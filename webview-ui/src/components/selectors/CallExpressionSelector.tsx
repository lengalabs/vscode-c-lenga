import React from "react";
import * as objects from "../../../../src/language_objects/cNodes";
import { AvailableDeclaration, findDeclarationsInScope } from "../../lib/findDeclarations";
import { AutocompleteOption, AutocompleteField } from "./AutocompleteOption";
import { ParentInfo, useLineContext } from "../context";

interface CallExpressionSelectorProps {
  node: objects.CallExpression;
  parentInfo: ParentInfo;
  className?: string;
}
export function CallExpressionSelector({
  node,
  parentInfo,
  className,
}: CallExpressionSelectorProps) {
  const {
    onEdit,
    setSelectedNodeId,
    setSelectedKey,
    setParentNodeInfo,
    focusRequest,
    clearFocusRequest,
    mode,
    nodeMap,
    parentMap,
  } = useLineContext();

  const [options, setOptions] = React.useState<AutocompleteOption<AvailableDeclaration>[]>([]);

  // Get the current identifier from the target declaration
  const targetDecl = nodeMap.get(node.idDeclaration);
  const currentIdentifier =
    targetDecl && "identifier" in targetDecl ? String(targetDecl.identifier) : "";

  const handleFocus = () => {
    setSelectedKey("idDeclaration");
    setSelectedNodeId(node.id);
    setParentNodeInfo(parentInfo);

    // Find available declarations and filter for functions only, then convert to options
    const declarations = findDeclarationsInScope(node, parentMap);
    const functions = declarations.filter(
      (decl) => decl.type === "functionDeclaration" || decl.type === "functionDefinition"
    );
    const newOptions: AutocompleteOption<AvailableDeclaration>[] = functions.map((decl) => ({
      value: decl,
      label: decl.identifier,
      description: (
        <span style={{ fontStyle: "italic", color: "var(--vscode-descriptionForeground)" }}>
          {decl.type}
        </span>
      ),
      key: decl.id,
      onSelect: (selectedDecl: AvailableDeclaration) => {
        // Update the call expression to point to the new function
        node.idDeclaration = selectedDecl.id;
        node.identifier = selectedDecl.identifier;
        onEdit(node, "idDeclaration");
      },
    }));
    setOptions(newOptions);
    console.log("Available functions for call expression:", functions);
  };

  const isSelected = focusRequest?.nodeId === node.id && focusRequest?.fieldKey === "idDeclaration";

  return (
    <AutocompleteField
      currentValue={currentIdentifier}
      placeholder="function_name"
      options={options}
      onFocus={handleFocus}
      focusRequest={focusRequest}
      nodeId={node.id}
      fieldKey="idDeclaration"
      clearFocusRequest={clearFocusRequest}
      className={className}
      isSelected={!!isSelected}
      readOnly={mode === "view"}
    />
  );
}
