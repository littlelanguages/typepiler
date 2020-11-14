import * as AST from "./ast.ts";
import * as TST from "../cfg/definition.ts";
import { Either, right } from "../data/either.ts";
import * as Errors from "./errors.ts";
import { parse } from "./parser.ts";

export const translate = (
  input: string,
): Either<Errors.Errors, TST.Declarations> => parse(input).map(translateAST);

export const translateAST = (ast: AST.Declarations): TST.Declarations => [];
