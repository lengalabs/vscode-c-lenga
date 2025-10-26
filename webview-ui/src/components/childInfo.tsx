import * as objects from "../../../src/language_objects/cNodes";
import { ParentInfo } from "./context";

// Helper to create ParentInfo for a child node

export function childInfo<T extends objects.LanguageObject, K extends string & keyof T>(
  parent: T,
  key: K,
  index: number = 0
): ParentInfo {
  return { parent, key, index } as unknown as ParentInfo;
}
