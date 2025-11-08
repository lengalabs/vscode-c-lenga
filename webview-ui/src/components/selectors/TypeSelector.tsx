import * as objects from "../../../../src/language_objects/cNodes";
import * as Autocomplete from "./Autocomplete";
import { ParentInfo, useLineContext } from "../../context/line/lineContext";
import React from "react";
// Valid C types for the type selector
const C_TYPES = [
  "void",
  "int",
  // "char",
  // "float",
  // "double",
  // "short",
  // "long",
  // "unsigned char",
  // "unsigned int",
  // "unsigned short",
  // "unsigned long",
  // "signed char",
  // "signed int",
  // "signed short",
  // "signed long",
  // "long long",
  // "unsigned long long",
  // "size_t",
  // "ptrdiff_t",
];
// ============================================================================
// Type Selector (uses AutocompleteField)
// ============================================================================
interface TypeSelectorProps<T extends objects.LanguageObject, K extends string & keyof T> {
  node: T;
  key: K;
  parentInfo: ParentInfo;
  ref: React.RefObject<HTMLElement>;
  firstField?: boolean;
  className?: string;
}

export default function TypeSelector<T extends objects.LanguageObject, K extends string & keyof T>({
  node,
  key,
  parentInfo,
  firstField,
  ref,
  className,
}: TypeSelectorProps<T, K>) {
  const { onEdit, setSelectedNodeId, setSelectedKey, setParentNodeInfo } = useLineContext();

  const currentValue = String(node[key] ?? "");

  function commitValue(selectedType: string) {
    if (currentValue !== selectedType) {
      node[key] = selectedType as T[K];
      onEdit(node, key);
    }
  }

  // Convert C_TYPES to AutocompleteOption format
  const options: Autocomplete.Option<string>[] = C_TYPES.map((type) => ({
    value: type,
    label: type,
    key: type,
    onSelect: (selectedType: string) => {
      commitValue(selectedType);
    },
  }));

  const handleNoMatch = (inputText: string) => {
    // Check if input is a valid type despite not being in filtered options
    const isValidType = C_TYPES.includes(inputText);
    if (isValidType) {
      commitValue(inputText);
    } else if (inputText.trim() === "") {
      // Empty input - revert to current value (do nothing)
    } else {
      // Invalid type - revert to current value (do nothing)
    }
  };

  const handleFocus = () => {
    setSelectedKey(key);
    setSelectedNodeId(node.id);
    setParentNodeInfo(parentInfo);
  };

  return (
    <Autocomplete.Field
      ref={ref as React.RefObject<HTMLInputElement>}
      firstField={firstField}
      currentValue={currentValue}
      placeholder="type"
      options={options}
      onNoMatch={handleNoMatch}
      onFocus={handleFocus}
      nodeId={node.id}
      fieldKey={key}
      className={className}
    />
  );
}
