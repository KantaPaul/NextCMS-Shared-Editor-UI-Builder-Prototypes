import { DashboardWidget, DashboardDocument } from './types.ts';
import { LayerNode } from '../editor-ui/tree/LayersTree.tsx';

export interface WidgetMetaDef {
  type: string;
  label: string;
  description: string;
  iconName: string;
  category: 'Metrics' | 'Charts' | 'Data Grids' | 'Content';
  defaultW: number;
  defaultH: number;
}

export const WIDGET_REGISTRY: Record<string, WidgetMetaDef> = {
  kpi: {
    type: 'kpi',
    label: 'KPI Metric Card',
    description: 'Key performance indicator with primary value, change versus previous period, and trend sparkline',
    iconName: 'TrendingUp',
    category: 'Metrics',
    defaultW: 3,
    defaultH: 1,
  },
  lineChart: {
    type: 'lineChart',
    label: 'Trend Line Chart',
    description: 'Multi-series time-interval chart with colorblind-safe palette, hover tooltips, and table view fallback',
    iconName: 'LineChart',
    category: 'Charts',
    defaultW: 8,
    defaultH: 2,
  },
  barChart: {
    type: 'barChart',
    label: 'Category Bar Chart',
    description: 'Horizontal or vertical categorical breakdown with comparative benchmarks',
    iconName: 'BarChart3',
    category: 'Charts',
    defaultW: 4,
    defaultH: 2,
  },
  table: {
    type: 'table',
    label: 'Data Table',
    description: 'Tabular grid with client-side sort, column filters, and pagination using tabular figures',
    iconName: 'Table',
    category: 'Data Grids',
    defaultW: 12,
    defaultH: 3,
  },
  text: {
    type: 'text',
    label: 'Annotation & Notes',
    description: 'Markdown note or contextual analytical summary block for the team',
    iconName: 'FileText',
    category: 'Content',
    defaultW: 4,
    defaultH: 1,
  },
};

// Rich mock data for dashboard builder
export const MOCK_ORDERS = [
  { id: 'ORD-9821', customer: 'Acme Robotics Corp', date: '2026-10-28', amount: 1420.00, status: 'Completed', region: 'NA' },
  { id: 'ORD-9820', customer: 'Helix BioSystems', date: '2026-10-28', amount: 890.50, status: 'Completed', region: 'EU' },
  { id: 'ORD-9819', customer: 'Vanguard Aerospace', date: '2026-10-27', amount: 3200.00, status: 'Processing', region: 'NA' },
  { id: 'ORD-9818', customer: 'Nordic Clean Energy', date: '2026-10-27', amount: 450.00, status: 'Completed', region: 'EU' },
  { id: 'ORD-9817', customer: 'Solaria Photonics', date: '2026-10-26', amount: 2150.00, status: 'Completed', region: 'APAC' },
  { id: 'ORD-9816', customer: 'Zenith Logistics', date: '2026-10-26', amount: 640.00, status: 'Shipped', region: 'NA' },
  { id: 'ORD-9815', customer: 'Aura Health Technologies', date: '2026-10-25', amount: 1120.00, status: 'Completed', region: 'APAC' },
  { id: 'ORD-9814', customer: 'Kestrel Marine Systems', date: '2026-10-25', amount: 4890.00, status: 'Completed', region: 'EU' },
  { id: 'ORD-9813', customer: 'Pinnacle Data Labs', date: '2026-10-24', amount: 780.00, status: 'Refunded', region: 'NA' },
  { id: 'ORD-9812', customer: 'Cortex Microelectronics', date: '2026-10-24', amount: 1950.00, status: 'Completed', region: 'APAC' },
];

export const MOCK_MONTHLY_REVENUE = [
  { month: 'May', actual: 82000, target: 78000 },
  { month: 'Jun', actual: 89000, target: 82000 },
  { month: 'Jul', actual: 94000, target: 88000 },
  { month: 'Aug', actual: 104000, target: 95000 },
  { month: 'Sep', actual: 116000, target: 105000 },
  { month: 'Oct', actual: 128450, target: 115000 },
];

export const MOCK_CATEGORY_BREAKDOWN = [
  { category: 'Enterprise Subscriptions', value: 58400, pct: 45 },
  { category: 'Professional Services', value: 34200, pct: 27 },
  { category: 'Hardware Units', value: 21850, pct: 17 },
  { category: 'API Overages', value: 14000, pct: 11 },
];

export const INITIAL_DASHBOARD_DOCUMENT: DashboardDocument = {
  version: 1,
  title: 'Executive Revenue & Fulfillment Operations',
  datePreset: '30d',
  widgets: [
    {
      id: 'kpi_revenue',
      type: 'kpi',
      title: 'Net Revenue',
      subtitle: '30-day cumulative',
      layout: {
        desktop: { x: 0, y: 0, w: 3, h: 1 },
        tablet: { x: 0, y: 0, w: 3, h: 1 },
        mobile: { x: 0, y: 0, w: 1, h: 1 },
      },
      props: {
        value: '$128,450',
        changePct: '+14.2%',
        changeDirection: 'up',
        previousPeriodText: 'vs previous 30 days ($112,400)',
        sparkline: [40, 48, 45, 62, 58, 70, 75, 82, 90, 88, 96, 102],
      },
      dataBinding: {
        source: 'revenue',
        measure: 'sum',
        dimension: 'month',
        filters: ['status == completed'],
        dateRange: '30d',
      },
    },
    {
      id: 'kpi_orders',
      type: 'kpi',
      title: 'Processed Orders',
      subtitle: 'B2B & Enterprise',
      layout: {
        desktop: { x: 3, y: 0, w: 3, h: 1 },
        tablet: { x: 3, y: 0, w: 3, h: 1 },
        mobile: { x: 0, y: 1, w: 1, h: 1 },
      },
      props: {
        value: '1,482',
        changePct: '+8.4%',
        changeDirection: 'up',
        previousPeriodText: 'vs previous 30 days (1,367)',
        sparkline: [22, 28, 25, 34, 30, 42, 45, 48, 52, 50, 58, 64],
      },
      dataBinding: {
        source: 'orders',
        measure: 'count',
        dimension: 'date',
        filters: ['region == all'],
        dateRange: '30d',
      },
    },
    {
      id: 'kpi_aov',
      type: 'kpi',
      title: 'Average Order Value',
      subtitle: 'Per contract line',
      layout: {
        desktop: { x: 6, y: 0, w: 3, h: 1 },
        tablet: { x: 0, y: 1, w: 3, h: 1 },
        mobile: { x: 0, y: 2, w: 1, h: 1 },
      },
      props: {
        value: '$86.60',
        changePct: '-1.5%',
        changeDirection: 'down',
        previousPeriodText: 'vs previous 30 days ($87.90)',
        sparkline: [60, 58, 62, 59, 56, 54, 58, 55, 52, 54, 53, 51],
      },
      dataBinding: {
        source: 'orders',
        measure: 'average',
        dimension: 'customer_tier',
        filters: [],
        dateRange: '30d',
      },
    },
    {
      id: 'kpi_stock',
      type: 'kpi',
      title: 'Low-Stock SKU Alerts',
      subtitle: 'Below reorder point',
      layout: {
        desktop: { x: 9, y: 0, w: 3, h: 1 },
        tablet: { x: 3, y: 1, w: 3, h: 1 },
        mobile: { x: 0, y: 3, w: 1, h: 1 },
      },
      props: {
        value: '14 SKUs',
        changePct: 'Requires action',
        changeDirection: 'neutral',
        previousPeriodText: '3 pending replenishment shipments',
        sparkline: [12, 14, 11, 15, 14, 16, 15, 14, 18, 15, 14, 14],
      },
      dataBinding: {
        source: 'inventory',
        measure: 'count',
        dimension: 'reorder_point',
        filters: ['stock < 20'],
        dateRange: 'today',
      },
    },
    {
      id: 'chart_trend',
      type: 'lineChart',
      title: 'Monthly Revenue vs Budget Target',
      subtitle: 'Past 6 months performance with safe contrast curves',
      layout: {
        desktop: { x: 0, y: 1, w: 8, h: 2 },
        tablet: { x: 0, y: 2, w: 6, h: 2 },
        mobile: { x: 0, y: 4, w: 1, h: 2 },
      },
      props: {
        showLegend: true,
        showGrid: true,
        unit: '$',
      },
      dataBinding: {
        source: 'revenue',
        measure: 'sum',
        dimension: 'month',
        filters: [],
        dateRange: 'quarter',
      },
    },
    {
      id: 'chart_category',
      type: 'barChart',
      title: 'Revenue by Business Stream',
      subtitle: 'Relative contribution distribution',
      layout: {
        desktop: { x: 8, y: 1, w: 4, h: 2 },
        tablet: { x: 0, y: 4, w: 6, h: 2 },
        mobile: { x: 0, y: 6, w: 1, h: 2 },
      },
      props: {
        orientation: 'horizontal',
        showValues: true,
      },
      dataBinding: {
        source: 'revenue',
        measure: 'sum',
        dimension: 'category',
        filters: [],
        dateRange: '30d',
      },
    },
    {
      id: 'table_orders',
      type: 'table',
      title: 'Recent Verified Transactions',
      subtitle: 'Live order queue with status reconciliation and tabular numerals',
      layout: {
        desktop: { x: 0, y: 3, w: 12, h: 3 },
        tablet: { x: 0, y: 6, w: 6, h: 3 },
        mobile: { x: 0, y: 8, w: 1, h: 3 },
      },
      props: {
        pageSize: 5,
        searchable: true,
        exportable: true,
      },
      dataBinding: {
        source: 'orders',
        measure: 'count',
        dimension: 'status',
        filters: [],
        dateRange: '7d',
      },
    },
  ],
};

export function convertDashboardToLayersTree(doc: DashboardDocument): LayerNode[] {
  return doc.widgets.map((widget) => ({
    id: widget.id,
    name: widget.title,
    type: widget.type,
    locked: widget.meta?.locked,
    hidden: widget.meta?.hidden,
  }));
}
