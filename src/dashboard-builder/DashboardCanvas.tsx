import React, { useState, useRef, useEffect } from 'react';
import { DashboardDocument, DashboardWidget, WidgetLayout } from './types.ts';
import {
  MOCK_ORDERS,
  MOCK_MONTHLY_REVENUE,
  MOCK_CATEGORY_BREAKDOWN,
  WIDGET_REGISTRY,
} from './widgetRegistry.ts';
import { SelectionBox } from '../editor-ui/overlays/SelectionBox.tsx';
import { HoverBox } from '../editor-ui/overlays/HoverBox.tsx';
import { FloatingToolbar } from '../editor-ui/overlays/FloatingToolbar.tsx';
import { ContextMenu, ContextMenuAction } from '../editor-ui/overlays/ContextMenu.tsx';
import { DeviceType } from '../editor-ui/inspector/DeviceValueBadge.tsx';
import { useLiveAnnouncer } from '../editor-ui/a11y/LiveAnnouncer.tsx';
import {
  TrendingUp,
  TrendingDown,
  Table as TableIcon,
  LineChart as LineChartIcon,
  Lock,
  ArrowUpDown,
  Search,
  Download,
  Filter,
} from 'lucide-react';

export interface DashboardCanvasProps {
  document: DashboardDocument;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateWidgetLayout: (id: string, layout: Partial<WidgetLayout>, device: DeviceType) => void;
  onDeleteWidget: (id: string) => void;
  onDuplicateWidget: (id: string) => void;
  onToggleLockWidget: (id: string) => void;
  device: DeviceType;
  zoom: number;
  isPreview?: boolean;
}

export const DashboardCanvas: React.FC<DashboardCanvasProps> = ({
  document,
  selectedId,
  onSelect,
  onUpdateWidgetLayout,
  onDeleteWidget,
  onDuplicateWidget,
  onToggleLockWidget,
  device,
  zoom,
  isPreview = false,
}) => {
  const { announce } = useLiveAnnouncer();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isMoveMode, setIsMoveMode] = useState(false);
  const [showTableFallback, setShowTableFallback] = useState<Record<string, boolean>>({});

  // Table widget local state
  const [tableSearch, setTableSearch] = useState('');
  const [tableSortCol, setTableSortCol] = useState<'id' | 'customer' | 'amount' | 'status'>('date' as any);
  const [tableSortAsc, setTableSortAsc] = useState(false);

  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [selectionBounds, setSelectionBounds] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [hoverBounds, setHoverBounds] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ open: boolean; x: number; y: number; targetId: string } | null>(null);

  // Column counts based on device
  const totalCols = device === 'desktop' ? 12 : device === 'tablet' ? 6 : 1;

  // Active layout for the current device
  const getWidgetLayout = (widget: DashboardWidget): WidgetLayout => {
    return widget.layout[device] || widget.layout.desktop;
  };

  // Measure overlay bounds outside widget markup
  useEffect(() => {
    if (!gridContainerRef.current || isPreview || !selectedId) {
      setSelectionBounds(null);
      return;
    }
    const el = gridContainerRef.current.querySelector(`[data-widget-id="${selectedId}"]`);
    if (el) {
      const containerRect = gridContainerRef.current.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setSelectionBounds({
        top: (elRect.top - containerRect.top) / (zoom / 100),
        left: (elRect.left - containerRect.left) / (zoom / 100),
        width: elRect.width / (zoom / 100),
        height: elRect.height / (zoom / 100),
      });
    } else {
      setSelectionBounds(null);
    }
  }, [selectedId, document, device, zoom, isPreview]);

  useEffect(() => {
    if (!gridContainerRef.current || isPreview || !hoveredId || hoveredId === selectedId) {
      setHoverBounds(null);
      return;
    }
    const el = gridContainerRef.current.querySelector(`[data-widget-id="${hoveredId}"]`);
    if (el) {
      const containerRect = gridContainerRef.current.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setHoverBounds({
        top: (elRect.top - containerRect.top) / (zoom / 100),
        left: (elRect.left - containerRect.left) / (zoom / 100),
        width: elRect.width / (zoom / 100),
        height: elRect.height / (zoom / 100),
      });
    } else {
      setHoverBounds(null);
    }
  }, [hoveredId, selectedId, zoom, isPreview]);

  // Keyboard navigation for grid move mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPreview || !selectedId) return;
      const widget = document.widgets.find((w) => w.id === selectedId);
      if (!widget) return;
      const layout = getWidgetLayout(widget);

      if (e.key === 'Enter') {
        if (!isMoveMode) {
          setIsMoveMode(true);
          announce(`Entered move mode for ${widget.title}. Use arrow keys to shift position or Shift+Arrows to resize.`);
        } else {
          setIsMoveMode(false);
          announce(`Confirmed position for ${widget.title} at column ${layout.x + 1}, row ${layout.y + 1}.`);
        }
      } else if (e.key === 'Escape') {
        if (isMoveMode) {
          setIsMoveMode(false);
          announce('Exited move mode.');
        } else {
          onSelect(null);
        }
      } else if (isMoveMode) {
        if (e.shiftKey) {
          // Resize mode with Shift+Arrows
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            const newW = Math.min(totalCols - layout.x, layout.w + 1);
            onUpdateWidgetLayout(selectedId, { w: newW }, device);
            announce(`Resized ${widget.title} width to ${newW} columns`);
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const newW = Math.max(1, layout.w - 1);
            onUpdateWidgetLayout(selectedId, { w: newW }, device);
            announce(`Resized ${widget.title} width to ${newW} columns`);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const newH = Math.min(5, layout.h + 1);
            onUpdateWidgetLayout(selectedId, { h: newH }, device);
            announce(`Increased height to ${newH} rows`);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const newH = Math.max(1, layout.h - 1);
            onUpdateWidgetLayout(selectedId, { h: newH }, device);
            announce(`Reduced height to ${newH} rows`);
          }
        } else {
          // Move mode with Arrows
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            const newX = Math.min(totalCols - layout.w, layout.x + 1);
            onUpdateWidgetLayout(selectedId, { x: newX }, device);
            announce(`${widget.title} moved to column ${newX + 1}`);
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const newX = Math.max(0, layout.x - 1);
            onUpdateWidgetLayout(selectedId, { x: newX }, device);
            announce(`${widget.title} moved to column ${newX + 1}`);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const newY = layout.y + 1;
            onUpdateWidgetLayout(selectedId, { y: newY }, device);
            announce(`${widget.title} moved to row ${newY + 1}`);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const newY = Math.max(0, layout.y - 1);
            onUpdateWidgetLayout(selectedId, { y: newY }, device);
            announce(`${widget.title} moved to row ${newY + 1}`);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, isMoveMode, isPreview, document, device, totalCols, onUpdateWidgetLayout, onSelect, announce]);

  const selectedWidget = document.widgets.find((w) => w.id === selectedId);

  const renderWidgetContent = (widget: DashboardWidget) => {
    switch (widget.type) {
      case 'kpi': {
        const isUp = widget.props.changeDirection === 'up';
        const isDown = widget.props.changeDirection === 'down';
        const points = widget.props.sparkline || [30, 40, 35, 50, 49, 60, 70];
        const minVal = Math.min(...points);
        const maxVal = Math.max(...points);
        const range = maxVal - minVal || 1;
        const width = 120;
        const height = 32;
        const svgPoints = points
          .map((p: number, i: number) => {
            const x = (i / (points.length - 1)) * width;
            const y = height - ((p - minVal) / range) * (height - 6) - 3;
            return `${x},${y}`;
          })
          .join(' ');

        return (
          <div className="flex flex-col justify-between h-full">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums font-sans">
                  {widget.props.value}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs">
                  <span
                    className={`inline-flex items-center font-medium tabular-nums ${
                      isUp ? 'text-emerald-600 dark:text-emerald-400' : isDown ? 'text-red-600 dark:text-red-400' : 'text-slate-500'
                    }`}
                  >
                    {isUp && <TrendingUp className="w-3.5 h-3.5 mr-0.5 inline" />}
                    {isDown && <TrendingDown className="w-3.5 h-3.5 mr-0.5 inline" />}
                    {widget.props.changePct}
                  </span>
                  <span className="text-slate-500 text-[11px] truncate max-w-[150px]">
                    {widget.props.previousPeriodText}
                  </span>
                </div>
              </div>

              {/* Sparkline mini chart */}
              <div className="shrink-0 pt-1">
                <svg width={width} height={height} className="overflow-visible">
                  <polyline
                    fill="none"
                    stroke={isUp ? '#059669' : isDown ? '#DC2626' : '#2563EB'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={svgPoints}
                  />
                </svg>
              </div>
            </div>
          </div>
        );
      }

      case 'lineChart': {
        const isTableMode = !!showTableFallback[widget.id];

        if (isTableMode) {
          return (
            <div className="h-full overflow-y-auto ne-scrollbar text-xs">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-500 text-[11px]">Table View for Screen Readers & Data Audit</span>
                <button
                  type="button"
                  onClick={() => setShowTableFallback((prev) => ({ ...prev, [widget.id]: false }))}
                  className="text-blue-600 hover:underline text-[11px] font-medium"
                >
                  View as Chart
                </button>
              </div>
              <table className="w-full text-left tabular-nums border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px]">
                    <th className="py-1">Month</th>
                    <th className="py-1 text-right">Actual ($)</th>
                    <th className="py-1 text-right">Target ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {MOCK_MONTHLY_REVENUE.map((row) => (
                    <tr key={row.month} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-1.5 font-medium">{row.month}</td>
                      <td className="py-1.5 text-right font-mono">${row.actual.toLocaleString()}</td>
                      <td className="py-1.5 text-right font-mono text-slate-500">${row.target.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // SVG Multi-Series Chart
        const maxVal = 140000;
        const chartH = 140;
        const chartW = 500;
        const actualPts = MOCK_MONTHLY_REVENUE.map((d, i) => {
          const x = (i / (MOCK_MONTHLY_REVENUE.length - 1)) * chartW;
          const y = chartH - (d.actual / maxVal) * chartH;
          return `${x},${y}`;
        }).join(' ');

        const targetPts = MOCK_MONTHLY_REVENUE.map((d, i) => {
          const x = (i / (MOCK_MONTHLY_REVENUE.length - 1)) * chartW;
          const y = chartH - (d.target / maxVal) * chartH;
          return `${x},${y}`;
        }).join(' ');

        return (
          <div className="flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-blue-600 rounded-full" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Actual Revenue</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-amber-500 rounded-full" />
                  <span className="text-slate-500">Budget Target</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTableFallback((prev) => ({ ...prev, [widget.id]: true }))}
                title="View data as table"
                className="text-[11px] text-slate-500 hover:text-blue-600 flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 hover:border-blue-300"
              >
                <TableIcon className="w-3 h-3" />
                <span>View as Table</span>
              </button>
            </div>

            {/* Responsive SVG Chart */}
            <div className="w-full h-36 relative mt-2">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-full overflow-visible">
                {/* Grid lines */}
                <line x1="0" y1="0" x2={chartW} y2="0" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" />
                <line x1="0" y1={chartH / 2} x2={chartW} y2={chartH / 2} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" />
                <line x1="0" y1={chartH} x2={chartW} y2={chartH} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />

                {/* Target line */}
                <polyline
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  points={targetPts}
                />

                {/* Actual line */}
                <polyline
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={actualPts}
                />

                {/* Points */}
                {MOCK_MONTHLY_REVENUE.map((d, i) => {
                  const cx = (i / (MOCK_MONTHLY_REVENUE.length - 1)) * chartW;
                  const cy = chartH - (d.actual / maxVal) * chartH;
                  return (
                    <circle
                      key={d.month}
                      cx={cx}
                      cy={cy}
                      r="3.5"
                      fill="#FFFFFF"
                      stroke="#2563EB"
                      strokeWidth="2"
                    />
                  );
                })}
              </svg>

              {/* X axis labels */}
              <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
                {MOCK_MONTHLY_REVENUE.map((d) => (
                  <span key={d.month}>{d.month}</span>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 'barChart':
        return (
          <div className="space-y-3 h-full flex flex-col justify-around">
            {MOCK_CATEGORY_BREAKDOWN.map((cat, idx) => {
              const colors = ['bg-blue-600', 'bg-amber-500', 'bg-emerald-600', 'bg-purple-600'];
              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{cat.category}</span>
                    <span className="font-mono text-slate-900 dark:text-slate-100 font-medium tabular-nums">
                      ${cat.value.toLocaleString()} ({cat.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors[idx % colors.length]} rounded-full transition-all duration-300`}
                      style={{ width: `${cat.pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'table': {
        const filtered = MOCK_ORDERS.filter((ord) => {
          if (!tableSearch) return true;
          const q = tableSearch.toLowerCase();
          return ord.customer.toLowerCase().includes(q) || ord.id.toLowerCase().includes(q) || ord.status.toLowerCase().includes(q);
        });

        return (
          <div className="space-y-3">
            {/* Table Search & Export */}
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Filter transactions..."
                  className="w-full h-7 pl-7 pr-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => announce('Exporting CSV transaction data...')}
                className="flex items-center gap-1.5 h-7 px-2.5 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Scrollable table container */}
            <div className="overflow-x-auto ne-scrollbar border border-slate-200 dark:border-slate-800 rounded-md">
              <table className="w-full text-left text-xs border-collapse tabular-nums">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                    <th className="py-2 px-3 font-semibold">Order ID</th>
                    <th className="py-2 px-3 font-semibold">Client Organization</th>
                    <th className="py-2 px-3 font-semibold">Date</th>
                    <th className="py-2 px-3 font-semibold text-right">Amount</th>
                    <th className="py-2 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-950">
                  {filtered.slice(0, 5).map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="py-2 px-3 font-mono font-medium text-blue-600 dark:text-blue-400">{row.id}</td>
                      <td className="py-2 px-3 text-slate-800 dark:text-slate-200">{row.customer}</td>
                      <td className="py-2 px-3 text-slate-500">{row.date}</td>
                      <td className="py-2 px-3 text-right font-mono font-medium text-slate-900 dark:text-slate-100">
                        ${row.amount.toFixed(2)}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`text-[11px] font-medium ${
                          row.status === 'Completed'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : row.status === 'Processing'
                            ? 'text-blue-600 dark:text-blue-400'
                            : row.status === 'Refunded'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-[11px] text-slate-500 text-right">
              Showing 5 of {MOCK_ORDERS.length} records · Tabular numerals enabled
            </div>
          </div>
        );
      }

      case 'text':
      default:
        return (
          <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed space-y-1">
            <p>
              Q4 operational velocity is tracking 14.2% above baseline targets. High enterprise contract renewals in NA and EU drove recurring margins higher.
            </p>
          </div>
        );
    }
  };

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
      {/* 12-Column Responsive Grid Canvas Frame */}
      <div
        ref={gridContainerRef}
        className={`relative w-full max-w-6xl bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg p-6 min-h-[720px] shadow-xs select-none`}
      >
        {/* Visible Grid Background Lines while dragging / moving */}
        {(isMoveMode || selectedId) && (
          <div
            className={`absolute inset-0 p-6 grid grid-cols-${totalCols} gap-4 pointer-events-none opacity-20`}
            aria-hidden="true"
          >
            {Array.from({ length: totalCols * 6 }).map((_, i) => (
              <div
                key={i}
                className="border border-dashed border-blue-500 rounded-md min-h-[120px]"
              />
            ))}
          </div>
        )}

        {/* 12-Column Grid Layout */}
        <div className={`grid grid-cols-${totalCols} gap-4 relative z-10`}>
          {document.widgets.map((widget) => {
            const layout = getWidgetLayout(widget);
            const isSelected = selectedId === widget.id;
            const isLocked = !!widget.meta?.locked;

            const colSpanClass = {
              1: 'col-span-1',
              2: 'col-span-2',
              3: 'col-span-3',
              4: 'col-span-4',
              5: 'col-span-5',
              6: 'col-span-6',
              7: 'col-span-7',
              8: 'col-span-8',
              9: 'col-span-9',
              10: 'col-span-10',
              11: 'col-span-11',
              12: 'col-span-12',
            }[Math.min(totalCols, layout.w)] || 'col-span-1';

            return (
              <div
                key={widget.id}
                data-widget-id={widget.id}
                onClick={(e) => {
                  if (!isPreview) {
                    e.stopPropagation();
                    onSelect(widget.id);
                  }
                }}
                onMouseEnter={() => !isPreview && setHoveredId(widget.id)}
                onMouseLeave={() => !isPreview && setHoveredId(null)}
                className={`relative ${colSpanClass} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs transition-shadow flex flex-col justify-between ${
                  !isPreview ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700' : ''
                }`}
                style={{
                  minHeight: `${layout.h * 130 + (layout.h - 1) * 16}px`,
                }}
              >
                {/* Widget Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
                      {widget.title}
                    </h3>
                    {widget.subtitle && (
                      <p className="text-[11px] text-slate-500 font-sans truncate">
                        {widget.subtitle}
                      </p>
                    )}
                  </div>
                  {isLocked && (
                    <span className="p-0.5 text-amber-500" title="Widget is locked">
                      <Lock className="w-3 h-3" />
                    </span>
                  )}
                </div>

                {/* Widget Body */}
                <div className="flex-1 min-h-0">
                  {renderWidgetContent(widget)}
                </div>
              </div>
            );
          })}
        </div>

        {/* OVERLAYS DRAWN OUTSIDE WIDGET MARKUP */}
        {!isPreview && (
          <>
            {/* Selection Box */}
            {selectionBounds && selectedWidget && (
              <SelectionBox
                bounds={selectionBounds}
                label={`${selectedWidget.title} (${selectedWidget.type})`}
                locked={selectedWidget.meta?.locked}
                isMoveMode={isMoveMode}
              />
            )}

            {/* Hover Box */}
            {hoverBounds && hoveredId && (
              <HoverBox
                bounds={hoverBounds}
                label={document.widgets.find((w) => w.id === hoveredId)?.title}
              />
            )}

            {/* Floating Toolbar on Selected Widget */}
            {selectionBounds && selectedWidget && (
              <FloatingToolbar
                top={selectionBounds.top}
                left={selectionBounds.left}
                isLocked={selectedWidget.meta?.locked}
                onDuplicate={() => onDuplicateWidget(selectedId!)}
                onDelete={() => onDeleteWidget(selectedId!)}
                onToggleLock={() => onToggleLockWidget(selectedId!)}
                onEnterMoveMode={() => {
                  setIsMoveMode(true);
                  announce('Move mode active. Use arrow keys to reposition across 12-column grid.');
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
