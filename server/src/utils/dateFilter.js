// src/utils/dateFilter.js

/**
 * Build a Prisma-compatible date range filter for any DateTime field.
 *
 * Usage:
 *   where: { createdAt: buildDateFilter(from, to) }
 *
 * Both params are optional ISO strings or Date objects.
 *   buildDateFilter("2024-01-01", "2024-01-31")
 *   → { gte: Date("2024-01-01T00:00:00Z"), lte: Date("2024-01-31T23:59:59Z") }
 *
 * Returns undefined when neither param is provided
 * (Prisma ignores undefined in where clauses).
 */
export function buildDateFilter(from, to) {
  if (!from && !to) return undefined;

  const filter = {};

  if (from) {
    const d = new Date(from);
    d.setHours(0, 0, 0, 0);
    filter.gte = d;
  }

  if (to) {
    const d = new Date(to);
    d.setHours(23, 59, 59, 999);
    filter.lte = d;
  }

  return filter;
}

/**
 * Returns a date range for "today" in local time.
 * Useful for the shipmentsToday stat card.
 */
export function todayFilter() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { gte: start, lte: end };
}

/**
 * Returns a date range for the last N days (inclusive of today).
 */
export function lastNDaysFilter(n) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date();
  start.setDate(start.getDate() - (n - 1));
  start.setHours(0, 0, 0, 0);

  return { gte: start, lte: end };
}