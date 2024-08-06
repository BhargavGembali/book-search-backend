const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT ;

app.use(cors());

app.get('/search', async (req, res) => {
  const { query } = req.query;
  try {
    const results = await fetchBookLinks(query);
    res.json(results);
  } catch (error) {
    console.error('Error fetching book links:', error);
    res.status(500).json({ error: 'Failed to fetch book links' });
  }
});

const fetchBookLinks = async (query) => {
  const url = `https://archive.org/advancedsearch.php?q=${query}+mediatype:texts&fl[]=title&fl[]=creator&fl[]=year&fl[]=identifier&output=json&rows=20`;
  try {
    const response = await axios.get(url);
    return response.data.response.docs.map(book => ({
      title: book.title,
      author: book.creator ? book.creator : 'Unknown',
      publishYear: book.year,
      link: `https://archive.org/details/${book.identifier}`,
      cover: `https://archive.org/services/img/${book.identifier}`
    }));
  } catch (error) {
    console.error('Error fetching data from Archive.org:', error);
    throw error;
  }
};

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
