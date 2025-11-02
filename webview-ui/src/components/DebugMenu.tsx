import { useDebugContext } from "../context/debug/debugContext";
import { useLineContext } from "../context/line/lineContext";

export default function DebugMenu(): React.ReactNode {
  const { debug } = useDebugContext();
  const { selectedNodeId, selectedKey, parentNodeInfo, nodeMap } = useLineContext();

  return (
    <>
      {debug && (
        <div>
          <h1>Debug Info</h1>
          <p>selectedNodeId: {selectedNodeId}</p>
          <p>selectedNodeType: {nodeMap.get(selectedNodeId ?? "")?.type}</p>
          <p>selectedKey: {selectedKey}</p>
          <p>parentNodeId: {parentNodeInfo?.parent.id}</p>
          <p>parentType: {parentNodeInfo?.parent.type}</p>
          <p>parentKey: {parentNodeInfo?.key}</p>
          <p>parentIndex: {parentNodeInfo?.index}</p>
        </div>
      )}
    </>
  );
}
