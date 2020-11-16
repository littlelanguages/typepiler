import { Location } from "./location.ts";
import type { SyntaxError } from "./typepiler-parser.ts";

export type Errors = Array<ErrorItem>;

export type ErrorItem =
  | SyntaxError
  | DuplicateDefinitionError
  | DuplicateSetElementError
  | UnknownTypeError
  | IncorrectTypeArityError;

export type DuplicateDefinitionError = {
  tag: "DuplicateDefinitionError";
  location: Location;
  name: string;
};

export type DuplicateSetElementError = {
  tag: "DuplicateSetElementError";
  location: Location;
  name: string;
};

export type UnknownTypeError = {
  tag: "UnknownTypeError";
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
