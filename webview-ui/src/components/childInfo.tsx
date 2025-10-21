import * as objects from "../../../src/language_objects/cNodes";
import { ParentInfoV2 } from "./context";

// Helper to create ParentInfoV2 for a child node

export function childInfo<T extends objects.LanguageObject, K extends string & keyof T>(
  parent: T,
  key: K,
  index: number = 0
): ParentInfoV2 {
  return { parent, key, index } as unknown as ParentInfoV2;
}
