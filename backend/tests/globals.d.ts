/**
 * Global type declarations for tests
 */

declare global {
  var pool: any;
}

declare namespace NodeJS {
  interface Global {
    pool: any;
  }
}

export {};
