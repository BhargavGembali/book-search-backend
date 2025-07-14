const stringSimilarity = require("string-similarity");

const fetchBookLinks = async (query) => {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(
    query
  )}+mediatype:texts&fl[]=title&fl[]=creator&fl[]=year&fl[]=identifier&output=json&rows=20`;
  const response = await axios.get(url);

  const books = response.data.response.docs.map((book) => {
    const title = book.title || "";
    const author = book.creator || "Unknown";
    const combinedText = `${title} ${author}`;
    const similarity = stringSimilarity.compareTwoStrings(
      query.toLowerCase(),
      combinedText.toLowerCase()
    );

    return {
      title,
      author,
      publishYear: book.year,
      link: `https://archive.org/details/${book.identifier}`,
      cover: `https://archive.org/services/img/${book.identifier}`,
      relevance: similarity,
    };
  });

  books.sort((a, b) => b.relevance - a.relevance);

  return books.map(({ relevance, ...book }) => book);
};
