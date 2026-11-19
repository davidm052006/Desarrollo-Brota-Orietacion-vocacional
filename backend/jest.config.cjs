module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  coverageReporters: ['text', 'lcov'],
  coverageDirectory: 'coverage',
  // Semana 6: umbral = max(70, cobertura real redondeada hacia abajo), medida
  // SIN DATABASE_URL (como el CI: la integración se salta). Medición del
  // 19-nov-2026: sentencias 84.87, ramas 72.69, funciones 82.8, líneas 87.57.
  coverageThreshold: {
    global: {
      branches: 72,
      functions: 82,
      lines: 87,
      statements: 84,
    },
  },
};
