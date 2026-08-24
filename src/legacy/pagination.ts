/**
 * Pagination helpers shared by the reporting queries.
 *
 * Contract: pages are 1-based. `page=1` is the first page.
 */

export interface PageParams {
  page: number;
  limit: number;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const DEFAULT_LIMIT = 25;
export const MAX_LIMIT = 200;

export function parsePageParams(
  query: Record<string, string | undefined>,
): PageParams {
  const page = Number(query.page ?? "1");
  const limit = Number(
    query.limit ?? String(DEFAULT_LIMIT),
  );

  return {
    page:
      Number.isFinite(page) && page >= 1
        ? Math.floor(page)
        : 1,

    limit:
      Number.isFinite(limit) && limit >= 1
        ? Math.min(
          Math.floor(limit),
          MAX_LIMIT,
        )
        : DEFAULT_LIMIT,
  };
}

/**
 * Convert a 1-based page number into a zero-based
 * database offset.
 *
 * Examples:
 *
 * page=1, limit=25 → offset=0
 * page=2, limit=25 → offset=25
 * page=3, limit=25 → offset=50
 */
export function toOffset(
  params: PageParams,
): number {
  return (
    (params.page - 1) *
    params.limit
  );
}

export function toPageMeta(
  params: PageParams,
  total: number,
): PageMeta {
  return {
    page: params.page,

    limit: params.limit,

    total,

    totalPages: Math.max(
      1,
      Math.ceil(
        total / params.limit,
      ),
    ),
  };
}