import type { ToolManifest } from '../../../core/types';

export const manifest: ToolManifest = {
  id: 'geography.china-climate',
  title: '中国气候类型',
  subject: 'geography',
  stage: ['junior'],
  tags: ['地理', '中国', '气候', '拖拽', '填图'],
  description: '把气候类型拖到对应区域;演示 / 练习',
  icon: 'cloud-rain',
  accent: '#E1A100',
  offlineReady: true,
  entry: () => import('./ChinaClimate').then((m) => ({ default: m.ChinaClimate })),
};
