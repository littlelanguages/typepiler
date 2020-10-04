# typepiler
A parser and type checker for a type compiler.

## Example

```
Program = Seq<Declaration>;

Declaration = VariableDeclaration | FunctionDeclaration;

VariableDeclaration :: VariableAccess * Identifier * LiteralExpression;
FunctionDeclaration :: Identifier * Seq<Identifier * Type> * Seq<Statement> * Opt<Type * Expression>;

VariableAccess = {ReadOnly, ReadWrite};

Statement = AssignmentStatement | IfThenElseStatement | WhileStatement | BlockStatement | CallStatement | EmptyStatement;

AssignmentStatement :: Opt<VariableAccess> * Identifier * Expression;
IfThenElseStatement :: Expression * Statement * Opt<Statement>;
WhileStatement :: Expression * Statement;
BlockStatement :: Seq<Statement>;
CallStatement :: Identifier * Seq<Expression>;
EmptyStatement :: ;

Expression = TernaryExpression | BinaryExpression | UnaryExpression | CallExpression | IdentifierReference | Parenthesis | LiteralValue;

TernaryExpression :: Expression * Expression * Expression;
BinaryExpression :: BinaryOp * Expression * Expression;
UnaryExpression :: Position * UnaryOp * Expression;
CallExpression :: Identifier * Seq<Expression>;
IdentifierReference :: Identifier;
Parenthesis :: Position * Expression;

LiteralExpression = LiteralValue | LiteralUnaryValue;

LiteralValue = LiteralBool | LiteralInt | LiteralFloat | LiteralString;
LiteralBool :: Position * B;
LiteralInt :: Position * S;
LiteralFloat :: Position * S;
LiteralString :: Position * S;

LiteralUnaryValue :: Position * UnaryOp * LiteralValue;

BinaryOp = { Divide, Minus, Plus, Times, Equal, GreaterEqual, GreaterThan, LessEqual, LessThan, NotEqual, And, Or };
UnaryOp = { UnaryNot, UnaryMinus, UnaryPlus };

Identifier = Position * S;
```
