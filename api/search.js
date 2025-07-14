const axios = require('axios');

const fetchBookLinks = async (query) => {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+mediatype:texts&fl[]=title&fl[]=creator&fl[]=year&fl[]=identifier&output=json&rows=20`;
  const response = await axios.get(url);
  return response.data.response.docs.map(book => ({
    title: book.title,
    author: book.creator ? book.creator : 'Unknown',
    publishYear: book.year,
    link: `https://archive.org/details/${book.identifier}`,
    cover: `https://archive.org/services/img/${book.identifier}`
  }));
};

module.exports = async (req, res) => {
  const { query } = req.query;
  if (!query) {
    res.status(400).json({ error: 'Missing query parameter' });
    return;
  }
  try {
    const results = await fetchBookLinks(query);
    res.json(results);
  } catch (error) {
    console.error('Error fetching book links:', error);
    res.status(500).json({ error: 'Failed to fetch book links' });
  }
};