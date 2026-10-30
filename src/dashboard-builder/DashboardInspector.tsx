import React, { useState } from 'react';
import { DashboardDocument, DashboardWidget, WidgetLayout } from './types.ts';
import { WIDGET_REGISTRY } from './widgetRegistry.ts';
import { InspectorTabs } from '../editor-ui/inspector/InspectorTabs.tsx';
import { FieldRow } from '../editor-ui/inspector/FieldRow.tsx';
import { FieldGroup } from '../editor-ui/inspector/FieldGroup.tsx';
import { Input } from '../editor-ui/primitives/Input.tsx';
import { NumberInput } from '../editor-ui/primitives/NumberInput.tsx';
import { Select } from '../editor-ui/primitives/Select.tsx';
import { Switch } from '../editor-ui/primitives/Switch.tsx';
import { Button } from '../editor-ui/primitives/Button.tsx';
import { DeviceType } from '../editor-ui/inspector/DeviceValueBadge.tsx';
import { Database, Sliders, Play, Download, Copy, Trash2, Lock, Unlock } from 'lucide-react';

export interface DashboardInspectorProps {
  document: DashboardDocument;
  selectedId: string | null;
  onUpdateWidget: (id: string, updates: Partial<DashboardWidget>) => void;
  onDeleteWidget: (id: string) => void;
  onDuplicateWidget: (id: string) => void;
  onToggleLock: (id: string) => void;
  device: DeviceType;
  className?: string;
}

export const DashboardInspector: React.FC<DashboardInspectorProps> = ({
  document,
  selectedId,
  onUpdateWidget,
  onDeleteWidget,
  onDuplicateWidget,
  onToggleLock,
  device,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'data' | 'style' | 'actions'>('data');
  const [searchQuery, setSearchQuery] = useState('');

  const widget = document.widgets.find((w) => w.id === selectedId);

  if (!selectedId || !widget) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-[var(--ne-text-muted)] h-full">
        <Sliders className="w-8 h-8 text-[var(--ne-border-strong)] mb-2" />
        <span className="font-medium text-[var(--ne-text)]">No Widget Selected</span>
        <p className="text-[11px] mt-1 max-w-[200px]">
          Click any chart, KPI card, or table in the 12-column grid to bind data and adjust layout.
        </p>
      </div>
    );
  }

  const isLocked = !!widget.meta?.locked;
  const currentLayout = widget.layout[device] || widget.layout.desktop;

  const handleLayoutChange = (key: keyof WidgetLayout, val: number) => {
    onUpdateWidget(widget.id, {
      layout: {
        ...widget.layout,
        [device]: {
          ...currentLayout,
          [key]: val,
        },
      },
    });
  };

  const handleDataBindingChange = (key: string, val: any) => {
    onUpdateWidget(widget.id, {
      dataBinding: {
        ...widget.dataBinding,
        [key]: val,
      },
    });
  };

  return (
    <div className={`flex flex-col h-full bg-[var(--ne-surface)] ${className}`}>
      {/* Widget Header Banner */}
      <div className="px-3 py-2 border-b border-[var(--ne-border)] flex items-center justify-between gap-2 bg-[var(--ne-surface-subtle)]">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
          <span className="text-xs font-semibold text-[var(--ne-text)] truncate">
            {widget.title}
          </span>
          <span className="text-[10px] font-mono text-[var(--ne-text-muted)] uppercase">
            ({widget.type})
          </span>
        </div>
        {isLocked && (
          <div className="flex items-center gap-1 text-[10px] text-[var(--ne-warning)] font-medium bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900">
            <Lock className="w-2.5 h-2.5" />
            <span>Locked</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <InspectorTabs
        tabs={[
          { id: 'data', label: 'Data', icon: <Database className="w-3 h-3" /> },
          { id: 'style', label: 'Style', icon: <Sliders className="w-3 h-3" /> },
          { id: 'actions', label: 'Actions', icon: <Play className="w-3 h-3" /> },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as any)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 ne-scrollbar">
        {activeTab === 'data' && (
          <div className="space-y-3">
            <FieldGroup title="Data Source & Aggregation">
              <FieldRow label="Data Entity">
                <Select
                  value={widget.dataBinding.source}
                  onChange={(e) => handleDataBindingChange('source', e.target.value)}
                  disabled={isLocked}
                  options={[
                    { label: 'Orders & Transactions', value: 'orders' },
                    { label: 'Revenue Stream', value: 'revenue' },
                    { label: 'Customer Accounts', value: 'customers' },
                    { label: 'Inventory Stock', value: 'inventory' },
                  ]}
                />
              </FieldRow>

              <FieldRow label="Measure / Metric">
                <Select
                  value={widget.dataBinding.measure}
                  onChange={(e) => handleDataBindingChange('measure', e.target.value)}
                  disabled={isLocked}
                  options={[
                    { label: 'Sum (Total)', value: 'sum' },
                    { label: 'Count (Records)', value: 'count' },
                    { label: 'Average (Mean)', value: 'average' },
                    { label: 'Unique Count', value: 'unique' },
                  ]}
                />
              </FieldRow>

              <FieldRow label="Dimension">
                <Select
                  value={widget.dataBinding.dimension}
                  onChange={(e) => handleDataBindingChange('dimension', e.target.value)}
                  disabled={isLocked}
                  options={[
                    { label: 'Month / Time Interval', value: 'month' },
                    { label: 'Business Stream / Category', value: 'category' },
                    { label: 'Order Status', value: 'status' },
                    { label: 'Geographic Region', value: 'region' },
                  ]}
                />
              </FieldRow>

              <FieldRow label="Time Window">
                <Select
                  value={widget.dataBinding.dateRange}
                  onChange={(e) => handleDataBindingChange('dateRange', e.target.value)}
                  disabled={isLocked}
                  options={[
                    { label: 'Today', value: 'today' },
                    { label: 'Last 7 Days', value: '7d' },
                    { label: 'Last 30 Days', value: '30d' },
                    { label: 'This Quarter', value: 'quarter' },
                  ]}
                />
              </FieldRow>
            </FieldGroup>

            {/* Live Result Preview */}
            <div className="p-2.5 rounded-[var(--ne-radius-md)] border border-[var(--ne-border)] bg-[var(--ne-surface-subtle)] space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--ne-text)]">
                <span>Result Preview</span>
                <span className="text-[10px] text-emerald-600 font-mono">200 OK</span>
              </div>
              <p className="text-[11px] text-[var(--ne-text-muted)] font-mono leading-relaxed">
                SELECT {widget.dataBinding.measure}(amount) FROM {widget.dataBinding.source} GROUP BY {widget.dataBinding.dimension}
              </p>
              <div className="text-[10px] text-[var(--ne-text-subtle)]">
                Returned 6 aggregated buckets · 0ms latency (mock)
              </div>
            </div>
          </div>
        )}

        {activeTab === 'style' && (
          <div className="space-y-3">
            <FieldGroup title="Widget Header">
              <FieldRow label="Display Title">
                <Input
                  value={widget.title}
                  onChange={(e) => onUpdateWidget(widget.id, { title: e.target.value })}
                  disabled={isLocked}
                  size="sm"
                />
              </FieldRow>
              <FieldRow label="Subtitle">
                <Input
                  value={widget.subtitle || ''}
                  onChange={(e) => onUpdateWidget(widget.id, { subtitle: e.target.value })}
                  disabled={isLocked}
                  size="sm"
                />
              </FieldRow>
            </FieldGroup>

            <FieldGroup title={`Grid Placement (${device})`}>
              <div className="text-[11px] text-[var(--ne-text-muted)] mb-2">
                12-column grid position. Drag handles on canvas or scrub below:
              </div>
              <FieldRow label="Col Span (W)" device={device} isInherited={device !== 'desktop'}>
                <NumberInput
                  value={currentLayout.w}
                  onChange={(v) => handleLayoutChange('w', v)}
                  min={1}
                  max={device === 'desktop' ? 12 : device === 'tablet' ? 6 : 1}
                  unit="cols"
                  disabled={isLocked}
                  size="sm"
                />
              </FieldRow>
              <FieldRow label="Row Height (H)" device={device} isInherited={device !== 'desktop'}>
                <NumberInput
                  value={currentLayout.h}
                  onChange={(v) => handleLayoutChange('h', v)}
                  min={1}
                  max={6}
                  unit="units"
                  disabled={isLocked}
                  size="sm"
                />
              </FieldRow>
              <FieldRow label="Column Offset (X)">
                <NumberInput
                  value={currentLayout.x}
                  onChange={(v) => handleLayoutChange('x', v)}
                  min={0}
                  max={11}
                  disabled={isLocked}
                  size="sm"
                />
              </FieldRow>
              <FieldRow label="Row Offset (Y)">
                <NumberInput
                  value={currentLayout.y}
                  onChange={(v) => handleLayoutChange('y', v)}
                  min={0}
                  disabled={isLocked}
                  size="sm"
                />
              </FieldRow>
            </FieldGroup>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-3">
            <FieldGroup title="Widget Controls">
              <div className="space-y-2 pt-1">
                <Button
                  fullWidth
                  variant="secondary"
                  size="sm"
                  leftIcon={isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  onClick={() => onToggleLock(widget.id)}
                >
                  {isLocked ? 'Unlock Widget' : 'Lock Position & Settings'}
                </Button>

                <Button
                  fullWidth
                  variant="secondary"
                  size="sm"
                  leftIcon={<Copy className="w-3.5 h-3.5" />}
                  onClick={() => onDuplicateWidget(widget.id)}
                  disabled={isLocked}
                >
                  Duplicate Widget
                </Button>

                <Button
                  fullWidth
                  variant="danger"
                  size="sm"
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => onDeleteWidget(widget.id)}
                  disabled={isLocked}
                >
                  Delete Widget
                </Button>
              </div>
            </FieldGroup>
          </div>
        )}
      </div>
    </div>
  );
};
