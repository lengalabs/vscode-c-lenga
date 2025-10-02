import { useState, useEffect } from 'react'
import { NodeRender } from './components/line'
import { LineProvider } from './components/lineContext'
// import { vscode } from '../vscode'
import * as nodes from '../../../src/nodes/cNodes';

export default function App() {
  const [ast, setAst] = useState<nodes.Node[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [insertTargetId, setInsertTargetId] = useState<string | null>(null);


  const main: nodes.FunctionDefinition = {
    id: '0',
    name: 'main',
    type: 'FunctionDefinition',
    return_type: 'int',
    params: [{ type: 'FunctionParameter', id: '1', name: 'argv', data_type: 'int' }],
    body: {
      id: '2',
      type: 'CompoundStatement',
      statements: [
        {
          id: '3',
          type: 'Declaration',
          name: 'myVar',
          data_type: 'int',
          initializer: {
            id: '4',
            type: "NumberLiteral",
            value: "58"
          } as nodes.CExpressionNode
        } as nodes.Node
      ]
    }
  };

  const testAst: nodes.Node[] = [main]

  useEffect(() => {
    setAst(testAst)
    // const handleMessage = (event: MessageEvent) => {
    //   const message = event.data;
    //   setAst(message.contents)
    // }

    // window.addEventListener('message', handleMessage)

    // vscode.postMessage({type: 'ready'});

    // return () => {
    //   window.removeEventListener('message', handleMessage)
    // }    
  }, [])

  const onEdit = <T extends nodes.Node, K extends string & keyof T>(node: T, key: K | null) => {
    const message = { type: 'nodeEdit', contents: node, key: key }
    setAst((prev) => [...prev]); //Placeholder
    console.log("sending message: ", message);
    //vscode.postMessage(message)
  }

  const debug = true

  return (
    <>
      <LineProvider ast={ast} onEdit={onEdit} selectedNodeId={selectedNodeId} selectedKey={selectedKey} setSelectedNodeId={setSelectedNodeId} setSelectedKey={setSelectedKey} insertTargetId={insertTargetId} setInsertTargetId={setInsertTargetId}>
        <div>
          {ast.map(node => (
            <NodeRender key={node.id} node={node} indent={0} />
          ))}
        </div>
      </LineProvider>
      {debug && <div>
        <h1>Debug Info</h1>
        <p>selectedNodeId: {selectedNodeId}</p>
        <p>selectedKey: {selectedKey}</p>
        <p>insertTargetId: {insertTargetId}</p>
      </div>}
    </>
  )
}