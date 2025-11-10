import { expect, afterEach, vi, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// ЗАЩИТА: Убеждаемся, что в тестовом окружении НЕ используются реальные переменные окружения
// Это предотвращает случайное подключение к реальной БД
beforeAll(() => {
  // Переопределяем переменные окружения на тестовые значения
  // Даже если они установлены, они не будут использованы благодаря мокам
  if (typeof process !== 'undefined') {
    process.env.VITE_SUPABASE_URL = 'https://test-mock.supabase.co';
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'test-mock-key';
  }
  
  // Дополнительная защита: проверяем, что мы в тестовом окружении
  if (import.meta.env.MODE !== 'test' && import.meta.env.MODE !== undefined) {
    console.warn('⚠️ ВНИМАНИЕ: Тесты запускаются не в тестовом режиме!');
  }
});

// Очистка после каждого теста
afterEach(() => {
  cleanup();
});

// Моки для window.matchMedia (используется в некоторых UI компонентах)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Моки для localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

