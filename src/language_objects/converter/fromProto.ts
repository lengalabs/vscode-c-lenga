import * as proto from "../../../rpc/generated/c/objects";
import * as objects from "../cNodes";

export function convertProtoLanguageObjectToTs(
  protoObject: proto.LanguageObject
): objects.LanguageObject {
  if (!protoObject || !protoObject.languageObject) {
    return undefined as any;
  }

  const object = protoObject.languageObject;
  switch (object.$case) {
    case "sourceFile":
      return convertSourceFileToTS(object.sourceFile);
    case "assignmentExpression":
      return convertAssignmentExpressionToTS(object.assignmentExpression);
    case "binaryExpression":
      return convertBinaryExpressionToTs(object.binaryExpression);
    case "callExpression":
      return convertCallExpressionToTS(object.callExpression);
    case "numberLiteral":
      return convertNumberLiteralToTS(object.numberLiteral);
    case "reference":
      return convertReferenceToTS(object.reference);
    case "stringLiteral":
      return convertStringLiteralToTS(object.stringLiteral);

    case "compoundStatement":
      return convertCompoundStatementToTs(object.compoundStatement);
    case "ifStatement":
      return convertIfStatementToTs(object.ifStatement);
    case "returnStatement":
      return convertReturnStatementToTS(object.returnStatement);

    case "declaration":
      return variableDeclarationToTS(object.declaration);
    case "functionDeclaration":
      return convertFunctionDeclarationToTs(object.functionDeclaration);
    case "functionDefinition":
      return convertFunctionDefinitionToTS(object.functionDefinition);
    case "preprocInclude":
      return convertPreprocIncludeToTs(object.preprocInclude);

    case "functionParameter":
      return convertFunctionParameterToTS(object.functionParameter);
    case "elseClause":
      return convertElseClauseToTs(object.elseClause);
    case "comment":
      return convertCommentToTs(object.comment);
    case "unknown":
      return convertUnknownToTs(object.unknown);
  }
}

export function convertProtoDeclarationObjectToTs(
  protoObject: proto.DeclarationObject
): objects.DeclarationObject {
  if (!protoObject || !protoObject.declarationObject) {
    return undefined as any;
  }

  const object = protoObject.declarationObject;
  switch (object.$case) {
    case "declaration":
      return variableDeclarationToTS(object.declaration);
    case "functionDeclaration":
      return convertFunctionDeclarationToTs(object.functionDeclaration);
    case "functionDefinition":
      return convertFunctionDefinitionToTS(object.functionDefinition);
    case "preprocInclude":
      return convertPreprocIncludeToTs(object.preprocInclude);
    case "comment":
      return convertCommentToTs(object.comment);
    case "unknown":
      return convertUnknownToTs(object.unknown);
  }
}

export function convertProtoExpressionObjectToTs(
  protoObject: proto.ExpressionObject
): objects.ExpressionObject {
  if (!protoObject || !protoObject.expressionObject) {
    return undefined as any;
  }

  const object = protoObject.expressionObject;
  switch (object.$case) {
    case "assignmentExpression":
      return convertAssignmentExpressionToTS(object.assignmentExpression);
    case "binaryExpression":
      return convertBinaryExpressionToTs(object.binaryExpression);
    case "callExpression":
      return convertCallExpressionToTS(object.callExpression);
    case "numberLiteral":
      return convertNumberLiteralToTS(object.numberLiteral);
    case "reference":
      return convertReferenceToTS(object.reference);
    case "stringLiteral":
      return convertStringLiteralToTS(object.stringLiteral);
    case "unknown":
      return convertUnknownToTs(object.unknown);
  }
}
export function convertProtoStatementObjectToTs(
  protoObject: proto.StatementObject
): objects.StatementObject {
  if (!protoObject || !protoObject.statementObject) {
    return undefined as any;
  }

  const object = protoObject.statementObject;
  switch (object.$case) {
    case "ifStatement":
      return convertIfStatementToTs(object.ifStatement);
    case "returnStatement":
      return convertReturnStatementToTS(object.returnStatement);
    case "compoundStatement":
      return convertCompoundStatementToTs(object.compoundStatement);
    case "unknown":
      return convertUnknownToTs(object.unknown);
  }
}
export function convertProtoCompoundStatementObjectToTs(
  protoObject: proto.CompoundStatementObject
): objects.CompoundStatementObject {
  if (!protoObject || !protoObject.compoundStatementObject) {
    return undefined as any;
  }

  const object = protoObject.compoundStatementObject;
  switch (object.$case) {
    case "assignmentExpression":
      return convertAssignmentExpressionToTS(object.assignmentExpression);
    case "binaryExpression":
      return convertBinaryExpressionToTs(object.binaryExpression);
    case "callExpression":
      return convertCallExpressionToTS(object.callExpression);
    case "comment":
      return convertCommentToTs(object.comment);
    case "declaration":
      return variableDeclarationToTS(object.declaration);
    case "ifStatement":
      return convertIfStatementToTs(object.ifStatement);
    case "numberLiteral":
      return convertNumberLiteralToTS(object.numberLiteral);
    case "reference":
      return convertReferenceToTS(object.reference);
    case "returnStatement":
      return convertReturnStatementToTS(object.returnStatement);
    case "stringLiteral":
      return convertStringLiteralToTS(object.stringLiteral);
    case "compoundStatement":
      return convertCompoundStatementToTs(object.compoundStatement);
    case "unknown":
      return convertUnknownToTs(object.unknown);
  }
}

function convertPreprocIncludeToTs(preprocInclude: proto.PreprocInclude): objects.PreprocInclude {
  return {
    id: preprocInclude.id,
    type: "preprocInclude",
    content: preprocInclude.content,
  };
}

function convertFunctionDeclarationToTs(
  functionDeclaration: proto.FunctionDeclaration
): objects.FunctionDeclaration {
  return {
    id: functionDeclaration.id,
    type: "functionDeclaration",
    identifier: functionDeclaration.identifier,
    returnType: functionDeclaration.returnType,
    parameterList: functionDeclaration.parameterList.map(convertFunctionParameterToTS),
  };
}
function convertFunctionDefinitionToTS(
  functionDefinition: proto.FunctionDefinition
): objects.FunctionDefinition {
  return {
    id: functionDefinition.id,
    type: "functionDefinition",
    identifier: functionDefinition.identifier,
    returnType: functionDefinition.returnType,
    parameterList: functionDefinition.parameterList.map(convertFunctionParameterToTS),
    compoundStatement: convertCompoundStatementToTs(functionDefinition.compoundStatement!), // TODO why is this optional?
  };
}

function convertCompoundStatementToTs(
  compoundStatement: proto.CompoundStatement
): objects.CompoundStatement {
  return {
    id: compoundStatement.id,
    type: "compoundStatement",
    codeBlock: compoundStatement.codeBlock.map(convertProtoCompoundStatementObjectToTs),
  };
}

function convertFunctionParameterToTS(
  functionParameter: proto.FunctionParameter
): objects.FunctionParameter {
  return {
    type: "functionParameter",
    identifier: functionParameter.identifier,
    id: functionParameter.id,
    paramType: functionParameter.paramType,
  };
}
function variableDeclarationToTS(variableDeclaration: proto.Declaration): objects.Declaration {
  return {
    type: "declaration",
    id: variableDeclaration.id,
    identifier: variableDeclaration.identifier,
    primitiveType: variableDeclaration.primitiveType,
    value: variableDeclaration.value && convertProtoExpressionObjectToTs(variableDeclaration.value),
  };
}
function convertReturnStatementToTS(
  returnStatement: proto.ReturnStatement
): objects.ReturnStatement {
  return {
    id: returnStatement.id,
    type: "returnStatement",
    value: returnStatement.value && convertProtoExpressionObjectToTs(returnStatement.value),
  };
}
function convertCallExpressionToTS(callExpression: proto.CallExpression): objects.CallExpression {
  return {
    id: callExpression.id,
    type: "callExpression",
    identifier: callExpression.identifier,
    idDeclaration: callExpression.idDeclaration,
    argumentList: callExpression.argumentList.map(convertProtoExpressionObjectToTs),
  };
}
function convertSourceFileToTS(sourceFile: proto.SourceFile): objects.SourceFile {
  return {
    id: sourceFile.id,
    type: "sourceFile",
    code: sourceFile.code.map(convertProtoDeclarationObjectToTs),
  };
}
function convertReferenceToTS(reference: proto.Reference): objects.Reference {
  return {
    id: reference.id,
    identifier: reference.identifier,
    type: "reference",
    declarationId: reference.declarationId,
  };
}
function convertAssignmentExpressionToTS(
  assignmentExpression: proto.AssignmentExpression
): objects.AssignmentExpression {
  return {
    id: assignmentExpression.id,
    identifier: assignmentExpression.identifier,
    type: "assignmentExpression",
    idDeclaration: assignmentExpression.idDeclaration,
    value: convertProtoExpressionObjectToTs(
      assignmentExpression.value!
    ) as objects.ExpressionObject,
  };
}
function convertNumberLiteralToTS(numberLiteral: proto.NumberLiteral): objects.NumberLiteral {
  return {
    id: numberLiteral.id,
    type: "numberLiteral",
    value: numberLiteral.value,
  };
}
function convertStringLiteralToTS(stringLiteral: proto.StringLiteral): objects.StringLiteral {
  return {
    id: stringLiteral.id,
    type: "stringLiteral",
    value: stringLiteral.value,
  };
}
function convertBinaryExpressionToTs(
  binaryExpression: proto.BinaryExpression
): objects.BinaryExpression {
  return {
    id: binaryExpression.id,
    type: "binaryExpression",
    left: convertProtoExpressionObjectToTs(binaryExpression.left!) as objects.ExpressionObject,
    operator: binaryExpression.operator,
    right: convertProtoExpressionObjectToTs(binaryExpression.right!) as objects.ExpressionObject,
  };
}
function convertIfStatementToTs(ifStatement: proto.IfStatement): objects.IfStatement {
  return {
    id: ifStatement.id,
    type: "ifStatement",
    condition: convertProtoExpressionObjectToTs(ifStatement.condition!) as objects.ExpressionObject,
    compoundStatement: convertProtoStatementObjectToTs(ifStatement.compoundStatement!),
    elseStatement:
      ifStatement.elseStatement?.$case === "elseClause"
        ? convertElseClauseToTs(ifStatement.elseStatement.elseClause)
        : ifStatement.elseStatement?.$case === "elseIf"
          ? convertIfStatementToTs(ifStatement.elseStatement.elseIf)
          : undefined,
  };
}
function convertElseClauseToTs(elseClause: proto.ElseClause): objects.ElseClause {
  return {
    id: elseClause.id,
    type: "elseClause",
    compoundStatement: convertProtoStatementObjectToTs(elseClause.compoundStatement!),
  };
}
function convertCommentToTs(comment: proto.Comment): objects.Comment {
  return {
    id: comment.id,
    type: "comment",
    content: comment.content,
  };
}
function convertUnknownToTs(unknown: proto.Unknown): objects.Unknown {
  return {
    id: unknown.id,
    type: "unknown",
    content: unknown.content,
  };
}
