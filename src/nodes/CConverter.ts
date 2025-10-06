import * as cObjects from "../../rpc/generated/c/objects";
import * as lenga from "../../rpc/generated/lenga";
import * as cNode from "./cNodes";

const typeMap: Record<string, string> = {
    unknown_node: "UnknownNode",
    include_decl: "PreprocInclude",
    func_decl: "FuncDecl",
    var_decl: "Declaration",
    param_decl: "FunctionParameter",
    comp_stmt: "CompoundStatement",
    return_stmt: "ReturnStatement",
    call_expr: "CallExpression",
    decl_ref_expr: "Reference",
    assignment_expr: "AssignmentExpr",
    literal_expr: "LiteralExpr",
    identifier_expr: "IdentifierExpr"
};

const fieldRenameMap: Record<string, string> = {
    decl_ref_id: "DeclRefId" // Reference
};

export class CConverter {
    public fromProto(protoAst: cObjects.SourceFile): cNode.Node[] {
        return protoAst.code.map(convertProtoNodeToTs);
    }

    public toProto(TsAst: cNode.Node[]): cObjects.SourceFile {
        return { id: "1", code: TsAst.map(convertTsNodeToProto) };
    }
}

function convertProtoNodeToTs(protoObject: cObjects.LanguageObject): cNode.Node {
    if (!protoObject || !protoObject.languageObject) {
        return undefined as any;
    }

    const object = protoObject.languageObject;
    switch (object.$case) {
        case "assignmentExpression":
            return convertAssignmentExpressionToTS(object.assignmentExpression);
        case "binaryExpression":
            return convertBinaryExpressionToTs(object.binaryExpression);
        case "callExpression":
            return convertCallExpressionToTS(object.callExpression);
        case "sourceFile":
            return convertSourceFileToTS(object.sourceFile);
        case "comment":
            return convertCommentToTs(object.comment);
        case "declaration":
            return variableDeclarationToTS(object.declaration);
        case "elseClause":
            return convertElseClauseToTs(object.elseClause);
        case "expressionStatement":
            return newUnknownNode(protoObject); // TODO remove node
        case "functionDefinition":
            return convertFunctionDefinitionToTS(object.functionDefinition);
        case "functionParameter":
            return convertFunctionParameterToTS(object.functionParameter);
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
        case "preprocInclude":
            return convertPreprocIncludeToTs(object.preprocInclude);
        case "functionDeclaration":
            return convertFunctionDeclarationToTs(object.functionDeclaration);
        case "unknownNode":
            throw new Error("TODO remove unknown node");
    }
}

function newUnknownNode(obj: cObjects.LanguageObject): cNode.UnknownNode {
    return {
        id: crypto.randomUUID(),
        type: "UnknownNode",
        contents: String(obj.languageObject)
    };
}

function convertPreprocIncludeToTs(preprocInclude: cObjects.PreprocInclude): cNode.PreprocInclude {
    return { id: preprocInclude.id, type: "PreprocInclude", directive: preprocInclude.content };
}

function convertFunctionDeclarationToTs(functionDeclaration: cObjects.FunctionDeclaration): cNode.FunctionDeclaration {
    return {
        id: functionDeclaration.id,
        type: "FunctionDeclaration",
        name: functionDeclaration.identifier,
        return_type: functionDeclaration.returnType,
        params: functionDeclaration.parameterList.map(convertFunctionParameterToTS),
    };
}

function convertFunctionDefinitionToTS(functionDefinition: cObjects.FunctionDefinition): cNode.FunctionDefinition {
    return {
        id: functionDefinition.id,
        type: "FunctionDefinition",
        name: functionDefinition.identifier,
        return_type: functionDefinition.returnType,
        params: functionDefinition.parameterList.map(convertFunctionParameterToTS),
        body: convertCompoundStatementToTs(functionDefinition.compoundStatement!) // TODO why is this optional?
    };
}

function convertCompoundStatementToTs(compoundStatement: cObjects.CompoundStatement): cNode.CompoundStatement {
    return {
        id: compoundStatement.id,
        type: "CompoundStatement",
        statements: compoundStatement.codeBlock.map(convertProtoNodeToTs)
    };
}

function convertFunctionParameterToTS(functionParameter: cObjects.FunctionParameter): cNode.FunctionParameter {
    return {
        type: "FunctionParameter",
        name: functionParameter.identifier,
        id: functionParameter.id,
        data_type: functionParameter.paramType,
    };
}

function variableDeclarationToTS(variableDeclaration: cObjects.Declaration): cNode.Declaration {
    return {
        type: "Declaration",
        id: variableDeclaration.id,
        name: variableDeclaration.identifier,
        data_type: variableDeclaration.primitiveType,
        initializer: variableDeclaration.value && convertProtoNodeToTs(variableDeclaration.value) as cNode.CExpressionNode
    };
}

function convertReturnStatementToTS(returnStatement: cObjects.ReturnStatement): cNode.ReturnStatement {

    return {
        id: returnStatement.id,
        type: "ReturnStatement",
        expression: returnStatement.value && convertProtoNodeToTs(returnStatement.value) as cNode.CExpressionNode,
    };
}

function convertCallExpressionToTS(callExpression: cObjects.CallExpression): cNode.CallExpression {
    const args = callExpression.argumentList.map(convertProtoNodeToTs);

    return {
        id: callExpression.id,
        type: "CallExpression",
        identifier: callExpression.identifier,
        idDeclaration: callExpression.idDeclaration,
        args: args as cNode.CExpressionNode[], // TODO
    };
}

function convertSourceFileToTS(sourceFile: cObjects.SourceFile): cNode.SourceFile {
    return {
        id: sourceFile.id,
        type: "SourceFile",
        code: sourceFile.code.map(convertProtoNodeToTs),
    };
}

function convertReferenceToTS(reference: cObjects.Reference): cNode.Reference {
    return {
        id: reference.id,
        type: "Reference",
        DeclRefId: reference.declarationId,
    };
}

function convertAssignmentExpressionToTS(assignmentExpression: cObjects.AssignmentExpression): cNode.AssignmentExpression {
    return {
        id: assignmentExpression.id,
        type: "AssignmentExpression",
        id_reference: assignmentExpression.idDeclaration,
        value: convertProtoNodeToTs(assignmentExpression.value!) as cNode.CExpressionNode,
    };
}

function convertNumberLiteralToTS(numberLiteral: cObjects.NumberLiteral): cNode.NumberLiteral {
    return {
        id: numberLiteral.id,
        type: "NumberLiteral",
        value: numberLiteral.value,
    };
}

function convertStringLiteralToTS(stringLiteral: cObjects.StringLiteral): cNode.StringLiteral {
    return {
        id: stringLiteral.id,
        type: "StringLiteral",
        value: stringLiteral.value,
    };
}

function convertBinaryExpressionToTs(binaryExpression: cObjects.BinaryExpression): cNode.BinaryExpression {
    return {
        id: binaryExpression.id,
        type: "BinaryExpression",
        left: convertProtoNodeToTs(binaryExpression.left!) as cNode.CExpressionNode,
        operator: binaryExpression.operator,
        right: convertProtoNodeToTs(binaryExpression.right!) as cNode.CExpressionNode,
    };
}

function convertIfStatementToTs(ifStatement: cObjects.IfStatement): cNode.IfStatement {
    return {
        id: ifStatement.id,
        type: "IfStatement",
        condition: convertProtoNodeToTs(ifStatement.condition!) as cNode.CExpressionNode,
        compoundStatement: convertCompoundStatementToTs(ifStatement.compoundStatement!),
        elseClause: ifStatement.elseClause ? convertElseClauseToTs(ifStatement.elseClause) : undefined,
    };
}

function convertElseClauseToTs(elseClause: cObjects.ElseClause): cNode.ElseClause {
    return {
        id: elseClause.id,
        type: "ElseClause",
        condition: convertProtoNodeToTs(elseClause.condition!) as cNode.CExpressionNode,
        compoundStatement: convertCompoundStatementToTs(elseClause.compoundStatement!),
    };
}

function convertCommentToTs(comment: cObjects.Comment): cNode.Comment {
    return {
        id: comment.id,
        type: "Comment",
        content: comment.content,
    };
}

function convertTsNodeToProto(object: cNode.Node): cObjects.LanguageObject {

    switch (object.type) {
        case "PreprocInclude": {
            const incl = object as cNode.PreprocInclude;
            let val: cObjects.LanguageObject = {
                languageObject: {
                    $case: "preprocInclude", preprocInclude: preprocIncludeToProto(incl)
                }
            };
            return val;
        }

        case "FunctionParameter": {
            const param = object as cNode.FunctionParameter;
            let val: cObjects.LanguageObject = {
                languageObject: {
                    $case: "functionParameter",
                    functionParameter: functionParameterToProto(param)
                }
            };
            return val;
        }

        case "FunctionDeclaration": {
            const func = object as cNode.FunctionDeclaration;
            let val: cObjects.LanguageObject = {
                languageObject: {
                    $case: "functionDeclaration",
                    functionDeclaration: functionDeclarationToProto(func)
                }
            };
            return val;
        }

        case "FunctionDefinition": {
            const func = object as cNode.FunctionDefinition;
            let val: cObjects.LanguageObject = {
                languageObject: {
                    $case: "functionDefinition",
                    functionDefinition: {
                        id: func.id,
                        identifier: func.name,
                        returnType: func.return_type,
                        parameterList: func.params.map(functionParameterToProto),
                        compoundStatement: compoundStatementToProto(func.body)
                    }
                }
            };
            return val;
        }

        case "Declaration": {
            const v = object as cNode.Declaration;
            let val: cObjects.LanguageObject = {
                languageObject: {
                    $case: "declaration",
                    declaration: declarationToProto(v)
                }
            };
            return val;
        }

        case "CompoundStatement": {
            const comp = object as cNode.CompoundStatement;
            let val: cObjects.LanguageObject = {
                languageObject: {
                    $case: "compoundStatement",
                    compoundStatement: compoundStatementToProto(comp)
                }
            };
            return val;
        }

        case "ReturnStatement": {
            const ret = object as cNode.ReturnStatement;
            const val: cObjects.LanguageObject = {
                languageObject: {
                    $case: "returnStatement",
                    returnStatement: {
                        id: ret.id,
                        value: ret.expression && convertTsNodeToProto(ret.expression),
                    }
                }
            };
            return val;
        }

        case "CallExpression": {
            const call = object as cNode.CallExpression;
            const val: cObjects.LanguageObject = {
                languageObject:  {
                    $case: "callExpression",
                    callExpression: callExpressionToProto(call)
                }

            };
            return val;
        }

        case "Reference": {
            const declRef = object as cNode.Reference;
            const val: cObjects.LanguageObject = {
                languageObject: {
                    $case: "reference",
                    reference: { id: declRef.id, identifier: "TODO", declarationId: declRef.DeclRefId } //TODO recover identifier
                }
            };
            return val;
        }

        case "AssignmentExpression": {
            const assign = object as cNode.AssignmentExpression;
            const val: cObjects.LanguageObject = {
                languageObject: {
                    $case: "assignmentExpression",
                    assignmentExpression: assignmentExpressionToProto(assign)
                }
            };
            return val;
        }

        case "NumberLiteral": {
            const lit = object as cNode.NumberLiteral;
            const val: cObjects.LanguageObject = {
                languageObject: {
                    $case: "numberLiteral",
                    numberLiteral: numberLiteralToProto(lit)
                }
            };
            return val;
        }

        case "StringLiteral": {
            const lit = object as cNode.StringLiteral;
            const val: cObjects.LanguageObject = {
                languageObject: {
                    $case: "stringLiteral",
                    stringLiteral: stringLiteralToProto(lit)
                }
            };
            return val;
        }

        case "SourceFile": {
            const src = object as cNode.SourceFile;
            const val: cObjects.LanguageObject = {
                languageObject: {
                    $case: "sourceFile",
                    sourceFile: sourceFileToProto(src)
                }
            };
            return val;
        }

        case "Comment": {
            const comment = object as cNode.Comment;
            const val: cObjects.LanguageObject = {
                languageObject: {
                    $case: "comment",
                    comment: commentToProto(comment)
                }
            };
            return val;
        }

        case "BinaryExpression": {
            const bin = object as cNode.BinaryExpression;
            const val: cObjects.LanguageObject = {
                languageObject: {
                    $case: "binaryExpression",
                    binaryExpression: binaryExpressionToProto(bin)
                }
            };
            return val;
        }

        case "IfStatement": {
            const ifStmt = object as cNode.IfStatement;
            const val: cObjects.LanguageObject = {
                languageObject: {
                    $case: "ifStatement",
                    ifStatement: ifStatementToProto(ifStmt)
                }
            };
            return val;
        }

        case "ElseClause": {
            const elseClause = object as cNode.ElseClause;
            const val: cObjects.LanguageObject = {
                languageObject: {
                    $case: "elseClause",
                    elseClause: elseClauseToProto(elseClause)
                }
            };
            return val;
        }

        default:
            throw new Error("Unexpected");
    }
}


function stringLiteralToProto(lit: cNode.StringLiteral): cObjects.StringLiteral {
    return {
        id: lit.id,
        value: lit.value
    };
}

function numberLiteralToProto(lit: cNode.NumberLiteral): cObjects.NumberLiteral {
    return {
        id: lit.id,
        value: lit.value
    };
}

function assignmentExpressionToProto(assign: cNode.AssignmentExpression): cObjects.AssignmentExpression {
    return {
        id: assign.id,
        identifier: "TODO", // TODO recover identifier
        idDeclaration: assign.id_reference,
        value: convertTsNodeToProto(assign.value),
    };
}

function callExpressionToProto(call: cNode.CallExpression): cObjects.CallExpression {
    return {
        id: call.id,
        idDeclaration: call.idDeclaration,
        identifier: call.identifier,
        argumentList: call.args.map(convertTsNodeToProto)
    };
}

function declarationToProto(v: cNode.Declaration): cObjects.Declaration {
    return {
        id: v.id,
        identifier: v.name,
        primitiveType: v.data_type,
        value: v.initializer && convertTsNodeToProto(v.initializer)
    };
}

function compoundStatementToProto(comp: cNode.CompoundStatement): cObjects.CompoundStatement {
    return {
        id: comp.id,
        codeBlock: comp.statements.map(convertTsNodeToProto)
    };
}

function functionDeclarationToProto(func: cNode.FunctionDeclaration): cObjects.FunctionDeclaration {
    return {
        id: func.id,
        identifier: func.name,
        returnType: func.return_type,
        parameterList: func.params.map(functionParameterToProto),
    };
}

function preprocIncludeToProto(incl: cNode.PreprocInclude): cObjects.PreprocInclude {
    return {
        id: incl.id,
        content: incl.directive,
    };
}

function functionParameterToProto(param: cNode.FunctionParameter): cObjects.FunctionParameter {
    return { id: param.id, identifier: param.name, paramType: param.data_type };
}

function sourceFileToProto(src: cNode.SourceFile): cObjects.SourceFile {
    return { id: src.id, code: src.code.map(convertTsNodeToProto) };
}

function commentToProto(comment: cNode.Comment): cObjects.Comment {
    return { id: comment.id, content: comment.content };
}

function binaryExpressionToProto(bin: cNode.BinaryExpression): cObjects.BinaryExpression {
    return { id: bin.id, left: convertTsNodeToProto(bin.left), operator: bin.operator, right: convertTsNodeToProto(bin.right) };
}

function ifStatementToProto(ifStmt: cNode.IfStatement): cObjects.IfStatement {
    return {
        id: ifStmt.id, 
        condition: convertTsNodeToProto(ifStmt.condition), 
        compoundStatement: compoundStatementToProto(ifStmt.compoundStatement), 
        elseClause: ifStmt.elseClause ? elseClauseToProto(ifStmt.elseClause) : undefined,
    };
}

function elseClauseToProto(elseClause: cNode.ElseClause): cObjects.ElseClause {
    return {
        id: elseClause.id, 
        condition: convertTsNodeToProto(elseClause.condition),
        compoundStatement: compoundStatementToProto(elseClause.compoundStatement),
    };
}