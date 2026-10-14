import { validateBook } from "../utils/validators.js";

const GENRES = ["Fantasía", "Ciencia ficción", "Terror", "Romance", "Historia", "Misterio", "Aventura", "Drama", "Ensayo", "Biografía", "Infantil", "Sin género"];

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

export class BookForm {
  constructor(container, { book = null, onSave, onCancel } = {}) {
    this.container = container;
    this.book = book;
    this.onSave = onSave;
    this.onCancel = onCancel;
  }

  render() {
    const book = this.book ?? {};
    const selectedGenre = book.genre ?? "Fantasía";
    const genres = [...new Set([...GENRES, selectedGenre])];
    this.container.innerHTML = `
      <form id="book-form" class="panel" novalidate>
        <div class="section-heading">
          <div><p class="eyebrow">${this.book ? "ACTUALIZA TU COLECCIÓN" : "NUEVA INCORPORACIÓN"}</p>
          <h2>${this.book ? "Editar libro" : "Datos del libro"}</h2></div>
        </div>
        <div id="form-general-error" class="error-message" role="alert"></div>
        <div class="form-grid">
          <div class="field full-width">
            <label for="title">Título *</label>
            <input id="title" name="title" maxlength="180" value="${escapeHtml(book.title ?? "")}" placeholder="Ej. El nombre del viento" required>
            <p class="error-message" data-error="title"></p>
          </div>
          <div class="field">
            <label for="author">Autor *</label>
            <input id="author" name="author" maxlength="120" value="${escapeHtml(book.author ?? "")}" placeholder="Ej. Patrick Rothfuss" required>
            <p class="error-message" data-error="author"></p>
          </div>
          <div class="field">
            <label for="genre">Género</label>
            <input id="genre" name="genre" list="genre-options" maxlength="80" value="${escapeHtml(selectedGenre)}" placeholder="Selecciona o escribe uno">
            <datalist id="genre-options">${genres.map((genre) => `<option value="${escapeHtml(genre)}"></option>`).join("")}</datalist>
          </div>
          <div class="field">
            <label for="year">Año de publicación *</label>
            <input id="year" name="year" type="number" min="1" max="${new Date().getFullYear()}" step="1" value="${escapeHtml(book.year ?? new Date().getFullYear())}" required>
            <p class="error-message" data-error="year"></p>
          </div>
          <div class="field">
            <label for="pages">Número de páginas *</label>
            <input id="pages" name="pages" type="number" min="1" step="1" value="${escapeHtml(book.pages ?? 1)}" required>
            <p class="error-message" data-error="pages"></p>
          </div>
          <div class="field">
            <label for="rating">Valoración (0–5)</label>
            <input id="rating" name="rating" type="number" min="0" max="5" step="0.1" value="${escapeHtml(book.rating ?? 0)}">
            <p class="error-message" data-error="rating"></p>
          </div>
          <div class="field">
            <label for="cover">URL de la portada</label>
            <input id="cover" name="cover" type="url" value="${escapeHtml(book.cover ?? "")}" placeholder="https://...">
            <span class="field-hint">Opcional. Puedes dejarlo vacío.</span>
          </div>
          <div class="field full-width">
            <label for="description">Descripción</label>
            <textarea id="description" name="description" maxlength="3000" placeholder="Anotaciones sobre el libro...">${escapeHtml(book.description ?? "")}</textarea>
          </div>
          <div class="field full-width">
            <label><input type="checkbox" name="read" ${book.read ? "checked" : ""}> Ya he leído este libro</label>
          </div>
        </div>
        <div class="form-actions">
          <button class="button button-secondary" type="button" id="cancel-form">Cancelar</button>
          <button class="button button-primary" type="submit">${this.book ? "Guardar cambios" : "Añadir a mi biblioteca"}</button>
        </div>
      </form>`;

    const form = this.container.querySelector("#book-form");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const data = {
        title: String(formData.get("title") ?? "").trim(),
        author: String(formData.get("author") ?? "").trim(),
        genre: String(formData.get("genre") ?? "").trim() || "Sin género",
        year: Number(formData.get("year")),
        pages: Number(formData.get("pages")),
        rating: Number(formData.get("rating") ?? 0),
        cover: String(formData.get("cover") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim(),
        read: formData.has("read"),
        loan: this.book?.loan ?? null
      };

      const errors = validateBook(data);
      form.querySelectorAll("[data-error]").forEach((element) => {
        element.textContent = errors[element.dataset.error] ?? "";
      });

      const coverField = form.elements.namedItem("cover");
      if (data.cover && !coverField.checkValidity()) {
        form.querySelector("#form-general-error").textContent = "La URL de la portada no es válida.";
        return;
      }

      form.querySelector("#form-general-error").textContent = "";
      if (Object.keys(errors).length) {
        form.querySelector(`[name="${Object.keys(errors)[0]}"]`)?.focus();
        return;
      }

      this.onSave?.(data);
    });

    form.querySelector("#cancel-form").addEventListener("click", () => this.onCancel?.());
  }
}
