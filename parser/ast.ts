import { Location } from "./location.ts";

export type Declarations = Array<Declaration>;

export type Declaration =
  | SetDeclaration
  | UnionDeclaration
  | SimpleComposite
  | RecordComposite;

export type SetDeclaration = {
  tag: "SetDeclaration";
  name: ID;
  elements: Array<ID>;
};

export type UnionDeclaration = {
  tag: "UnionDeclaration";
  name: ID;
  elements: Array<Type>;
};

export type SimpleComposite = {
  tag: "SimpleComposite";
  name: ID;
  type: Type;
};

export type RecordComposite = {
  tag: "RecordComposite";
  name: ID;
  fields: Array<[ID, Type]>;
};

export type ID = {
  tag: "ID";
  location: Location;
  id: string;
};

export type Type = Tuple | Reference | Parenthesis;

export type Tuple = {
  tag: "Tuple";
  value: Array<Type>;
};

export type Reference = {
  tag: "Reference";
  name: ID;
  parameters: Array<Type>;
};

export type Parenthesis = {
  tag: "Parenthesis";
  location: Location;
  type: Type;
};
