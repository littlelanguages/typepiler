import * as Path from "https://deno.land/std@0.76.0/path/mod.ts";

import * as AST from "./ast.ts";
import * as TST from "../cfg/definition.ts";
import { Either, isLeft, left, right } from "../data/either.ts";
import * as S from "../data/set.ts";
import * as Errors from "./errors.ts";
import { parse } from "./parser.ts";

export const translate = (
  fileName: string,
  loadedFileNames: Set<string>,
): Promise<Either<Errors.Errors, Array<TST.Types>>> => {
  const isURL = fileName.startsWith("http");

  const resolvedFileName = isURL ? fileName : Path.resolve(fileName);

  console.log(`***** ${resolvedFileName}`);

  const readContent = (): Promise<string> =>
    isURL
      ? fetch(resolvedFileName).then((response) => response.text())
      : Deno.readTextFile(resolvedFileName);

  if (loadedFileNames.has(resolvedFileName)) {
    // TODO: report module cycle
    return Promise.resolve(left([]));
  } else {
    // TODO: report error if Deno.readTextFile throws error

    loadedFileNames.add(resolvedFileName);
    return readContent().then((content) =>
      translateContent(resolvedFileName, content, loadedFileNames)
    );
  }
};

export const translateContent = (
  canonicalFileName: string,
  input: string,
  loadedFileNames: Set<string>,
): Promise<Either<Errors.Errors, Array<TST.Types>>> => {
  const parseInput: Either<Errors.Errors, AST.Declarations> = parse(input);

  return parseInput.either(
    (e: Errors.Errors) => Promise.resolve(left(e)),
    (ast) => translateAST(canonicalFileName, ast, loadedFileNames),
  );
};

export const translateAST = (
  canonicalFileName: string,
  ast: AST.Declarations,
  loadedFileNames: Set<string>,
): Promise<Either<Errors.Errors, Array<TST.Types>>> => {
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
          errors.push({
            tag: "UnionDeclarationReferenceCompundTypeError",
            location: AST.typeLocation(t),
          });
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

  const flattenUnionDeclaration = (d: AST.Declaration) => {
    const flattenDeclaration = (
      names: Set<string>,
      d: TST.UnionDeclaration | TST.SimpleComposite | TST.RecordComposite,
    ): Array<TST.SimpleComposite | TST.RecordComposite> => {
      if (d.tag === "UnionDeclaration") {
        if (names.has(d.name)) {
          throw d.name;
        } else {
          names = S.union(names, S.setOf(d.name));

          return d.elements.flatMap((e) => flattenDeclaration(names, e));
        }
      } else {
        return [d];
      }
    };

    const uniqueUnion = (
      ds: Array<TST.SimpleComposite | TST.RecordComposite>,
    ): Array<TST.SimpleComposite | TST.RecordComposite> => {
      let names: Set<string> = new Set();
      const result: Array<TST.SimpleComposite | TST.RecordComposite> = [];

      ds.forEach((d) => {
        if (!names.has(d.name)) {
          result.push(d);

          names.add(d.name);
        }
      });

      return result;
    };

    if (d.tag === "UnionDeclaration" && d.elements.length > 1) {
      const tst = getDeclaration(d.name.id) as TST.UnionDeclaration;

      try {
        tst.elements = uniqueUnion(
          tst.elements.flatMap((e) =>
            flattenDeclaration(S.setOf(d.name.id), e)
          ),
        );
      } catch (e) {
        errors.push(
          {
            tag: "UnionDeclarationCyclicReferenceError",
            location: d.name.location,
            name: e,
          },
        );
      }
    }
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

  const resolveImports = (): Promise<Either<Errors.Errors, Array<TST.Types>>> =>
    Promise.all(
      ast.imports.map((i) =>
        translate(
          relativeTo(
            canonicalFileName,
            i.source.value.slice(1, i.source.value.length - 1),
          ),
          loadedFileNames,
        )
      ),
    )
      .then(
        (
          rs,
        ) => (rs.some(isLeft)
          ? left(rs.flatMap((r) => r.either((l) => l, (_) => [])))
          : right(rs.flatMap((r) => r.either((_) => [], (r) => r)))),
      );

  const imports = resolveImports();

  return imports.then((imports) => {
    // console.log(`*************** ${JSON.stringify(imports, null, 2)}`);

    return imports.either((e) => left(e), (i) => {
      ast.declarations.forEach((d) => {
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

      ast.declarations.forEach(translateDeclaration);
      ast.declarations.forEach(flattenUnionDeclaration);

      // console.log(`*************** ${JSON.stringify(declarations, null, 2)}`);

      // console.log(errors);

      return errors.length === 0
        ? right(
          [
            {
              canonicalFileName: canonicalFileName,
              declarations: declarations,
            },
            ...i,
          ],
        )
        : left(errors);
    });
  });
};

const typeShell: TST.Type = { tag: "Tuple", value: [] };

const relativeTo = (src: string, target: string): string => {
  let srcParse = Path.parse(src);
  const targetParse = Path.parse(target);
  return (srcParse.root !== targetParse.root ||
      targetParse.dir.startsWith("/"))
    ? target
    : Path.normalize(Path.format(
      Object.assign(
        targetParse,
        { dir: srcParse.dir + "/" + targetParse.dir },
      ),
    ));
};
