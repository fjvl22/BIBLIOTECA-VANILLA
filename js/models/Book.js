export class Book {
  constructor({
    id = crypto.randomUUID(),
    title = "",
    author = "",
    genre = "Sin género",
    year = new Date().getFullYear(),
    pages = 1,
    cover = "",
    read = false,
    rating = 0,
    description = "",
    loan = null
  } = {}) {
    this.id = id;
    this.title = title.trim();
    this.author = author.trim();
    this.genre = genre.trim() || "Sin género";
    this.year = Number(year);
    this.pages = Number(pages);
    this.cover = cover || "";
    this.read = Boolean(read);
    this.rating = Number(rating);
    this.description = description || "";
    this.loan = loan;
  }
}
