export * from "./cfg/definition.ts";
export * from "./parser/errors.ts";
export { translateFiles } from "./parser/dynamic.ts";
export { mkParser, parseDeclarations } from "./parser/typepiler-parser.ts";
export type { SyntaxError, Visitor } from "./parser/typepiler-parser.ts";
