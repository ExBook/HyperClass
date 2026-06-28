import type { ToolManifest } from '../../../core/types';

export const manifest: ToolManifest = {
  id: 'common.dice',
  title: '骰子',
  subject: 'common',
  stage: ['primary', 'junior', 'senior'],
  tags: ['骰子', '随机', '游戏', '概率', '数学'],
  description: '1–6 颗骰子,翻滚动画 + 点数合计',
  icon: 'dice',
  accent: '#378ADD',
  offlineReady: true,
  entry: () => import('./Dice').then((m) => ({ default: m.Dice })),
};
