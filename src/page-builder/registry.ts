import { BlockDefinition } from './types.ts';

export const BLOCK_REGISTRY: Record<string, BlockDefinition> = {
  hero: {
    type: 'hero',
    label: 'Hero Banner',
    description: 'Prominent header section with headline, description, and primary CTA',
    category: 'Layout',
    iconName: 'Sparkles',
    allowedChildren: ['heading', 'paragraph', 'button'],
    fields: [
      { name: 'headline', label: 'Headline', type: 'text', defaultValue: 'Build Faster with Shared Components', category: 'content' },
      { name: 'subheadline', label: 'Subheadline', type: 'textarea', defaultValue: 'A unified editor design system powering both page builders and responsive dashboards.', category: 'content' },
      { name: 'badgeText', label: 'Kicker Text', type: 'text', defaultValue: 'NextCMS System 2.0', category: 'content' },
      { name: 'ctaText', label: 'Button Label', type: 'text', defaultValue: 'Explore Documentation', category: 'content' },
      { name: 'align', label: 'Alignment', type: 'select', defaultValue: 'center', category: 'style', options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' }
      ]},
      { name: 'bgTone', label: 'Background', type: 'select', defaultValue: 'subtle', category: 'style', options: [
        { label: 'Subtle Slate', value: 'subtle' },
        { label: 'Clean White', value: 'white' },
        { label: 'Primary Tint', value: 'primary' }
      ]},
      { name: 'paddingY', label: 'Vertical Padding', type: 'number', defaultValue: 48, min: 16, max: 120, unit: 'px', category: 'style', supportsDeviceOverride: true },
    ],
    defaultProps: {
      headline: 'Build Faster with Shared Components',
      subheadline: 'A unified editor design system powering both page builders and responsive dashboards.',
      badgeText: 'NextCMS System 2.0',
      ctaText: 'Explore Documentation',
      align: 'center',
      bgTone: 'subtle',
      paddingY: 48,
    },
  },
  section: {
    type: 'section',
    label: 'Section Container',
    description: 'Outer layout container with customizable padding, background, and max-width',
    category: 'Layout',
    iconName: 'LayoutTemplate',
    allowedChildren: ['columns', 'heading', 'paragraph', 'button', 'image'],
    fields: [
      { name: 'title', label: 'Section Label', type: 'text', defaultValue: 'Features Section', category: 'content' },
      { name: 'maxWidth', label: 'Max Width', type: 'select', defaultValue: '1200px', category: 'style', options: [
        { label: 'Standard (1200px)', value: '1200px' },
        { label: 'Narrow (900px)', value: '900px' },
        { label: 'Full Width (100%)', value: '100%' }
      ]},
      { name: 'paddingY', label: 'Vertical Padding', type: 'number', defaultValue: 32, min: 0, max: 128, unit: 'px', category: 'style', supportsDeviceOverride: true },
      { name: 'background', label: 'Background Color', type: 'color', defaultValue: 'transparent', category: 'style' },
      { name: 'spacing', label: 'Margin & Padding', type: 'boxModel', defaultValue: { margin: { top: 0, right: 0, bottom: 16, left: 0 }, padding: { top: 24, right: 24, bottom: 24, left: 24 } }, category: 'style' },
    ],
    defaultProps: {
      title: 'Features Section',
      maxWidth: '1200px',
      paddingY: 32,
      background: 'transparent',
      spacing: { margin: { top: 0, right: 0, bottom: 16, left: 0 }, padding: { top: 24, right: 24, bottom: 24, left: 24 } },
    },
  },
  columns: {
    type: 'columns',
    label: 'Columns Grid',
    description: 'Multi-column layout with equal or custom slot divisions',
    category: 'Layout',
    iconName: 'Columns3',
    // Columns cannot be put inside columns!
    allowedChildren: ['heading', 'paragraph', 'button', 'image'],
    fields: [
      { name: 'count', label: 'Column Count', type: 'select', defaultValue: '3', category: 'style', options: [
        { label: '2 Columns', value: '2' },
        { label: '3 Columns', value: '3' },
        { label: '4 Columns', value: '4' }
      ]},
      { name: 'gap', label: 'Column Gap', type: 'number', defaultValue: 16, min: 0, max: 48, unit: 'px', category: 'style', supportsDeviceOverride: true },
    ],
    defaultProps: {
      count: '3',
      gap: 16,
    },
  },
  heading: {
    type: 'heading',
    label: 'Heading',
    description: 'Section headline or kicker with balanced line wrapping',
    category: 'Basic',
    iconName: 'Heading1',
    allowedChildren: [],
    fields: [
      { name: 'text', label: 'Heading Text', type: 'text', defaultValue: 'Production-Grade Architecture', category: 'content' },
      { name: 'level', label: 'HTML Tag', type: 'select', defaultValue: 'h2', category: 'content', options: [
        { label: 'H1 (Main Title)', value: 'h1' },
        { label: 'H2 (Section Heading)', value: 'h2' },
        { label: 'H3 (Subsection)', value: 'h3' },
        { label: 'H4 (Card Title)', value: 'h4' }
      ]},
      { name: 'size', label: 'Font Size', type: 'number', defaultValue: 24, min: 14, max: 64, unit: 'px', category: 'style', supportsDeviceOverride: true },
      { name: 'color', label: 'Text Color', type: 'color', defaultValue: '#0F172A', category: 'style' },
    ],
    defaultProps: {
      text: 'Production-Grade Architecture',
      level: 'h2',
      size: 24,
      color: '#0F172A',
    },
  },
  paragraph: {
    type: 'paragraph',
    label: 'Paragraph Text',
    description: 'Body copy with optimal measure and line height',
    category: 'Basic',
    iconName: 'Pilcrow',
    allowedChildren: [],
    fields: [
      { name: 'text', label: 'Text Content', type: 'textarea', defaultValue: 'Components share zero knowledge of host application details. Clean abstraction guarantees stability across releases.', category: 'content' },
      { name: 'size', label: 'Text Size', type: 'number', defaultValue: 14, min: 11, max: 20, unit: 'px', category: 'style', supportsDeviceOverride: true },
      { name: 'muted', label: 'Muted Tone', type: 'switch', defaultValue: true, category: 'style' },
    ],
    defaultProps: {
      text: 'Components share zero knowledge of host application details. Clean abstraction guarantees stability across releases.',
      size: 14,
      muted: true,
    },
  },
  button: {
    type: 'button',
    label: 'Action Button',
    description: 'Clickable call-to-action button element',
    category: 'Interactive',
    iconName: 'MousePointerClick',
    allowedChildren: [],
    fields: [
      { name: 'label', label: 'Button Label', type: 'text', defaultValue: 'Get Started', category: 'content' },
      { name: 'variant', label: 'Style Variant', type: 'select', defaultValue: 'primary', category: 'style', options: [
        { label: 'Primary Brand', value: 'primary' },
        { label: 'Secondary Surface', value: 'secondary' },
        { label: 'Ghost Outline', value: 'ghost' }
      ]},
      { name: 'size', label: 'Size', type: 'select', defaultValue: 'md', category: 'style', options: [
        { label: 'Small (24px)', value: 'sm' },
        { label: 'Medium (28px)', value: 'md' },
        { label: 'Large (32px)', value: 'lg' }
      ]},
      { name: 'fullWidth', label: 'Full Width', type: 'switch', defaultValue: false, category: 'style' },
    ],
    defaultProps: {
      label: 'Get Started',
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
  image: {
    type: 'image',
    label: 'Image Frame',
    description: 'Responsive media frame with aspect ratio and fallback container',
    category: 'Media',
    iconName: 'Image',
    allowedChildren: [],
    fields: [
      { name: 'alt', label: 'Alt Description', type: 'text', defaultValue: 'Interface architecture preview', category: 'content' },
      { name: 'aspectRatio', label: 'Aspect Ratio', type: 'select', defaultValue: '16/9', category: 'style', options: [
        { label: '16:9 Landscape', value: '16/9' },
        { label: '4:3 Card', value: '4/3' },
        { label: '1:1 Square', value: '1/1' },
        { label: '3:2 Photo', value: '3/2' }
      ]},
      { name: 'caption', label: 'Optional Caption', type: 'text', defaultValue: '', category: 'content' },
      { name: 'rounded', label: 'Border Radius', type: 'number', defaultValue: 8, min: 0, max: 24, unit: 'px', category: 'style' },
    ],
    defaultProps: {
      alt: 'Interface architecture preview',
      aspectRatio: '16/9',
      caption: '',
      rounded: 8,
    },
  },
};
