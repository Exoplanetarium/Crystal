from flask import Flask, request, jsonify
import boto3
from botocore.config import Config
import fitz
import requests
from io import BytesIO
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed  
import logging
import sys
import hashlib
import gzip

# Configure logging
logging.basicConfig(
    level=logging.INFO,  # Set the logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    format='%(asctime)s %(levelname)s %(name)s %(message)s',  
    handlers=[
        logging.StreamHandler(sys.stdout)  # Ensure logs are sent to stdout for CloudWatch
    ]
)

# Create a logger for your application
logger = logging.getLogger(__name__)

# Flask app setup
app = Flask(__name__)

# Define custom botocore configuration
custom_config = Config(
    retries = {
        'max_attempts': 10,
        'mode': 'standard'
    },
    max_pool_connections=40  # Increase pool size
)


client = boto3.client("bedrock-runtime", region_name="us-west-2", config=custom_config)
model_id = "us.meta.llama3-2-3b-instruct-v1:0"

dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
cache_table = dynamodb.Table('SummarizationCache')

# AWS S3 Configuration
S3_BUCKET = 'pdf-sustainability-parser-bucket-west-2'
REGION = 'us-west-2'
s3 = boto3.client('s3', region_name=REGION)

# Upload PDF to S3
def upload_to_s3(file_bytes, s3_key):
    try:
        s3.upload_fileobj(file_bytes, S3_BUCKET, s3_key)
        file_url = f"https://{S3_BUCKET}.s3.{REGION}.amazonaws.com/{s3_key}"
        logger.info(f"Uploaded PDF to S3 at {file_url}")
        return file_url
    except Exception as e:
        raise e
    
def get_document_hash(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

def get_cached_summary(document_hash):
    try:
        response = cache_table.get_item(Key={'DocumentHash': document_hash})
        item = response.get('Item')
        if item:
            return {
                'goals': item.get('Goals'),
                'environment': item.get('Environment'),
                'certifications': item.get('Certifications'),
                'transparency': item.get('Transparency')
            }
        return None
    except Exception as e:
        logger.error(f"Error accessing DynamoDB: {e}", exc_info=True)
        return None

def cache_summary(document_hash, summaries):
    try:
        cache_table.put_item(
            Item={
                'DocumentHash': document_hash,
                'Goals': summaries['goals'],
                'Environment': summaries['environment'],
                'Certifications': summaries['certifications'],
                'Transparency': summaries['transparency'],
                'ExpirationTime': int(time.time()) + 86400  # Expires in 24 hours
            }
        )
    except Exception as e:
        logger.error(f"Error writing to DynamoDB: {e}", exc_info=True)

def check_cache(hash_text):
    start_time = time.time()
    document_hash = get_document_hash(hash_text) # Use entire report as hash
    cached_summaries = get_cached_summary(document_hash)

    if cached_summaries:
        logger.info("Cache hit. Returning cached summaries.")
        goals = cached_summaries['goals']
        environment = cached_summaries['environment']
        certifications = cached_summaries['certifications']
        transparency = cached_summaries['transparency']
        time_step2 = time.time() - start_time
        return goals, environment, certifications, transparency, time_step2
    else:
        return None

def compress_data(data):
    # Create a BytesIO stream for the compressed data
    out = BytesIO()
    # Write data into the gzip compressor
    with gzip.GzipFile(fileobj=out, mode='wb') as f:
        f.write(data)
    # Get the compressed data from the BytesIO stream
    return out.getvalue()

def decompress_data(compressed_data: bytes) -> bytes:
    # Create a BytesIO stream from the compressed data
    in_ = BytesIO(compressed_data)
    # Read the decompressed data from the gzip file
    with gzip.GzipFile(fileobj=in_, mode='rb') as f:
        return f.read()

# Summarize text chunk focusing on goals and progress
def summarize_step1(chunk):
    # system_prompt = (
    #     "You are an assistant that summarizes documents."
    #     "Your task is to provide a general summary of the text,"
    #     "focusing on the key themes, priorities, and sustainability efforts mentioned."
    #     "Focus on highlighting broad goals, environmental impacts, certifications, and governance practices" 
    #     "Keep the summary clear, concise, and high-level." 
    #     "Provide the output as one distinct bullet point."
    # )

    user_prompt = (
        "Summarize the following text to highlight the company's"
        "overall sustainability efforts, goals, and progress"
        "focusing on the key themes, priorities, and sustainability efforts mentioned."
        "Focus on highlighting broad goals, environmental impacts, certifications, and governance practices" 
        "Keep the summary clear and concise." 
        "Present your output as only one distinct bullet point.\n\n"
        f"{chunk}"
    )
    
    response = client.converse(
        modelId=model_id,
        messages=[
            {"role": "user", "content": [{"text": user_prompt}]}
        ],
        inferenceConfig={
            "maxTokens": 150, 
            "temperature": 0.2,
        },
    )
    logger.info("Summarization Step 1 completed for a chunk.")
    return response["output"]["message"]["content"][0]["text"]

def summarize_step2(aggregated_summaries, category):
    label = ""
    category_name = ""
    match category:
        case 1:
            label = """
            Provide 4 specific unique, concise major goals, their progress status (not started, in progress, or completed), a precise, brief description no longer than 120 characters of what they have completed (if any) and timelines. Organize it by goal and provide all parameters within the curly braces (not including the curly braces):
            - {header}: {status} ({date}) {description}.
            Replace {header} with the goal header, {status} with the goal status, {date} with the date the goal was completed, and {description} with a brief description of the goal. Only go to a new line after each set. If there isn't a timeline, assume status is Not Started and put date as (TBD), but still write a brief description no longer than 100 characters. However, prioritize goals that have information on progress.
            The brief descriptions should be less than 120 characters. Also make sure the header is no more than 5 words. 
            A great example could be: - Reduce Waste to Landfill: Completed (2023) 90% diversion from landfills achieved.
            """
            category_name = "Goals"
        case 2:
            label = """
            Provide 4 specific eco-impact and sustainability efforts sectioned into energy efficiency, resource efficiency, waste reduction, and water replenishment. Only if the report does not mention one of these sections, please add a different one of your choosing that is included in the report. However, make sure to always have 4 total sections. If the report says they will do something 'by' some date, it means they haven't done it yet, and you should NOT include it in your percentage.
            Include progress other than set as goals, prioritizing measureable outcomes that most align with each section. There should only be one bullet point in each section.  Organize it by section and provide all parameters within the curly braces (not including the curly braces): 
            - {section}: ({percentage}) {description}. 
            Replace {section} with the section header, {percentage} with the specific data point for that specific section (use positive percentages (NOT negative) for positive impacts, AND put the percentage in parenthesis), and {description} with a brief description of the data that is concise and LESS than 100 characters.
            Above all, prioritize ACCURACY with percentages, always use the report's provided numbers, and only estimate when numbers are not provided. However, if the report does not provide any numbers, you can estimate the percentage based on the information given. NEVER use N/A or some other placeholder for no data, and NEVER use Environment as a header
            """
            category_name = "Environment"
        case 3:
            label = """Extract all certifications mentioned in the following sustainability report. For each certification, provide:
                - Certification Name
                * Issuing Body
                * Status (Active, Pending, Expired)
                * Description (brief summary)

                """
            category_name = "Certifications"
        case 4: 
            label = """Extract and structure the transparency details from the following sustainability report. For each transparency item, please provide:
            1. Governance Practices: Describe the specific governance policies and oversight mechanisms in place.
            2. Reporting Frequency: Specify how often transparency reports or audits occur.
            3. Accountability Mechanisms: Detail the processes that ensure accountability (e.g., external audits, stakeholder reviews).
            4. Setbacks: List any challenges or setbacks that have affected transparency.
            Present the output as a numbered list with each item having these four clearly labeled sections.
            """
            category_name = "Transparency"
        case _:
            label = "General"

    # system_prompt = (
    #     f"""
    #     You are an assistant that summarizes documents. Your task is to create a focused summary of sustainability performance based on the provided text,
    #     and the user's request. 
    #     Keep each point unique and succinct. 
    #     Category:
    #     {label}
    #     """
    # )

    user_prompt = (
        f"Below are summaries of sustainability performance. Your task is to create a refined summary for the category '{category_name}' using the text provided. "
        "Please follow these instructions exactly:\n\n"
        "1. Do not include any introduction or conclusion—only list the summary points.\n"
        "2. Each summary point must begin on a new line with a hyphen followed by a space (\"- \").\n"
        "3. Each point should be concise, specific, and focus on measurable outcomes and progress.\n"
        f"4. Use the provided guidelines exactly as given: {label}\n\n"
        "Below is the aggregated summary text:\n\n"
        f"{aggregated_summaries}"
    )

    response = client.converse(
        modelId=model_id,
        messages=[
            {"role": "user", "content": [{"text": user_prompt}]}
        ],
        inferenceConfig={
            "maxTokens": 400, 
            "temperature": 0.2,
        },
    )

    logger.info(f"Summarization Step 2 completed for category: {category_name}.")
    return response["output"]["message"]["content"][0]["text"]

# Split text into smaller chunks
def split_text(text, max_length=18000):
    chunks = []
    current_chunk = ""
    for line in text.splitlines():
        if len(current_chunk) + len(line) > max_length:
            chunks.append(current_chunk)
            current_chunk = ""
        current_chunk += line + "\n"
    chunks.append(current_chunk)
    return chunks

# Summarize large document using parallel processing (Step 1)
def summarize_large_document_step1(text, max_chunks=60, time_limit=15, ):
    chunks = split_text(text)[:max_chunks]

    start_time = time.time()
    processed_chunks = 0

    summaries = []

    # Use ThreadPoolExecutor for parallel processing
    with ThreadPoolExecutor(max_workers=30) as executor:
        # Submit all summarization tasks
        future_to_chunk = {executor.submit(summarize_step1, chunk): chunk for chunk in chunks}
        for future in as_completed(future_to_chunk, timeout=time_limit):
            try:
                summary = future.result()
                summaries.append(summary)
                processed_chunks += 1
            except Exception as e:
                summaries.append("")  # Append empty string or handle as needed
                processed_chunks += 1
            # Check if time limit exceeded
            if time.time() - start_time > time_limit:
                break
    
    total_time = time.time() - start_time

    return summaries, total_time, processed_chunks, len(chunks)

# Summarize aggregated summaries into final bullet points (Step 2)
def summarize_final_step2(aggregated_summaries, hash_text):
    start_time = time.time()

    document_hash = get_document_hash(hash_text) # Use entire report as hash

    def summarize_task(index):
        return summarize_step2(aggregated_summaries, index)

    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(summarize_task, i) for i in range(1, 5)]
        results = [future.result() for future in futures]

    goals, environment, certifications, transparency = results

    # Cache the summaries
    summaries = {
        'goals': goals,
        'environment': environment,
        'certifications': certifications,
        'transparency': transparency
    }

    cache_summary(document_hash, summaries)

    time_step2 = time.time() - start_time
    return goals, environment, certifications, transparency, time_step2

@app.route('/extract-text', methods=['POST'])
def extract_text():
    try:
        # Get PDF URL from request body
        data = request.json
        pdf_url = data.get('pdfUrl')
        if not pdf_url:
            return jsonify({"error": "No URL provided"}), 400
        
        logger.info(f"Processing PDF URL: {pdf_url}")

        # Download PDF from URL
        start_download = time.time()
        cookies = {
            'ux_exp_id': 'fe971672-35fd-4c0b-ad9e-c34a056d33d7',
            '__cf_bm': '.exhiQpF8tpTjXaNL25eiTxKzL6xZL4ncTvhde7NJQU-1738039110-1.0.1.1-wVzEeP7ZIlTr0Yb3tXM_V6WUgyDOerOISJqzC14ZIjgyMjjkgA1v2nOuR3rxyWRjbbSV0Odvya8n6WWfYd.bOA',
        }

        headers = {
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'accept-language': 'en-US,en;q=0.9',
            'cache-control': 'max-age=0',
            'dnt': '1',
            'priority': 'u=0, i',
            'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'none',
            'sec-fetch-user': '?1',
            'upgrade-insecure-requests': '1',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
        }

        response = requests.get(pdf_url, cookies=cookies, headers=headers)
        if response.status_code != 200:
            logger.error(f"Failed to download PDF. Status code: {response.status_code}")
            return jsonify({"error": "Failed to download PDF"}), response.status_code
        download_time = time.time() - start_download
        logger.info(f"Downloaded PDF in {download_time:.4f} seconds.")

        # Upload PDF to S3
        compressed_response = compress_data(response.content)
        pdf_bytes = BytesIO(compressed_response)  # Original stream
        pdf_copy = BytesIO(compressed_response)  # Create a copy for reuse
        s3_key = 'uploads/input.pdf'
        upload_time = time.time()
        file_url = upload_to_s3(pdf_bytes, s3_key)
        upload_duration = time.time() - upload_time
        logger.info(f"Uploaded PDF to S3 in {upload_duration:.4f} seconds.")

        # Extract text 
        start_extraction = time.time()
        try:
            doc = fitz.open(stream=pdf_copy, filetype="pdf")
            if doc.is_encrypted:
                logger.error("PDF is encrypted and cannot be extracted")
                return jsonify({"error": "Encrypted PDF not supported"}), 400
            text = "".join([page.get_text() for page in doc])
        except Exception as e:
            logger.error(f"Failed to extract text from PDF: {str(e)}")
            return jsonify({"error": "Failed to extract text from PDF"}), 500
        extraction_time = time.time() - start_extraction
        logger.info(f"Extracted text from PDF in {extraction_time:.4f} seconds.")

        cache_result = check_cache(text)
        if cache_result:
            goals, environment, certifications, transparency, time_step2 = cache_result
            total_time = time_step2 + download_time + upload_duration + extraction_time
            return jsonify({
                "goals": goals,
                "environment": environment,
                "certifications": certifications,
                "transparency": transparency,
                "processing_time_seconds": total_time,  # Cache hit, no processing time
                "total_time_step1": -1,
                "time_step2": time_step2,
                "processed_chunks": -1,
                "total_chunks": -1,
                "download_time_seconds": download_time,
                "upload_time_seconds": upload_duration,
                "extraction_time_seconds": extraction_time
            })

        # Step 1: Summarize each chunk into single bullet points
        logger.info("Starting Summarization Step 1.")
        summaries_step1, total_time_step1, processed_chunks, total_chunks = summarize_large_document_step1(text)
        logger.info(f"Summarization Step 1 completed in {total_time_step1:.4f} seconds. Processed {processed_chunks}/{total_chunks} chunks.")

        # Aggregate summaries from Step 1
        aggregated_summaries = "\n".join([summary for summary in summaries_step1 if summary])
        logger.info("Aggregated summaries from Step 1.")

        # Step 2: Summarize aggregated summaries into final 8-10 bullet points
        logger.info("Starting Summarization Step 2.")
        goals, environment, certifications, transparency, time_step2 = summarize_final_step2(aggregated_summaries, text)
        logger.info(f"Summarization Step 2 completed in {time_step2:.4f} seconds.")

        # Calculate total processing time
        total_time = total_time_step1 + time_step2 + download_time + upload_duration + extraction_time
        logger.info(f"Total processing time: {total_time:.4f} seconds.")

        return jsonify({
            "goals": goals,
            "environment": environment,
            "certifications": certifications,
            "transparency": transparency,
            "processing_time_seconds": total_time,
            "total_time_step1": total_time_step1,
            "time_step2": time_step2,
            "processed_chunks": processed_chunks,
            "total_chunks": total_chunks,
            "download_time_seconds": download_time,
            "upload_time_seconds": upload_duration,
            "extraction_time_seconds": extraction_time
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, threaded=True)
