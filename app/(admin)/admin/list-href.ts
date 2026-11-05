export type ListHrefFilters = {
  search?: string;
  country?: string;
  attendance?: "today" | "never";
  period?: number;
  page?: number;
};

/** URL del listado de acreditaciones con los filtros indicados. */
export function listHref(filters: ListHrefFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.country) params.set("country", filters.country);
  if (filters.attendance) params.set("attendance", filters.attendance);
  if (filters.period) params.set("period", String(filters.period));
  if (filters.page && filters.page > 1) params.set("p", String(filters.page));
  const queryString = params.toString();
  return queryString ? `/admin?${queryString}` : "/admin";
}
