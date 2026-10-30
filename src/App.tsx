import React, { useState, useEffect, useReducer, useMemo } from 'react';
import {
  EditorShell,
  LibraryPanel,
  LayersTree,
  CommandAction,
  DeviceType,
  SaveState,
  ConflictDialog,
  useToast,
  BreadcrumbItem,
} from './editor-ui/index.ts';
import {
  INITIAL_PAGE_DOCUMENT,
  convertDocToLayersTree,
  findNodeParents,
} from './page-builder/documentStore.ts';
import { PageCanvas } from './page-builder/PageCanvas.tsx';
import { PageInspector } from './page-builder/PageInspector.tsx';
import { BLOCK_REGISTRY } from './page-builder/registry.ts';
import { PageDocument, PageNode } from './page-builder/types.ts';
import {
  INITIAL_DASHBOARD_DOCUMENT,
  convertDashboardToLayersTree,
  WIDGET_REGISTRY,
} from './dashboard-builder/widgetRegistry.ts';
import { DashboardCanvas } from './dashboard-builder/DashboardCanvas.tsx';
import { DashboardInspector } from './dashboard-builder/DashboardInspector.tsx';
import { DashboardDocument, DashboardWidget, WidgetLayout } from './dashboard-builder/types.ts';
import { DesignSystemGallery } from './gallery/DesignSystemGallery.tsx';
import {
  Sparkles,
  LayoutTemplate,
  Columns3,
  Heading1,
  Pilcrow,
  MousePointerClick,
  Image as ImageIcon,
  TrendingUp,
  LineChart,
  BarChart3,
  Table,
  FileText,
  Layers,
  Component,
  Sliders,
  Palette,
  Eye,
} from 'lucide-react';

type AppMode = 'page' | 'dashboard' | 'gallery';

export default function App() {
  const [mode, setMode] = useState<AppMode>('page');
  const [isDark, setIsDark] = useState(false);
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [zoom, setZoom] = useState(100);
  const [isPreview, setIsPreview] = useState(false);
  const [leftTab, setLeftTab] = useState<'library' | 'layers'>('library');

  // Document states
  const [pageDoc, setPageDoc] = useState<PageDocument>(INITIAL_PAGE_DOCUMENT);
  const [pageHistory, setPageHistory] = useState<PageDocument[]>([]);
  const [pageFuture, setPageFuture] = useState<PageDocument[]>([]);

  const [dashDoc, setDashDoc] = useState<DashboardDocument>(INITIAL_DASHBOARD_DOCUMENT);
  const [dashHistory, setDashHistory] = useState<DashboardDocument[]>([]);
  const [dashFuture, setDashFuture] = useState<DashboardDocument[]>([]);

  // Selection states
  const [selectedPageId, setSelectedPageId] = useState<string | null>('hero_1');
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>('kpi_revenue');

  // Favorites & Recents in Library
  const [favorites, setFavorites] = useState<string[]>(['hero', 'kpi', 'lineChart']);
  const [recentTypes, setRecentTypes] = useState<string[]>(['section', 'table']);

  // Save states
  const [saveStatus, setSaveStatus] = useState<SaveState>('saved');
  const [conflictModalOpen, setConflictModalOpen] = useState(false);

  // Sync theme with document class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Page Builder Actions with History
  const pushPageHistory = (newDoc: PageDocument) => {
    setPageHistory((prev) => [...prev.slice(-20), pageDoc]);
    setPageFuture([]);
    setPageDoc(newDoc);
    setSaveStatus('unsaved');
  };

  const handleUndoPage = () => {
    if (pageHistory.length === 0) return;
    const previous = pageHistory[pageHistory.length - 1];
    setPageHistory((prev) => prev.slice(0, prev.length - 1));
    setPageFuture((prev) => [pageDoc, ...prev]);
    setPageDoc(previous);
  };

  const handleRedoPage = () => {
    if (pageFuture.length === 0) return;
    const next = pageFuture[0];
    setPageFuture((prev) => prev.slice(1));
    setPageHistory((prev) => [...prev, pageDoc]);
    setPageDoc(next);
  };

  const handleUpdatePageProps = (nodeId: string, newProps: Record<string, any>) => {
    const updatedNodes = {
      ...pageDoc.nodes,
      [nodeId]: {
        ...pageDoc.nodes[nodeId],
        props: newProps,
      },
    };
    pushPageHistory({ ...pageDoc, nodes: updatedNodes });
  };

  const handleInsertPageNode = (type: string, parentId: string, slotName: string, index?: number) => {
    const newId = `${type}_${Math.random().toString(36).substring(2, 7)}`;
    const reg = BLOCK_REGISTRY[type];
    const newNode: PageNode = {
      id: newId,
      type,
      props: { ...(reg?.defaultProps || {}) },
      slots: reg?.defaultSlots ? { ...reg.defaultSlots } : {},
      meta: { label: reg?.label || type },
    };

    const parentNode = pageDoc.nodes[parentId];
    if (!parentNode) return;

    const currentSlotItems = parentNode.slots[slotName] || [];
    const newSlotItems = [...currentSlotItems];
    if (index !== undefined) {
      newSlotItems.splice(index, 0, newId);
    } else {
      newSlotItems.push(newId);
    }

    const updatedNodes = {
      ...pageDoc.nodes,
      [newId]: newNode,
      [parentId]: {
        ...parentNode,
        slots: {
          ...parentNode.slots,
          [slotName]: newSlotItems,
        },
      },
    };

    pushPageHistory({ ...pageDoc, nodes: updatedNodes });
    setSelectedPageId(newId);
    setRecentTypes((prev) => [type, ...prev.filter((t) => t !== type).slice(0, 4)]);
  };

  const handleMovePageNode = (nodeId: string, direction: 'up' | 'down') => {
    // Locate parent and slot containing nodeId
    let foundParent: PageNode | null = null;
    let foundSlot = '';
    let foundIndex = -1;

    for (const node of Object.values(pageDoc.nodes)) {
      for (const [slot, children] of Object.entries(node.slots)) {
        if (Array.isArray(children)) {
          const idx = children.indexOf(nodeId);
          if (idx !== -1) {
            foundParent = node;
            foundSlot = slot;
            foundIndex = idx;
            break;
          }
        }
      }
      if (foundParent) break;
    }

    if (!foundParent || foundIndex === -1) return;
    const items = [...(foundParent.slots[foundSlot] || [])];
    const targetIndex = direction === 'up' ? foundIndex - 1 : foundIndex + 1;

    if (targetIndex < 0 || targetIndex >= items.length) return;

    // Swap positions
    const [moved] = items.splice(foundIndex, 1);
    items.splice(targetIndex, 0, moved);

    const updatedNodes = {
      ...pageDoc.nodes,
      [foundParent.id]: {
        ...foundParent,
        slots: {
          ...foundParent.slots,
          [foundSlot]: items,
        },
      },
    };
    pushPageHistory({ ...pageDoc, nodes: updatedNodes });
  };

  const handleDeletePageNode = (id: string) => {
    if (id === 'root') return;
    const newNodes = { ...pageDoc.nodes };
    delete newNodes[id];

    // Remove from parents
    for (const parent of Object.values(newNodes)) {
      for (const [slot, children] of Object.entries(parent.slots)) {
        if (Array.isArray(children) && children.includes(id)) {
          parent.slots[slot] = children.filter((c) => c !== id);
        }
      }
    }
    pushPageHistory({ ...pageDoc, nodes: newNodes });
    if (selectedPageId === id) setSelectedPageId(null);
  };

  const handleDuplicatePageNode = (id: string) => {
    const node = pageDoc.nodes[id];
    if (!node || id === 'root') return;
    const newId = `${node.type}_${Math.random().toString(36).substring(2, 7)}`;
    const clonedNode: PageNode = {
      ...node,
      id: newId,
      meta: { ...node.meta, label: `${node.meta?.label || node.type} (Copy)` },
    };

    // Find parent to insert right after
    let foundParent: PageNode | null = null;
    let foundSlot = '';
    let foundIndex = -1;

    for (const p of Object.values(pageDoc.nodes)) {
      for (const [slot, children] of Object.entries(p.slots)) {
        if (Array.isArray(children)) {
          const idx = children.indexOf(id);
          if (idx !== -1) {
            foundParent = p;
            foundSlot = slot;
            foundIndex = idx;
            break;
          }
        }
      }
      if (foundParent) break;
    }

    if (!foundParent) return;
    const currentChildren = [...(foundParent.slots[foundSlot] || [])];
    currentChildren.splice(foundIndex + 1, 0, newId);

    const updatedNodes = {
      ...pageDoc.nodes,
      [newId]: clonedNode,
      [foundParent.id]: {
        ...foundParent,
        slots: {
          ...foundParent.slots,
          [foundSlot]: currentChildren,
        },
      },
    };

    pushPageHistory({ ...pageDoc, nodes: updatedNodes });
    setSelectedPageId(newId);
  };

  const handleToggleLockPageNode = (id: string) => {
    const node = pageDoc.nodes[id];
    if (!node) return;
    const isLocked = !node.meta?.locked;
    const updated = {
      ...pageDoc.nodes,
      [id]: {
        ...node,
        meta: { ...node.meta, locked: isLocked },
      },
    };
    pushPageHistory({ ...pageDoc, nodes: updated });
  };

  // Dashboard Builder Actions with History
  const pushDashHistory = (newDoc: DashboardDocument) => {
    setDashHistory((prev) => [...prev.slice(-20), dashDoc]);
    setDashFuture([]);
    setDashDoc(newDoc);
    setSaveStatus('unsaved');
  };

  const handleUndoDash = () => {
    if (dashHistory.length === 0) return;
    const previous = dashHistory[dashHistory.length - 1];
    setDashHistory((prev) => prev.slice(0, prev.length - 1));
    setDashFuture((prev) => [dashDoc, ...prev]);
    setDashDoc(previous);
  };

  const handleRedoDash = () => {
    if (dashFuture.length === 0) return;
    const next = dashFuture[0];
    setDashFuture((prev) => prev.slice(1));
    setDashHistory((prev) => [...prev, dashDoc]);
    setDashDoc(next);
  };

  const handleUpdateWidgetLayout = (id: string, layoutChanges: Partial<WidgetLayout>, targetDevice: DeviceType) => {
    const updated = dashDoc.widgets.map((w) => {
      if (w.id === id) {
        return {
          ...w,
          layout: {
            ...w.layout,
            [targetDevice]: {
              ...w.layout[targetDevice],
              ...layoutChanges,
            },
          },
        };
      }
      return w;
    });
    pushDashHistory({ ...dashDoc, widgets: updated });
  };

  const handleUpdateWidget = (id: string, updates: Partial<DashboardWidget>) => {
    const updated = dashDoc.widgets.map((w) => (w.id === id ? { ...w, ...updates } : w));
    pushDashHistory({ ...dashDoc, widgets: updated });
  };

  const handleDeleteWidget = (id: string) => {
    const updated = dashDoc.widgets.filter((w) => w.id !== id);
    pushDashHistory({ ...dashDoc, widgets: updated });
    if (selectedWidgetId === id) setSelectedWidgetId(null);
  };

  const handleDuplicateWidget = (id: string) => {
    const target = dashDoc.widgets.find((w) => w.id === id);
    if (!target) return;
    const newId = `${target.type}_${Math.random().toString(36).substring(2, 7)}`;
    const cloned: DashboardWidget = {
      ...target,
      id: newId,
      title: `${target.title} (Copy)`,
      layout: {
        desktop: { ...target.layout.desktop, y: target.layout.desktop.y + target.layout.desktop.h },
        tablet: { ...target.layout.tablet, y: target.layout.tablet.y + target.layout.tablet.h },
        mobile: { ...target.layout.mobile, y: target.layout.mobile.y + target.layout.mobile.h },
      },
    };
    pushDashHistory({ ...dashDoc, widgets: [...dashDoc.widgets, cloned] });
    setSelectedWidgetId(newId);
  };

  const handleToggleLockWidget = (id: string) => {
    const updated = dashDoc.widgets.map((w) => {
      if (w.id === id) {
        return {
          ...w,
          meta: { ...w.meta, locked: !w.meta?.locked },
        };
      }
      return w;
    });
    pushDashHistory({ ...dashDoc, widgets: updated });
  };

  // Global Command Palette Actions
  const commandActions: CommandAction[] = useMemo(() => [
    {
      id: 'mode-page',
      title: 'Switch to Page Builder',
      category: 'View Mode',
      icon: <LayoutTemplate className="w-3.5 h-3.5" />,
      onExecute: () => setMode('page'),
    },
    {
      id: 'mode-dashboard',
      title: 'Switch to Dashboard Builder',
      category: 'View Mode',
      icon: <Columns3 className="w-3.5 h-3.5" />,
      onExecute: () => setMode('dashboard'),
    },
    {
      id: 'mode-gallery',
      title: 'Open Design System Gallery',
      category: 'View Mode',
      icon: <Palette className="w-3.5 h-3.5" />,
      onExecute: () => setMode('gallery'),
    },
    {
      id: 'theme-toggle',
      title: isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme',
      category: 'Preferences',
      shortcut: '⌘⇧T',
      onExecute: () => setIsDark(!isDark),
    },
    {
      id: 'device-desktop',
      title: 'Desktop View (1280px / 12 Cols)',
      category: 'Device',
      onExecute: () => setDevice('desktop'),
    },
    {
      id: 'device-tablet',
      title: 'Tablet View (768px / 6 Cols)',
      category: 'Device',
      onExecute: () => setDevice('tablet'),
    },
    {
      id: 'device-mobile',
      title: 'Mobile View (390px / 1 Col)',
      category: 'Device',
      onExecute: () => setDevice('mobile'),
    },
    {
      id: 'undo',
      title: 'Undo Edit',
      category: 'History',
      shortcut: '⌘Z',
      onExecute: () => (mode === 'page' ? handleUndoPage() : handleUndoDash()),
    },
    {
      id: 'redo',
      title: 'Redo Edit',
      category: 'History',
      shortcut: '⌘⇧Z',
      onExecute: () => (mode === 'page' ? handleRedoPage() : handleRedoDash()),
    },
    {
      id: 'export-json',
      title: 'Export Document JSON to Console',
      category: 'Data',
      onExecute: () => {
        console.log('Document JSON:', mode === 'page' ? pageDoc : dashDoc);
      },
    },
  ], [isDark, mode, pageDoc, dashDoc]);

  // Breadcrumbs calculation
  const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
    if (mode === 'page' && selectedPageId) {
      const parents = findNodeParents(pageDoc, selectedPageId);
      return parents.map((p) => ({
        id: p.id,
        label: p.label,
      }));
    }
    if (mode === 'dashboard' && selectedWidgetId) {
      const w = dashDoc.widgets.find((x) => x.id === selectedWidgetId);
      return [
        { id: 'dashboard', label: 'Dashboard Grid' },
        { id: selectedWidgetId, label: w?.title || selectedWidgetId },
      ];
    }
    return [];
  }, [mode, selectedPageId, selectedWidgetId, pageDoc, dashDoc]);

  // Library Items based on active builder
  const libraryItems = useMemo(() => {
    if (mode === 'page') {
      return Object.values(BLOCK_REGISTRY).map((reg) => {
        const icon = {
          hero: <Sparkles className="w-3.5 h-3.5" />,
          section: <LayoutTemplate className="w-3.5 h-3.5" />,
          columns: <Columns3 className="w-3.5 h-3.5" />,
          heading: <Heading1 className="w-3.5 h-3.5" />,
          paragraph: <Pilcrow className="w-3.5 h-3.5" />,
          button: <MousePointerClick className="w-3.5 h-3.5" />,
          image: <ImageIcon className="w-3.5 h-3.5" />,
        }[reg.type] || <Component className="w-3.5 h-3.5" />;

        return {
          type: reg.type,
          label: reg.label,
          description: reg.description,
          category: reg.category,
          icon,
        };
      });
    }

    return Object.values(WIDGET_REGISTRY).map((reg) => {
      const icon = {
        kpi: <TrendingUp className="w-3.5 h-3.5" />,
        lineChart: <LineChart className="w-3.5 h-3.5" />,
        barChart: <BarChart3 className="w-3.5 h-3.5" />,
        table: <Table className="w-3.5 h-3.5" />,
        text: <FileText className="w-3.5 h-3.5" />,
      }[reg.type] || <Component className="w-3.5 h-3.5" />;

      return {
        type: reg.type,
        label: reg.label,
        description: reg.description,
        category: reg.category,
        icon,
      };
    });
  }, [mode]);

  // Layers Tree representation
  const layersNodes = useMemo(() => {
    if (mode === 'page') {
      return convertDocToLayersTree(pageDoc);
    }
    return convertDashboardToLayersTree(dashDoc);
  }, [mode, pageDoc, dashDoc]);

  // Mode Switcher Bar in TopBar extraActions
  const modeSwitcher = (
    <div className="flex items-center p-0.5 bg-[var(--ne-surface-subtle)] border border-[var(--ne-border)] rounded-[var(--ne-radius-md)]">
      <button
        type="button"
        onClick={() => setMode('page')}
        className={`px-2.5 py-1 text-xs font-sans rounded-[var(--ne-radius-sm)] transition-colors cursor-pointer ${
          mode === 'page'
            ? 'bg-[var(--ne-surface)] text-[var(--ne-primary)] shadow-2xs font-medium'
            : 'text-[var(--ne-text-muted)] hover:text-[var(--ne-text)]'
        }`}
      >
        Page Builder
      </button>
      <button
        type="button"
        onClick={() => setMode('dashboard')}
        className={`px-2.5 py-1 text-xs font-sans rounded-[var(--ne-radius-sm)] transition-colors cursor-pointer ${
          mode === 'dashboard'
            ? 'bg-[var(--ne-surface)] text-[var(--ne-primary)] shadow-2xs font-medium'
            : 'text-[var(--ne-text-muted)] hover:text-[var(--ne-text)]'
        }`}
      >
        Dashboard Builder
      </button>
      <button
        type="button"
        onClick={() => setMode('gallery')}
        className={`px-2.5 py-1 text-xs font-sans rounded-[var(--ne-radius-sm)] transition-colors cursor-pointer ${
          mode === 'gallery'
            ? 'bg-[var(--ne-surface)] text-[var(--ne-primary)] shadow-2xs font-medium'
            : 'text-[var(--ne-text-muted)] hover:text-[var(--ne-text)]'
        }`}
      >
        Tokens &amp; Gallery
      </button>
    </div>
  );

  // Left Panel Content (Library or Layers Tree)
  const leftPanelContent = (
    <div className="flex flex-col h-full">
      {/* Sub-tabs: Insert vs Layers */}
      <div className="flex border-b border-[var(--ne-border)] px-2 pt-1.5 pb-1 gap-1">
        <button
          type="button"
          onClick={() => setLeftTab('library')}
          className={`flex-1 py-1 text-xs font-sans rounded-[var(--ne-radius-sm)] transition-colors cursor-pointer text-center ${
            leftTab === 'library'
              ? 'bg-[var(--ne-surface-subtle)] text-[var(--ne-text)] font-semibold'
              : 'text-[var(--ne-text-muted)] hover:text-[var(--ne-text)]'
          }`}
        >
          {mode === 'page' ? 'Insert Blocks' : 'Insert Widgets'}
        </button>
        <button
          type="button"
          onClick={() => setLeftTab('layers')}
          className={`flex-1 py-1 text-xs font-sans rounded-[var(--ne-radius-sm)] transition-colors cursor-pointer text-center ${
            leftTab === 'layers'
              ? 'bg-[var(--ne-surface-subtle)] text-[var(--ne-text)] font-semibold'
              : 'text-[var(--ne-text-muted)] hover:text-[var(--ne-text)]'
          }`}
        >
          Layers Tree
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {leftTab === 'library' ? (
          <LibraryPanel
            items={libraryItems}
            onSelectItem={(item) => {
              if (mode === 'page') {
                handleInsertPageNode(item.type, 'root', 'children');
              } else {
                // Insert widget into dashboard grid
                const newId = `${item.type}_${Math.random().toString(36).substring(2, 7)}`;
                const newWidget: DashboardWidget = {
                  id: newId,
                  type: item.type as any,
                  title: `New ${item.label}`,
                  layout: {
                    desktop: { x: 0, y: 10, w: 4, h: 2 },
                    tablet: { x: 0, y: 10, w: 6, h: 2 },
                    mobile: { x: 0, y: 10, w: 1, h: 2 },
                  },
                  props: {},
                  dataBinding: { source: 'revenue', measure: 'sum', dimension: 'month', filters: [], dateRange: '30d' },
                };
                pushDashHistory({ ...dashDoc, widgets: [...dashDoc.widgets, newWidget] });
                setSelectedWidgetId(newId);
              }
            }}
            favorites={favorites}
            onToggleFavorite={(type) => {
              setFavorites((prev) =>
                prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
              );
            }}
            recentTypes={recentTypes}
          />
        ) : (
          <LayersTree
            nodes={layersNodes}
            selectedId={mode === 'page' ? selectedPageId || undefined : selectedWidgetId || undefined}
            onSelect={(id) => {
              if (mode === 'page') setSelectedPageId(id);
              else setSelectedWidgetId(id);
            }}
            onToggleHide={(id) => {
              if (mode === 'page') {
                const node = pageDoc.nodes[id];
                if (node) {
                  pushPageHistory({
                    ...pageDoc,
                    nodes: { ...pageDoc.nodes, [id]: { ...node, meta: { ...node.meta, hidden: !node.meta?.hidden } } },
                  });
                }
              }
            }}
            onToggleLock={(id) => {
              if (mode === 'page') handleToggleLockPageNode(id);
              else handleToggleLockWidget(id);
            }}
            onDelete={(id) => {
              if (mode === 'page') handleDeletePageNode(id);
              else handleDeleteWidget(id);
            }}
            onDuplicate={(id) => {
              if (mode === 'page') handleDuplicatePageNode(id);
              else handleDuplicateWidget(id);
            }}
          />
        )}
      </div>
    </div>
  );

  // If in Gallery mode, render DesignSystemGallery inside shell
  if (mode === 'gallery') {
    return (
      <EditorShell
        topBarProps={{
          documentName: 'Design System & Token Gallery',
          saveStatus: 'saved',
          device,
          onDeviceChange: setDevice,
          zoom,
          onZoomChange: setZoom,
          isPreview: false,
          onTogglePreview: () => {},
          isDark,
          onToggleTheme: () => setIsDark(!isDark),
          extraActions: modeSwitcher,
        }}
        canvas={<DesignSystemGallery isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} />}
        commandActions={commandActions}
        modeLabel="Gallery Mode"
      />
    );
  }

  return (
    <>
      <EditorShell
        topBarProps={{
          documentName: mode === 'page' ? 'Landing Page Template' : dashDoc.title,
          onRenameDocument: (name) => {
            if (mode === 'page') {
              // rename
            } else {
              setDashDoc({ ...dashDoc, title: name });
            }
          },
          saveStatus,
          canUndo: mode === 'page' ? pageHistory.length > 0 : dashHistory.length > 0,
          canRedo: mode === 'page' ? pageFuture.length > 0 : dashFuture.length > 0,
          onUndo: mode === 'page' ? handleUndoPage : handleUndoDash,
          onRedo: mode === 'page' ? handleRedoPage : handleRedoDash,
          device,
          onDeviceChange: setDevice,
          zoom,
          onZoomChange: setZoom,
          isPreview,
          onTogglePreview: () => setIsPreview(!isPreview),
          onPublish: () => {
            setSaveStatus('saving');
            setTimeout(() => setSaveStatus('saved'), 600);
          },
          onRetrySave: () => setSaveStatus('saving'),
          onResolveConflict: () => setConflictModalOpen(true),
          isDark,
          onToggleTheme: () => setIsDark(!isDark),
          extraActions: modeSwitcher,
        }}
        leftPanelTitle={leftTab === 'library' ? 'Add Elements' : 'Hierarchy'}
        leftPanelContent={leftPanelContent}
        leftPanelDefaultWidth={270}
        rightPanelTitle={mode === 'page' ? 'Block Inspector' : 'Widget Inspector'}
        rightPanelContent={
          mode === 'page' ? (
            <PageInspector
              document={pageDoc}
              selectedId={selectedPageId}
              onUpdateProps={handleUpdatePageProps}
              device={device}
            />
          ) : (
            <DashboardInspector
              document={dashDoc}
              selectedId={selectedWidgetId}
              onUpdateWidget={handleUpdateWidget}
              onDeleteWidget={handleDeleteWidget}
              onDuplicateWidget={handleDuplicateWidget}
              onToggleLock={handleToggleLockWidget}
              device={device}
            />
          )
        }
        rightPanelDefaultWidth={320}
        canvas={
          mode === 'page' ? (
            <PageCanvas
              document={pageDoc}
              selectedId={selectedPageId}
              onSelect={setSelectedPageId}
              onUpdateProps={handleUpdatePageProps}
              onInsertNode={handleInsertPageNode}
              onMoveNode={handleMovePageNode}
              onDeleteNode={handleDeletePageNode}
              onDuplicateNode={handleDuplicatePageNode}
              onToggleLockNode={handleToggleLockPageNode}
              device={device}
              zoom={zoom}
              isPreview={isPreview}
            />
          ) : (
            <DashboardCanvas
              document={dashDoc}
              selectedId={selectedWidgetId}
              onSelect={setSelectedWidgetId}
              onUpdateWidgetLayout={handleUpdateWidgetLayout}
              onDeleteWidget={handleDeleteWidget}
              onDuplicateWidget={handleDuplicateWidget}
              onToggleLockWidget={handleToggleLockWidget}
              device={device}
              zoom={zoom}
              isPreview={isPreview}
            />
          )
        }
        breadcrumbs={breadcrumbs}
        onSelectBreadcrumb={(id) => {
          if (mode === 'page') setSelectedPageId(id);
          else setSelectedWidgetId(id);
        }}
        selectionSummary={
          mode === 'page'
            ? selectedPageId ? `Selected: ${pageDoc.nodes[selectedPageId]?.meta?.label || selectedPageId}` : 'No block selected'
            : selectedWidgetId ? `Selected: ${dashDoc.widgets.find((w) => w.id === selectedWidgetId)?.title || selectedWidgetId}` : 'No widget selected'
        }
        nodeCount={mode === 'page' ? Object.keys(pageDoc.nodes).length - 1 : dashDoc.widgets.length}
        commandActions={commandActions}
        modeLabel={mode === 'page' ? 'Page Canvas (Slot Model)' : 'Dashboard Canvas (12-Col Grid)'}
      />

      <ConflictDialog
        open={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        onKeepMine={() => {
          setSaveStatus('saved');
          setConflictModalOpen(false);
        }}
        onUseSaved={() => {
          setSaveStatus('saved');
          setConflictModalOpen(false);
        }}
      />
    </>
  );
}
