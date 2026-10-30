import React from 'react';

export interface PageNode {
  id: string;
  type: string;
  props: Record<string, any>;
  slots: {
    children?: string[];
    [slotName: string]: string[] | undefined;
  };
  meta?: {
    label?: string;
    locked?: boolean;
    hidden?: boolean;
    deviceProps?: {
      tablet?: Record<string, any>;
      mobile?: Record<string, any>;
    };
  };
}

export interface PageDocument {
  version: number;
  root: string;
  nodes: Record<string, PageNode>;
}

export interface BlockField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'switch' | 'color' | 'spacing' | 'boxModel';
  defaultValue: any;
  options?: { label: string; value: string }[];
  category?: 'content' | 'style' | 'advanced';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  supportsDeviceOverride?: boolean;
}

export interface BlockDefinition {
  type: string;
  label: string;
  description: string;
  category: 'Layout' | 'Basic' | 'Media' | 'Interactive';
  iconName: string;
  fields: BlockField[];
  defaultProps: Record<string, any>;
  defaultSlots?: { [slotName: string]: string[] };
  allowedChildren?: string[]; // types allowed inside its slots
  canBeRoot?: boolean;
}
