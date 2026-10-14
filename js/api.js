const API_URL = "https://openlibrary.org/search.json";

export async function searchBooks(query) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  const url = new URL(API_URL);
  url.searchParams.set("q", normalizedQuery);
  url.searchParams.set("limit", "8");
  url.searchParams.set("fields", "key,title,author_name,first_publish_year,number_of_pages_median,cover_i,subject");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("No se ha podido consultar la API. Inténtalo de nuevo.");
  }

  const data = await response.json();

  return (data.docs ?? []).map((item) => ({
    externalId: item.key,
    title: item.title ?? "Título desconocido",
    author: item.author_name?.[0] ?? "Autor desconocido",
    year: item.first_publish_year ?? new Date().getFullYear(),
    pages: item.number_of_pages_median ?? 1,
    cover: item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg` : "",
    genre: item.subject?.[0] ?? "Sin género"
  }));
}
