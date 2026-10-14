import { Book } from "../models/Book.js";

const STORAGE_KEY = "personal-library-books";

export class BookService {
  constructor() {
    this.books = this.#loadBooks();
  }

  #loadBooks() {
    try {
      const storedBooks = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");

      if (!Array.isArray(storedBooks)) {
        return [];
      }

      return storedBooks.map((book) => new Book(book));
    } catch (error) {
      console.error("No se han podido cargar los libros guardados:", error);
      return [];
    }
  }

  #saveBooks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.books));
  }

  getAll() {
    return [...this.books];
  }

  getById(id) {
    return this.books.find((book) => book.id === id) ?? null;
  }

  add(bookData) {
    const book = new Book(bookData);
    this.books = [...this.books, book];
    this.#saveBooks();
    return book;
  }

  update(id, changes) {
    const existingBook = this.getById(id);

    if (!existingBook) {
      return null;
    }

    const updatedBook = new Book({ ...existingBook, ...changes, id });
    this.books = this.books.map((book) => book.id === id ? updatedBook : book);
    this.#saveBooks();
    return updatedBook;
  }

  delete(id) {
    const exists = this.books.some((book) => book.id === id);

    if (!exists) {
      return false;
    }

    this.books = this.books.filter((book) => book.id !== id);
    this.#saveBooks();
    return true;
  }

  toggleRead(id) {
    const book = this.getById(id);
    return book ? this.update(id, { read: !book.read }) : null;
  }

  search(query = "", { status = "all", genre = "all", sort = "title-asc" } = {}) {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");

    const filteredBooks = this.books.filter((book) => {
      const matchesQuery = [book.title, book.author, book.genre]
        .some((value) => value.toLocaleLowerCase("es").includes(normalizedQuery));
      const matchesStatus = status === "all"
        || (status === "read" && book.read)
        || (status === "unread" && !book.read);
      const matchesGenre = genre === "all" || book.genre === genre;

      return matchesQuery && matchesStatus && matchesGenre;
    });

    const sorters = {
      "title-asc": (a, b) => a.title.localeCompare(b.title, "es"),
      "title-desc": (a, b) => b.title.localeCompare(a.title, "es"),
      "year-asc": (a, b) => a.year - b.year,
      "year-desc": (a, b) => b.year - a.year,
      "rating-desc": (a, b) => b.rating - a.rating,
      "pages-desc": (a, b) => b.pages - a.pages
    };

    return filteredBooks.sort(sorters[sort] ?? sorters["title-asc"]);
  }

  getGenres() {
    return [...new Set(this.books.map((book) => book.genre).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "es"));
  }

  getStats() {
    const readBooks = this.books.filter((book) => book.read);
    const genreCounts = this.books.reduce((counts, book) => {
      counts[book.genre] = (counts[book.genre] ?? 0) + 1;
      return counts;
    }, {});
    const favoriteGenre = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    const ratedBooks = this.books.filter((book) => book.rating > 0);
    const averageRating = ratedBooks.length
      ? ratedBooks.reduce((total, book) => total + book.rating, 0) / ratedBooks.length
      : 0;

    return {
      total: this.books.length,
      read: readBooks.length,
      unread: this.books.length - readBooks.length,
      pagesRead: readBooks.reduce((total, book) => total + book.pages, 0),
      favoriteGenre,
      averageRating,
      genreCounts,
      activeLoans: this.books.filter((book) => book.loan).length
    };
  }

  createLoan(id, borrower, dueDate) {
    const book = this.getById(id);

    if (!book || book.loan) {
      return null;
    }

    return this.update(id, {
      loan: {
        borrower: borrower.trim(),
        dueDate,
        loanedAt: new Date().toISOString()
      }
    });
  }

  returnLoan(id) {
    const book = this.getById(id);
    return book?.loan ? this.update(id, { loan: null }) : null;
  }
}
