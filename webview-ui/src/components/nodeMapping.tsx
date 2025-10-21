import * as objects from "../../../src/language_objects/cNodes";

export function mapNode(
    object: objects.BaseLanguageObject | undefined,
    mapper: (node: objects.BaseLanguageObject, parent?: objects.BaseLanguageObject, key?: string, index?: number) => void,
    parent?: objects.BaseLanguageObject,
    key = "",
    index = 0,
) {
    if (!object) return;

    mapper(object, parent, key, index);

    switch (object.type) {
        case "functionDeclaration": {
            const funcDecl = object as objects.FunctionDeclaration;
            funcDecl.parameterList.forEach((p, i) => mapNode(p, mapper, funcDecl, "parameterList", i));
            break;
        }
        case "functionDefinition": {
            const funcDecl = object as objects.FunctionDefinition;
            funcDecl.parameterList.forEach((p, i) => mapNode(p, mapper, funcDecl, "parameterList", i));
            mapNode(funcDecl.compoundStatement, mapper, object, "compoundStatement", 0);
            break;
        }
        case "compoundStatement": {
            const compStmt = object as objects.CompoundStatement;
            compStmt.codeBlock.forEach((stmt, i) => mapNode(stmt, mapper, object, "codeBlock", i));
            break;
        }
        case "declaration": {
            const varDecl = object as objects.Declaration;
            if (varDecl.value) mapNode(varDecl.value, mapper, varDecl, "value", 0);
            break;
        }
        case "returnStatement": {
            const returnStmt = object as objects.ReturnStatement;
            if (returnStmt.value) mapNode(returnStmt.value, mapper, returnStmt, "value", 0);
            break;
        }
        case "callExpression": {
            const callExpr = object as objects.CallExpression;
            callExpr.argumentList.forEach((argument, i) => mapNode(argument, mapper, callExpr, "argumentList", i));
            break;
        }
        case "assignmentExpression": {
            const assignmentExpr = object as objects.AssignmentExpression;
            mapNode(assignmentExpr.value, mapper, assignmentExpr, "value", 0);
            break;
        }
        case "IfStatement": {
            const ifStatement = object as objects.IfStatement;
            mapNode(ifStatement.condition, mapper, ifStatement, "condition", 0);
            mapNode(ifStatement.compoundStatement, mapper, ifStatement, "compoundStatement", 0);
            if (ifStatement.elseClause) mapNode(ifStatement.elseClause, mapper, ifStatement, "elseClause", 0);
            break;
        }
        case "ElseClause": {
            const elseClause = object as objects.ElseClause;
            mapNode(elseClause.condition, mapper, elseClause, "condition", 0);
            mapNode(elseClause.compoundStatement, mapper, elseClause, "compoundStatement", 0);
            break;
        }
        case "BinaryExpression": {
            const binaryExpression = object as objects.BinaryExpression;
            mapNode(binaryExpression.left, mapper, binaryExpression, "left", 0);
            mapNode(binaryExpression.right, mapper, binaryExpression, "right", 0);
            break;
        }
        default:
            break; // leaf nodes
    }
}