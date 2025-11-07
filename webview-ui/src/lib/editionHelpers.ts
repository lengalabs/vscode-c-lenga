import * as objects from "../../../src/language_objects/cNodes";
import { EditorModeType } from "../context/line/lineContext";
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

// Helper to create callbacks for array fields (supports insert & delete)
export function createArrayFieldCallbacks<
  T extends objects.LanguageObject,
  K extends string & keyof T,
>(
  parent: T,
  key: K,
  index: number,
  constructor: (requestFocus?: (props: FocusRequest) => void) => objects.LanguageObject,
  nodeMap: Map<string, objects.LanguageObject>, // Should there be a single callback to update the map and notify server onEdit?
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
  };
}

export function createParentArrayFieldCallbacks<
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
