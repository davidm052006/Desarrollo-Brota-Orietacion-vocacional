module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  coverageReporters: ['text', 'lcov'],
  coverageDirectory: 'coverage',
  // Semana 5: umbral = max(60, cobertura real redondeada hacia abajo).
  // Medición del 16-nov-2026: sentencias 73.27, ramas 62.13, funciones 69.95,
  // líneas 76.69.
  coverageThreshold: {
    global: {
      branches: 62,
      functions: 69,
      lines: 76,
      statements: 73,
    },
  },
};
