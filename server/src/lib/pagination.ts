export const DEFAULT_PAGE_SIZE = 50

export type PaginationQuery =
  | { mode: 'paged'; page: number; pageSize: number; skip: number; take: number }
  | { mode: 'all'; page: 1; skip: 0 }

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
  all?: boolean
}

type QuerySource = {
  req: { query: (key: string) => string | undefined }
}

export function parsePagination(source: QuerySource): PaginationQuery {
  const pageSizeRaw = source.req.query('pageSize')
  if (pageSizeRaw === 'all') {
    return { mode: 'all', page: 1, skip: 0 }
  }

  const page = Math.max(1, Number.parseInt(source.req.query('page') ?? '1', 10) || 1)
  const pageSize = Math.max(
    1,
    Number.parseInt(pageSizeRaw ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE
  )
  const skip = (page - 1) * pageSize
  return { mode: 'paged', page, pageSize, skip, take: pageSize }
}

/** Prisma list args: omit take/skip when loading all rows. */
export function prismaListArgs(query: PaginationQuery): { skip?: number; take?: number } {
  if (query.mode === 'all') return {}
  return { skip: query.skip, take: query.take }
}

export function toPaginationMeta(total: number, query: PaginationQuery): PaginationMeta {
  if (query.mode === 'all') {
    return { page: 1, pageSize: total, total, totalPages: 1, all: true }
  }
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize))
  return {
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages
  }
}
