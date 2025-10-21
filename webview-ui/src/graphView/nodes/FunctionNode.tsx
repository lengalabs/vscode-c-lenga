import { FunctionDefinition } from "../../../../src/language_objects/cNodes";
import { Object, NodeRender } from "../../components/line";
import { ParentInfoV2 } from "../../components/context";
import { Position, Handle } from "@xyflow/react";

export type FunctionFlowNode = {
  id: string;
  type: "function";
  position: { x: number; y: number };
  data: { func: FunctionDefinition; handlerPositions: number[]; parentInfo: ParentInfoV2 };
};

export function FunctionNode({
  data,
}: {
  data: { func: FunctionDefinition; handlerPositions: number[]; parentInfo: ParentInfoV2 };
}) {
  const lineHeight = 22;

  return (
    <div className="function-node">
      <Object node={data.func}>
        <NodeRender node={data.func} key={data.func.id} parentInfo={data.parentInfo} />
      </Object>

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
            top: callPosition * lineHeight,
            right: 0,
            visibility: "hidden",
            transform: "translateY(50%)",
          }}
        />
      ))}
    </div>
  );
}
