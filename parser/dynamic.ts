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
  const declarationNames = new Set<string>(
    [...TST.builtinDeclarations.map((d) => d.name)],
  );
  const errors: Errors.Errors = [];
  const declarations: TST.Declarations = [];

  const populateShellDeclaration = (d: AST.Declaration) => {
    if (d.tag === "SetDeclaration") {
      declarations.push(
        {
          tag: "SetDeclaration",
          name: d.name.id,
          elements: [],
        },
      );
    } else if (d.tag === "UnionDeclaration" && d.elements.length === 1) {
      declarations.push({
        tag: "AliasDeclaration",
        name: d.name.id,
        type: { tag: "Tuple", value: [] },
      });
    } else if (d.tag === "UnionDeclaration") {
      declarations.push({
        tag: "UnionDeclaration",
        name: d.name.id,
        elements: [],
      });
    }

    declarationNames.add(d.name.id);
  };

  const translateDeclaration = (d: AST.Declaration) => {
    if (d.tag === "SetDeclaration") {
      const tst = getDeclaration(d.name.id) as TST.SetDeclaration;

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

      tst.elements = d.elements.map((e) => e.id);
    } else if (d.tag === "UnionDeclaration" && d.elements.length === 1) {
      const tst = getDeclaration(d.name.id) as TST.AliasDeclaration;

      tst.type = translateType(d.elements[0]);
    }
  };

  const getDeclaration = (name: string): TST.Declaration => {
    let declaration: TST.Declaration | undefined = TST.builtinDeclarations.find(
      (d) => d.name === name,
    );

    if (declaration === undefined) {
      declaration = declarations.find((d) => d.name === name);
    }

    if (declaration === undefined) {
      throw `Unknown declaration: ${name}`;
    } else {
      return declaration;
    }
  };

  const translateType = (type: AST.Type): TST.Type =>
    type.tag === "Tuple"
      ? { tag: "Tuple", value: type.value.map(translateType) }
      : type.tag === "Parenthesis"
      ? translateType(type.type)
      : {
        tag: "Reference",
        declaration: getDeclaration(type.name.id),
        parameters: type.parameters.map(translateType),
      };

  ast.forEach((d) => {
    if (declarationNames.has(d.name.id)) {
      errors.push(
        {
          tag: "DuplicateDefinitionError",
          location: d.name.location,
          name: d.name.id,
        },
      );
    } else {
      populateShellDeclaration(d);
    }

    translateDeclaration(d);
  });

  return errors.length === 0 ? right(declarations) : left(errors);
};
Í