import { vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Типы для моков
export type MockSupabaseClient = {
  from: ReturnType<typeof createMockFrom>;
  auth: {
    getUser: ReturnType<typeof createMockGetUser>;
    signInWithPassword: ReturnType<typeof createMockSignIn>;
    signUp: ReturnType<typeof createMockSignUp>;
    signOut: ReturnType<typeof createMockSignOut>;
  };
  rpc: ReturnType<typeof createMockRpc>;
  storage: ReturnType<typeof createMockStorage>;
};

// Создание мока для метода from()
export function createMockFrom() {
  const mockQuery = {
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
    then: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  return vi.fn().mockReturnValue(mockQuery);
}

// Создание мока для auth.getUser()
export function createMockGetUser() {
  return vi.fn().mockResolvedValue({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      },
    },
    error: null,
  });
}

// Создание мока для auth.signInWithPassword()
export function createMockSignIn() {
  return vi.fn().mockResolvedValue({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
      session: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      },
    },
    error: null,
  });
}

// Создание мока для auth.signUp()
export function createMockSignUp() {
  return vi.fn().mockResolvedValue({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
      session: null,
    },
    error: null,
  });
}

// Создание мока для auth.signOut()
export function createMockSignOut() {
  return vi.fn().mockResolvedValue({
    error: null,
  });
}

// Создание мока для rpc()
export function createMockRpc() {
  return vi.fn().mockResolvedValue({
    data: null,
    error: null,
  });
}

// Создание мока для storage
export function createMockStorage() {
  return {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({
        data: { path: 'mock-path' },
        error: null,
      }),
      download: vi.fn().mockResolvedValue({
        data: new Blob(),
        error: null,
      }),
      remove: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/mock-url' },
      }),
    }),
  };
}

// Создание полного мока Supabase клиента
export function createMockSupabaseClient(): MockSupabaseClient {
  return {
    from: createMockFrom(),
    auth: {
      getUser: createMockGetUser(),
      signInWithPassword: createMockSignIn(),
      signUp: createMockSignUp(),
      signOut: createMockSignOut(),
    },
    rpc: createMockRpc(),
    storage: createMockStorage(),
  } as any;
}

