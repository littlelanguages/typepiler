import { Location } from "../deps/location.ts";

import type { SyntaxError } from "./typepiler-parser.ts";

export type Errors = Array<ErrorItem>;

export type ErrorItem =
  | DuplicateDefinitionError
  | DuplicateFieldNameError
  | DuplicateSetElementError
  | IncorrectTypeArityError
  | UseCycleError
  | SyntaxError
  | TypeDefinitionFileDoesNotExistError
  | UnionDeclarationCyclicReferenceError
  | UnionDeclarationReferenceAliasDeclarationError
  | UnionDeclarationReferenceCompoundTypeError
  | UnionDeclarationReferenceInteranlDeclarationError
  | UnionDeclarationReferenceSetDeclarationError
  | UnknownDeclarationError;

export type DuplicateDefinitionError = {
  tag: "DuplicateDefinitionError";
  location: Location;
  src: string;
  name: string;
};

export type DuplicateFieldNameError = {
  tag: "DuplicateFieldNameError";
  location: Location;
  src: string;
  name: string;
};

export type DuplicateSetElementError = {
  tag: "DuplicateSetElementError";
  location: Location;
  src: string;
  name: string;
};

export type IncorrectTypeArityError = {
  tag: "IncorrectTypeArityError";
  location: Location;
  src: string;
  name: string;
  expected: number;
  actual: number;
};

export type UseCycleError = {
  tag: "UseCycleError";
  name: string;
  names: Array<string>;
};

export type TypeDefinitionFileDoesNotExistError = {
  tag: "TypeDefinitionFileDoesNotExistError";
  name: string;
};

export type UnionDeclarationCyclicReferenceError = {
  tag: "UnionDeclarationCyclicReferenceError";
  location: Location;
  src: string;
  name: string;
};

export type UnionDeclarationReferenceAliasDeclarationError = {
  tag: "UnionDeclarationReferenceAliasDeclarationError";
  location: Location;
  src: string;
  name: string;
  reference: string;
};

export type UnionDeclarationReferenceCompoundTypeError = {
  tag: "UnionDeclarationReferenceCompoundTypeError";
  location: Location;
  src: string;
};

export type UnionDeclarationReferenceInteranlDeclarationError = {
  tag: "UnionDeclarationReferenceInteranlDeclarationError";
  location: Location;
  src: string;
  name: string;
  reference: string;
};

export type UnionDeclarationReferenceSetDeclarationError = {
  tag: "UnionDeclarationReferenceSetDeclarationError";
  location: Location;
  src: string;
  name: string;
  reference: string;
};

export type UnknownDeclarationError = {
  tag: "UnknownDeclarationError";
  location: Location;
  src: string;
  name: string;
};
