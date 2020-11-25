import { Location } from "./location.ts";
import type { SyntaxError } from "./typepiler-parser.ts";

export type Errors = Array<ErrorItem>;

export type ErrorItem =
  | DuplicateDefinitionError
  | DuplicateFieldNameError
  | DuplicateSetElementError
  | IncorrectTypeArityError
  | SyntaxError
  | TypeDefinitionFileDoesNotExistError
  | UnionDeclarationCyclicReferenceError
  | UnionDeclarationReferenceAliasDeclarationError
  | UnionDeclarationReferenceCompundTypeError
  | UnionDeclarationReferenceInteranlDeclarationError
  | UnionDeclarationReferenceSetDeclarationError
  | UnknownDeclarationError;

export type DuplicateDefinitionError = {
  tag: "DuplicateDefinitionError";
  location: Location;
  name: string;
};

export type DuplicateFieldNameError = {
  tag: "DuplicateFieldNameError";
  location: Location;
  name: string;
};

export type DuplicateSetElementError = {
  tag: "DuplicateSetElementError";
  location: Location;
  name: string;
};

export type IncorrectTypeArityError = {
  tag: "IncorrectTypeArityError";
  location: Location;
  name: string;
  expected: number;
  actual: number;
};

export type TypeDefinitionFileDoesNotExistError = {
  tag: "TypeDefinitionFileDoesNotExistError";
  name: string;
};

export type UnionDeclarationCyclicReferenceError = {
  tag: "UnionDeclarationCyclicReferenceError";
  location: Location;
  name: string;
};

export type UnionDeclarationReferenceAliasDeclarationError = {
  tag: "UnionDeclarationReferenceAliasDeclarationError";
  location: Location;
  name: string;
  reference: string;
};

export type UnionDeclarationReferenceCompundTypeError = {
  tag: "UnionDeclarationReferenceCompundTypeError";
  location: Location;
};

export type UnionDeclarationReferenceInteranlDeclarationError = {
  tag: "UnionDeclarationReferenceInteranlDeclarationError";
  location: Location;
  name: string;
  reference: string;
};

export type UnionDeclarationReferenceSetDeclarationError = {
  tag: "UnionDeclarationReferenceSetDeclarationError";
  location: Location;
  name: string;
  reference: string;
};

export type UnknownDeclarationError = {
  tag: "UnknownDeclarationError";
  location: Location;
  name: string;
};
