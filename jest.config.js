module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jest-environment-jsdom',
    setupFilesAfterEnv: ['@testing-library/jest-dom'],
    collectCoverage: true,
    coverageDirectory: 'docs',
    coverageReporters: ['text', 'lcov'],
    displayName: { name: 'ReactCCompiler', color: 'magenta' },
    verbose: true,
    forceExit: true,
    detectOpenHandles: true,
};
