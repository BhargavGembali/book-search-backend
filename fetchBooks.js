const axios = require("axios");
const stringSimilarity = require("string-similarity");

// Helper to normalize results for all APIs
function normalizeBook({ title, author, publishYear, link, cover }, query) {
  const combinedText = `${title || ""} ${author || ""}`;
  const relevance = stringSimilarity.compareTwoStrings(
    query.toLowerCase(),
    combinedText.toLowerCase()
  );
  return { title, author, publishYear, link, cover, relevance };
}

// Archive.org API
async function fetchArchiveBooks(query) {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(
    query
  )}+mediatype:texts&fl[]=title&fl[]=creator&fl[]=year&fl[]=identifier&output=json&rows=20`;
  const response = await axios.get(url);
  return response.data.response.docs.map((book) =>
    normalizeBook(
      {
        title: book.title,
        author: book.creator || "Unknown",
        publishYear: book.year,
        link: `https://archive.org/details/${book.identifier}`,
        cover: `https://archive.org/services/img/${book.identifier}`,
      },
      query
    )
  );
}

// Open Library API
async function fetchOpenLibraryBooks(query) {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(
    query
  )}`;
  const response = await axios.get(url);
  // Filter only books with ebook access and readable for free
  return (response.data.docs || [])
    .filter((doc) => doc.ebook_access === "public" && doc.has_fulltext)
    .map((doc) =>
      normalizeBook(
        {
          title: doc.title,
          author: (doc.author_name && doc.author_name[0]) || "Unknown",
          publishYear: doc.first_publish_year,
          link: `https://openlibrary.org${doc.key}`,
          cover: doc.cover_i
            ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
            : undefined,
        },
        query
      )
    );
}

// Project Gutenberg API
async function fetchGutenbergBooks(query) {
  // Note: Project Gutenberg has an OAI and a search API, using gutendex for easiest access
  const url = `https://gutendex.com/books?search=${encodeURIComponent(query)}`;
  const response = await axios.get(url);
  return (response.data.results || []).map((book) =>
    normalizeBook(
      {
        title: book.title,
        author:
          (book.authors && book.authors[0] && book.authors[0].name) ||
          "Unknown",
        publishYear: book.download_count ? undefined : undefined, // Gutenberg doesn't always have year
        link: `https://www.gutenberg.org/ebooks/${book.id}`,
        cover: book.formats["image/jpeg"],
      },
      query
    )
  );
}

// Unified function
const fetchBookLinks = async (query) => {
  const [archiveBooks, openLibraryBooks, gutenbergBooks] = await Promise.all([
    fetchArchiveBooks(query),
    fetchOpenLibraryBooks(query),
    fetchGutenbergBooks(query),
  ]);
  // Combine all, remove duplicates by link, sort by relevance
  const allBooks = [...archiveBooks, ...openLibraryBooks, ...gutenbergBooks];
  const seen = new Set();
  const filteredBooks = allBooks.filter((book) => {
    if (!book.link || seen.has(book.link)) return false;
    seen.add(book.link);
    return true;
  });
  // Sort by relevance descending
  filteredBooks.sort((a, b) => b.relevance - a.relevance);
  // Remove relevance from final output
  return filteredBooks.map(({ relevance, ...book }) => book);
};

module.exports = { fetchBookLinks };
