# typepiler
A parser and type checker for a type compiler.

The type syntax is based on the early versions of VDM which has been more recently adopoted into TypeScript.  The following grammar describes the syntax of these definitions.

```
uses "./typepiler.llld";

Declarations: {Import} {Declaration};

Import: "use" LiteralString ["as" UpperID] ";";

Declaration: UpperID ("=" Alias | "::" Composite) ";";

Alias
  : Type {"|" Type}
  | "{" UpperID {"," UpperID} "}"
  ;

Composite
  : Type
  | {LowerID ":" Type}
  ;

Type: TypeTerm {"*" TypeTerm};

TypeTerm
  : UpperID ["." UpperID] {TypeFactor}
  | "(" Type ")"
  ;

TypeFactor
  : UpperID ["." UpperID]
  | "(" Type ")"
  ;
```

This definition refers to the following lexical definition.

```
tokens
    LowerID = lowerAlpha {alpha | digit};
    UpperID = upperAlpha {alpha | digit};
    LiteralString = '"' {!'"'} '"';

comments
    "/*" to "*/" nested;
    "//" {!cr};

whitespace
    chr(0)-' ';

fragments
    digit = '0'-'9';
    lowerAlpha = 'a' - 'z';
    upperAlpha = 'A'-'Z';
    alpha = lowerAlpha + upperAlpha;
    cr = chr(10);
```

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
  value: Bool;

LiteralInt ::
  location: Location
  value: String;

LiteralFloat ::
  location: Location
  value: String;

LiteralString ::
  location: Location
  value: String;

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
  name: String;
```
## Building Source

The directory `~/.devcontainer` contains a Dockerfile used by [Visual Studio Code](https://code.visualstudio.com) to issolate the editor and build tools from being installed on the developer's workstation.

The Dockerfile is straightforward with the interesting piece being [entr](https://github.com/eradman/entr/) which is used by the `etl.sh` to run `test.sh` whenever a source file has changed.

## Scripts

Two script can be found inside `~/.bin`

| Name   | Purpose |
|--------|----------------------------------|
| build.sh | Builds the scanner and parser in the event that the lexical ([./parser/typepiler.llld](./parser/typepiler.llld)) and syntactic ([./parser/typepiler.llgd](./parser/typepiler.llgd)) definitions have been changed. |
| etl.sh | Runs an edit-test-loop - loops indefinately running all of the tests whenever a source file has changed. |
| test.sh | Runs lint on the source code and executes the automated tests. |

These scripts must be run out of the project's root directory which, when using [Visual Studio Code](https://code.visualstudio.com), is done using a shell inside the container.