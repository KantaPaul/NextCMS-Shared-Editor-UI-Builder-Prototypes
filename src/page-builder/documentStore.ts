import { PageDocument, PageNode } from './types.ts';
import { BLOCK_REGISTRY } from './registry.ts';
import { LayerNode } from '../editor-ui/tree/LayersTree.tsx';

export const INITIAL_PAGE_DOCUMENT: PageDocument = {
  version: 1,
  root: 'root',
  nodes: {
    root: {
      id: 'root',
      type: 'root',
      props: {},
      slots: {
        children: ['hero_1', 'section_features', 'section_cta'],
      },
    },
    hero_1: {
      id: 'hero_1',
      type: 'hero',
      props: {
        headline: 'Unified Editor Architecture',
        subheadline: 'A production-grade design system built once, powering modular page editors and dynamic analytics dashboards with zero cross-leakage.',
        badgeText: 'NextCMS System 2.0',
        ctaText: 'Explore Components',
        align: 'center',
        bgTone: 'subtle',
        paddingY: 48,
      },
      slots: {},
      meta: { label: 'Hero Banner' },
    },
    section_features: {
      id: 'section_features',
      type: 'section',
      props: {
        title: 'Core Architecture',
        maxWidth: '1200px',
        paddingY: 36,
        background: 'transparent',
        spacing: {
          margin: { top: 0, right: 0, bottom: 16, left: 0 },
          padding: { top: 24, right: 24, bottom: 24, left: 24 },
        },
      },
      slots: {
        children: ['features_heading', 'features_cols'],
      },
      meta: { label: 'Features Section' },
    },
    features_heading: {
      id: 'features_heading',
      type: 'heading',
      props: {
        text: 'Engineered for Performance & Scalability',
        level: 'h2',
        size: 26,
        color: '#0F172A',
      },
      slots: {},
      meta: { label: 'Features Title' },
    },
    features_cols: {
      id: 'features_cols',
      type: 'columns',
      props: {
        count: '3',
        gap: 20,
      },
      slots: {
        col_0: ['col1_h', 'col1_p', 'col1_btn'],
        col_1: ['col2_h', 'col2_p', 'col2_btn'],
        col_2: ['col3_h', 'col3_p', 'col3_btn'],
      },
      meta: { label: '3-Column Grid' },
    },
    col1_h: {
      id: 'col1_h',
      type: 'heading',
      props: { text: '01. Zero-Pill Restraint', level: 'h4', size: 16, color: '#0F172A' },
      slots: {},
      meta: { label: 'Col 1 Heading' },
    },
    col1_p: {
      id: 'col1_p',
      type: 'paragraph',
      props: {
        text: 'Quiet metadata rendering with typographic dot separators. Eliminates noisy badge sandwiches for crisp scannability.',
        size: 13,
        muted: true,
      },
      slots: {},
      meta: { label: 'Col 1 Copy' },
    },
    col1_btn: {
      id: 'col1_btn',
      type: 'button',
      props: { label: 'Inspect Specs', variant: 'secondary', size: 'sm', fullWidth: false },
      slots: {},
      meta: { label: 'Col 1 Action' },
    },
    col2_h: {
      id: 'col2_h',
      type: 'heading',
      props: { text: '02. Single-Elevation Depth', level: 'h4', size: 16, color: '#0F172A' },
      slots: {},
      meta: { label: 'Col 2 Heading' },
    },
    col2_p: {
      id: 'col2_p',
      type: 'paragraph',
      props: {
        text: 'Subtle 1px border lines replace stacked drop shadows. Overlays render outside document markup for zero layout shift.',
        size: 13,
        muted: true,
      },
      slots: {},
      meta: { label: 'Col 2 Copy' },
    },
    col2_btn: {
      id: 'col2_btn',
      type: 'button',
      props: { label: 'View Tokens', variant: 'secondary', size: 'sm', fullWidth: false },
      slots: {},
      meta: { label: 'Col 2 Action' },
    },
    col3_h: {
      id: 'col3_h',
      type: 'heading',
      props: { text: '03. Full Keyboard Parity', level: 'h4', size: 16, color: '#0F172A' },
      slots: {},
      meta: { label: 'Col 3 Heading' },
    },
    col3_p: {
      id: 'col3_p',
      type: 'paragraph',
      props: {
        text: 'Every drag interaction has a keyboard equivalent. Press Enter for step-wise movement and announce changes via live regions.',
        size: 13,
        muted: true,
      },
      slots: {},
      meta: { label: 'Col 3 Copy' },
    },
    col3_btn: {
      id: 'col3_btn',
      type: 'button',
      props: { label: 'Test Shortcuts', variant: 'secondary', size: 'sm', fullWidth: false },
      slots: {},
      meta: { label: 'Col 3 Action' },
    },
    section_cta: {
      id: 'section_cta',
      type: 'section',
      props: {
        title: 'Call to Action',
        maxWidth: '900px',
        paddingY: 32,
        background: 'transparent',
        spacing: {
          margin: { top: 16, right: 0, bottom: 24, left: 0 },
          padding: { top: 28, right: 28, bottom: 28, left: 28 },
        },
      },
      slots: {
        children: ['cta_title', 'cta_desc', 'cta_btn'],
      },
      meta: { label: 'Callout Footer' },
    },
    cta_title: {
      id: 'cta_title',
      type: 'heading',
      props: { text: 'Ready to standardize your editor experience?', level: 'h3', size: 20, color: '#0F172A' },
      slots: {},
      meta: { label: 'CTA Heading' },
    },
    cta_desc: {
      id: 'cta_desc',
      type: 'paragraph',
      props: { text: 'Drop @nextcms/editor-ui into any React or Next.js app without CSS framework dependencies.', size: 13, muted: true },
      slots: {},
      meta: { label: 'CTA Body' },
    },
    cta_btn: {
      id: 'cta_btn',
      type: 'button',
      props: { label: 'Deploy Package', variant: 'primary', size: 'md', fullWidth: false },
      slots: {},
      meta: { label: 'CTA Button' },
    },
  },
};

export function convertDocToLayersTree(doc: PageDocument): LayerNode[] {
  const visited = new Set<string>();

  function buildNode(id: string): LayerNode | null {
    if (visited.has(id)) return null;
    visited.add(id);

    const node = doc.nodes[id];
    if (!node) return null;

    const childIds: string[] = [];
    Object.values(node.slots).forEach((arr) => {
      if (Array.isArray(arr)) {
        childIds.push(...arr);
      }
    });

    const children: LayerNode[] = [];
    childIds.forEach((cId) => {
      const child = buildNode(cId);
      if (child) children.push(child);
    });

    const reg = BLOCK_REGISTRY[node.type];
    const name = node.meta?.label || reg?.label || node.type;

    return {
      id: node.id,
      name,
      type: node.type,
      locked: node.meta?.locked,
      hidden: node.meta?.hidden,
      children: children.length > 0 ? children : undefined,
    };
  }

  const rootNode = buildNode(doc.root);
  return rootNode && rootNode.children ? rootNode.children : [];
}

export function findNodeParents(doc: PageDocument, targetId: string): { id: string; label: string }[] {
  const trail: { id: string; label: string }[] = [];

  function search(currentId: string, path: { id: string; label: string }[]): boolean {
    const node = doc.nodes[currentId];
    if (!node) return false;

    const currentPath = [
      ...path,
      { id: currentId, label: node.meta?.label || BLOCK_REGISTRY[node.type]?.label || currentId },
    ];

    if (currentId === targetId) {
      trail.push(...currentPath);
      return true;
    }

    const childIds: string[] = [];
    Object.values(node.slots).forEach((arr) => {
      if (Array.isArray(arr)) childIds.push(...arr);
    });

    for (const cId of childIds) {
      if (search(cId, currentPath)) return true;
    }
    return false;
  }

  search(doc.root, []);
  return trail;
}
