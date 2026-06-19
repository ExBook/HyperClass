import type { ToolManifest } from '../../../core/types';

export const manifest: ToolManifest = {
  id: 'common.draw-box',
  title: '抽题盒',
  subject: 'common',
  stage: ['primary', 'junior', 'senior'],
  tags: ['抽题', '随机', '提问', '复习'],
  description: '从题目 / 条目里随机翻一张,翻牌动画',
  icon: 'cards',
  accent: '#6AB04C',
  offlineReady: true,
  entry: () => import('./DrawBox').then((m) => ({ default: m.DrawBox })),
};
