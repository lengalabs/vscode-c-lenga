import * as objects from "../../../src/language_objects/cNodes";
import { EditorModeType, ParentInfo } from "../context/line/lineContext";
import { FocusRequest } from "../context/line/LineProvider";
import {
  getKeyComboString,
  KEY_MAPPINGS,
  NodeChildEditCallbacks,
  NodeCommandHandlers,
  NodeEditCallbacks,
} from "./keyBinds";

// Helper for common insert pattern: insert unknown node into optional field
export function insertUnknownIntoField<
  T extends objects.LanguageObject,
  K extends string & keyof T,
>(
  node: T,
  key: K,
  nodeMap: Map<string, objects.LanguageObject>,
  onEdit: (node: T, key: K | null) => void,
  requestFocus?: (props: FocusRequest) => void
): void {
  const newUnknown = createUnknown(requestFocus);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (node as any)[key] = newUnknown;
  nodeMap.set(newUnknown.id, newUnknown);
  onEdit(node, key);
}
// Helper to prepend an unknown node to an array field
export function prependToArray<T extends objects.LanguageObject, K extends string & keyof T>(
  node: T,
  key: K,
  constructor: (requestFocus?: (props: FocusRequest) => void) => objects.LanguageObject,
  nodeMap: Map<string, objects.LanguageObject>,
  onEdit: (node: T, key: K) => void,
  requestFocus?: (props: FocusRequest) => void
): void {
  const newUnknown = constructor(requestFocus);
  const array = node[key] as unknown as objects.LanguageObject[];
  array.unshift(newUnknown);
  nodeMap.set(newUnknown.id, newUnknown);
  onEdit(node, key);
}

// Helper to append an unknown node to an array field
export function appendToArray<T extends objects.LanguageObject, K extends string & keyof T>(
  node: T,
  key: K,
  constructor: (requestFocus?: (props: FocusRequest) => void) => objects.LanguageObject,
  nodeMap: Map<string, objects.LanguageObject>,
  onEdit: (node: T, key: K) => void,
  requestFocus?: (props: FocusRequest) => void
): void {
  const newNode = constructor(requestFocus);
  const array = node[key] as unknown as objects.LanguageObject[];
  array.push(newNode);
  nodeMap.set(newNode.id, newNode);
  onEdit(node, key);
}

// Helper function to move a node to become a sibling of its parent
function moveNodeToParentSibling<T extends objects.LanguageObject, K extends string & keyof T>(
  node: objects.LanguageObject,
  currentParent: T,
  currentKey: K,
  currentIndex: number,
  currentParentInfo: ParentInfo,
  direction: "before" | "after",
  parentMap: Map<string, ParentInfo>,
  onEdit: (node: T, key: K) => void,
  requestFocus: (props: FocusRequest) => void
): boolean {
  // Get the grandparent (parent's parent)
  const grandparent = currentParentInfo.parent;
  const grandparentKey = currentParentInfo.key;
  const parentIndex = currentParentInfo.index;

  // Check if grandparent has an array field that we can insert into
  const grandparentField = grandparent[grandparentKey as keyof typeof grandparent];

  // Ensure the grandparent field is an array
  if (!Array.isArray(grandparentField)) {
    return false; // Cannot move to non-array field
  }

  // Remove node from current parent
  const currentField = currentParent[currentKey] as unknown as objects.LanguageObject[];
  const newCurrentField = [
    ...currentField.slice(0, currentIndex),
    ...currentField.slice(currentIndex + 1),
  ];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (currentParent as any)[currentKey] = newCurrentField;

  // Insert node into grandparent array
  const grandparentArray = [...grandparentField] as objects.LanguageObject[];
  let insertIndex;

  if (direction === "before") {
    insertIndex = parentIndex; // Insert before the parent
  } else {
    insertIndex = parentIndex + 1; // Insert after the parent
  }

  grandparentArray.splice(insertIndex, 0, node);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (grandparent as any)[grandparentKey] = grandparentArray;

  // Update parent map for the moved node
  parentMap.set(node.id, {
    parent: grandparent,
    key: grandparentKey,
    index: insertIndex,
  } as ParentInfo);

  // Update parent map for nodes that shifted in grandparent array
  grandparentArray.forEach((sibling, idx) => {
    if (idx >= insertIndex) {
      parentMap.set(sibling.id, {
        parent: grandparent,
        key: grandparentKey,
        index: idx,
      } as ParentInfo);
    }
  });

  // Notify changes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEdit(grandparent as any, grandparentKey as any);

  // Keep focus on moved node
  requestFocus({ nodeId: node.id });

  return true;
}

// Helper function to move a node into a sibling's children array
function moveNodeIntoSibling<T extends objects.LanguageObject, K extends string & keyof T>(
  node: objects.LanguageObject,
  currentParent: T,
  currentKey: K,
  currentIndex: number,
  targetSiblingIndex: number,
  position: "first" | "last",
  parentMap: Map<string, ParentInfo>,
  onEdit: (node: T, key: K) => void,
  requestFocus: (props: FocusRequest) => void
): boolean {
  const currentField = currentParent[currentKey] as unknown as objects.LanguageObject[];

  // Check if target sibling exists
  if (
    targetSiblingIndex < 0 ||
    targetSiblingIndex >= currentField.length ||
    targetSiblingIndex === currentIndex
  ) {
    return false;
  }

  const targetSibling = currentField[targetSiblingIndex];

  // Find an array field in the target sibling to move into
  // We'll look for common array fields that can contain statements
  const arrayFields = findArrayFieldsInNode(targetSibling);

  if (arrayFields.length === 0) {
    return false; // Target sibling has no array fields
  }

  // Use the first available array field (could be made more sophisticated)
  const targetField = arrayFields[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const targetArray = (targetSibling as any)[targetField] as objects.LanguageObject[];

  // Remove node from current array
  const newCurrentField = [
    ...currentField.slice(0, currentIndex),
    ...currentField.slice(currentIndex + 1),
  ];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (currentParent as any)[currentKey] = newCurrentField;

  // Add node to target sibling's array
  const newTargetArray = [...targetArray];
  let insertIndex;

  if (position === "first") {
    insertIndex = 0;
    newTargetArray.unshift(node);
  } else {
    insertIndex = newTargetArray.length;
    newTargetArray.push(node);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (targetSibling as any)[targetField] = newTargetArray;

  // Update parent map for the moved node
  parentMap.set(node.id, {
    parent: targetSibling,
    key: targetField,
    index: insertIndex,
  } as ParentInfo);

  // Update parent map for nodes that shifted in current array
  newCurrentField.forEach((sibling, idx) => {
    if (idx >= currentIndex) {
      parentMap.set(sibling.id, {
        parent: currentParent,
        key: currentKey,
        index: idx,
      } as ParentInfo);
    }
  });

  // Update parent map for nodes that shifted in target array
  newTargetArray.forEach((child, idx) => {
    if (idx >= insertIndex) {
      parentMap.set(child.id, {
        parent: targetSibling,
        key: targetField,
        index: idx,
      } as ParentInfo);
    }
  });

  // Notify changes
  onEdit(currentParent, currentKey);

  // Keep focus on moved node
  requestFocus({ nodeId: node.id });

  return true;
}

// Helper function to find array fields in a node that can contain child nodes
function findArrayFieldsInNode(node: objects.LanguageObject): string[] {
  const arrayFields: string[] = [];

  // Check common array fields based on node type
  switch (node.type) {
    case "compoundStatement":
      arrayFields.push("codeBlock");
      break;
    case "functionDeclaration":
    case "functionDefinition":
      arrayFields.push("parameterList");
      break;
    case "callExpression":
      arrayFields.push("argumentList");
      break;
    case "sourceFile":
      arrayFields.push("code");
      break;
    // Add more cases as needed for other node types that have array children
  }

  // Filter to only include fields that actually exist and are arrays
  return arrayFields.filter((field) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fieldValue = (node as any)[field];
    return Array.isArray(fieldValue);
  });
}

// Helper to create callbacks for array fields (supports insert & delete)
export function createArrayFieldCallbacks<
  T extends objects.LanguageObject,
  K extends string & keyof T,
>(
  parent: T,
  key: K,
  index: number,
  constructor: (requestFocus?: (props: FocusRequest) => void) => objects.LanguageObject,
  nodeMap: Map<string, objects.LanguageObject>,
  parentMap: Map<string, ParentInfo>,
  onEdit: (node: T, key: K) => void,
  requestFocus: (props: FocusRequest) => void
): NodeEditCallbacks {
  return {
    onInsertSibling: (node: objects.LanguageObject) => {
      console.log("Inserting sibling after node:", node.id, " at index:", index);
      const field = parent[key] as unknown as objects.LanguageObject[];
      const newUnknown = constructor(requestFocus);
      const newArray = [...field.slice(0, index + 1), newUnknown, ...field.slice(index + 1)];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parent as any)[key] = newArray;
      nodeMap.set(newUnknown.id, newUnknown);
      onEdit(parent, key);
      requestFocus({ nodeId: newUnknown.id });
    },
    onInsertSiblingBefore: (node: objects.LanguageObject) => {
      console.log("Inserting sibling before node:", node.id, " at index:", index);
      const field = parent[key] as unknown as objects.LanguageObject[];
      const newUnknown = constructor(requestFocus);
      const newArray = [...field.slice(0, index), newUnknown, ...field.slice(index)];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parent as any)[key] = newArray;
      nodeMap.set(newUnknown.id, newUnknown);
      onEdit(parent, key);
      requestFocus({ nodeId: newUnknown.id });
    },
    onDelete: (node: objects.LanguageObject) => {
      console.log("Deleting node:", node.id, " at index:", index);
      const field = parent[key] as unknown as objects.LanguageObject[];
      const newArray = [...field.slice(0, index), ...field.slice(index + 1)];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parent as any)[key] = newArray;
      nodeMap.delete(node.id);
      onEdit(parent, key);

      // Focus next sibling, or previous sibling, or parent
      if (newArray.length > 0) {
        // Try next sibling (same index, since we removed current)
        const nextIndex = Math.min(index, newArray.length - 1);
        const nextNode = newArray[nextIndex];
        requestFocus({ nodeId: nextNode.id });
      } else {
        // Array is now empty, focus parent
        requestFocus({ nodeId: parent.id });
      }
    },
    onReplace: (oldNode: objects.LanguageObject, newNode: objects.LanguageObject) => {
      console.log("Replacing node:", oldNode.id, " at index:", index, " with:", newNode.id);
      const field = parent[key] as unknown as objects.LanguageObject[];
      const newArray = [...field];
      newArray[index] = newNode;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parent as any)[key] = newArray;
      nodeMap.delete(oldNode.id);
      nodeMap.set(newNode.id, newNode);
      onEdit(parent, key);

      // Auto-focus on the first editable field of the new node
      requestFocus({ nodeId: newNode.id });
    },
    onMoveUp: (node: objects.LanguageObject) => {
      console.log("Moving node up:", node.id, " from index:", index);
      const field = parent[key] as unknown as objects.LanguageObject[];

      // If at the beginning, try to move to parent's previous sibling
      if (index === 0) {
        const parentInfo = parentMap.get(parent.id);
        if (
          parentInfo &&
          moveNodeToParentSibling(
            node,
            parent,
            key,
            index,
            parentInfo,
            "before",
            parentMap,
            onEdit,
            requestFocus
          )
        ) {
          return; // Successfully moved to parent sibling
        }
        console.log("Node is already at the beginning and cannot move to parent sibling");
        return;
      }

      const newArray = [...field];
      // Swap with previous item
      [newArray[index - 1], newArray[index]] = [newArray[index], newArray[index - 1]];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parent as any)[key] = newArray;
      onEdit(parent, key);

      // Keep focus on the moved node
      requestFocus({ nodeId: node.id });
    },
    onMoveDown: (node: objects.LanguageObject) => {
      console.log("Moving node down:", node.id, " from index:", index);
      const field = parent[key] as unknown as objects.LanguageObject[];

      // If at the end, try to move to parent's next sibling
      if (index === field.length - 1) {
        const parentInfo = parentMap.get(parent.id);
        if (
          parentInfo &&
          moveNodeToParentSibling(
            node,
            parent,
            key,
            index,
            parentInfo,
            "after",
            parentMap,
            onEdit,
            requestFocus
          )
        ) {
          return; // Successfully moved to parent sibling
        }
        console.log("Node is already at the end and cannot move to parent sibling");
        return;
      }

      const newArray = [...field];
      // Swap with next item
      [newArray[index], newArray[index + 1]] = [newArray[index + 1], newArray[index]];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parent as any)[key] = newArray;
      onEdit(parent, key);

      // Keep focus on the moved node
      requestFocus({ nodeId: node.id });
    },
    onMoveIntoNextSiblingsFirstChild: (node: objects.LanguageObject) => {
      console.log("Moving node into next sibling's first child:", node.id, " from index:", index);

      if (
        moveNodeIntoSibling(
          node,
          parent,
          key,
          index,
          index + 1,
          "first",
          parentMap,
          onEdit,
          requestFocus
        )
      ) {
        return; // Successfully moved into next sibling
      }
      console.log("Cannot move into next sibling's children");
    },
    onMoveIntoPreviousSiblingsLastChild: (node: objects.LanguageObject) => {
      console.log(
        "Moving node into previous sibling's last child:",
        node.id,
        " from index:",
        index
      );

      if (
        moveNodeIntoSibling(
          node,
          parent,
          key,
          index,
          index - 1,
          "last",
          parentMap,
          onEdit,
          requestFocus
        )
      ) {
        return; // Successfully moved into previous sibling
      }
      console.log("Cannot move into previous sibling's children");
    },
    onMoveToParentPreviousSibling: (node: objects.LanguageObject) => {
      console.log("Moving node to parent's previous sibling:", node.id, " from index:", index);
      const parentInfo = parentMap.get(parent.id);

      if (
        parentInfo &&
        moveNodeToParentSibling(
          node,
          parent,
          key,
          index,
          parentInfo,
          "before",
          parentMap,
          onEdit,
          requestFocus
        )
      ) {
        return; // Successfully moved to parent sibling
      }
      console.log("Cannot move to parent's previous sibling");
    },
    onMoveToParentNextSibling: (node: objects.LanguageObject) => {
      console.log("Moving node to parent's next sibling:", node.id, " from index:", index);
      const parentInfo = parentMap.get(parent.id);

      if (
        parentInfo &&
        moveNodeToParentSibling(
          node,
          parent,
          key,
          index,
          parentInfo,
          "after",
          parentMap,
          onEdit,
          requestFocus
        )
      ) {
        return; // Successfully moved to parent sibling
      }
      console.log("Cannot move to parent's next sibling");
    },
  };
}

export function createParentArrayFieldEditCallbacks<
  T extends objects.LanguageObject,
  K extends string & keyof T,
>(
  parent: T,
  key: K,
  constructor: (requestFocus?: (props: FocusRequest) => void) => objects.LanguageObject,
  nodeMap: Map<string, objects.LanguageObject>,
  onEdit: (node: T, key: K) => void,
  requestFocus: (props: FocusRequest) => void
): NodeChildEditCallbacks {
  return {
    // Edit mode: insert at beginning or end of array
    onInsertChildFirst: () => {
      console.log("Inserting at beginning of array:", key);
      const field = parent[key] as unknown as objects.LanguageObject[];
      const newNode = constructor(requestFocus);
      const newArray = [newNode, ...field];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parent as any)[key] = newArray;
      nodeMap.set(newNode.id, newNode);
      onEdit(parent, key);
      requestFocus({ nodeId: newNode.id });
    },
    onInsertChildLast: () => {
      console.log("Inserting at end of array:", key);
      const field = parent[key] as unknown as objects.LanguageObject[];
      const newNode = constructor(requestFocus);
      const newArray = [...field, newNode];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parent as any)[key] = newArray;
      nodeMap.set(newNode.id, newNode);
      onEdit(parent, key);
      requestFocus({ nodeId: newNode.id });
    },
  };
}

// Helper to create callbacks for optional single-value fields (delete sets to null)
export function createOptionalFieldCallbacks<
  T extends objects.LanguageObject,
  K extends string & keyof T,
>(
  parent: T,
  key: K,
  nodeMap: Map<string, objects.LanguageObject>,
  onEdit: (node: T, key: K) => void,
  requestFocus: (props: FocusRequest) => void
): NodeEditCallbacks {
  return {
    onDelete: (node: objects.LanguageObject) => {
      console.log("Deleting optional field:", key, " node:", node.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parent as any)[key] = null;
      nodeMap.delete(node.id);
      onEdit(parent, key);

      // Focus parent after deleting optional field
      requestFocus({ nodeId: parent.id });
    },
    onReplace: (oldNode: objects.LanguageObject, newNode: objects.LanguageObject) => {
      console.log("Replacing optional field:", key, " old node:", oldNode.id, " with:", newNode.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parent as any)[key] = newNode;
      nodeMap.delete(oldNode.id);
      nodeMap.set(newNode.id, newNode);
      onEdit(parent, key);

      // Auto-focus on the first editable field of the new node
      requestFocus({ nodeId: newNode.id });
    },
  };
}

export function createParentOptionalFieldCallbacks<
  T extends objects.LanguageObject,
  K extends string & keyof T,
>(
  parent: T,
  key: K,
  constructor: (requestFocus?: (props: FocusRequest) => void) => objects.LanguageObject,
  nodeMap: Map<string, objects.LanguageObject>,
  onEdit: (node: T, key: K) => void,
  requestFocus: (props: FocusRequest) => void
): NodeChildEditCallbacks {
  return {
    onInsertChildFirst: () => {
      console.log("Inserting into optional field:", key);
      const newNode = constructor(requestFocus);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parent as any)[key] = newNode;
      nodeMap.set(newNode.id, newNode);
      onEdit(parent, key);
      requestFocus({ nodeId: newNode.id });
    },
    onInsertChildLast: () => {
      console.log("Inserting into optional field:", key);
      const newNode = constructor(requestFocus);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parent as any)[key] = newNode;
      nodeMap.set(newNode.id, newNode);
      onEdit(parent, key);
      requestFocus({ nodeId: newNode.id });
    },
  };
}

// Helper to create callbacks for required single-value fields (delete replaces with unknown)
export function createRequiredFieldCallbacks<
  T extends objects.LanguageObject,
  K extends string & keyof T,
>(
  parent: T,
  key: K,
  nodeMap: Map<string, objects.LanguageObject>,
  onEdit: (node: T, key: K) => void,
  requestFocus: (props: FocusRequest) => void
): NodeEditCallbacks {
  return {
    onDelete: (node: objects.LanguageObject) => {
      console.log("Replacing required field:", key, " node:", node.id, " with unknown");
      const newUnknown = createUnknown();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parent as any)[key] = newUnknown;
      nodeMap.delete(node.id);
      nodeMap.set(newUnknown.id, newUnknown);
      onEdit(parent, key);
      requestFocus({ nodeId: newUnknown.id });
    },
    onReplace: (oldNode: objects.LanguageObject, newNode: objects.LanguageObject) => {
      console.log("Replacing required field:", key, " old node:", oldNode.id, " with:", newNode.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parent as any)[key] = newNode;
      nodeMap.delete(oldNode.id);
      nodeMap.set(newNode.id, newNode);
      onEdit(parent, key);

      // Auto-focus on the first editable field of the new node
      requestFocus({ nodeId: newNode.id });
    },
  };
}

export function createKeyDownHandler(
  mode: EditorModeType,
  commands: NodeCommandHandlers
): (e: React.KeyboardEvent) => void {
  return (e: React.KeyboardEvent) => {
    console.log("Key down event:", e.key, " Mode:", mode);
    console.log("KEY_MAPPINGS:", KEY_MAPPINGS);
    const keyMapping = KEY_MAPPINGS[mode];
    console.log("Using key mapping:\n", keyMapping);
    const comboString = getKeyComboString(e);

    const commandName = keyMapping[comboString];

    if (!commandName) {
      console.warn("No command found for key combo:", comboString);
      return;
    }
    console.log("Executing command:", commandName, " for key combo:", comboString);

    const command = commands[commandName as keyof typeof commands];
    console.log("Found command handler:", command);
    if (command) {
      console.log("Handling key event for command:", commandName);
      e.preventDefault();
      e.stopPropagation();
      command();
    } else {
      console.warn("No handler defined for command:", commandName);
    }
  };
}

export function createUnknown(requestFocus?: (props: FocusRequest) => void): objects.Unknown {
  const newUnknown: objects.Unknown = {
    id: crypto.randomUUID(),
    type: "unknown",
    content: "",
  };
  if (requestFocus) {
    requestFocus({ nodeId: newUnknown.id });
  }
  return newUnknown;
}

export function createParameter(
  requestFocus?: (props: FocusRequest) => void
): objects.FunctionParameter {
  const newParameter: objects.FunctionParameter = {
    id: crypto.randomUUID(),
    type: "functionParameter",
    paramType: "void",
    identifier: "",
  };
  if (requestFocus) {
    requestFocus({ nodeId: newParameter.id });
  }
  return newParameter;
}
