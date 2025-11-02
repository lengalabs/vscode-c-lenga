import { useEffect, useState, useRef } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Edge,
  MarkerType,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { FunctionNode, FunctionFlowNode } from "./nodes/FunctionNode";
import * as objects from "../../../src/language_objects/cNodes";
import LineProvider from "../context/line/LineProvider";
import { vscode } from "../vscode";
import { visitNodes } from "../lib/nodeVisiting";
import { ParentInfo, parentInfoFromChild } from "../context/line/lineContext";

const nodeTypes = { function: FunctionNode };

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState<FunctionFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [sourceFile, setSourceFile] = useState<objects.SourceFile | undefined>(undefined);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [availableInserts, setAvailableInserts] = useState<objects.LanguageObject[] | null>(null);
  const [parentNodeInfo, setParentNodeInfo] = useState<ParentInfo | null>(null);

  const nodesRef = useRef<FunctionFlowNode[]>([]);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      console.log("got message:", message);

      if (message.type === "availableInserts") {
        setAvailableInserts(message.contents);
      } else if (message.type === "toggleDebug") {
        console.log("Operation unsupported for now");
      } else if (message.type === "update") {
        const newSourceFile = message.contents as objects.SourceFile;

        const functionNodes: FunctionFlowNode[] = [];
        const edges: Edge[] = [];

        newSourceFile.code.forEach((object, i) => {
          if (object.type === "functionDefinition") {
            /* Getting function calls data in the function body */
            const calls: objects.CallExpression[] = [];
            let currentLine = 0;
            const positions: number[] = [];

            function mapper(
              object: objects.BaseLanguageObject,
              parent?: objects.BaseLanguageObject,
              key?: string
            ) {
              console.log(object.type);

              if (parent?.type === "compoundStatement" && key === "codeBlock") {
                currentLine++;
              }

              if (object.type === "callExpression") {
                const call = object as objects.CallExpression;
                console.log(call.identifier);
                calls.push(call);
                positions.push(currentLine);
              }
            }
            visitNodes(object, mapper);

            /* Setting the ReactFlow nodes data */
            const existing = nodesRef.current.find((flowNode) => flowNode.id === object.id);
            const flowNode = {
              id: object.id,
              type: "function",
              position: existing ? existing.position : { x: 100, y: i * 100 },
              data: {
                func: object as objects.FunctionDefinition,
                handlerPositions: positions,
                parentInfo: parentInfoFromChild(newSourceFile, "code", i),
              },
            } satisfies FunctionFlowNode;
            functionNodes.push(flowNode);

            /* Setting the ReactFlow Edge data for the corresponding node */

            calls.forEach((call, i) => {
              edges.push({
                id: call.id,
                source: object.id,
                target: call.idDeclaration,
                sourceHandle: i.toString(),
                markerEnd: { type: MarkerType.ArrowClosed },
              });
            });
          }
        });

        console.log(functionNodes);
        console.log(edges);

        const validEdges = edges.filter(
          (e) =>
            functionNodes.some((n) => n.id === e.source) &&
            functionNodes.some((n) => n.id === e.target)
        );

        setNodes(functionNodes);
        setEdges(validEdges);
        setSourceFile(newSourceFile);
      }
    };

    window.addEventListener("message", handleMessage);
    vscode.postMessage({ type: "ready" });

    return () => window.removeEventListener("message", handleMessage);
  }, [setNodes, setEdges]);

  const onEdit = <T extends objects.BaseLanguageObject, K extends string & keyof T>(
    node: T,
    key: K | null
  ) => {
    const message = { type: "nodeEdit", contents: node, key: key };
    console.log("sending message: ", message);
    vscode.postMessage(message);
  };

  const onRequestAvailableInserts = (nodeId: string, nodeKey: string) => {
    const message = { type: "requestAvailableInserts", nodeId, nodeKey };
    console.log("requesting available inserts: ", message);
    vscode.postMessage(message);
  };

  return sourceFile ? (
    <LineProvider
      sourceFile={sourceFile}
      onEdit={onEdit}
      onRequestAvailableInserts={onRequestAvailableInserts}
      availableInserts={availableInserts}
      selectedNodeId={selectedNodeId}
      selectedKey={selectedKey}
      parentNodeInfo={parentNodeInfo}
      setSelectedNodeId={setSelectedNodeId}
      setSelectedKey={setSelectedKey}
      setParentNodeInfo={setParentNodeInfo}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        style={{ width: "100%", height: "100%" }}
      >
        <Controls />
        <MiniMap />
        <Background />
      </ReactFlow>
    </LineProvider>
  ) : (
    <p>loading...</p>
  );
}
