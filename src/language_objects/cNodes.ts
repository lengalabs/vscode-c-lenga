// ==========================
// Base Type
// ==========================

export interface BaseLanguageObject {
  id: string;
  type: string;
}

// ==========================
// LanguageObject (union of everything)
// ==========================

export type LanguageObject =
  | SourceFile
  | Declaration
  | FunctionDeclaration
  | FunctionDefinition
  | PreprocInclude
  | Comment
  | FunctionParameter
  | AssignmentExpression
  | BinaryExpression
  | CallExpression
  | NumberLiteral
  | Reference
  | StringLiteral
  | CompoundStatement
  | IfStatement
  | ReturnStatement
  | ElseClause
  | Unknown;

// ==========================
// Grouped Unions (by role)
// ==========================

export type DeclarationObject =
  | Declaration
  | FunctionDeclaration
  | FunctionDefinition
  | PreprocInclude
  | Comment
  | Unknown;

export type ExpressionObject =
  | AssignmentExpression
  | BinaryExpression
  | CallExpression
  | NumberLiteral
  | Reference
  | StringLiteral
  | Unknown;

export type StatementObject = CompoundStatement | IfStatement | ReturnStatement | Unknown;

export type CompoundStatementObject =
  | Declaration
  | AssignmentExpression
  | BinaryExpression
  | CallExpression
  | NumberLiteral
  | Reference
  | StringLiteral
  | CompoundStatement
  | IfStatement
  | ReturnStatement
  | Comment
  | Unknown;

// ==========================
// Miscellaneous Nodes
// ==========================

export interface Unknown extends BaseLanguageObject {
  type: "unknown";
  content: string;
}

export interface PreprocInclude extends BaseLanguageObject {
  type: "preprocInclude";
  content: string;
}

export interface SourceFile extends BaseLanguageObject {
  type: "sourceFile";
  code: DeclarationObject[];
}

export interface Comment extends BaseLanguageObject {
  type: "comment";
  content: string;
}

// ==========================
// Declaration Nodes
// ==========================

export interface FunctionParameter extends BaseLanguageObject {
  type: "functionParameter";
  identifier: string;
  paramType: string;
}

export interface FunctionDeclaration extends BaseLanguageObject {
  type: "functionDeclaration";
  identifier: string;
  returnType: string;
  parameterList: Array<FunctionParameter>;
}

export interface FunctionDefinition extends BaseLanguageObject {
  type: "functionDefinition";
  identifier: string;
  returnType: string;
  parameterList: Array<FunctionParameter>;
  compoundStatement: CompoundStatement;
}

export interface Declaration extends BaseLanguageObject {
  type: "declaration";
  identifier: string;
  primitiveType: string;
  value?: ExpressionObject;
}

// ==========================
// Statement Nodes
// ==========================

export interface ReturnStatement extends BaseLanguageObject {
  type: "returnStatement";
  value?: ExpressionObject;
}

export interface CompoundStatement extends BaseLanguageObject {
  type: "compoundStatement";
  codeBlock: CompoundStatementObject[];
}

export interface IfStatement extends BaseLanguageObject {
  type: "ifStatement";
  condition: ExpressionObject;
  compoundStatement: StatementObject;
  elseStatement?: IfStatement | ElseClause;
}

export interface ElseClause extends BaseLanguageObject {
  type: "elseClause";
  compoundStatement: StatementObject;
}

// ==========================
// Expression Nodes
// ==========================

export interface CallExpression extends BaseLanguageObject {
  type: "callExpression";
  idDeclaration: string;
  identifier: string;
  argumentList: ExpressionObject[];
}

export interface Reference extends BaseLanguageObject {
  type: "reference";
  declarationId: string;
  identifier: string;
}

export interface AssignmentExpression extends BaseLanguageObject {
  type: "assignmentExpression";
  idDeclaration: string;
  identifier: string;
  value: ExpressionObject;
}

export interface NumberLiteral extends BaseLanguageObject {
  type: "numberLiteral";
  value: string;
}

export interface StringLiteral extends BaseLanguageObject {
  type: "stringLiteral";
  value: string;
}

export interface BinaryExpression extends BaseLanguageObject {
  type: "binaryExpression";
  left: ExpressionObject;
  operator: string;
  right: ExpressionObject;
}
