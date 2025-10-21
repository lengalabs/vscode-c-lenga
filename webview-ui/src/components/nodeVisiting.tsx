import * as objects from "../../../src/language_objects/cNodes";

export function visitNodes(
    object: objects.BaseLanguageObject | undefined,
    visitor: (node: objects.BaseLanguageObject, parent?: objects.BaseLanguageObject, key?: string, index?: number) => void,
    parent?: objects.BaseLanguageObject,
    key = "",
    index = 0,
) {
    if (!object) return;

    visitor(object, parent, key, index);

    switch (object.type) {
        case "functionDeclaration": {
            const funcDecl = object as objects.FunctionDeclaration;
            funcDecl.parameterList.forEach((p, i) => visitNodes(p, visitor, funcDecl, "parameterList", i));
            break;
        }
        case "functionDefinition": {
            const funcDecl = object as objects.FunctionDefinition;
            funcDecl.parameterList.forEach((p, i) => visitNodes(p, visitor, funcDecl, "parameterList", i));
            visitNodes(funcDecl.compoundStatement, visitor, object, "compoundStatement", 0);
            break;
        }
        case "compoundStatement": {
            const compStmt = object as objects.CompoundStatement;
            compStmt.codeBlock.forEach((stmt, i) => visitNodes(stmt, visitor, object, "codeBlock", i));
            break;
        }
        case "declaration": {
            const varDecl = object as objects.Declaration;
            if (varDecl.value) visitNodes(varDecl.value, visitor, varDecl, "value", 0);
            break;
        }
        case "returnStatement": {
            const returnStmt = object as objects.ReturnStatement;
            if (returnStmt.value) visitNodes(returnStmt.value, visitor, returnStmt, "value", 0);
            break;
        }
        case "callExpression": {
            const callExpr = object as objects.CallExpression;
            callExpr.argumentList.forEach((argument, i) => visitNodes(argument, visitor, callExpr, "argumentList", i));
            break;
        }
        case "assignmentExpression": {
            const assignmentExpr = object as objects.AssignmentExpression;
            visitNodes(assignmentExpr.value, visitor, assignmentExpr, "value", 0);
            break;
        }
        case "ifStatement": {
            const ifStatement = object as objects.IfStatement;
            visitNodes(ifStatement.condition, visitor, ifStatement, "condition", 0);
            visitNodes(ifStatement.compoundStatement, visitor, ifStatement, "compoundStatement", 0);
            if (ifStatement.elseClause) visitNodes(ifStatement.elseClause, visitor, ifStatement, "elseClause", 0);
            break;
        }
        case "elseClause": {
            const elseClause = object as objects.ElseClause;
            visitNodes(elseClause.condition, visitor, elseClause, "condition", 0);
            visitNodes(elseClause.compoundStatement, visitor, elseClause, "compoundStatement", 0);
            break;
        }
        case "binaryExpression": {
            const binaryExpression = object as objects.BinaryExpression;
            visitNodes(binaryExpression.left, visitor, binaryExpression, "left", 0);
            visitNodes(binaryExpression.right, visitor, binaryExpression, "right", 0);
            break;
        }
        default:
            break; // leaf nodes
    }
}