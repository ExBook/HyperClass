import type { ToolManifest } from '../../../core/types';

export const manifest: ToolManifest = {
  id: 'geography.latlon-grid',
  title: '经纬网定位',
  subject: 'geography',
  stage: ['junior'],
  tags: ['地理', '经纬度', '经纬网', '定位', '读图'],
  description: '经纬度读图与定位:演示拖点读数 / 练习按坐标定位',
  icon: 'grid-dots',
  accent: '#1D9E75',
  offlineReady: true,
  entry: () => import('./LatLonGrid').then((m) => ({ default: m.LatLonGrid })),
};
