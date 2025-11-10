import { vi } from 'vitest';

/**
 * Вспомогательная функция для создания моков Supabase query объектов
 * Создает thenable объект, который можно использовать с await
 */
export function createMockSupabaseQuery<T = any>(mockData: T = null as any) {
  const query = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
  };

  // Делаем объект thenable (можно использовать с await)
  return Object.assign(
    Promise.resolve({ data: mockData, error: null }),
    query
  );
}

/**
 * Создает мок для query с single() - возвращает один объект
 */
export function createMockSupabaseQueryWithSingle<T = any>(mockData: T) {
  const query = createMockSupabaseQuery(mockData);
  // single() должен возвращать промис с одним объектом
  query.single = vi.fn().mockResolvedValue({ data: mockData, error: null });
  return query;
}

/**
 * Создает мок для query с maybeSingle() - возвращает один объект или null
 */
export function createMockSupabaseQueryWithMaybeSingle<T = any>(mockData: T | null) {
  const query = createMockSupabaseQuery(mockData);
  // maybeSingle() должен возвращать промис с одним объектом или null
  query.maybeSingle = vi.fn().mockResolvedValue({ data: mockData, error: null });
  return query;
}

