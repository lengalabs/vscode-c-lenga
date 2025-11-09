import React from "react";
import * as objects from "../../../../src/language_objects/cNodes";
import { AvailableDeclaration, findDeclarationsInScope } from "../../lib/findDeclarations";
import * as Autocomplete from "./Autocomplete";
import { ParentInfo, useLineContext } from "../../context/line/lineContext";
import { NodeRender } from "../line";

interface Props {
  node: objects.CallExpression;
  parentInfo: ParentInfo;
  ref: React.RefObject<HTMLElement>;
  firstField?: boolean;
  className?: string;
}

export default function CallExpressionSelector({
  node,
  firstField,
  parentInfo,
  className,
  ref,
}: Props) {
  const { onEdit, setSelectedNodeId, setSelectedKey, setParentNodeInfo, nodeMap, parentMap } =
    useLineContext();

  const [options, setOptions] = React.useState<Autocomplete.Option<AvailableDeclaration>[]>([]);

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
    const newOptions: Autocomplete.Option<AvailableDeclaration>[] = functions.map((decl) => {
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
          // Update the call expression to point to the new function
          node.idDeclaration = selectedDecl.id;
          node.identifier = selectedDecl.identifier;
          onEdit(node, "idDeclaration");
        },
      };
    });
    setOptions(newOptions);
    console.log("Available functions for call expression:", functions);
  };

  return (
    <Autocomplete.Field
      ref={ref as React.RefObject<HTMLInputElement>}
      firstField={firstField}
      currentValue={currentIdentifier}
      placeholder="function_name"
      options={options}
      onFocus={handleFocus}
      nodeId={node.id}
      fieldKey="idDeclaration"
      parentInfo={parentInfo}
      className={className}
    />
  );
}
