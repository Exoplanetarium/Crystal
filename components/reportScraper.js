import axios from 'axios';

const API_KEY = 'AIzaSyDkr-Bg7qcffPv0RAexhkpfD8GXaoJWuaQ';
const CX = '0288a889430994f29';
const ENDPOINT = 'https://ffzv4aia78.execute-api.us-west-2.amazonaws.com/dev/extract-text';

export async function reportScraper(companyName) {

  const searchQuery = encodeURIComponent(`${companyName} sustainability report 2024 filetype:pdf`);
  const url = `https://www.googleapis.com/customsearch/v1?q=${searchQuery}&key=${API_KEY}&cx=${CX}`;

  try {
    const response = await axios.get(url);

    if (!response.data) {
      throw new Error('Invalid response data');
    }

    const items = response.data.items || [];

    // Get only the first 3 items
    const results = items.slice(0, 3).map(item => ({
      title: item.title,
      link: item.link,
    }));

    const foundItem = results.find(item => {
      const link = item.link.toLowerCase();
      const title = item.title.toLowerCase();
      console.log('Link:', link);
      if (link.includes('2024') || title.includes('2024')) {
        console.log('Found 2024:', item);
        return true;
      }

      return link.includes('2023') || title.includes('2023');
    });

    console.log('link: ' + foundItem.link);

    if (!foundItem) {
      throw new Error('No suitable PDF found');
    }

    const parserResponse = await axios.post(
      ENDPOINT,
      { pdfUrl: foundItem.link},
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!parserResponse.data) {
      throw new Error('Failed to parse text from PDF');
    }

    return parserResponse.data;

  } catch(error) {
      console.error('Error fetching data:', error);
      throw error;
  }
}
