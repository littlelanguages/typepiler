import { combine, Location } from "./location.ts";

export type Declarations = Array<Declaration>;

export type Declaration =
  | SetDeclaration
  | UnionDeclaration
  | SimpleComposite
  | RecordComposite;

export type SetDeclaration = {
  tag: "SetDeclaration";
  name: Name;
  elements: Array<Name>;
};

export type UnionDeclaration = {
  tag: "UnionDeclaration";
  name: Name;
  elements: Array<Type>;
};

export type SimpleComposite = {
  tag: "SimpleComposite";
  name: Name;
  type: Type;
};

export type RecordComposite = {
  tag: "RecordComposite";
  name: Name;
  fields: Array<[Name, Type]>;
};

export type Name = {
  tag: "Name";
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
  name: Name;
  parameters: Array<Type>;
};

export type Parenthesis = {
  tag: "Parenthesis";
  location: Location;
  type: Type;
};

export const typeLocation = (type: Type): Location =>
  type.tag === "Reference"
    ? type.name.location
    : type.tag === "Parenthesis"
    ? type.location
    : combine(
      typeLocation(type.value[0]),
      typeLocation(type.value[type.value.length - 1]),
    );
