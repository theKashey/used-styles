export const flattenOrder = (order: string | boolean | number | null): number => {
  if (typeof order === 'number' || typeof order === 'string') {
    return +order;
  }

  if (order === true) {
    return 0;
  }

  return Number.NaN;
};

export function unique<T extends any[]>(data: T): T {
  return Array.from(new Set<any>(data)) as T;
}
