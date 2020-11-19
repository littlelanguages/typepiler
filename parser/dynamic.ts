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
        type: typeShell,
      });
    } else if (d.tag === "UnionDeclaration") {
      declarations.push({
        tag: "UnionDeclaration",
        name: d.name.id,
        elements: [],
      });
    } else if (d.tag === "SimpleComposite") {
      declarations.push({
        tag: "SimpleComposite",
        name: d.name.id,
        type: typeShell,
      });
    } else {
      declarations.push({
        tag: "RecordComposite",
        name: d.name.id,
        fields: [],
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
    } else if (d.tag === "UnionDeclaration") {
      const tst = getDeclaration(d.name.id) as TST.UnionDeclaration;

      d.elements.forEach((t) => {
        if (t.tag === "Reference") {
          const declaration = getDeclaration(t.name.id);

          if (declaration === undefined) {
            errors.push({
              tag: "UnknownDeclarationError",
              location: t.name.location,
              name: t.name.id,
            });
          } else if (declaration.tag === "InternalDeclaration") {
            errors.push({
              tag: "UnionDeclarationReferenceInteranlDeclarationError",
              location: t.name.location,
              name: d.name.id,
              reference: t.name.id,
            });
          } else if (declaration.tag === "AliasDeclaration") {
            errors.push({
              tag: "UnionDeclarationReferenceAliasDeclarationError",
              location: t.name.location,
              name: d.name.id,
              reference: t.name.id,
            });
          } else if (declaration.tag === "SetDeclaration") {
            errors.push({
              tag: "UnionDeclarationReferenceSetDeclarationError",
              location: t.name.location,
              name: d.name.id,
              reference: t.name.id,
            });
          } else {
            tst.elements.push(declaration);
          }
        } else {
          throw `TODO - ${t}`;
        }
      });
    } else if (d.tag === "SimpleComposite") {
      const tst = getDeclaration(d.name.id) as TST.SimpleComposite;

      tst.type = translateType(d.type);
    } else if (d.tag === "RecordComposite") {
      const fieldNames = new Set();

      d.fields.forEach(([n, _]) => {
        if (fieldNames.has(n.id)) {
          errors.push(
            {
              tag: "DuplicateFieldNameError",
              location: n.location,
              name: n.id,
            },
          );
        }
        fieldNames.add(n.id);
      });

      const tst = getDeclaration(d.name.id) as TST.RecordComposite;

      tst.fields = d.fields.map(([n, t]) => [n.id, translateType(t)]);
    }
  };

  const getDeclaration = (name: string): TST.Declaration | undefined => {
    let declaration: TST.Declaration | undefined = TST.builtinDeclarations.find(
      (d) => d.name === name,
    );

    if (declaration === undefined) {
      declaration = declarations.find((d) => d.name === name);
    }

    return declaration;
  };

  const translateType = (type: AST.Type): TST.Type => {
    if (type.tag === "Tuple") {
      return { tag: "Tuple", value: type.value.map(translateType) };
    } else if (type.tag === "Parenthesis") {
      return translateType(type.type);
    } else {
      const d = getDeclaration(type.name.id);

      if (d === undefined) {
        errors.push({
          tag: "UnknownDeclarationError",
          location: type.name.location,
          name: type.name.id,
        });
        return typeShell;
      } else if (
        d.tag === "InternalDeclaration" && d.arity !== type.parameters.length
      ) {
        errors.push({
          tag: "IncorrectTypeArityError",
          location: type.name.location,
          name: type.name.id,
          expected: d.arity,
          actual: type.parameters.length,
        });

        return typeShell;
      } else {
        return {
          tag: "Reference",
          declaration: d,
          parameters: type.parameters.map(translateType),
        };
      }
    }
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
  });

  ast.forEach(translateDeclaration);

  return errors.length === 0 ? right(declarations) : left(errors);
};

const typeShell: TST.Type = { tag: "Tuple", value: [] };
