const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = 5001;

app.use(cors());

app.get('/search', async (req, res) => {
  const { query } = req.query;
  const results = await fetchBookLinks(query);
  res.json(results);
});

const fetchBookLinks = async (query) => {
  const url = `https://archive.org/advancedsearch.php?q=${query}+mediatype:texts&fl[]=title&fl[]=creator&fl[]=year&fl[]=identifier&output=json&rows=20`;
  const response = await axios.get(url);
  return response.data.response.docs.map(book => ({
    title: book.title,
    author: book.creator ? book.creator : 'Unknown',
    publishYear: book.year,
    link: `https://archive.org/details/${book.identifier}`,
    cover: `https://archive.org/services/img/${book.identifier}`
  }));
};

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
