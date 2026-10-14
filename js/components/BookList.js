const COVER_COLORS = ["#426a56", "#8c5846", "#5a6489", "#9a7743", "#496f78", "#765b83"];

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

export class BookList {
  constructor(container, { onSelect, onToggleRead } = {}) {
    this.container = container;
    this.onSelect = onSelect;
    this.onToggleRead = onToggleRead;
  }

  render(books) {
    if (!books.length) {
      this.container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⌕</div>
          <h3>No se han encontrado libros</h3>
          <p>Prueba con otra búsqueda o cambia los filtros. También puedes añadir un libro nuevo.</p>
          <a class="button button-primary" href="#/books/new">Añadir libro</a>
        </div>`;
      return;
    }

    this.container.innerHTML = `<div class="book-grid">${books.map((book, index) => {
      const title = escapeHtml(book.title);
      const author = escapeHtml(book.author);
      const cover = book.cover
        ? `<img class="book-cover" src="${escapeHtml(book.cover)}" alt="Portada de ${title}" loading="lazy">`
        : `<div class="cover-placeholder" style="--cover:${COVER_COLORS[index % COVER_COLORS.length]}">
             <span>${escapeHtml(book.genre)}</span><strong>${title}</strong>
           </div>`;

      return `
        <article class="book-card" data-book-id="${escapeHtml(book.id)}" tabindex="0" role="link" aria-label="Ver ${title}">
          <div class="book-cover-wrap">
            ${cover}
            <span class="book-status">${book.read ? "Leído" : "Pendiente"}</span>
          </div>
          <div class="book-info">
            <p class="book-title">${title}</p>
            <p class="book-author">${author}</p>
            <div class="book-meta">
              <span>${Number(book.year) || "—"}</span>
              <span class="rating">${Number(book.rating) > 0 ? `★ ${Number(book.rating).toFixed(1)}` : "Sin valorar"}</span>
            </div>
          </div>
        </article>`;
    }).join("")}</div>`;

    this.container.querySelectorAll("[data-book-id]").forEach((card) => {
      const open = () => this.onSelect?.(card.dataset.bookId);
      card.addEventListener("click", open);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });
    });
  }
}
