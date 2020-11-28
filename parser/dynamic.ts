import * as Path from "https://deno.land/std@0.76.0/path/mod.ts";

import * as AST from "./ast.ts";
import * as TST from "../cfg/definition.ts";
import { Either, isLeft, left, right } from "../data/either.ts";
import * as S from "../data/set.ts";
import * as Errors from "./errors.ts";
import { parse } from "./parser.ts";

export const translateFiles = (
  srcNames: Array<string>,
): Promise<Either<Errors.Errors, Array<TST.Types>>> =>
  Promise.all(
    srcNames.map(resolveSrcName).map((resolvedSrcName) =>
      translate(resolvedSrcName, S.emptySet as Set<string>)
    ),
  ).then((
    rs,
  ) => (rs.some(isLeft)
    ? left(rs.flatMap((r) => r.either((l) => l, (_) => [])))
    : right(mergeTypes(rs.flatMap((r) => r.either((_) => [], (r) => r)))))
  );

export const isSrcLoaded = (
  srcName: string,
  types: Array<TST.Types>,
): boolean => {
  return types.find((t) => t.canonicalFileName === srcName) !== undefined;
};

const resolveSrcName = (srcName: string): string =>
  srcName.startsWith("http") ? srcName : Path.resolve(srcName);

const translate = (
  fileName: string,
  loadedFileNames: Set<string>,
): Promise<Either<Errors.Errors, Array<TST.Types>>> => {
  const isURL = fileName.startsWith("http");

  const resolvedFileName = isURL ? fileName : Path.resolve(fileName);

  const readContent = (): Promise<string> =>
    isURL
      ? fetch(resolvedFileName).then((response) => response.text())
      : Deno.readTextFile(resolvedFileName);

  if (loadedFileNames.has(resolvedFileName)) {
    console.log(
      `Cycle detected: ${[...loadedFileNames]} -- ${resolvedFileName}`,
    );
    // TODO: report module cycle
    return Promise.resolve(left([]));
  } else {
    return readContent().then((content) =>
      translateContent(
        resolvedFileName,
        content,
        S.union(S.setOf(resolvedFileName), loadedFileNames),
      )
    ).catch((_) =>
      left(
        [{
          tag: "TypeDefinitionFileDoesNotExistError",
          name: resolvedFileName,
        }],
      )
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

type UseAlias = {
  tag: "UseAlias";
  bindings: Map<string, TST.Declaration>;
};

export const translateAST = (
  canonicalFileName: string,
  ast: AST.Declarations,
  loadedFileNames: Set<string>,
): Promise<Either<Errors.Errors, Array<TST.Types>>> => {
  const setElements = new Set<string>();
  const declarationBindings = new Map<string, TST.Declaration | UseAlias>(
    TST.builtinDeclarations.map((d) => [d.name, d]),
  );
  const errors: Errors.Errors = [];
  const declarations: TST.Declarations = [];

  const populateShellDeclaration = (d: AST.Declaration) => {
    const addDeclaration = (declaration: TST.Declaration) => {
      declarations.push(declaration);
      declarationBindings.set(declaration.name, declaration);
    };

    const declaration: TST.Declaration = (d.tag === "SetDeclaration")
      ? {
        tag: "SetDeclaration",
        name: d.name.id,
        elements: [],
      }
      : (d.tag === "UnionDeclaration" && d.elements.length === 1)
      ? {
        tag: "AliasDeclaration",
        name: d.name.id,
        type: typeShell,
      }
      : (d.tag === "UnionDeclaration")
      ? {
        tag: "UnionDeclaration",
        name: d.name.id,
        elements: [],
      }
      : (d.tag === "SimpleComposite")
      ? {
        tag: "SimpleComposite",
        name: d.name.id,
        type: typeShell,
      }
      : {
        tag: "RecordComposite",
        name: d.name.id,
        fields: [],
      };

    addDeclaration(declaration);
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
          const declaration = getDeclaration(t.name.id, t.qualifier?.id);

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

  const getDeclaration = (
    name: string,
    qualified: string | undefined = undefined,
  ): TST.Declaration | undefined => {
    if (qualified === undefined) {
      const binding = declarationBindings.get(name);

      return (binding === undefined || binding.tag === "UseAlias")
        ? undefined
        : binding;
    } else {
      const useBinding = declarationBindings.get(qualified);

      return (useBinding === undefined || useBinding.tag !== "UseAlias")
        ? undefined
        : useBinding.bindings.get(name);
    }
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
      const d = getDeclaration(type.name.id, type.qualifier?.id);

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

  const imports: Promise<Either<Errors.Errors, Array<TST.Types>>> = Promise.all(
    ast.imports.map((i) =>
      translate(
        relativeTo(
          canonicalFileName,
          i.source.value.slice(1, i.source.value.length - 1),
        ),
        loadedFileNames,
      )
    ),
  ).then(
    (
      rs,
    ) => (rs.some(isLeft)
      ? left(rs.flatMap((r) => r.either((l) => l, (_) => [])))
      : right(rs.flatMap((r) => r.either((_) => [], (r) => r)))),
  );

  return imports.then((imports) => {
    return imports.either((e) => left(e), (i) => {
      ast.imports.forEach((imp, idx) => {
        if (imp.qualified === undefined) {
          i[idx].declarations.forEach((d) => {
            if (declarationBindings.has(d.name)) {
              errors.push({
                tag: "DuplicateDefinitionError",
                location: imp.source.location,
                name: d.name,
              });
            }
            declarationBindings.set(d.name, d);
          });
        } else {
          if (declarationBindings.has(imp.qualified.id)) {
            errors.push({
              tag: "DuplicateDefinitionError",
              location: imp.qualified.location,
              name: imp.qualified.id,
            });
          }
          declarationBindings.set(
            imp.qualified.id,
            {
              tag: "UseAlias",
              bindings: new Map<string, TST.Declaration>(
                i[idx].declarations.map((d) => [d.name, d]),
              ),
            },
          );
        }
      });

      ast.declarations.forEach((d) => {
        if (declarationBindings.has(d.name.id)) {
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
  if (src.startsWith("http")) {
    const srcURL = new URL(src);
    const srcParse = Path.parse(srcURL.pathname);
    const targetParse = Path.parse(target);

    srcURL.pathname = Path.normalize(Path.format(
      Object.assign(
        {},
        targetParse,
        { dir: srcParse.dir + "/" + targetParse.dir },
      ),
    ));

    return srcURL.toString();
  } else {
    const srcParse = Path.parse(src);
    const targetParse = Path.parse(target);

    return targetParse.dir.startsWith("/") ? target : Path.resolve(Path.format(
      Object.assign(
        {},
        targetParse,
        { dir: srcParse.dir + "/" + targetParse.dir },
      ),
    ));
  }
};

const mergeTypes = (types: Array<TST.Types>): Array<TST.Types> => {
  const result: Array<TST.Types> = [];

  // console.log("***************************");
  // console.log(types);

  types.forEach((type) => {
    if (!isSrcLoaded(type.canonicalFileName, result)) {
      result.push(type);
    }
  });

  // console.log("---------------------------");
  // console.log(result);
  // console.log("***************************");

  return result;
};
