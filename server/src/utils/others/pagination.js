// src/utils/pagination.js

/**
 * Build a consistent pagination meta object.
 *
 * Usage in a service:
 *   return { data: rows, ...buildPaginationMeta(total, page, limit) };
 *
 * Response shape:
 *   {
 *     data:        [...],
 *     total:       84,
 *     page:        2,
 *     limit:       20,
 *     totalPages:  5,
 *     hasNext:     true,
 *     hasPrev:     true,
 *   }
 */
export function buildPaginationMeta(total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Parse and clamp page / limit from query params.
 *
 * Usage in a controller:
 *   const { page, limit, skip } = parsePagination(req.query);
 */
export function parsePagination(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit) || defaultLimit));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
}