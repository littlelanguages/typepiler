export type Types = {
  canonicalFileName: string;
  declarations: Declarations;
};

export type Declarations = Array<Declaration>;

export type Declaration =
  | SetDeclaration
  | AliasDeclaration
  | UnionDeclaration
  | SimpleComposite
  | RecordComposite
  | InternalDeclaration;

export type SetDeclaration = {
  tag: "SetDeclaration";
  src: string;
  name: string;
  elements: Array<string>;
};

export type AliasDeclaration = {
  tag: "AliasDeclaration";
  src: string;
  name: string;
  type: Type;
};

export type UnionDeclaration = {
  tag: "UnionDeclaration";
  src: string;
  name: string;
  elements: Array<UnionDeclaration | SimpleComposite | RecordComposite>;
};

export type SimpleComposite = {
  tag: "SimpleComposite";
  src: string;
  name: string;
  type: Type;
};

export type RecordComposite = {
  tag: "RecordComposite";
  src: string;
  name: string;
  fields: Array<[string, Type]>;
};

export type InternalDeclaration = {
  tag: "InternalDeclaration";
  name: string;
  arity: number;
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

export const builtinDeclarations: Array<InternalDeclaration> = [
  ["Bool", 0],
  ["U8", 0],
  ["S8", 0],
  ["U16", 0],
  ["S16", 0],
  ["U32", 0],
  ["S32", 0],
  ["U64", 0],
  ["S64", 0],
  ["F32", 0],
  ["F64", 0],
  ["Char", 0],
  ["String", 0],
  ["Seq", 1],
  ["Set", 1],
  ["Map", 2],
].map((
  [name, arity],
) => ({ tag: "InternalDeclaration", name, arity } as InternalDeclaration));
