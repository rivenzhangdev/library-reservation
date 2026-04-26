export interface PaginationState {
  page: number;
  pageSize: number;
  total?: number;
  hasMore: boolean;
}

export function calcHasMore(params: {
  page: number;
  pageSize: number;
  total?: number;
  batchSize: number;
}) {
  const { page, pageSize, total, batchSize } = params;
  if (typeof total === 'number' && Number.isFinite(total)) {
    return page * pageSize < total;
  }
  return batchSize >= pageSize;
}

export function mergeUniqueByKey<T>(prev: T[], next: T[], keyGetter: (item: T) => string): T[] {
  const map = new Map<string, T>();
  [...prev, ...next].forEach((item) => {
    map.set(keyGetter(item), item);
  });
  return Array.from(map.values());
}
