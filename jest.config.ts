const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/src/' }),
  forceExit: true,
  detectOpenHandles: true,
  testMatch: ['**/src/tests/*.test.ts'],
  verbose: true,
  testTimeout: 200000,
};
