import React from "react";
import * as objects from "../../../../src/language_objects/cNodes";
import { AvailableDeclaration, findDeclarationsInScope } from "../../lib/findDeclarations";
import { AutocompleteOption, AutocompleteField } from "./AutocompleteOption";
import { NodeCallbacks, ParentInfo, useLineContext } from "../context";

export function ReferenceSelector({
  node,
  parentInfo,
  className,
  callbacks,
}: ReferenceSelectorProps) {
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
  const targetDecl = nodeMap.get(node.declarationId);
  const currentIdentifier =
    targetDecl && "identifier" in targetDecl ? String(targetDecl.identifier) : "";

  const handleFocus = () => {
    console.log("Focusing ReferenceSelector for node:", node.id);
    setSelectedKey("declarationId");
    setSelectedNodeId(node.id);
    setParentNodeInfo(parentInfo);

    // Find available declarations and convert to options
    const declarations = findDeclarationsInScope(node, parentMap);
    const newOptions: AutocompleteOption<AvailableDeclaration>[] = declarations.map((decl) => ({
      value: decl,
      label: decl.identifier,
      description: (
        <span style={{ fontStyle: "italic", color: "var(--vscode-descriptionForeground)" }}>
          {decl.type}
        </span>
      ),
      key: decl.id,
      onSelect: (selectedDecl: AvailableDeclaration) => {
        switch (selectedDecl.type) {
          case "functionDeclaration":
          case "functionDefinition": {
            // Replace Reference with CallExpression
            console.log(
              "Converting Reference to CallExpression for function:",
              selectedDecl.identifier
            );

            const newCallExpression: objects.CallExpression = {
              id: crypto.randomUUID(),
              type: "callExpression",
              idDeclaration: selectedDecl.id,
              identifier: selectedDecl.identifier,
              argumentList: [],
            };

            nodeMap.set(newCallExpression.id, newCallExpression);
            nodeMap.delete(node.id);

            // Replace in parent
            if (callbacks?.onReplace) {
              callbacks.onReplace(node, newCallExpression);
            }
            break;
          }
          case "declaration":
          case "functionParameter":
            // Update reference to point to variable/parameter
            node.declarationId = selectedDecl.id;
            onEdit(node, "declarationId");
        }
      },
    }));
    setOptions(newOptions);
    console.log("Available declarations for reference:", declarations);
  };

  const isSelected = focusRequest?.nodeId === node.id && focusRequest?.fieldKey === "declarationId";

  return (
    <AutocompleteField
      currentValue={currentIdentifier}
      placeholder="reference_name"
      options={options}
      onFocus={handleFocus}
      focusRequest={focusRequest}
      nodeId={node.id}
      fieldKey="declarationId"
      clearFocusRequest={clearFocusRequest}
      className={className}
      isSelected={!!isSelected}
      readOnly={mode === "view"}
    />
  );
}
export interface ReferenceSelectorProps {
  node: objects.Reference;
  parentInfo: ParentInfo;
  callbacks?: NodeCallbacks;
  className?: string;
}
