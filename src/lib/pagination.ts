// Shared shape for a Spring Data Page<T> JSON response — every backend list
// endpoint that paginates (Leads, lead-source webhook events, lead-source
// import attempts, ...) returns this same structure, so the frontend has one
// type for it instead of each feature defining its own copy.
export interface Page<T> {
  content: T[];
  /** Current page, 0-based — matches the `page` query param sent to the API. */
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
