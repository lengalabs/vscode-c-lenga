import * as objects from "../../../src/language_objects/cNodes";
import { NodeCallbacks } from "../components/context";

// Helper to create a new unknown node
function createUnknownNode(): objects.Unknown {
  return {
    id: crypto.randomUUID(),
    type: "unknown",
    content: "",
  };
}
// Helper for common insert pattern: insert unknown node into optional field
export function insertUnknownIntoField<
  T extends objects.LanguageObject,
  K extends string & keyof T,
>(
  node: T,
  key: K,
  nodeMap: Map<string, objects.LanguageObject>,
  onEdit: (node: T, key: K | null) => void,
  requestFocus?: (nodeId: string, fieldKey: string) => void
): void {
  const newUnknown = createUnknownNode();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (node as any)[key] = newUnknown;
  nodeMap.set(newUnknown.id, newUnknown);
  onEdit(node, key);
  if (requestFocus) {
    requestFocus(newUnknown.id, "content");
  }
}
// Helper to prepend an unknown node to an array field
export function prependUnknownToArray<T extends objects.LanguageObject, K extends string & keyof T>(
  node: T,
  key: K,
  nodeMap: Map<string, objects.LanguageObject>,
  onEdit: (node: T, key: K) => void
): void {
  const newUnknown = createUnknownNode();
  const array = node[key] as unknown as objects.LanguageObject[];
  array.unshift(newUnknown);
  nodeMap.set(newUnknown.id, newUnknown);
  onEdit(node, key);
}

// Helper to append an unknown node to an array field
export function appendToArray<T extends objects.LanguageObject, K extends string & keyof T>(
  node: T,
  key: K,
  constructor: (
    requestFocus?: (nodeId: string, fieldKey: string) => void
  ) => objects.LanguageObject,
  nodeMap: Map<string, objects.LanguageObject>,
  onEdit: (node: T, key: K) => void,
  requestFocus?: (nodeId: string, fieldKey: string) => void
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
  constructor: (
    requestFocus?: (nodeId: string, fieldKey: string) => void
  ) => objects.LanguageObject,
  nodeMap: Map<string, objects.LanguageObject>, // Should there be a single callback to update the map and notify server onEdit?
  onEdit: (node: T, key: K) => void,
  requestFocus: (nodeId: string, fieldKey: string) => void
): NodeCallbacks {
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
      requestFocus(newUnknown.id, "content");
    },
    onDelete: (node: objects.LanguageObject) => {
      console.log("Deleting node:", node.id, " at index:", index);
      const field = parent[key] as unknown as objects.LanguageObject[];
      const newArray = [...field.slice(0, index), ...field.slice(index + 1)];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parent as any)[key] = newArray;
      nodeMap.delete(node.id);
      onEdit(parent, key);
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
  onEdit: (node: T, key: K) => void
): NodeCallbacks {
  return {
    onDelete: (node: objects.LanguageObject) => {
      console.log("Deleting optional field:", key, " node:", node.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parent as any)[key] = null;
      nodeMap.delete(node.id);
      onEdit(parent, key);
    },
    onReplace: (oldNode: objects.LanguageObject, newNode: objects.LanguageObject) => {
      console.log("Replacing optional field:", key, " old node:", oldNode.id, " with:", newNode.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parent as any)[key] = newNode;
      nodeMap.delete(oldNode.id);
      nodeMap.set(newNode.id, newNode);
      onEdit(parent, key);
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
  requestFocus: (nodeId: string, fieldKey: string) => void
): NodeCallbacks {
  return {
    onDelete: (node: objects.LanguageObject) => {
      console.log("Replacing required field:", key, " node:", node.id, " with unknown");
      const newUnknown: objects.Unknown = {
        id: crypto.randomUUID(),
        type: "unknown",
        content: "",
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parent as any)[key] = newUnknown;
      nodeMap.delete(node.id);
      nodeMap.set(newUnknown.id, newUnknown);
      onEdit(parent, key);
      requestFocus(newUnknown.id, "content");
    },
    onReplace: (oldNode: objects.LanguageObject, newNode: objects.LanguageObject) => {
      console.log("Replacing required field:", key, " old node:", oldNode.id, " with:", newNode.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parent as any)[key] = newNode;
      nodeMap.delete(oldNode.id);
      nodeMap.set(newNode.id, newNode);
      onEdit(parent, key);
    },
  };
}

export function createUnknown(
  requestFocus?: (nodeId: string, fieldKey: string) => void
): objects.Unknown {
  const newUnknown: objects.Unknown = {
    id: crypto.randomUUID(),
    type: "unknown",
    content: "",
  };
  if (requestFocus) {
    requestFocus(newUnknown.id, "content");
  }
  return newUnknown;
}

export function createParameter(
  requestFocus?: (nodeId: string, fieldKey: string) => void
): objects.FunctionParameter {
  const newParameter: objects.FunctionParameter = {
    id: crypto.randomUUID(),
    type: "functionParameter",
    paramType: "void",
    identifier: "",
  };
  if (requestFocus) {
    requestFocus(newParameter.id, "paramType");
  }
  return newParameter;
}
