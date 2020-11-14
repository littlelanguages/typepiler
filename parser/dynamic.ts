import * as AST from "./ast.ts";
import * as TST from "../cfg/definition.ts";
import { Either, left, right } from "../data/either.ts";
import * as Errors from "./errors.ts";
import { parse } from "./parser.ts";

export const translate = (
  input: string,
): Either<Errors.Errors, TST.Declarations> =>
  parse(input).andThen(translateAST);

export const translateAST = (
  ast: AST.Declarations,
): Either<Errors.Errors, TST.Declarations> => {
  const setElements = new Set<string>();
  const declarationNames = new Set<string>();
  const errors: Errors.Errors = [];
  const declarations: TST.Declarations = [];

  const translateDeclaration = (d: AST.Declaration) => {
    if (declarationNames.has(d.name.id)) {
      errors.push(
        {
          tag: "DuplicateDefinitionError",
          location: d.name.location,
          name: d.name.id,
        },
      );
    }

    if (d.tag === "SetDeclaration") {
      d.elements.forEach((n) => {
        if (setElements.has(n.id)) {
          errors.push(
            {
              tag: "DuplicateSetElementError",
              location: n.location,
              name: n.id,
            },
          );
        }
        setElements.add(n.id);
      });

      declarations.push(
        {
          tag: "SetDeclaration",
          name: d.name.id,
          elements: d.elements.map((e) => e.id),
        },
      );
    }
  };

  ast.forEach((d) => translateDeclaration(d));

  return errors.length === 0 ? right(declarations) : left(errors);
};
