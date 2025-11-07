import React from "react";
import * as objects from "../../../../src/language_objects/cNodes";
import { AvailableDeclaration, findDeclarationsInScope } from "../../lib/findDeclarations";
import * as Autocomplete from "./Autocomplete";
import { NodeCallbacks, ParentInfo, useLineContext } from "../../context/line/lineContext";
import { NodeRender } from "../line";

interface Props {
  node: objects.Reference;
  parentInfo: ParentInfo;
  firstField?: boolean;
  ref: React.RefObject<HTMLElement>;
  callbacks?: NodeCallbacks;
  className?: string;
}

export default function ReferenceSelector({
  node,
  parentInfo,
  firstField,
  ref,
  className,
  callbacks,
}: Props) {
  const { onEdit, setSelectedNodeId, setSelectedKey, setParentNodeInfo, nodeMap, parentMap } =
    useLineContext();

  const [options, setOptions] = React.useState<Autocomplete.Option<AvailableDeclaration>[]>([]);

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
    const newOptions: Autocomplete.Option<AvailableDeclaration>[] = declarations.map((decl) => {
      const parentInfo = parentMap.get(decl.id)!; // We don't expect decl to be missing from parentMap. The only node without a parent is the source file.

      return {
        value: decl,
        label: decl.identifier,
        description: NodeRender({
          ref: React.createRef<HTMLElement>() as React.RefObject<HTMLElement>,
          node: decl,
          parentInfo,
        }),
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
      };
    });
    setOptions(newOptions);
    console.log("Available declarations for reference:", declarations);
  };

  return (
    <Autocomplete.Field
      ref={ref as React.RefObject<HTMLInputElement>}
      firstField={firstField}
      currentValue={currentIdentifier}
      placeholder="reference_name"
      options={options}
      onFocus={handleFocus}
      nodeId={node.id}
      fieldKey="declarationId"
      className={className}
    />
  );
}
