# typepiler
A parser and type checker for a type compiler.

## Example

```
Program ::
  declarations: Seq Declaration;

Declaration =
  VariableDeclaration | FunctionDeclaration;

VariableDeclaration ::
  access: VariableAccess
  identifier: Identifier
  expression: LiteralExpression;

FunctionDeclaration ::
  identifier: Identifier
  arguments: Seq (Identifier * Type)
  statements: Seq Statement
  suffix: Type * Expression;

VariableAccess = {ReadOnly, ReadWrite};

Type =
  {Int, Float, Bool};

Statement =
  AssignmentStatement | DeclarationStatement | IfThenElseStatement | WhileStatement |
  BlockStatement | CallStatement | EmptyStatement;

AssignmentStatement ::
  identifier: Identifier
  expression: Expression;

DeclarationStatement ::
  access: VariableAccess
  identifier: Identifier
  expression: Expression;

IfThenElseStatement ::
  expression: Expression
  statement1: Statement
  statement2: Statement;

WhileStatement ::
  expression: Expression
  statement: Statement;

BlockStatement ::
  Seq Statement;

CallStatement ::
  identifier: Identifier
  expressions: Seq Expression;

EmptyStatement ::
  ;

Expression =
  TernaryExpression | BinaryExpression | UnaryExpression | CallExpression | Identifier |
  ParenthesisExpression | LiteralValue;

TernaryExpression ::
  expression1: Expression
  expression2: Expression
  expression3: Expression;

BinaryExpression ::
  expression1: Expression
  op: BinaryOp
  expression2: Expression;

UnaryExpression ::
  op: UnaryOp
  expression: Expression;

CallExpression ::
  identifier: Identifier
  expressions: Seq Expression;

ParenthesisExpression ::
  location: Location
  expression: Expression;

LiteralExpression =
  LiteralValue | LiteralUnaryValue;

LiteralValue =
  LiteralBool | LiteralInt | LiteralFloat | LiteralString;

LiteralBool ::
  location: Location
  value: B;

LiteralInt ::
  location: Location
  value: S;

LiteralFloat ::
  location: Location
  value: S;

LiteralString ::
  location: Location
  value: S;

LiteralUnaryValue ::
  location: Location
  op: UnaryOp
  value: LiteralValue;

BinaryOp =
  {Divide, Minus, Plus, Times, Equal, GreaterEqual, GreaterThan, LessEqual, LessThan,
   NotEqual, And, Or};

UnaryOp =
  {UnaryNot, UnaryMinus, UnaryPlus};

Identifier ::
  location: Location
  name: S;
```
