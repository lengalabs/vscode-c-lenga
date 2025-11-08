import { FunctionDefinition } from "../../../../src/language_objects/cNodes";
import { NodeRender } from "../../components/line";
import { ParentInfo } from "../../context/line/lineContext";
import { Position, Handle } from "@xyflow/react";

export type FunctionFlowNode = {
  id: string;
  type: "function";
  position: { x: number; y: number };
  data: { func: FunctionDefinition; handlerPositions: number[]; parentInfo: ParentInfo };
};

export function FunctionNode({
  data,
}: {
  data: { func: FunctionDefinition; handlerPositions: number[]; parentInfo: ParentInfo };
}) {
  return (
    <div className="function-node">
      <NodeRender node={data.func} key={data.func.id} parentInfo={data.parentInfo} />

      <Handle
        type="target"
        position={Position.Bottom}
        style={{
          visibility: "hidden",
          transform: "translateX(50%)",
        }}
      />

      {data.handlerPositions.map((callPosition, i) => (
        <Handle
          id={i.toString()}
          type="source"
          position={Position.Right}
          style={{
            position: "absolute",
            top: `calc(${callPosition + 0.5} * var(--vscode-editor-line-height, 1.2) * var(--vscode-editor-font-size, 14px))`,
            right: 0,
            visibility: "hidden",
            transform: "translateY(50%)",
          }}
        />
      ))}
    </div>
  );
}
