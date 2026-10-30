import React, { useState, useRef, useEffect } from 'react';
import { PageDocument, PageNode } from './types.ts';
import { BLOCK_REGISTRY } from './registry.ts';
import { SelectionBox } from '../editor-ui/overlays/SelectionBox.tsx';
import { HoverBox } from '../editor-ui/overlays/HoverBox.tsx';
import { DropLine } from '../editor-ui/overlays/DropLine.tsx';
import { FloatingToolbar } from '../editor-ui/overlays/FloatingToolbar.tsx';
import { ContextMenu, ContextMenuAction } from '../editor-ui/overlays/ContextMenu.tsx';
import { DeviceType } from '../editor-ui/inspector/DeviceValueBadge.tsx';
import { useLiveAnnouncer } from '../editor-ui/a11y/LiveAnnouncer.tsx';
import { Plus, Sparkles, LayoutTemplate, Columns3, Heading1, Pilcrow, MousePointerClick, Image as ImageIcon } from 'lucide-react';

export interface PageCanvasProps {
  document: PageDocument;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateProps: (id: string, props: Record<string, any>) => void;
  onInsertNode: (type: string, parentId: string, slotName: string, index?: number) => void;
  onMoveNode: (nodeId: string, direction: 'up' | 'down') => void;
  onDeleteNode: (id: string) => void;
  onDuplicateNode: (id: string) => void;
  onToggleLockNode: (id: string) => void;
  device: DeviceType;
  zoom: number;
  isPreview?: boolean;
}

export const PageCanvas: React.FC<PageCanvasProps> = ({
  document,
  selectedId,
  onSelect,
  onUpdateProps,
  onInsertNode,
  onMoveNode,
  onDeleteNode,
  onDuplicateNode,
  onToggleLockNode,
  device,
  zoom,
  isPreview = false,
}) => {
  const { announce } = useLiveAnnouncer();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isMoveMode, setIsMoveMode] = useState(false);
  const [quickInsertSlot, setQuickInsertSlot] = useState<{ parentId: string; slotName: string; index?: number } | null>(null);

  // Overlay positions calculated relative to canvas viewport
  const canvasFrameRef = useRef<HTMLDivElement>(null);
  const [selectionBounds, setSelectionBounds] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [hoverBounds, setHoverBounds] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ open: boolean; x: number; y: number; targetId: string } | null>(null);

  // Measure selection and hover bounds outside markup
  useEffect(() => {
    if (!canvasFrameRef.current || isPreview) {
      setSelectionBounds(null);
      return;
    }

    if (selectedId && selectedId !== 'root') {
      const el = canvasFrameRef.current.querySelector(`[data-node-id="${selectedId}"]`);
      if (el) {
        const frameRect = canvasFrameRef.current.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        setSelectionBounds({
          top: (elRect.top - frameRect.top) / (zoom / 100),
          left: (elRect.left - frameRect.left) / (zoom / 100),
          width: elRect.width / (zoom / 100),
          height: elRect.height / (zoom / 100),
        });
      } else {
        setSelectionBounds(null);
      }
    } else {
      setSelectionBounds(null);
    }
  }, [selectedId, document, zoom, device, isPreview]);

  useEffect(() => {
    if (!canvasFrameRef.current || isPreview || !hoveredId || hoveredId === selectedId || hoveredId === 'root') {
      setHoverBounds(null);
      return;
    }
    const el = canvasFrameRef.current.querySelector(`[data-node-id="${hoveredId}"]`);
    if (el) {
      const frameRect = canvasFrameRef.current.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setHoverBounds({
        top: (elRect.top - frameRect.top) / (zoom / 100),
        left: (elRect.left - frameRect.left) / (zoom / 100),
        width: elRect.width / (zoom / 100),
        height: elRect.height / (zoom / 100),
      });
    } else {
      setHoverBounds(null);
    }
  }, [hoveredId, selectedId, zoom, isPreview]);

  // Keyboard navigation & move mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPreview || !selectedId || selectedId === 'root') return;

      if (e.key === 'Enter') {
        if (!isMoveMode) {
          setIsMoveMode(true);
          announce(`Entered keyboard move mode for ${document.nodes[selectedId]?.meta?.label || selectedId}. Use Arrow Up and Down to move.`);
        } else {
          setIsMoveMode(false);
          announce(`Confirmed position for ${document.nodes[selectedId]?.meta?.label || selectedId}.`);
        }
      } else if (e.key === 'Escape') {
        if (isMoveMode) {
          setIsMoveMode(false);
          announce('Cancelled move mode.');
        } else {
          onSelect(null);
        }
      } else if (isMoveMode) {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          onMoveNode(selectedId, 'up');
          announce(`Moved ${document.nodes[selectedId]?.meta?.label || selectedId} up.`);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          onMoveNode(selectedId, 'down');
          announce(`Moved ${document.nodes[selectedId]?.meta?.label || selectedId} down.`);
        }
      } else {
        // Quick insert shortcut
        if (e.key === '/' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
          e.preventDefault();
          setQuickInsertSlot({ parentId: 'root', slotName: 'children' });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, isMoveMode, isPreview, document, onMoveNode, onSelect, announce]);

  const frameWidthStyle = {
    desktop: 'w-[1280px]',
    tablet: 'w-[768px]',
    mobile: 'w-[390px]',
  }[device];

  const selectedNode = selectedId ? document.nodes[selectedId] : null;

  // Render individual page block
  const renderBlock = (nodeId: string, parentId: string, slotName: string, index: number) => {
    const node = document.nodes[nodeId];
    if (!node || node.meta?.hidden) return null;

    const isSelected = selectedId === nodeId;
    const isLocked = !!node.meta?.locked;

    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onSelect(nodeId);
      setContextMenu({
        open: true,
        x: e.clientX,
        y: e.clientY,
        targetId: nodeId,
      });
    };

    const blockContent = (() => {
      switch (node.type) {
        case 'hero':
          return (
            <div
              className={`p-8 md:p-12 transition-all ${
                node.props.bgTone === 'subtle'
                  ? 'bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800'
                  : node.props.bgTone === 'primary'
                  ? 'bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-900'
                  : 'bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800'
              } text-${node.props.align || 'center'}`}
              style={{ paddingTop: `${node.props.paddingY || 48}px`, paddingBottom: `${node.props.paddingY || 48}px` }}
            >
              <div className="max-w-3xl mx-auto space-y-4">
                {node.props.badgeText && (
                  <div className="text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400">
                    {node.props.badgeText}
                  </div>
                )}
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight text-balance">
                  {node.props.headline}
                </h1>
                <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
                  {node.props.subheadline}
                </p>
                {node.props.ctaText && (
                  <div className="pt-2">
                    <button className="px-5 py-2.5 text-xs font-medium bg-blue-600 text-white rounded-md shadow-xs hover:bg-blue-700 transition-colors">
                      {node.props.ctaText}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );

        case 'section':
          return (
            <div
              className="w-full transition-all"
              style={{
                backgroundColor: node.props.background === 'transparent' ? undefined : node.props.background,
                paddingTop: `${node.props.paddingY || 32}px`,
                paddingBottom: `${node.props.paddingY || 32}px`,
              }}
            >
              <div
                className="mx-auto px-6 space-y-4"
                style={{ maxWidth: node.props.maxWidth || '1200px' }}
              >
                {/* Render children inside section */}
                {node.slots.children?.map((cId, cIdx) => (
                  <React.Fragment key={cId}>
                    {renderBlock(cId, node.id, 'children', cIdx)}
                  </React.Fragment>
                ))}

                {/* Quick Add at bottom of section */}
                {!isPreview && (
                  <div className="flex justify-center py-2 opacity-0 hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => setQuickInsertSlot({ parentId: node.id, slotName: 'children' })}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs text-blue-600 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-md hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add block to Section</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );

        case 'columns': {
          const colCount = parseInt(node.props.count || '3', 10);
          const colsGrid = {
            2: 'grid-cols-1 md:grid-cols-2',
            3: 'grid-cols-1 md:grid-cols-3',
            4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
          }[colCount] || 'grid-cols-3';

          return (
            <div
              className={`grid ${colsGrid} gap-4 w-full`}
              style={{ gap: `${node.props.gap || 16}px` }}
            >
              {Array.from({ length: colCount }).map((_, cIdx) => {
                const slotKey = `col_${cIdx}`;
                const colChildren = node.slots[slotKey] || [];
                return (
                  <div
                    key={slotKey}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between min-h-[140px] space-y-3"
                  >
                    <div className="space-y-2">
                      {colChildren.map((cId, idx) => (
                        <React.Fragment key={cId}>
                          {renderBlock(cId, node.id, slotKey, idx)}
                        </React.Fragment>
                      ))}
                    </div>

                    {!isPreview && (
                      <button
                        type="button"
                        onClick={() => setQuickInsertSlot({ parentId: node.id, slotName: slotKey })}
                        className="flex items-center justify-center gap-1 py-1 text-[11px] text-slate-400 hover:text-blue-600 border border-dashed border-slate-200 dark:border-slate-800 rounded hover:border-blue-400 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Insert in Col {cIdx + 1}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        }

        case 'heading': {
          const Tag = (node.props.level || 'h2') as any;
          return (
            <Tag
              className="font-bold tracking-tight text-balance leading-snug"
              style={{
                fontSize: `${node.props.size || 24}px`,
                color: node.props.color || 'inherit',
              }}
            >
              {node.props.text}
            </Tag>
          );
        }

        case 'paragraph':
          return (
            <p
              className={`leading-relaxed ${node.props.muted ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}
              style={{ fontSize: `${node.props.size || 14}px` }}
            >
              {node.props.text}
            </p>
          );

        case 'button':
          return (
            <div>
              <button
                type="button"
                className={`inline-flex items-center justify-center font-medium rounded-md transition-colors ${
                  node.props.variant === 'primary'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : node.props.variant === 'secondary'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                    : 'bg-transparent text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50'
                } ${
                  node.props.size === 'sm' ? 'px-2.5 py-1 text-xs h-7' : node.props.size === 'lg' ? 'px-4 py-2 text-sm h-9' : 'px-3 py-1.5 text-xs h-8'
                } ${node.props.fullWidth ? 'w-full' : ''}`}
              >
                {node.props.label}
              </button>
            </div>
          );

        case 'image':
          return (
            <div
              className="relative overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center"
              style={{
                aspectRatio: node.props.aspectRatio || '16/9',
                borderRadius: `${node.props.rounded || 8}px`,
              }}
            >
              <div className="flex flex-col items-center text-slate-400 gap-1.5 p-4 text-center">
                <ImageIcon className="w-8 h-8 opacity-50" />
                <span className="text-xs font-medium">{node.props.alt || 'Image slot'}</span>
                {node.props.caption && (
                  <span className="text-[11px] text-slate-500">{node.props.caption}</span>
                )}
              </div>
            </div>
          );

        default:
          return <div>Unknown Block: {node.type}</div>;
      }
    })();

    return (
      <div
        key={nodeId}
        data-node-id={nodeId}
        onClick={(e) => {
          if (!isPreview) {
            e.stopPropagation();
            onSelect(nodeId);
          }
        }}
        onMouseEnter={() => !isPreview && setHoveredId(nodeId)}
        onMouseLeave={() => !isPreview && setHoveredId(null)}
        onContextMenu={handleContextMenu}
        className={`relative transition-all duration-75 ${!isPreview ? 'cursor-pointer' : ''}`}
      >
        {blockContent}

        {/* "+" insert button between adjacent blocks on root */}
        {!isPreview && parentId === 'root' && (
          <div className="group/plus relative h-2 -mb-1 flex items-center justify-center z-10 opacity-0 hover:opacity-100 transition-opacity">
            <div className="absolute inset-x-0 h-[1px] bg-blue-400 dark:bg-blue-500" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setQuickInsertSlot({ parentId: 'root', slotName: 'children', index: index + 1 });
              }}
              title="Insert block here"
              className="relative z-10 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const contextActions: ContextMenuAction[] = [
    {
      id: 'move-up',
      label: 'Move Up',
      shortcut: 'Alt+↑',
      onClick: () => {
        if (contextMenu?.targetId) {
          onMoveNode(contextMenu.targetId, 'up');
          announce('Moved item up');
        }
      },
    },
    {
      id: 'move-down',
      label: 'Move Down',
      shortcut: 'Alt+↓',
      onClick: () => {
        if (contextMenu?.targetId) {
          onMoveNode(contextMenu.targetId, 'down');
          announce('Moved item down');
        }
      },
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      shortcut: 'Cmd+D',
      onClick: () => {
        if (contextMenu?.targetId) onDuplicateNode(contextMenu.targetId);
      },
    },
    {
      id: 'lock',
      label: selectedNode?.meta?.locked ? 'Unlock' : 'Lock',
      onClick: () => {
        if (contextMenu?.targetId) onToggleLockNode(contextMenu.targetId);
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      shortcut: 'Del',
      danger: true,
      onClick: () => {
        if (contextMenu?.targetId) onDeleteNode(contextMenu.targetId);
      },
    },
  ];

  return (
    <div
      onClick={() => onSelect(null)}
      className="p-8 w-full flex flex-col items-center justify-start min-h-full"
      style={{
        transform: `scale(${zoom / 100})`,
        transformOrigin: 'top center',
        transition: 'transform 100ms ease-out',
      }}
    >
      {/* Device Canvas Frame */}
      <div
        ref={canvasFrameRef}
        className={`relative ${frameWidthStyle} bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm min-h-[700px] overflow-visible transition-[width] duration-200`}
      >
        {/* Render Root Children */}
        {document.nodes.root.slots.children?.map((childId, idx) =>
          renderBlock(childId, 'root', 'children', idx)
        )}

        {/* OVERLAYS DRAWN OUTSIDE BLOCK MARKUP */}
        {!isPreview && (
          <>
            {/* Selection Box */}
            {selectionBounds && selectedNode && (
              <SelectionBox
                bounds={selectionBounds}
                label={selectedNode.meta?.label || BLOCK_REGISTRY[selectedNode.type]?.label || selectedNode.type}
                locked={selectedNode.meta?.locked}
                isMoveMode={isMoveMode}
              />
            )}

            {/* Hover Box */}
            {hoverBounds && hoveredId && (
              <HoverBox
                bounds={hoverBounds}
                label={document.nodes[hoveredId]?.meta?.label || BLOCK_REGISTRY[document.nodes[hoveredId]?.type]?.label}
              />
            )}

            {/* Floating Toolbar on Selected Block */}
            {selectionBounds && selectedNode && (
              <FloatingToolbar
                top={selectionBounds.top}
                left={selectionBounds.left}
                isLocked={selectedNode.meta?.locked}
                onMoveUp={() => {
                  onMoveNode(selectedId!, 'up');
                  announce(`Moved ${selectedNode.meta?.label || selectedNode.type} up`);
                }}
                onMoveDown={() => {
                  onMoveNode(selectedId!, 'down');
                  announce(`Moved ${selectedNode.meta?.label || selectedNode.type} down`);
                }}
                onDuplicate={() => onDuplicateNode(selectedId!)}
                onDelete={() => onDeleteNode(selectedId!)}
                onToggleLock={() => onToggleLockNode(selectedId!)}
                onEnterMoveMode={() => {
                  setIsMoveMode(true);
                  announce('Move mode enabled. Use arrow keys to reposition.');
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Right-click Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          open={contextMenu.open}
          onClose={() => setContextMenu(null)}
          actions={contextActions}
        />
      )}

      {/* Quick Insert Modal (triggered by "+" or "/") */}
      {quickInsertSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setQuickInsertSlot(null)}
          />
          <div className="relative z-10 w-full max-w-sm bg-[var(--ne-surface)] border border-[var(--ne-border)] rounded-[var(--ne-radius-lg)] shadow-2xl p-4">
            <h4 className="text-xs font-semibold text-[var(--ne-text)] mb-3">
              Insert Block
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(BLOCK_REGISTRY).map((reg) => (
                <button
                  key={reg.type}
                  type="button"
                  onClick={() => {
                    onInsertNode(reg.type, quickInsertSlot.parentId, quickInsertSlot.slotName, quickInsertSlot.index);
                    announce(`Inserted ${reg.label}`);
                    setQuickInsertSlot(null);
                  }}
                  className="flex items-center gap-2 p-2 rounded-[var(--ne-radius-md)] border border-[var(--ne-border)] hover:border-[var(--ne-primary)] hover:bg-[var(--ne-surface-hover)] text-left cursor-pointer transition-all"
                >
                  <span className="w-6 h-6 rounded bg-[var(--ne-primary-soft)] text-[var(--ne-primary)] flex items-center justify-center text-xs font-bold">
                    +
                  </span>
                  <div>
                    <div className="text-xs font-medium text-[var(--ne-text)]">{reg.label}</div>
                    <div className="text-[10px] text-[var(--ne-text-muted)] truncate max-w-[100px]">{reg.category}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
