import '@testing-library/jest-dom';

// sessionStorage polyfill for jsdom environments that lack it partially
if (typeof window !== 'undefined' && !window.sessionStorage) {
  const store: Record<string, string> = {};
  // @ts-expect-error test polyfill
  window.sessionStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
}
