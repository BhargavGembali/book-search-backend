const express = require("express");
const { fetchBookLinks } = require("./fetchBooks");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/search", async (req, res) => {
  const query = req.query.query;
  if (!query) {
    return res.status(400).json({ error: "Missing search query (?query=...)" });
  }
  try {
    const books = await fetchBookLinks(query);
    if (books.length === 0) {
      return res
        .status(404)
        .json({ message: "No free books found for your query." });
    }
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message || "Error fetching books" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
