export function validateBook(book) {
  const errors = {};

  if (!book.title?.trim()) {
    errors.title = "El título es obligatorio.";
  }

  if (!book.author?.trim()) {
    errors.author = "El autor es obligatorio.";
  }

  const year = Number(book.year);
  const currentYear = new Date().getFullYear();

  if (!Number.isInteger(year) || year < 1 || year > currentYear) {
    errors.year = `Introduce un año entre 1 y ${currentYear}.`;
  }

  const pages = Number(book.pages);

  if (!Number.isInteger(pages) || pages <= 0) {
    errors.pages = "El número de páginas debe ser un entero mayor que 0.";
  }

  const rating = Number(book.rating);

  if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
    errors.rating = "La valoración debe estar entre 0 y 5.";
  }

  return errors;
}
