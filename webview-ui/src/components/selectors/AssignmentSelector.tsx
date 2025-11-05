import React from "react";
import * as objects from "../../../../src/language_objects/cNodes";
import { AvailableDeclaration, findDeclarationsInScope } from "../../lib/findDeclarations";
import * as Autocomplete from "./Autocomplete";
import { ParentInfo, useLineContext } from "../../context/line/lineContext";
import { NodeRender } from "../line";

interface Props {
  node: objects.AssignmentExpression;
  parentInfo: ParentInfo;
  firstField?: boolean;
  className?: string;
}

export default function AssignmentSelector({ node, parentInfo, firstField, className }: Props) {
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

  const [options, setOptions] = React.useState<Autocomplete.Option<AvailableDeclaration>[]>([]);

  // Get the current identifier from the target declaration
  const targetDecl = nodeMap.get(node.idDeclaration);
  const currentIdentifier =
    targetDecl && "identifier" in targetDecl ? String(targetDecl.identifier) : "";

  const handleFocus = () => {
    console.log("Focusing AssignmentSelector for node:", node.id);
    setSelectedKey("declarationId");
    setSelectedNodeId(node.id);
    setParentNodeInfo(parentInfo);

    // Find available declarations and convert to options
    const declarations = findDeclarationsInScope(node, parentMap);
    const newOptions: Autocomplete.Option<AvailableDeclaration>[] = declarations
      .filter((decl) => decl.type === "declaration" || decl.type === "functionParameter")
      .map((decl) => {
        const parentInfo = parentMap.get(decl.id)!; // We don't expect decl to be missing from parentMap. The only node without a parent is the source file.

        return {
          value: decl,
          label: decl.identifier,
          description: NodeRender({
            node: decl,
            parentInfo,
          }),
          key: decl.id,
          onSelect: (selectedDecl: AvailableDeclaration) => {
            // Update reference to point to variable/parameter
            node.idDeclaration = selectedDecl.id;
            onEdit(node, "idDeclaration");
          },
        };
      });
    setOptions(newOptions);
    console.log("Available declarations for reference:", declarations);
  };

  const isSelected = focusRequest?.nodeId === node.id && focusRequest?.fieldKey === "idDeclaration";

  return (
    <Autocomplete.Field
      firstField={firstField}
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
