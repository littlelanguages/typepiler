export type Declarations = Array<Declaration>;

export type Declaration =
  | SetDeclaration
  | UnionDeclaration
  | SimpleComposite
  | RecordComposite
  | InternalDeclaration;

export type SetDeclaration = {
  tag: "SetDeclaration";
  name: string;
  elements: Array<String>;
};

export type UnionDeclaration = {
  tag: "UnionDeclaration";
  name: string;
  elements: Array<UnionDeclaration | SimpleComposite | RecordComposite>;
};

export type SimpleComposite = {
  tag: "SimpleComposite";
  name: string;
  type: Type;
};

export type RecordComposite = {
  tag: "RecordComposite";
  name: string;
  fields: Array<[String, Type]>;
};

export type InternalDeclaration = {
  tag: "InternalDeclaration";
  name: string;
};

export type Type = Tuple | Reference;

export type Tuple = {
  tag: "Tuple";
  value: Array<Type>;
};

export type Reference = {
  tag: "Reference";
  declaration: Declaration;
  parameters: Array<Type>;
};
