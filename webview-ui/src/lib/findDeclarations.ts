import * as objects from "../../../src/language_objects/cNodes";
import { ParentInfo } from "../context/line/lineContext";

// Interface for available declarations that can be referenced
export type AvailableDeclaration =
  | objects.Declaration
  | objects.FunctionDeclaration
  | objects.FunctionParameter
  | objects.FunctionDefinition;
/**
 * Find all declarations that are in scope at the given reference position.
 * In C, a variable can only be referenced if:
 * 1. It's declared before the current position in the same scope or parent scope
 * 2. It's a function parameter (available throughout the function body)
 * 3. It's a function declaration/definition (available globally)
 */
export function findDeclarationsInScope(
  referenceNode: objects.LanguageObject,
  parentMap: Map<string, ParentInfo>
): AvailableDeclaration[] {
  const declarations: AvailableDeclaration[] = [];
  const referenceParentInfo = parentMap.get(referenceNode.id);

  if (!referenceParentInfo) {
    return declarations;
  }

  let currentNode = referenceNode;
  let currentParentInfo = referenceParentInfo;

  while (currentNode && currentParentInfo) {
    const parent = currentParentInfo.parent;

    switch (parent.type) {
      // If parent is a function definition, add itself and its parameters
      case "functionDefinition": {
        declarations.push(...parent.parameterList);
        declarations.push(parent);
        break;
      }

      // If parent is a compound statement, add declarations that come before our position
      case "compoundStatement": {
        const currentIndex = parent.codeBlock.findIndex((n) => n.id === currentNode.id);
        declarations.push(
          ...parent.codeBlock.slice(0, currentIndex).filter((stmt) => stmt.type === "declaration")
        );
        break;
      }

      // If parent is a source file, add functions and global declarations that come before
      case "sourceFile": {
        const currentIndex = parent.code.findIndex((n) => n.id === currentNode.id);
        declarations.push(
          ...parent.code
            .slice(0, currentIndex)
            .filter(
              (stmt) =>
                stmt.type === "declaration" ||
                stmt.type === "functionDeclaration" ||
                stmt.type === "functionDefinition"
            )
        );
      }
    }

    // Move up one level
    currentNode = parent;
    const nextParentInfo = parentMap.get(currentNode.id);
    if (!nextParentInfo) break;
    currentParentInfo = nextParentInfo;
  }

  // Remove duplicates (in case a declaration is found multiple times)
  const seen = new Set<string>();
  return declarations.filter((decl) => {
    if (seen.has(decl.identifier)) return false;
    seen.add(decl.identifier);
    return true;
  });
}
