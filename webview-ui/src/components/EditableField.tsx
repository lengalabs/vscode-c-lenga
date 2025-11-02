import React from "react";
import * as objects from "../../../src/language_objects/cNodes";
import { ParentInfo, useLineContext } from "../context/line/lineContext";

interface EditableFieldProps<T extends objects.LanguageObject, K extends string & keyof T> {
  node: T;
  key: K;
  parentInfo: ParentInfo;
  className?: string;
  placeholder: string;
}

export default function EditableField<
  T extends objects.LanguageObject,
  K extends string & keyof T,
>({ node, key, parentInfo, className, placeholder }: EditableFieldProps<T, K>) {
  const {
    selectedNodeId,
    selectedKey,
    onEdit,
    setSelectedNodeId,
    setSelectedKey,
    setParentNodeInfo,
    focusRequest,
    clearFocusRequest,
    mode,
  } = useLineContext();
  const isSelected = selectedNodeId === node.id && selectedKey && selectedKey === key;
  const initialValue = String(node[key] ?? "");
  const [inputValue, setInputValue] = React.useState(initialValue);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const hasFocusedRef = React.useRef(false);

  React.useEffect(() => {
    setInputValue(String(node[key] ?? ""));
  }, [node, key]);

  // React to focus requests - only focus once per request
  React.useEffect(() => {
    if (
      focusRequest &&
      focusRequest.nodeId === node.id &&
      focusRequest.fieldKey === key &&
      !hasFocusedRef.current
    ) {
      console.log("Focusing input for node:", node.id, " key:", key);
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
        hasFocusedRef.current = true;
        // Clear the focus request after handling it
        clearFocusRequest();
      }
    }
    // Reset the flag when focus request changes
    if (!focusRequest) {
      hasFocusedRef.current = false;
    }
  }, [focusRequest, node.id, key, clearFocusRequest]);

  // width in ch units, at least 1ch
  const width =
    (inputValue.length === 0 ? placeholder.length : Math.max(1, inputValue.length)) + "ch";

  return (
    <input
      ref={inputRef}
      className={`inline-editor ${className ?? ""}`}
      style={{
        ...(isSelected
          ? {
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              boxShadow: "inset 0 -1px 0 0 rgba(163, 209, 252, 0.5)",
            }
          : {}),
        width, // dynamically set width in ch
      }}
      value={inputValue}
      placeholder={placeholder}
      onChange={(e) => setInputValue(e.target.value)}
      onFocus={() => {
        setSelectedKey(key);
        setSelectedNodeId(node.id);
        setParentNodeInfo(parentInfo);
      }}
      onBlur={() => {
        if (initialValue !== inputValue) {
          node[key] = inputValue as T[K];
          onEdit(node, key);
        }
      }}
      readOnly={mode === "view"}
    />
  );
}
