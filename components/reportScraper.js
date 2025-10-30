import axios from 'axios';

const API_KEY = 'AIzaSyDkr-Bg7qcffPv0RAexhkpfD8GXaoJWuaQ';
const CX = '0288a889430994f29';
const ENDPOINT =
  'https://ffzv4aia78.execute-api.us-west-2.amazonaws.com/dev/extract-text';

export async function reportScraper(companyName) {
  const currentYear = new Date().getFullYear();
  const searchQuery = encodeURIComponent(
    `${companyName} sustainability report ${currentYear} filetype:pdf`,
  );
  const url = `https://www.googleapis.com/customsearch/v1?q=${searchQuery}&key=${API_KEY}&cx=${CX}`;

  try {
    const response = await axios.get(url);

    if (!response.data) {
      throw new Error('Invalid response data');
    }

    const items = response.data.items || [];

    // Get only the first 3 items
    const results = items.slice(0, 5).map(item => ({
      title: item.title,
      link: item.link,
    }));

    const foundItem = results.find(item => {
      const link = item.link.toLowerCase();
      const title = item.title.toLowerCase();
      console.log('Link:', link);

      if (
        title.includes(companyName.toLowerCase()) ||
        link.includes(companyName.toLowerCase())
      ) {
        if (link.includes('impact') || title.includes('impact')) {
          return true;
        }

        if (
          link.includes('sustainability') ||
          title.includes('sustainability')
        ) {
          return true;
        }

        if (
          link.includes(currentYear.toString()) ||
          title.includes(currentYear.toString())
        ) {
          return true;
        }

        return (
          link.includes((currentYear - 1).toString()) ||
          title.includes((currentYear - 1).toString())
        );
      }
    });

    if (!foundItem) {
      return {};
    }

    console.log('link:', foundItem.link);

    try {
      const parserResponse = await axios.post(
        ENDPOINT,
        {pdfUrl: foundItem.link},
        {headers: {'Content-Type': 'application/json'}, timeout: 60000},
      );

      if (!parserResponse.data) {
        throw new Error('Failed to parse text from PDF');
      }

      return parserResponse.data;
    } catch (err) {
      console.error(
        'Parser endpoint failed for found PDF:',
        err.message || err,
      );
      // Return an indicator that the PDF is inaccessible to scraping/parsing
      return {inaccessible: true, link: foundItem.link};
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    let friendly = 'Unknown error during search';
    if (error && error.response && error.response.status) {
      const status = error.response.status;
      if (status === 403) {
        friendly =
          'Search blocked (403). The search provider denied the request.';
      } else if (status === 429) {
        friendly = 'Rate limited (429). Please try again shortly.';
      } else if (status >= 500) {
        friendly = `Server error (${status}). Try again later.`;
      } else {
        friendly = `HTTP error (${status}).`;
      }
    } else if (error && error.code === 'ECONNABORTED') {
      friendly = 'Request timed out. Try again.';
    } else if (error && error.message) {
      friendly = error.message;
    }

    // for front end display purposes
    return {
      error: true,
      message: friendly,
      raw: error,
    };
  }
}
