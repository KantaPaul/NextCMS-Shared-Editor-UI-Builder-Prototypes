import { DeviceType } from '../editor-ui/inspector/DeviceValueBadge.tsx';

export interface WidgetLayout {
  x: number; // 0 to 11 on desktop, 0 to 5 on tablet, 0 on mobile
  y: number; // row index (0, 1, 2...)
  w: number; // span columns (1 to 12)
  h: number; // span row height units (e.g. 1 = 140px, 2 = 280px)
}

export interface WidgetDataBinding {
  source: string; // 'orders' | 'revenue' | 'customers' | 'inventory'
  measure: string; // 'sum' | 'count' | 'average' | 'unique'
  dimension: string; // 'month' | 'category' | 'status' | 'region'
  filters: string[];
  dateRange: 'today' | '7d' | '30d' | 'quarter' | 'custom';
}

export interface DashboardWidget {
  id: string;
  type: 'kpi' | 'lineChart' | 'barChart' | 'table' | 'text';
  title: string;
  subtitle?: string;
  layout: {
    desktop: WidgetLayout;
    tablet: WidgetLayout;
    mobile: WidgetLayout;
  };
  props: Record<string, any>;
  dataBinding: WidgetDataBinding;
  meta?: {
    locked?: boolean;
    hidden?: boolean;
    colorTheme?: string;
  };
}

export interface DashboardDocument {
  version: number;
  title: string;
  widgets: DashboardWidget[];
  datePreset: 'today' | '7d' | '30d' | 'quarter';
}
