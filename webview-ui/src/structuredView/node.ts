export type AnyNode =
  | IncludeNode
  | FunctionNode
  | VariableNode
  | LiteralNode
  | ReturnNode
  | FunctionCallNode

export interface Node {
  id: string
  type: string
  [key: string]: unknown
}

export interface IncludeNode extends Node {
  type: "include"
  value: string
}

export interface Argument {
  id: string
  name: string
  data_type: string
}

export interface FunctionNode extends Node {
  type: "function"
  name: string
  return_type: string
  args: Array<Argument>
  body: Array<AnyNode>
}

export interface VariableNode extends Node {
  type: "variable"
  name: string
  data_type: string
  value: AnyNode
}

export interface LiteralNode extends Node {
  type: "literal"
  value: string
}

export interface ReturnNode extends Node {
  type: "return"
  value: AnyNode
}

export interface FunctionCallNode extends Node {
  type: "function_call"
  name: string
  parameters: Array<string>
}