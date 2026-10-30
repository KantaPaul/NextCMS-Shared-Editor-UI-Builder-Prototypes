import React, { useState } from 'react';
import { PageDocument, PageNode, BlockField } from './types.ts';
import { BLOCK_REGISTRY } from './registry.ts';
import { InspectorTabs } from '../editor-ui/inspector/InspectorTabs.tsx';
import { FieldRow } from '../editor-ui/inspector/FieldRow.tsx';
import { FieldGroup } from '../editor-ui/inspector/FieldGroup.tsx';
import { BoxModelWidget, BoxSpacing } from '../editor-ui/inspector/BoxModelWidget.tsx';
import { TokenPicker } from '../editor-ui/inspector/TokenPicker.tsx';
import { Input } from '../editor-ui/primitives/Input.tsx';
import { NumberInput } from '../editor-ui/primitives/NumberInput.tsx';
import { Select } from '../editor-ui/primitives/Select.tsx';
import { Switch } from '../editor-ui/primitives/Switch.tsx';
import { DeviceType } from '../editor-ui/inspector/DeviceValueBadge.tsx';
import { Lock, Sliders, Type, Palette, Shield } from 'lucide-react';

export interface PageInspectorProps {
  document: PageDocument;
  selectedId: string | null;
  onUpdateProps: (nodeId: string, props: Record<string, any>) => void;
  device: DeviceType;
  className?: string;
}

export const PageInspector: React.FC<PageInspectorProps> = ({
  document,
  selectedId,
  onUpdateProps,
  device,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'advanced'>('content');
  const [searchQuery, setSearchQuery] = useState('');

  if (!selectedId || selectedId === 'root' || !document.nodes[selectedId]) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-[var(--ne-text-muted)] h-full">
        <Sliders className="w-8 h-8 text-[var(--ne-border-strong)] mb-2" />
        <span className="font-medium text-[var(--ne-text)]">No Block Selected</span>
        <p className="text-[11px] mt-1 max-w-[200px]">
          Click any element on the page canvas or select from the layers tree to inspect properties.
        </p>
      </div>
    );
  }

  const node = document.nodes[selectedId];
  const definition = BLOCK_REGISTRY[node.type];

  if (!definition) {
    return <div className="p-4 text-xs">Unknown block definition: {node.type}</div>;
  }

  const isLocked = !!node.meta?.locked;

  const handlePropChange = (fieldName: string, value: any) => {
    onUpdateProps(selectedId, {
      ...node.props,
      [fieldName]: value,
    });
  };

  const handleResetField = (fieldName: string) => {
    const defaultVal = definition.defaultProps[fieldName];
    if (defaultVal !== undefined) {
      handlePropChange(fieldName, defaultVal);
    }
  };

  // Filter fields by tab and search
  const visibleFields = definition.fields.filter((field) => {
    // If searching, search all tabs
    if (searchQuery) {
      return (
        field.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        field.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    const targetCategory = field.category || 'content';
    return targetCategory === activeTab;
  });

  const renderFieldControl = (field: BlockField) => {
    const currentValue = node.props[field.name] !== undefined ? node.props[field.name] : field.defaultValue;
    const isChanged = JSON.stringify(currentValue) !== JSON.stringify(definition.defaultProps[field.name]);
    const isInherited = device !== 'desktop' && field.supportsDeviceOverride;

    switch (field.type) {
      case 'text':
        return (
          <FieldRow
            key={field.name}
            label={field.label}
            changed={isChanged}
            onReset={() => handleResetField(field.name)}
            device={field.supportsDeviceOverride ? device : undefined}
            isInherited={isInherited}
          >
            <Input
              value={currentValue}
              onChange={(e) => handlePropChange(field.name, e.target.value)}
              disabled={isLocked}
              size="sm"
            />
          </FieldRow>
        );

      case 'textarea':
        return (
          <FieldRow
            key={field.name}
            label={field.label}
            changed={isChanged}
            onReset={() => handleResetField(field.name)}
            layout="vertical"
          >
            <textarea
              value={currentValue}
              onChange={(e) => handlePropChange(field.name, e.target.value)}
              disabled={isLocked}
              rows={3}
              className="w-full text-xs p-1.5 bg-[var(--ne-surface)] border border-[var(--ne-border)] rounded-[var(--ne-radius-md)] text-[var(--ne-text)] focus:outline-none focus:border-[var(--ne-primary)] font-sans resize-none disabled:opacity-50"
            />
          </FieldRow>
        );

      case 'number':
        return (
          <FieldRow
            key={field.name}
            label={field.label}
            changed={isChanged}
            onReset={() => handleResetField(field.name)}
            device={field.supportsDeviceOverride ? device : undefined}
            isInherited={isInherited}
          >
            <NumberInput
              value={Number(currentValue) || 0}
              onChange={(v) => handlePropChange(field.name, v)}
              min={field.min}
              max={field.max}
              step={field.step || 1}
              unit={field.unit}
              disabled={isLocked}
              size="sm"
            />
          </FieldRow>
        );

      case 'select':
        return (
          <FieldRow
            key={field.name}
            label={field.label}
            changed={isChanged}
            onReset={() => handleResetField(field.name)}
          >
            <Select
              value={currentValue}
              options={field.options || []}
              onChange={(e) => handlePropChange(field.name, e.target.value)}
              disabled={isLocked}
              size="sm"
            />
          </FieldRow>
        );

      case 'switch':
        return (
          <FieldRow
            key={field.name}
            label={field.label}
            changed={isChanged}
            onReset={() => handleResetField(field.name)}
          >
            <div className="flex justify-end">
              <Switch
                checked={!!currentValue}
                onChange={(checked) => handlePropChange(field.name, checked)}
                disabled={isLocked}
              />
            </div>
          </FieldRow>
        );

      case 'color':
        return (
          <FieldRow
            key={field.name}
            label={field.label}
            changed={isChanged}
            onReset={() => handleResetField(field.name)}
          >
            <TokenPicker
              value={currentValue}
              onChange={(val) => handlePropChange(field.name, val)}
              type="color"
            />
          </FieldRow>
        );

      case 'boxModel': {
        const spacing = currentValue || {
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
          padding: { top: 16, right: 16, bottom: 16, left: 16 },
        };
        return (
          <div key={field.name} className="py-2 space-y-1">
            <div className="flex items-center justify-between text-xs font-medium text-[var(--ne-text)] mb-1">
              <span>{field.label}</span>
              {isChanged && (
                <button
                  type="button"
                  onClick={() => handleResetField(field.name)}
                  className="text-[10px] text-[var(--ne-primary)] hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
            <BoxModelWidget
              margin={spacing.margin}
              padding={spacing.padding}
              onMarginChange={(m) => handlePropChange(field.name, { ...spacing, margin: m })}
              onPaddingChange={(p) => handlePropChange(field.name, { ...spacing, padding: p })}
            />
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[var(--ne-surface)] ${className}`}>
      {/* Block Meta Header */}
      <div className="px-3 py-2 border-b border-[var(--ne-border)] flex items-center justify-between gap-2 bg-[var(--ne-surface-subtle)]">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[var(--ne-primary)] shrink-0" />
          <span className="text-xs font-semibold text-[var(--ne-text)] truncate">
            {node.meta?.label || definition.label}
          </span>
          <span className="text-[10px] font-mono text-[var(--ne-text-muted)] uppercase">
            ({node.type})
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
          { id: 'content', label: 'Content', icon: <Type className="w-3 h-3" /> },
          { id: 'style', label: 'Style', icon: <Palette className="w-3 h-3" /> },
          { id: 'advanced', label: 'Advanced', icon: <Shield className="w-3 h-3" /> },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as any)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Fields Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 ne-scrollbar">
        {activeTab === 'advanced' && !searchQuery ? (
          <div className="space-y-3">
            <FieldGroup title="Identification">
              <FieldRow label="Node ID">
                <span className="font-mono text-xs text-[var(--ne-text-muted)] select-all">
                  {node.id}
                </span>
              </FieldRow>
              <FieldRow label="Custom Class">
                <Input size="sm" placeholder="e.g. hero-highlight" />
              </FieldRow>
            </FieldGroup>

            <FieldGroup title="Responsive Visibility">
              <FieldRow label="Hide on Mobile">
                <Switch checked={false} onChange={() => {}} />
              </FieldRow>
              <FieldRow label="Hide on Tablet">
                <Switch checked={false} onChange={() => {}} />
              </FieldRow>
            </FieldGroup>
          </div>
        ) : visibleFields.length === 0 ? (
          <div className="text-center py-6 text-xs text-[var(--ne-text-muted)]">
            No properties found in this tab.
          </div>
        ) : (
          <div className="divide-y divide-[var(--ne-border)]">
            {visibleFields.map(renderFieldControl)}
          </div>
        )}
      </div>
    </div>
  );
};
