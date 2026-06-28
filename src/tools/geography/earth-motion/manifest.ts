import type { ToolManifest } from '../../../core/types';

export const manifest: ToolManifest = {
  id: 'geography.earth-motion',
  title: '地球运动演示',
  subject: 'geography',
  stage: ['junior'],
  tags: ['地球运动', '公转', '自转', '昼夜', '四季', '太阳直射点', '二分二至'],
  description: '公转(四季/直射点)+ 自转(昼夜交替)',
  icon: 'world',
  accent: '#378ADD',
  offlineReady: true,
  entry: () => import('./EarthMotion').then((m) => ({ default: m.EarthMotion })),
};
