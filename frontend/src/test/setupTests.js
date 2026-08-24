// Setup para Vitest: mocks globales necesarios para librerías que usan DOM
// Mock básico de ResizeObserver para evitar errores de chart.js en JSDOM
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = global.ResizeObserver || ResizeObserverMock;

// Make React available globally for tests that use JSX without explicit import
try {
  // eslint-disable-next-line global-require
  global.React = global.React || require('react');
} catch (e) {
  // ignore if react isn't resolvable in the environment
}

// Añadir matchers de jest-dom para assertions como toBeDisabled, toBeInTheDocument, etc.
try {
  // eslint-disable-next-line global-require
  const matchers = require('@testing-library/jest-dom/matchers');
  // eslint-disable-next-line global-require
  const vitest = require('vitest');
  vitest.expect.extend(matchers);
} catch (e) {
  // ignore if not installed or runtime doesn't support extend
}
