import type { ToolManifest } from '../../../core/types';

export const manifest: ToolManifest = {
  id: 'geography.china-provinces',
  title: '中国省级行政区',
  subject: 'geography',
  stage: ['junior'],
  tags: ['地理', '中国', '行政区', '拖拽', '填图'],
  description: '把省份拖到地图正确位置;演示 / 练习',
  icon: 'map-2',
  accent: '#1D9E75',
  offlineReady: true,
  entry: () => import('./ChinaProvinces').then((m) => ({ default: m.ChinaProvinces })),
};
