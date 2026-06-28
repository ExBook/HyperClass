import type { ToolManifest } from '../../../core/types';

export const manifest: ToolManifest = {
  id: 'geography.china-regions',
  title: '中国四大地理区域',
  subject: 'geography',
  stage: ['junior'],
  tags: ['四大地理区域', '北方', '南方', '西北', '青藏', '秦岭淮河'],
  description: '北方/南方/西北/青藏 + 三条分界线',
  icon: 'map-2',
  accent: '#15A98B',
  offlineReady: true,
  entry: () => import('./ChinaRegions').then((m) => ({ default: m.ChinaRegions })),
};
