// Node types

export type CDeclarationNode =
    | IncludeDecl
    | FuncDecl
    | VarDecl
    | ParamDecl

export type CStatementNode =
    | CompStmt
    | ReturnStmt

export type CExpressionNode =
    | CallExpr
    | DeclRefExpr
    | AssignmentExpr
    | LiteralExpr
    | IdentifierExpr

// Base Nodes

export interface Node {
    id: string
    type: string
}

export type UnknownNode = Node & {
    type: "UnknownNode"
    contents: string
}

// Miscellaneous Nodes

export type IncludeDecl = Node & {
    type: "IncludeDecl"
    directive: string
}

// Declaration Nodes

export type ParamDecl = Node & {
    type: "ParamDecl"
    name: string
    data_type: string
}

export type FuncDecl = Node & {
    type: "FuncDecl"
    name: string
    return_type: string
    params: Array<ParamDecl>
    body?: CompStmt
}

export type VarDecl = Node & {
    type: "VarDecl"
    name: string
    data_type: string
    initializer?: CExpressionNode
}

// Statement Nodes

export type ReturnStmt = Node & {
    type: "ReturnStmt"
    expression?: CExpressionNode
}

export type CompStmt = Node & {
    type: "CompStmt"
    statements: Array<Node>
}

// Expression Nodes

export type AssignmentOp = 
    | "="

export type CallExpr = Node & {
    type: "CallExpr"
    calle: CExpressionNode
    args: Array<CExpressionNode>
}

export type DeclRefExpr = Node & {
    type: "DeclRefExpr"
    DeclRefId: string
}

export type AssignmentExpr = Node & {
    type: "AssignmentExpr"
    left: DeclRefExpr | IdentifierExpr
    right: CExpressionNode
    op: AssignmentOp
}

export type LiteralExpr = Node & {
    type: "LiteralExpr"
    data_type: string
    value: string
}

export type IdentifierExpr = Node & {
    type: "IdentifierExpr"
    identifier: string
}

/* List of basic nodes

1. X Translation Unit (Remplazarlo por el nodo de include ?)
2. Declaraciones
    1. X FuncDecl
    2. X ParamDecl (Esto solo iria dentro de un FuncDecl. No se si tiene sentido tenerlo por separado)
    3. X VarDecl
    4. TypeDecl
    5. StructDecl / UnionDecl / EnumDecl
    6. FieldDecl (Esto solo va dentro de un Struct/Union/Enum, asi que no se si tiene sentido que vaya por separado)
    7. EnumConstantDecl (????)
3. Statements
    1. X CompStmt (Es un listado de statements, creo que se podría usar la interfaz directamente)
    2. ExprStmt (Es un wrapper de una expression, no se si tiene mucho sentido siendo que en typescript podemos poner la interfaz directamente)
    3. X ReturnStmt
    4. IfStmt
    5. SwitchStmt
    6. CaseStmt/DefStmt
    7. WhileStmt / DoStmt / DorStmt
    8. BreakStmt / ContinueStmt
    9. GotoStmt
    10. LabelStmt
    11. NullStmt (Tiene sentido permitir esto siendo que estamos delimitando la estructura que se puede armar ?)
4. Expresiones
    1. BinaryOp
    2. UnaryOp
    3. CondOp (Tenia entendido que esto no existia en C)
    4. X AssignmentOp
    5. X CallExpr
    6. X DeclRefExpr
    7. MemberExpr (Investigar)
    8. ArraySubscriptExpr (Index a un array)
    9. CastExpr
    10. SizeOfExpr
    11. X Literal (Int, float, char, string, bool)

*/