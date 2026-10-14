function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

export class BookDetail {
  constructor(container, { onEdit, onDelete, onToggleRead, onLoan, onReturnLoan } = {}) {
    this.container = container;
    this.onEdit = onEdit;
    this.onDelete = onDelete;
    this.onToggleRead = onToggleRead;
    this.onLoan = onLoan;
    this.onReturnLoan = onReturnLoan;
  }

  render(book) {
    if (!book) {
      this.container.innerHTML = `<div class="panel empty-state"><h3>Libro no encontrado</h3><p>Puede que se haya eliminado o que el enlace ya no sea válido.</p><a class="button button-primary" href="#/books">Volver a la biblioteca</a></div>`;
      return;
    }

    const title = escapeHtml(book.title);
    const cover = book.cover
      ? `<img class="book-cover" src="${escapeHtml(book.cover)}" alt="Portada de ${title}">`
      : `<div class="cover-placeholder" style="--cover:#426a56"><span>${escapeHtml(book.genre)}</span><strong>${title}</strong></div>`;

    this.container.innerHTML = `
      <div class="panel">
        <a class="text-link" href="#/books">← Volver a la biblioteca</a>
        <div class="detail-layout" style="margin-top:22px">
          <div class="detail-cover">${cover}</div>
          <div>
            <p class="eyebrow">${escapeHtml(book.genre)} · ${book.read ? "LEÍDO" : "PENDIENTE"}</p>
            <h2 class="detail-title">${title}</h2>
            <p class="detail-author">de ${escapeHtml(book.author)}</p>
            ${book.rating > 0 ? `<p class="rating">★ ${Number(book.rating).toFixed(1)} / 5</p>` : `<p class="field-hint">Este libro todavía no tiene valoración.</p>`}
            <div class="detail-facts">
              <div class="fact"><span>Publicación</span><strong>${Number(book.year) || "—"}</strong></div>
              <div class="fact"><span>Páginas</span><strong>${Number(book.pages) || "—"}</strong></div>
              <div class="fact"><span>Estado</span><strong>${book.read ? "Leído" : "Pendiente"}</strong></div>
            </div>
            ${book.description ? `<p class="detail-description">${escapeHtml(book.description).replace(/\n/g, "<br>")}</p>` : `<p class="detail-description">No has añadido una descripción para este libro.</p>`}
            ${book.loan ? `<div class="notice"><strong>Prestado a ${escapeHtml(book.loan.borrower)}</strong><br>Fecha de devolución prevista: ${escapeHtml(book.loan.dueDate)}</div>` : ""}
            <div class="detail-actions">
              <button class="button button-primary" id="edit-book">Editar libro</button>
              <button class="button button-secondary" id="toggle-read">${book.read ? "Marcar como pendiente" : "Marcar como leído"}</button>
              ${book.loan ? `<button class="button button-secondary" id="return-loan">Registrar devolución</button>` : `<button class="button button-secondary" id="loan-book">Prestar libro</button>`}
              <button class="button button-danger" id="delete-book">Eliminar</button>
            </div>
          </div>
        </div>
      </div>`;

    this.container.querySelector("#edit-book").addEventListener("click", () => this.onEdit?.(book.id));
    this.container.querySelector("#toggle-read").addEventListener("click", () => this.onToggleRead?.(book.id));
    this.container.querySelector("#delete-book").addEventListener("click", () => this.onDelete?.(book.id));
    this.container.querySelector("#loan-book")?.addEventListener("click", () => this.onLoan?.(book.id));
    this.container.querySelector("#return-loan")?.addEventListener("click", () => this.onReturnLoan?.(book.id));
  }
}
