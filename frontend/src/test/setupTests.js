// Setup para Vitest: mocks globales necesarios para librerías que usan DOM
// Mock básico de ResizeObserver para evitar errores de chart.js en JSDOM
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = global.ResizeObserver || ResizeObserverMock;

// En algunas versiones de Node, el `localStorage` global experimental
// (nativo de Node, no el de jsdom) pisa al de jsdom y tira
// "Cannot read properties of undefined (reading 'removeItem')" apenas se
// usa — pasaba en TestVocacional.jsx al inicializar. Un polyfill simple en
// memoria evita depender de cuál gana según la versión de Node/Vitest.
if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.removeItem !== 'function') {
  class LocalStorageMock {
    constructor() { this.store = {}; }
    getItem(key) { return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null; }
    setItem(key, value) { this.store[key] = String(value); }
    removeItem(key) { delete this.store[key]; }
    clear() { this.store = {}; }
  }
  globalThis.localStorage = new LocalStorageMock();
}

// Make React available globally for tests that use JSX without explicit import
try {
  global.React = global.React || require('react');
} catch {
  // ignore if react isn't resolvable in the environment
}

// Añadir matchers de jest-dom para assertions como toBeDisabled, toBeInTheDocument, etc.
try {
  const matchers = require('@testing-library/jest-dom/matchers');
  const vitest = require('vitest');
  vitest.expect.extend(matchers);
} catch {
  // ignore if not installed or runtime doesn't support extend
}
