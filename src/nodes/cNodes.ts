// Node types

export type CDeclarationNode =
    | PreprocInclude
    | FunctionDeclaration
    | FunctionDefinition
    | Declaration
    | FunctionParameter

export type CStatementNode =
    | CompoundStatement
    | ReturnStatement
    | IfStatement
    | ElseClause
    | ExpressionStatement

export type CExpressionNode =
    | CallExpression
    | Reference
    | AssignmentExpression
    | NumberLiteral
    | StringLiteral
    | BinaryExpression

// Base Nodes

export interface Node {
    id: string
    type: NodeTypes
}

export type NodeTypes = "UnknownNode"
    | "SourceFile"
    | "AssignmentExpression"
    | "BinaryExpression"
    | "CallExpression"
    | "Comment"
    | "Declaration"
    | "ElseClause"
    | "FunctionDeclaration"
    | "FunctionDefinition"
    | "FunctionParameter"
    | "IfStatement"
    | "NumberLiteral"
    | "PreprocInclude"
    | "Reference"
    | "ReturnStatement"
    | "StringLiteral"
    | "CompoundStatement"
    | "ExpressionStatement"

export type UnknownNode = Node & {
    type: "UnknownNode"
    contents: string
}

// Miscellaneous Nodes

export type PreprocInclude = Node & {
    type: "PreprocInclude"
    directive: string
}

export type SourceFile = Node & {
    type: "SourceFile"
    code: Array<Node>
}

export type Comment = Node & {
    type: "Comment"
    content: string
}

// Declaration Nodes

export type FunctionParameter = Node & {
    type: "FunctionParameter"
    name: string
    data_type: string
}

export type FunctionDeclaration = Node & {
    type: "FunctionDeclaration"
    name: string
    return_type: string
    params: Array<FunctionParameter>
}

export type FunctionDefinition = Node & {
    type: "FunctionDefinition"
    name: string
    return_type: string
    params: Array<FunctionParameter>
    body: CompoundStatement
}

export type Declaration = Node & {
    type: "Declaration"
    name: string
    data_type: string
    initializer?: CExpressionNode
}

// Statement Nodes

export type ReturnStatement = Node & {
    type: "ReturnStatement"
    expression?: CExpressionNode
}

export type CompoundStatement = Node & {
    type: "CompoundStatement"
    statements: Array<Node>
}

export type IfStatement = Node & {
    type: "IfStatement"
    condition: CExpressionNode
    compoundStatement: CompoundStatement
    elseClause?: ElseClause
}

export type ElseClause = Node & {
    type: "ElseClause"
    condition: CExpressionNode
    compoundStatement: CompoundStatement
}

export type ExpressionStatement = Node & {
    type: "ExpressionStatement"
    expression: CExpressionNode
}

// Expression Nodes

export type CallExpression = Node & {
    type: "CallExpression"
    identifier: string
    idDeclaration: string
    args: Array<CExpressionNode>
}

export type Reference = Node & {
    type: "Reference"
    DeclRefId: string
}

export type AssignmentExpression = Node & {
    type: "AssignmentExpression"
    id_reference: string
    value: CExpressionNode
}

export type NumberLiteral = Node & {
    type: "NumberLiteral"
    value: string
}

export type StringLiteral = Node & {
    type: "StringLiteral"
    value: string
}

export type BinaryExpression = Node & {
    type: "BinaryExpression"
    left: CExpressionNode
    operator: string // Assuming the operators are stored as a string
    right: CExpressionNode
}

/* List of basic nodes

1. X Translation Unit (Remplazarlo por el nodo de include ?)
2. Declaraciones
    1. X FuncDecl
    2. X FunctionParameter (Esto solo iria dentro de un FuncDecl. No se si tiene sentido tenerlo por separado)
    3. X Declaration
    4. TypeDecl
    5. StructDecl / UnionDecl / EnumDecl
    6. FieldDecl (Esto solo va dentro de un Struct/Union/Enum, asi que no se si tiene sentido que vaya por separado)
    7. EnumConstantDecl (????)
3. Statements
    1. X CompoundStatement (Es un listado de statements, creo que se podría usar la interfaz directamente)
    2. ExprStmt (Es un wrapper de una expression, no se si tiene mucho sentido siendo que en typescript podemos poner la interfaz directamente)
    3. X ReturnStatement
    4. IfStmt
    5. SwitchStmt
    6. CaseStmt/DefStmt
    7. WhileStmt / DoStmt / DorStmt
    8. BreakStmt / ContinueStmt
    9. GotoStmt
    10. LabelStmt
    11. NullStmt (Tiene sentido permitir esto siendo que estamos delimitando la estructura que se puede armar ?)
4. Expresiones
    1. X BinaryOp
    2. UnaryOp
    3. CondOp (Tenia entendido que esto no existia en C)
    4. X AssignmentOp
    5. X CallExpression
    6. X Reference
    7. MemberExpr (Investigar)
    8. ArraySubscriptExpr (Index a un array)
    9. CastExpr
    10. SizeOfExpr
    11. X Literal (Int, float, char, string, bool)

*/