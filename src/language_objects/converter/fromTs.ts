import * as proto from "../../../rpc/generated/c/objects";
import * as objects from "../cNodes";

export function convertTsLanguageObjectToProto(
  object: objects.LanguageObject
): proto.LanguageObject {
  switch (object.type) {
    case "sourceFile": {
      const val: proto.LanguageObject = {
        languageObject: {
          $case: "sourceFile",
          sourceFile: sourceFileToProto(object),
        },
      };
      return val;
    }

    /* Declaration Objects*/

    case "declaration": {
      let val: proto.LanguageObject = {
        languageObject: {
          $case: "declaration",
          declaration: declarationToProto(object),
        },
      };
      return val;
    }
    case "functionDeclaration": {
      let val: proto.LanguageObject = {
        languageObject: {
          $case: "functionDeclaration",
          functionDeclaration: functionDeclarationToProto(object),
        },
      };
      return val;
    }
    case "functionDefinition": {
      let val: proto.LanguageObject = {
        languageObject: {
          $case: "functionDefinition",
          functionDefinition: functionDefinitionToProto(object),
        },
      };
      return val;
    }
    case "preprocInclude": {
      let val: proto.LanguageObject = {
        languageObject: {
          $case: "preprocInclude",
          preprocInclude: preprocIncludeToProto(object),
        },
      };
      return val;
    }

    /* Expression Objects*/

    case "assignmentExpression": {
      const val: proto.LanguageObject = {
        languageObject: {
          $case: "assignmentExpression",
          assignmentExpression: assignmentExpressionToProto(object),
        },
      };
      return val;
    }
    case "binaryExpression": {
      const val: proto.LanguageObject = {
        languageObject: {
          $case: "binaryExpression",
          binaryExpression: binaryExpressionToProto(object),
        },
      };
      return val;
    }
    case "callExpression": {
      const val: proto.LanguageObject = {
        languageObject: {
          $case: "callExpression",
          callExpression: callExpressionToProto(object),
        },
      };
      return val;
    }
    case "numberLiteral": {
      const val: proto.LanguageObject = {
        languageObject: {
          $case: "numberLiteral",
          numberLiteral: numberLiteralToProto(object),
        },
      };
      return val;
    }
    case "reference": {
      const val: proto.LanguageObject = {
        languageObject: {
          $case: "reference",
          reference: {
            id: object.id,
            identifier: object.identifier,
            declarationId: object.declarationId,
          },
        },
      };
      return val;
    }
    case "stringLiteral": {
      const val: proto.LanguageObject = {
        languageObject: {
          $case: "stringLiteral",
          stringLiteral: stringLiteralToProto(object),
        },
      };
      return val;
    }

    /* Statement Objects*/

    case "compoundStatement": {
      let val: proto.LanguageObject = {
        languageObject: {
          $case: "compoundStatement",
          compoundStatement: compoundStatementToProto(object),
        },
      };
      return val;
    }
    case "ifStatement": {
      const val: proto.LanguageObject = {
        languageObject: {
          $case: "ifStatement",
          ifStatement: ifStatementToProto(object),
        },
      };
      return val;
    }
    case "returnStatement": {
      const val: proto.LanguageObject = {
        languageObject: {
          $case: "returnStatement",
          returnStatement: returnStatementToProto(object),
        },
      };
      return val;
    }

    case "functionParameter": {
      let val: proto.LanguageObject = {
        languageObject: {
          $case: "functionParameter",
          functionParameter: functionParameterToProto(object),
        },
      };
      return val;
    }
    case "elseClause": {
      const val: proto.LanguageObject = {
        languageObject: {
          $case: "elseClause",
          elseClause: elseClauseToProto(object),
        },
      };
      return val;
    }

    case "comment": {
      const val: proto.LanguageObject = {
        languageObject: {
          $case: "comment",
          comment: commentToProto(object),
        },
      };
      return val;
    }
    case "unknown": {
      const val: proto.LanguageObject = {
        languageObject: {
          $case: "unknown",
          unknown: unknownToProto(object),
        },
      };
      return val;
    }
  }
}

export function convertTsDeclarationObjectToProto(
  object: objects.DeclarationObject
): proto.DeclarationObject {
  switch (object.type) {
    case "declaration": {
      let val: proto.DeclarationObject = {
        declarationObject: {
          $case: "declaration",
          declaration: declarationToProto(object),
        },
      };
      return val;
    }
    case "functionDeclaration": {
      let val: proto.DeclarationObject = {
        declarationObject: {
          $case: "functionDeclaration",
          functionDeclaration: functionDeclarationToProto(object),
        },
      };
      return val;
    }
    case "functionDefinition": {
      let val: proto.DeclarationObject = {
        declarationObject: {
          $case: "functionDefinition",
          functionDefinition: functionDefinitionToProto(object),
        },
      };
      return val;
    }
    case "preprocInclude": {
      let val: proto.DeclarationObject = {
        declarationObject: {
          $case: "preprocInclude",
          preprocInclude: preprocIncludeToProto(object),
        },
      };
      return val;
    }

    case "comment": {
      const val: proto.DeclarationObject = {
        declarationObject: {
          $case: "comment",
          comment: commentToProto(object),
        },
      };
      return val;
    }
    case "unknown": {
      const val: proto.DeclarationObject = {
        declarationObject: {
          $case: "unknown",
          unknown: unknownToProto(object),
        },
      };
      return val;
    }
  }
}

export function convertTsExpressionObjectToProto(
  object: objects.ExpressionObject
): proto.ExpressionObject {
  switch (object.type) {
    case "assignmentExpression": {
      const val: proto.ExpressionObject = {
        expressionObject: {
          $case: "assignmentExpression",
          assignmentExpression: assignmentExpressionToProto(object),
        },
      };
      return val;
    }
    case "binaryExpression": {
      const val: proto.ExpressionObject = {
        expressionObject: {
          $case: "binaryExpression",
          binaryExpression: binaryExpressionToProto(object),
        },
      };
      return val;
    }
    case "callExpression": {
      const val: proto.ExpressionObject = {
        expressionObject: {
          $case: "callExpression",
          callExpression: callExpressionToProto(object),
        },
      };
      return val;
    }
    case "numberLiteral": {
      const val: proto.ExpressionObject = {
        expressionObject: {
          $case: "numberLiteral",
          numberLiteral: numberLiteralToProto(object),
        },
      };
      return val;
    }
    case "reference": {
      const val: proto.ExpressionObject = {
        expressionObject: {
          $case: "reference",
          reference: {
            id: object.id,
            identifier: object.identifier,
            declarationId: object.declarationId,
          },
        },
      };
      return val;
    }
    case "stringLiteral": {
      const val: proto.ExpressionObject = {
        expressionObject: {
          $case: "stringLiteral",
          stringLiteral: stringLiteralToProto(object),
        },
      };
      return val;
    }

    case "unknown": {
      const val: proto.ExpressionObject = {
        expressionObject: {
          $case: "unknown",
          unknown: unknownToProto(object),
        },
      };
      return val;
    }
  }
}

export function convertTsStatementObjectToProto(
  object: objects.StatementObject
): proto.StatementObject {
  switch (object.type) {
    case "compoundStatement": {
      let val: proto.StatementObject = {
        statementObject: {
          $case: "compoundStatement",
          compoundStatement: compoundStatementToProto(object),
        },
      };
      return val;
    }
    case "ifStatement": {
      const val: proto.StatementObject = {
        statementObject: {
          $case: "ifStatement",
          ifStatement: ifStatementToProto(object),
        },
      };
      return val;
    }
    case "returnStatement": {
      const val: proto.StatementObject = {
        statementObject: {
          $case: "returnStatement",
          returnStatement: returnStatementToProto(object),
        },
      };
      return val;
    }

    case "unknown": {
      const val: proto.StatementObject = {
        statementObject: {
          $case: "unknown",
          unknown: unknownToProto(object),
        },
      };
      return val;
    }
  }
}

export function convertTsCompoundStatementObjectToProto(
  object: objects.CompoundStatementObject
): proto.CompoundStatementObject {
  switch (object.type) {
    /* Expression Objects*/

    case "assignmentExpression": {
      const val: proto.CompoundStatementObject = {
        compoundStatementObject: {
          $case: "assignmentExpression",
          assignmentExpression: assignmentExpressionToProto(object),
        },
      };
      return val;
    }
    case "binaryExpression": {
      const val: proto.CompoundStatementObject = {
        compoundStatementObject: {
          $case: "binaryExpression",
          binaryExpression: binaryExpressionToProto(object),
        },
      };
      return val;
    }
    case "callExpression": {
      const val: proto.CompoundStatementObject = {
        compoundStatementObject: {
          $case: "callExpression",
          callExpression: callExpressionToProto(object),
        },
      };
      return val;
    }
    case "numberLiteral": {
      const val: proto.CompoundStatementObject = {
        compoundStatementObject: {
          $case: "numberLiteral",
          numberLiteral: numberLiteralToProto(object),
        },
      };
      return val;
    }
    case "reference": {
      const val: proto.CompoundStatementObject = {
        compoundStatementObject: {
          $case: "reference",
          reference: {
            id: object.id,
            identifier: object.identifier,
            declarationId: object.declarationId,
          },
        },
      };
      return val;
    }
    case "stringLiteral": {
      const val: proto.CompoundStatementObject = {
        compoundStatementObject: {
          $case: "stringLiteral",
          stringLiteral: stringLiteralToProto(object),
        },
      };
      return val;
    }

    /* Statement Objects*/

    case "compoundStatement": {
      let val: proto.CompoundStatementObject = {
        compoundStatementObject: {
          $case: "compoundStatement",
          compoundStatement: compoundStatementToProto(object),
        },
      };
      return val;
    }
    case "ifStatement": {
      const val: proto.CompoundStatementObject = {
        compoundStatementObject: {
          $case: "ifStatement",
          ifStatement: ifStatementToProto(object),
        },
      };
      return val;
    }
    case "returnStatement": {
      const val: proto.CompoundStatementObject = {
        compoundStatementObject: {
          $case: "returnStatement",
          returnStatement: returnStatementToProto(object),
        },
      };
      return val;
    }

    /* Declaration Objects*/
    case "declaration": {
      let val: proto.CompoundStatementObject = {
        compoundStatementObject: {
          $case: "declaration",
          declaration: declarationToProto(object),
        },
      };
      return val;
    }
    case "comment": {
      const val: proto.CompoundStatementObject = {
        compoundStatementObject: {
          $case: "comment",
          comment: commentToProto(object),
        },
      };
      return val;
    }
    case "unknown": {
      const val: proto.CompoundStatementObject = {
        compoundStatementObject: {
          $case: "unknown",
          unknown: unknownToProto(object),
        },
      };
      return val;
    }
  }
}

function unknownToProto(object: objects.Unknown): proto.Unknown {
  return { id: object.id, content: object.content };
}

function functionDefinitionToProto(object: objects.FunctionDefinition): proto.FunctionDefinition {
  return {
    id: object.id,
    identifier: object.identifier,
    returnType: object.returnType,
    parameterList: object.parameterList.map(functionParameterToProto),
    compoundStatement: compoundStatementToProto(object.compoundStatement),
  };
}

function returnStatementToProto(object: objects.ReturnStatement): proto.ReturnStatement {
  return {
    id: object.id,
    value: object.value && convertTsExpressionObjectToProto(object.value),
  };
}

function stringLiteralToProto(lit: objects.StringLiteral): proto.StringLiteral {
  return {
    id: lit.id,
    value: lit.value,
  };
}

function numberLiteralToProto(lit: objects.NumberLiteral): proto.NumberLiteral {
  return {
    id: lit.id,
    value: lit.value,
  };
}

function assignmentExpressionToProto(
  assign: objects.AssignmentExpression
): proto.AssignmentExpression {
  return {
    id: assign.id,
    identifier: "TODO", // TODO recover identifier
    idDeclaration: assign.idDeclaration,
    value: convertTsExpressionObjectToProto(assign.value),
  };
}

function callExpressionToProto(call: objects.CallExpression): proto.CallExpression {
  return {
    id: call.id,
    idDeclaration: call.idDeclaration,
    identifier: call.identifier,
    argumentList: call.argumentList.map(convertTsExpressionObjectToProto),
  };
}

function declarationToProto(v: objects.Declaration): proto.Declaration {
  return {
    id: v.id,
    identifier: v.identifier,
    primitiveType: v.primitiveType,
    value: v.value && convertTsExpressionObjectToProto(v.value),
  };
}

function compoundStatementToProto(comp: objects.CompoundStatement): proto.CompoundStatement {
  return {
    id: comp.id,
    codeBlock: comp.codeBlock.map(convertTsCompoundStatementObjectToProto),
  };
}

function functionDeclarationToProto(func: objects.FunctionDeclaration): proto.FunctionDeclaration {
  return {
    id: func.id,
    identifier: func.identifier,
    returnType: func.returnType,
    parameterList: func.parameterList.map(functionParameterToProto),
  };
}

function preprocIncludeToProto(incl: objects.PreprocInclude): proto.PreprocInclude {
  return {
    id: incl.id,
    content: incl.content,
  };
}

function functionParameterToProto(param: objects.FunctionParameter): proto.FunctionParameter {
  return { id: param.id, identifier: param.identifier, paramType: param.paramType };
}

function sourceFileToProto(src: objects.SourceFile): proto.SourceFile {
  return { id: src.id, code: src.code.map(convertTsDeclarationObjectToProto) };
}

function commentToProto(comment: objects.Comment): proto.Comment {
  return { id: comment.id, content: comment.content };
}

function binaryExpressionToProto(bin: objects.BinaryExpression): proto.BinaryExpression {
  return {
    id: bin.id,
    left: convertTsExpressionObjectToProto(bin.left),
    operator: bin.operator,
    right: convertTsExpressionObjectToProto(bin.right),
  };
}

function ifStatementToProto(ifStmt: objects.IfStatement): proto.IfStatement {
  return {
    id: ifStmt.id,
    condition: convertTsExpressionObjectToProto(ifStmt.condition),
    compoundStatement: convertTsStatementObjectToProto(ifStmt.compoundStatement),
    elseStatement: ifStmt.elseStatement
      ? ifStmt.elseStatement.type === "elseClause"
        ? { $case: "elseClause", elseClause: elseClauseToProto(ifStmt.elseStatement) }
        : { $case: "elseIf", elseIf: ifStatementToProto(ifStmt.elseStatement) }
      : undefined,
  };
}

function elseClauseToProto(elseClause: objects.ElseClause): proto.ElseClause {
  return {
    id: elseClause.id,
    compoundStatement: convertTsStatementObjectToProto(elseClause.compoundStatement),
  };
}
