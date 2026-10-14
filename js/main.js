import { BookService } from "./services/BookService.js";
import { BookList } from "./components/BookList.js";
import { BookForm } from "./components/BookForm.js";
import { BookDetail } from "./components/BookDetail.js";
import { searchBooks } from "./api.js";

const bookService = new BookService();
const app = document.querySelector("#app");
const pageTitle = document.querySelector("#page-title");
const pageEyebrow = document.querySelector("#page-eyebrow");
const navLinks = [...document.querySelectorAll("[data-nav]")];

const PAGE_TITLES = {
  "/home": ["Inicio", "TU ESPACIO DE LECTURA"],
  "/books": ["Mi biblioteca", "TODOS TUS LIBROS"],
  "/books/new": ["Añadir libro", "AMPLÍA TU COLECCIÓN"],
  "/loans": ["Préstamos", "LIBROS QUE HAS PRESTADO"],
  "/stats": ["Estadísticas", "TU HISTORIAL LECTOR"]
};

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function navigate(path) {
  location.hash = `#${path}`;
}

function currentRoute() {
  const path = location.hash.replace(/^#/, "") || "/home";
  return path.startsWith("/") ? path : `/${path}`;
}

function updateHeader(route) {
  const bookDetail = route.match(/^\/books\/([^/]+)$/);
  const titleInfo = PAGE_TITLES[route] ?? (bookDetail ? ["Detalle del libro", "TU LIBRO"] : ["Página no encontrada", ""]);
  pageTitle.textContent = titleInfo[0];
  pageEyebrow.textContent = titleInfo[1];
  navLinks.forEach((link) => {
    const nav = link.dataset.nav;
    const active = route === nav
      || (nav === "/books" && (route.startsWith("/books/") && route !== "/books/new"));
    link.classList.toggle("active", active);
  });
}

function renderStatCard(label, value, icon, subtext = "") {
  return `<article class="stat-card">
    <div class="stat-top"><span>${label}</span><span class="stat-icon">${icon}</span></div>
    <div class="stat-value">${value}</div>
    <div class="stat-sub">${subtext}</div>
  </article>`;
}

function renderHome() {
  const stats = bookService.getStats();
  const recentBooks = bookService.getAll().slice(-5).reverse();

  app.innerHTML = `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">CADA LIBRO CUENTA UNA HISTORIA</p>
        <h2>Tu próxima aventura empieza aquí.</h2>
        <p>Organiza tus lecturas, descubre nuevas historias y lleva el control de tu biblioteca en un solo lugar.</p>
        <a href="#/books/new" class="button">＋ Añadir un libro</a>
      </div>
      <div class="hero-art" aria-hidden="true"><div class="book-shape one"></div><div class="book-shape two"></div><div class="book-shape three"></div></div>
    </section>
    <section class="stats-grid">
      ${renderStatCard("Libros en total", stats.total, "▤", "En tu colección")}
      ${renderStatCard("Libros leídos", stats.read, "✓", `${stats.unread} pendientes`)}
      ${renderStatCard("Páginas leídas", stats.pagesRead.toLocaleString("es-ES"), "≡", "De libros completados")}
      ${renderStatCard("Valoración media", stats.averageRating ? `${stats.averageRating.toFixed(1)} ★` : "—", "☆", "Solo libros valorados")}
    </section>
    <section>
      <div class="section-heading"><h2>Incorporaciones recientes</h2><a class="text-link" href="#/books">Ver toda la biblioteca →</a></div>
      <div id="recent-books"></div>
    </section>`;

  new BookList(app.querySelector("#recent-books"), {
    onSelect: (id) => navigate(`/books/${encodeURIComponent(id)}`)
  }).render(recentBooks);
}

function renderLibrary() {
  app.innerHTML = `
    <section class="panel">
      <div class="section-heading"><div><h2>Todos tus libros</h2><p class="field-hint">Busca, filtra y ordena tu colección.</p></div><a class="button button-primary button-small" href="#/books/new">＋ Añadir</a></div>
      <div class="toolbar">
        <div class="field"><label for="search">Buscar</label><input class="search-input" id="search" type="search" placeholder="Título, autor o género..."></div>
        <div class="field"><label for="status-filter">Estado</label><select id="status-filter"><option value="all">Todos</option><option value="read">Leídos</option><option value="unread">No leídos</option></select></div>
        <div class="field"><label for="genre-filter">Género</label><select id="genre-filter"><option value="all">Todos los géneros</option>${bookService.getGenres().map((genre) => `<option value="${escapeHtml(genre)}">${escapeHtml(genre)}</option>`).join("")}</select></div>
        <div class="field"><label for="sort-filter">Ordenar por</label><select id="sort-filter">
          <option value="title-asc">Título A-Z</option><option value="title-desc">Título Z-A</option>
          <option value="year-asc">Año más antiguo</option><option value="year-desc">Año más reciente</option>
          <option value="rating-desc">Valoración</option><option value="pages-desc">Número de páginas</option>
        </select></div>
      </div>
      <p class="field-hint" id="results-count"></p>
      <div id="library-results"></div>
    </section>
    <section class="panel">
      <div class="section-heading"><div><h2>Buscar en Open Library</h2><p class="field-hint">Consulta libros de una API pública y añade los resultados a tu colección.</p></div></div>
      <form id="api-search-form" class="toolbar" style="grid-template-columns:minmax(0,1fr) auto">
        <div class="field"><label for="api-query">Título, autor o palabras clave</label><input id="api-query" type="search" placeholder="Ej. Harry Potter" required></div>
        <div style="align-self:end"><button class="button button-primary" type="submit">Buscar en la API</button></div>
      </form>
      <div id="api-status" class="field-hint" role="status"></div>
      <div id="api-results" class="api-results"></div>
    </section>`;

  const results = app.querySelector("#library-results");
  const list = new BookList(results, {
    onSelect: (id) => navigate(`/books/${encodeURIComponent(id)}`)
  });

  const searchInput = app.querySelector("#search");
  const statusFilter = app.querySelector("#status-filter");
  const genreFilter = app.querySelector("#genre-filter");
  const sortFilter = app.querySelector("#sort-filter");
  const count = app.querySelector("#results-count");

  const updateResults = () => {
    const books = bookService.search(searchInput.value, {
      status: statusFilter.value,
      genre: genreFilter.value,
      sort: sortFilter.value
    });
    count.textContent = `${books.length} ${books.length === 1 ? "libro encontrado" : "libros encontrados"}`;
    list.render(books);
  };

  [searchInput, statusFilter, genreFilter, sortFilter].forEach((element) => {
    element.addEventListener(element === searchInput ? "input" : "change", updateResults);
  });
  updateResults();

  app.querySelector("#api-search-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const query = app.querySelector("#api-query").value.trim();
    const status = app.querySelector("#api-status");
    const resultsContainer = app.querySelector("#api-results");
    status.textContent = "Buscando libros...";
    resultsContainer.innerHTML = "";

    try {
      const resultsFromApi = await searchBooks(query);

      if (!resultsFromApi.length) {
        status.textContent = "No se han encontrado resultados. Prueba con otra búsqueda.";
        return;
      }

      status.textContent = `Se han encontrado ${resultsFromApi.length} resultados.`;
      resultsContainer.innerHTML = resultsFromApi.map((book, index) => `
        <article class="api-result">
          ${book.cover ? `<img src="${escapeHtml(book.cover)}" alt="" loading="lazy">` : `<div class="api-result-cover" aria-hidden="true">📖</div>`}
          <div class="api-result-info"><h3>${escapeHtml(book.title)}</h3><p>${escapeHtml(book.author)} · ${escapeHtml(book.year)}</p></div>
          <button class="button button-secondary button-small" type="button" data-api-book="${index}">Añadir</button>
        </article>`).join("");

      resultsContainer.querySelectorAll("[data-api-book]").forEach((button) => {
        button.addEventListener("click", () => {
          const selectedBook = resultsFromApi[Number(button.dataset.apiBook)];
          const duplicate = bookService.getAll().some((book) =>
            book.title.toLocaleLowerCase("es") === selectedBook.title.toLocaleLowerCase("es")
            && book.author.toLocaleLowerCase("es") === selectedBook.author.toLocaleLowerCase("es")
          );

          if (duplicate) {
            status.textContent = "Ese libro ya está en tu biblioteca.";
            return;
          }

          const addedBook = bookService.add({ ...selectedBook, rating: 0, read: false });
          status.textContent = `«${addedBook.title}» se ha añadido a tu biblioteca.`;
          button.textContent = "Añadido";
          button.disabled = true;
          updateResults();
        });
      });
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Ha ocurrido un error inesperado.";
    }
  });
}

function renderBookForm(book = null) {
  new BookForm(app, {
    book,
    onSave: (data) => {
      const savedBook = book
        ? bookService.update(book.id, data)
        : bookService.add(data);
      navigate(`/books/${encodeURIComponent(savedBook.id)}`);
    },
    onCancel: () => navigate(book ? `/books/${encodeURIComponent(book.id)}` : "/books")
  }).render();
}

function renderBookDetail(id) {
  const book = bookService.getById(id);
  new BookDetail(app, {
    onEdit: (bookId) => navigate(`/books/${encodeURIComponent(bookId)}/edit`),
    onDelete: (bookId) => {
      const selected = bookService.getById(bookId);
      if (selected && window.confirm(`¿Seguro que quieres eliminar «${selected.title}»?`)) {
        bookService.delete(bookId);
        navigate("/books");
      }
    },
    onToggleRead: (bookId) => {
      bookService.toggleRead(bookId);
      renderBookDetail(bookId);
    },
    onLoan: (bookId) => {
      const borrower = window.prompt("¿A quién le prestas el libro?");
      if (!borrower?.trim()) return;
      const dueDate = window.prompt("Fecha prevista de devolución (AAAA-MM-DD):", new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
      if (!dueDate) return;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || Number.isNaN(Date.parse(`${dueDate}T00:00:00`))) {
        window.alert("Introduce una fecha válida en formato AAAA-MM-DD.");
        return;
      }
      bookService.createLoan(bookId, borrower, dueDate);
      renderBookDetail(bookId);
    },
    onReturnLoan: (bookId) => {
      bookService.returnLoan(bookId);
      renderBookDetail(bookId);
    }
  }).render(book);
}

function renderLoans() {
  const loanedBooks = bookService.getAll().filter((book) => book.loan);
  app.innerHTML = `<section class="panel">
    <div class="section-heading"><div><h2>Préstamos activos</h2><p class="field-hint">Controla a quién has prestado tus libros y cuándo deben volver.</p></div></div>
    ${loanedBooks.length ? `<div class="loan-list">${loanedBooks.map((book) => `
      <article class="loan-item">
        <div class="stat-icon">↗</div>
        <div class="loan-details"><h3>${escapeHtml(book.title)}</h3><p>Prestado a ${escapeHtml(book.loan.borrower)} · Devolución prevista: ${escapeHtml(book.loan.dueDate)}</p></div>
        <div class="loan-actions"><a class="button button-secondary button-small" href="#/books/${encodeURIComponent(book.id)}">Ver libro</a><button class="button button-primary button-small" data-return-loan="${escapeHtml(book.id)}">Registrar devolución</button></div>
      </article>`).join("")}</div>` : `<div class="empty-state"><div class="empty-icon">↗</div><h3>No tienes préstamos activos</h3><p>Entra en el detalle de un libro y selecciona «Prestar libro» para registrar un préstamo.</p><a class="button button-primary" href="#/books">Ver biblioteca</a></div>`}
  </section>`;

  app.querySelectorAll("[data-return-loan]").forEach((button) => {
    button.addEventListener("click", () => {
      bookService.returnLoan(button.dataset.returnLoan);
      renderLoans();
    });
  });
}

function renderStats() {
  const stats = bookService.getStats();
  const genres = Object.entries(stats.genreCounts).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(1, ...genres.map(([, count]) => count));

  app.innerHTML = `
    <section class="stats-grid">
      ${renderStatCard("Libros totales", stats.total, "▤", "En tu biblioteca")}
      ${renderStatCard("Libros leídos", stats.read, "✓", `${stats.unread} pendientes`)}
      ${renderStatCard("Páginas leídas", stats.pagesRead.toLocaleString("es-ES"), "≡", "Solo libros marcados como leídos")}
      ${renderStatCard("Valoración media", stats.averageRating ? `${stats.averageRating.toFixed(1)} ★` : "—", "☆", "Libros con valoración superior a 0")}
    </section>
    <div class="two-column">
      <section class="panel">
        <div class="section-heading"><h2>Géneros de tu biblioteca</h2></div>
        ${genres.length ? `<div class="genre-stat-list">${genres.map(([genre, count]) => `
          <div class="genre-stat-row"><span class="genre-name">${escapeHtml(genre)}</span><div class="progress-track"><div class="progress-bar" style="width:${(count / maxCount) * 100}%"></div></div><strong>${count}</strong></div>`).join("")}</div>` : `<div class="empty-state"><p>Añade libros para ver tus géneros más habituales.</p></div>`}
      </section>
      <section class="panel">
        <div class="section-heading"><h2>Tu resumen lector</h2></div>
        <div class="genre-stat-list">
          <div><p class="field-hint">Género más frecuente</p><h3 style="margin-top:6px">${escapeHtml(stats.favoriteGenre)}</h3></div>
          <div><p class="field-hint">Progreso de lectura</p><h3 style="margin:6px 0 10px">${stats.total ? Math.round((stats.read / stats.total) * 100) : 0}% completado</h3><div class="progress-track"><div class="progress-bar" style="width:${stats.total ? (stats.read / stats.total) * 100 : 0}%"></div></div></div>
          <div><p class="field-hint">Préstamos activos</p><h3 style="margin-top:6px">${stats.activeLoans}</h3></div>
          <div><p class="field-hint">Páginas pendientes (estimación)</p><h3 style="margin-top:6px">${bookService.getAll().filter((book) => !book.read).reduce((total, book) => total + book.pages, 0).toLocaleString("es-ES")}</h3></div>
        </div>
      </section>
    </div>`;
}

function renderNotFound() {
  app.innerHTML = `<section class="panel empty-state"><div class="empty-icon">⌕</div><h3>Página no encontrada</h3><p>La dirección que has escrito no existe.</p><a class="button button-primary" href="#/home">Volver al inicio</a></section>`;
}

function renderRoute() {
  const route = currentRoute();
  updateHeader(route);

  if (route === "/home") {
    renderHome();
  } else if (route === "/books") {
    renderLibrary();
  } else if (route === "/books/new") {
    renderBookForm();
  } else if (route === "/loans") {
    renderLoans();
  } else if (route === "/stats") {
    renderStats();
  } else {
    const editMatch = route.match(/^\/books\/([^/]+)\/edit$/);
    const detailMatch = route.match(/^\/books\/([^/]+)$/);

    if (editMatch) {
      const id = decodeURIComponent(editMatch[1]);
      const book = bookService.getById(id);
      book ? renderBookForm(book) : renderNotFound();
    } else if (detailMatch) {
      renderBookDetail(decodeURIComponent(detailMatch[1]));
    } else {
      renderNotFound();
    }
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

window.addEventListener("hashchange", renderRoute);
document.addEventListener("DOMContentLoaded", renderRoute);
