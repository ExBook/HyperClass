import type { ToolManifest } from '../../../core/types';

export const manifest: ToolManifest = {
  id: 'geography.contour-map',
  title: '等高线地形图',
  subject: 'geography',
  stage: ['junior'],
  tags: ['等高线', '地形图', '山峰', '山脊', '山谷', '鞍部', '陡崖'],
  description: '识别山峰/山脊/山谷/鞍部/陡崖',
  icon: 'map-2',
  accent: '#BA7517',
  offlineReady: true,
  entry: () => import('./ContourMap').then((m) => ({ default: m.ContourMap })),
};
