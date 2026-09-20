/* Stands in for the `server-only` package under test. That package exists
   purely to fail a build when a server module is imported into client code;
   it has no runtime surface, so an empty module is a faithful stand-in. */
export {};
