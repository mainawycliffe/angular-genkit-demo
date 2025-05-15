import { v4 } from 'uuid';

function cleanUpBooks(books: any[]): any[] {
  return books
    .filter(
      (book) =>
        !!book.longDescription &&
        typeof book.longDescription === 'string' &&
        book.longDescription.trim().length > 0
    )
    .map(({ shortDescription, publishedDate, _id, ...rest }) => ({
      ...rest,
      id: v4(),
      publishedDate: publishedDate?.['$date'] ?? undefined,
    }));
}

// Example usage:
import * as fs from 'fs';

// Read books from a JSON file
const books = JSON.parse(fs.readFileSync('books.json', 'utf-8'));

// Clean up books
const cleanedBooks = cleanUpBooks(books);

// Write cleaned books to a new JSON file
fs.writeFileSync('books.cleaned.json', JSON.stringify(cleanedBooks, null, 2));

console.log(
  `Cleaned ${
    books.length - cleanedBooks.length
  } books. Output written to books.cleaned.json`
);
