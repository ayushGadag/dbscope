import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  Background,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
} from '@xyflow/react';
import {
  Maximize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  ArrowRight,
  Info,
  Layers,
  FileCode,
  Globe,
  Database,
  Table as TableIcon,
  Columns,
  ShieldAlert,
} from 'lucide-react';
import { dependencyService } from '../services/dependencyService';
import { scannerService } from '../services/scannerService';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface DependencyNodeData extends Record<string, unknown> {
  label: string;
  category: string;
  source?: string;
  relationship?: string;
  accentColor?: string;
}

const CustomDependencyNode: React.FC<{
  data: DependencyNodeData;
  selected?: boolean;
}> = ({
  data,
  selected,
}) => {
  const getCategoryTheme = () => {
    switch (data.category) {
      case 'Database':
        return {
          border: 'border-l-sky-500',
          badgeVariant: 'cyan' as const,
          icon: <Database className="w-3 h-3 text-sky-600" />,
        };
      case 'Table':
        return {
          border: 'border-l-blue-500',
          badgeVariant: 'primary' as const,
          icon: <TableIcon className="w-3 h-3 text-blue-600" />,
        };
      case 'Column':
        return {
          border: 'border-l-indigo-500',
          badgeVariant: 'indigo' as const,
          icon: <Columns className="w-3 h-3 text-indigo-600" />,
        };
      case 'ORM Model':
        return {
          border: 'border-l-emerald-500',
          badgeVariant: 'lime' as const,
          icon: <Layers className="w-3 h-3 text-emerald-600" />,
        };
      case 'Pydantic Schema':
        return {
          border: 'border-l-purple-500',
          badgeVariant: 'purple' as const,
          icon: <FileCode className="w-3 h-3 text-purple-600" />,
        };
      case 'FastAPI Route':
        return {
          border: 'border-l-amber-500',
          badgeVariant: 'warning' as const,
          icon: <Globe className="w-3 h-3 text-amber-600" />,
        };
      default:
        return {
          border: 'border-l-slate-400',
          badgeVariant: 'neutral' as const,
          icon: <Info className="w-3 h-3 text-slate-500" />,
        };
    }
  };

  const theme = getCategoryTheme();

  return (
    <div
      className={`px-4 py-3 bg-white border border-l-4 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all cursor-pointer min-w-[210px] max-w-[240px] select-none ${
        theme.border
      } ${
        selected
          ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-md'
          : 'border-gray-200/90 hover:border-gray-300'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 !bg-white !border-2 !border-slate-700 rounded-full"
      />

      <div className="flex items-center justify-between gap-1 mb-1.5">
        <Badge variant={theme.badgeVariant} size="xs">
          <span className="flex items-center gap-1">
            {theme.icon}
            <span>{data.category}</span>
          </span>
        </Badge>
      </div>

      <div
        className="text-xs font-mono font-semibold text-slate-900 truncate"
        title={data.label}
      >
        {data.label}
      </div>

      <div
        className="text-[11px] font-mono text-slate-500 truncate mt-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-200/70"
        title={data.source}
      >
        {data.source || 'schema_definition'}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 !bg-white !border-2 !border-slate-700 rounded-full"
      />
    </div>
  );
};

// Canvas wrapper
const GraphCanvas: React.FC<{
  onSelectNode: (node: Node<DependencyNodeData> | null) => void;
  selectedNodeId: string | null;
  loadedNodes: Node<DependencyNodeData>[];
  loadedEdges: Edge[];
}> = ({ onSelectNode, selectedNodeId, loadedNodes, loadedEdges }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(loadedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(loadedEdges);
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const nodeTypes = useMemo(() => ({ dependencyNode: CustomDependencyNode }), []);

  useEffect(() => {
    setNodes(loadedNodes);
  }, [loadedNodes, setNodes]);

  useEffect(() => {
    setEdges(loadedEdges);
  }, [loadedEdges, setEdges]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSelectNode(node as unknown as Node<DependencyNodeData>);
    },
    [onSelectNode]
  );

  const handleFit = useCallback(() => {
    fitView({ padding: 0.2, duration: 300 });
  }, [fitView]);

  const handleReset = useCallback(() => {
    fitView({ padding: 0.2, duration: 300 });
  }, [fitView]);

  const styledEdges = useMemo(() => {
    return edges.map((e) => ({
      ...e,
      animated: true,
      style: {
        stroke: '#64748b',
        strokeWidth: 1.5,
      },
    }));
  }, [edges]);

  return (
    <div className="relative w-full h-[580px] bg-[#f8f9fa] border border-gray-200/90 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
      {/* Top Left Toolbar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 p-1 bg-white border border-gray-200 rounded-lg shadow-sm">
        <button
          onClick={handleFit}
          className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
          title="Fit to Screen"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Fit</span>
        </button>
        <button
          onClick={handleReset}
          className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
          title="Reset View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
        <div className="h-4 w-px bg-gray-200 mx-0.5" />
        <button
          onClick={() => zoomIn()}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
          title="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => zoomOut()}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
          title="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Legend Top Right */}
      <div className="hidden sm:flex absolute top-3 right-3 z-10 items-center gap-3 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm text-[11px] text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-500" />
          <span>Database</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Table/Column</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>ORM</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          <span>Schema</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Route</span>
        </div>
      </div>

      <ReactFlow
        nodes={nodes.map((n) => ({
          ...n,
          selected: n.id === selectedNodeId,
        }))}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#cbd5e1" />
      </ReactFlow>
    </div>
  );
};

export const DependencyGraph: React.FC = () => {
  const navigate = useNavigate();
  const [currentNodes, setCurrentNodes] = useState<Node<DependencyNodeData>[]>([]);
  const [currentEdges, setCurrentEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node<DependencyNodeData> | null>(null);

  useEffect(() => {
    const activeDb = scannerService.getActiveDbConfig();
    dependencyService.getDependencyGraph('users.email', activeDb).then((res) => {
      if (res && res.nodes) {
        const mappedNodes: Node<DependencyNodeData>[] = res.nodes.map((n, idx) => {
          const typeLower = (n.type || '').toLowerCase();
          return {
            id: n.id,
            type: 'dependencyNode',
            position: { x: n.x ?? 40 + idx * 240, y: n.y ?? 200 },
            data: {
              label: n.label,
              category:
                n.category ||
                (typeLower === 'database'
                  ? 'Database'
                  : typeLower === 'table'
                  ? 'Table'
                  : typeLower === 'column'
                  ? 'Column'
                  : typeLower === 'orm_model'
                  ? 'ORM Model'
                  : typeLower === 'pydantic_schema'
                  ? 'Pydantic Schema'
                  : 'FastAPI Route'),
              source: n.source || (n.file ? `${n.file}:${n.line}` : ''),
              relationship: n.relationship || n.description || '',
              accentColor: '#0ea5e9',
            },
          };
        });

        const mappedEdges: Edge[] = res.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          style: { stroke: '#64748b', strokeWidth: 1.5 },
        }));

        setCurrentNodes(mappedNodes);
        setCurrentEdges(mappedEdges);
        const defaultTarget =
          mappedNodes.find((n) => n.data.category === 'ORM Model') || mappedNodes[0];
        setSelectedNode(defaultTarget || null);
      }
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Graph Action Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Lineage Focus:</span>
          <span className="text-xs font-mono px-3 py-1 bg-white border border-[#e2e7e2] text-slate-900 rounded-full shadow-2xs font-semibold">
            users.email
          </span>
        </div>
        <Button
          variant="primary"
          size="sm"
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          onClick={() => navigate('/impact')}
        >
          View Impact Matrix
        </Button>
      </div>

      {/* Main Graph Grid (9 cols canvas, 3 cols inspector) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-9">
          <ReactFlowProvider>
            <GraphCanvas
              onSelectNode={setSelectedNode}
              selectedNodeId={selectedNode?.id || null}
              loadedNodes={currentNodes}
              loadedEdges={currentEdges}
            />
          </ReactFlowProvider>
        </div>

        {/* Node Inspector Panel */}
        <div className="xl:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col h-full overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5 font-mono">
                Node Inspector
              </span>
              <h3 className="text-sm font-semibold font-mono text-slate-900 truncate">
                {selectedNode ? selectedNode.data.label : 'Select a node'}
              </h3>
            </div>

            <div className="p-5 space-y-4 flex-1 overflow-y-auto text-xs text-slate-700">
              {selectedNode ? (
                <>
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block font-mono">
                      Architecture Tier
                    </span>
                    <span className="inline-block px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-slate-700 border border-gray-200">
                      {selectedNode.data.category}
                    </span>
                  </div>

                  {selectedNode.data.source && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block font-mono">
                        Source Location
                      </span>
                      <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200/80 font-mono text-slate-800 text-xs">
                        {selectedNode.data.source}
                      </div>
                    </div>
                  )}

                  {selectedNode.data.relationship && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block font-mono">
                        Dependency Binding
                      </span>
                      <p className="text-slate-600 leading-relaxed text-xs">
                        {selectedNode.data.relationship}
                      </p>
                    </div>
                  )}

                  <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                      <span>Impact Notice</span>
                    </div>
                    <p className="text-amber-800 text-[11px] leading-relaxed">
                      {selectedNode.data.category === 'FastAPI Route'
                        ? 'Public contract broken. Response serialization fails with missing attribute.'
                        : selectedNode.data.category === 'ORM Model'
                        ? 'Python model binding broken. Query compilation fails with AttributeError.'
                        : selectedNode.data.category === 'Pydantic Schema'
                        ? 'DTO validation failure. Model fields cannot serialize target attribute.'
                        : 'Underlying database schema modification point.'}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
                  <Info className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs">Click any node in the dependency canvas to inspect architecture bindings.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
