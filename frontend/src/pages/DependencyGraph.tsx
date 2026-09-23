import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
} from '@xyflow/react';
import {
  Network,
  Maximize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  ArrowRight,
  Info,
} from 'lucide-react';

interface DependencyNodeData {
  label: string;
  category: string;
  source: string;
  relationship: string;
  accentColor: string;
  [key: string]: unknown;
}

// Custom Node Component for Clean Engineering Aesthetic
const CustomDependencyNode: React.FC<{ data: DependencyNodeData; selected?: boolean }> = ({
  data,
  selected,
}) => {
  return (
    <div
      className={`px-3 py-2.5 rounded bg-[#141720] border min-w-[160px] font-mono shadow-xs transition-colors cursor-grab active:cursor-grabbing ${
        selected
          ? 'border-blue-500 ring-1 ring-blue-500/50 bg-[#171C28]'
          : 'border-[#232733] hover:border-[#384157]'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-1.5 h-1.5 !bg-slate-500 border-none"
      />
      <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-400 mb-1">
        <span>{data.category}</span>
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: data.accentColor }}
        ></span>
      </div>
      <div className="text-xs font-semibold text-slate-100 truncate">{data.label}</div>
      <div className="text-[10px] text-slate-400 mt-1 truncate">{data.source}</div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-1.5 h-1.5 !bg-slate-500 border-none"
      />
    </div>
  );
};

const initialNodes: Node<DependencyNodeData>[] = [
  {
    id: 'node-db',
    type: 'dependencyNode',
    position: { x: 40, y: 160 },
    data: {
      label: 'PostgreSQL',
      category: 'Database',
      source: 'Catalog: information_schema',
      relationship: 'Root database catalog',
      accentColor: '#3b82f6',
    },
  },
  {
    id: 'node-table',
    type: 'dependencyNode',
    position: { x: 260, y: 160 },
    data: {
      label: 'users',
      category: 'Table',
      source: 'public.users',
      relationship: 'Contains table schema',
      accentColor: '#6366f1',
    },
  },
  {
    id: 'node-col',
    type: 'dependencyNode',
    position: { x: 480, y: 160 },
    data: {
      label: 'users.email',
      category: 'Column',
      source: 'VARCHAR(255), Nullable',
      relationship: 'Target column being removed',
      accentColor: '#d97706',
    },
  },
  {
    id: 'node-orm',
    type: 'dependencyNode',
    position: { x: 700, y: 160 },
    data: {
      label: 'User.email',
      category: 'ORM Model',
      source: 'models.py:17',
      relationship: 'Maps to users.email column',
      accentColor: '#a855f7',
    },
  },
  {
    id: 'node-schema',
    type: 'dependencyNode',
    position: { x: 920, y: 160 },
    data: {
      label: 'UserResponse.email',
      category: 'Pydantic Schema',
      source: 'schemas.py:12',
      relationship: 'Serializes User.email attribute',
      accentColor: '#10b981',
    },
  },
  {
    id: 'node-route',
    type: 'dependencyNode',
    position: { x: 1140, y: 160 },
    data: {
      label: 'GET /users/{id}',
      category: 'FastAPI Route',
      source: 'routes.py:12',
      relationship: 'Declares response_model=UserResponse',
      accentColor: '#e11d48',
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e-db-table',
    source: 'node-db',
    target: 'node-table',
    style: { stroke: '#333A4D', strokeWidth: 1.5 },
  },
  {
    id: 'e-table-col',
    source: 'node-table',
    target: 'node-col',
    style: { stroke: '#333A4D', strokeWidth: 1.5 },
  },
  {
    id: 'e-col-orm',
    source: 'node-col',
    target: 'node-orm',
    style: { stroke: '#333A4D', strokeWidth: 1.5 },
  },
  {
    id: 'e-orm-schema',
    source: 'node-orm',
    target: 'node-schema',
    style: { stroke: '#333A4D', strokeWidth: 1.5 },
  },
  {
    id: 'e-schema-route',
    source: 'node-schema',
    target: 'node-route',
    style: { stroke: '#333A4D', strokeWidth: 1.5 },
  },
];

const GraphCanvas: React.FC<{
  onSelectNode: (node: Node<DependencyNodeData> | null) => void;
  selectedNodeId: string | null;
}> = ({ onSelectNode, selectedNodeId }) => {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const { fitView, zoomIn, zoomOut, setViewport } = useReactFlow();

  const nodeTypes = useMemo(
    () => ({
      dependencyNode: CustomDependencyNode,
    }),
    []
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSelectNode(node as Node<DependencyNodeData>);
    },
    [onSelectNode]
  );

  const handleReset = useCallback(() => {
    setViewport({ x: 0, y: 0, zoom: 0.95 });
  }, [setViewport]);

  const handleFit = useCallback(() => {
    fitView({ padding: 0.2 });
  }, [fitView]);

  return (
    <div className="relative h-[480px] w-full bg-[#0E1118] border border-[#232733] rounded-lg overflow-hidden">
      {/* Graph Toolbar Controls */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-[#141720] p-1 rounded border border-[#232733]">
        <button
          onClick={handleFit}
          className="px-2 py-1 rounded hover:bg-[#1C212E] text-slate-300 text-[11px] font-mono flex items-center gap-1 transition-colors"
          title="Fit View"
        >
          <Maximize2 className="w-3 h-3" />
          <span>Fit</span>
        </button>
        <button
          onClick={handleReset}
          className="px-2 py-1 rounded hover:bg-[#1C212E] text-slate-300 text-[11px] font-mono flex items-center gap-1 transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
        <span className="w-px h-3.5 bg-[#232733] mx-0.5"></span>
        <button
          onClick={() => zoomIn()}
          className="p-1.5 rounded hover:bg-[#1C212E] text-slate-300 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => zoomOut()}
          className="p-1.5 rounded hover:bg-[#1C212E] text-slate-300 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="absolute top-3 right-3 z-10 text-[10px] font-mono text-slate-400 bg-[#141720] px-2.5 py-1 rounded border border-[#232733]">
        Drag nodes freely • Edges follow nodes
      </div>

      <ReactFlow
        nodes={nodes.map((n) => ({
          ...n,
          selected: n.id === selectedNodeId,
        }))}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.4}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#1E2330" />
      </ReactFlow>
    </div>
  );
};

export const DependencyGraph: React.FC = () => {
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState<Node<DependencyNodeData> | null>(
    initialNodes[3] // Default select User.email
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <Network className="w-4 h-4 text-blue-400" />
            <span>Dependency Graph</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Static AST dependency trace mapping database column alterations downstream to application endpoints.
          </p>
        </div>

        <button
          onClick={() => navigate('/impact')}
          className="px-3 py-1.5 bg-[#191D28] hover:bg-[#202534] text-xs font-medium text-slate-300 border border-[#2B3142] rounded transition flex items-center gap-1.5 self-start md:self-auto"
        >
          <span>View Impact Table</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Real Interactive Graph Canvas */}
        <div className="lg:col-span-3">
          <ReactFlowProvider>
            <GraphCanvas
              onSelectNode={setSelectedNode}
              selectedNodeId={selectedNode?.id || null}
            />
          </ReactFlowProvider>

          <div className="mt-2 p-2.5 bg-[#141720] border border-[#232733] rounded text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Trace Chain: PostgreSQL → Table → Column → ORM Model → Pydantic Schema → FastAPI Route</span>
            <span className="text-slate-400">Total nodes: 6</span>
          </div>
        </div>

        {/* Selected Node Details Panel */}
        <div className="rounded-lg p-4 bg-[#141720] border border-[#232733] flex flex-col justify-between">
          {selectedNode ? (
            <div className="space-y-3 font-mono text-xs">
              <div className="pb-2.5 border-b border-[#232733]">
                <span className="text-[10px] text-slate-500 uppercase block">Node Details</span>
                <h3 className="text-sm font-semibold text-white mt-1 break-all">
                  {selectedNode.data.label}
                </h3>
                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.2 rounded bg-[#191D28] text-slate-300 border border-[#2B3142]">
                  {selectedNode.data.category}
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Type</span>
                  <p className="text-slate-200 mt-0.5">{selectedNode.data.category}</p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Source</span>
                  <p className="text-slate-300 mt-0.5 break-all">{selectedNode.data.source}</p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Relationship</span>
                  <p className="text-slate-300 mt-0.5 leading-normal">
                    {selectedNode.data.relationship}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs">
              <Info className="w-6 h-6 mx-auto mb-2 text-slate-600" />
              <span>Click a node to inspect metadata.</span>
            </div>
          )}

          <div className="pt-3 border-t border-[#232733] mt-4">
            <button
              onClick={() => navigate('/impact')}
              className="w-full py-1.5 px-3 rounded bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition flex items-center justify-center gap-1.5"
            >
              <span>Impact Matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
