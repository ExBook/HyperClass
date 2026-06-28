import type { ToolManifest } from '../../../core/types';

export const manifest: ToolManifest = {
  id: 'common.spinner',
  title: '幸运转盘',
  subject: 'common',
  stage: ['primary', 'junior', 'senior'],
  tags: ['转盘', '随机', '抽取', '点名', '抽奖'],
  description: '旋转抽取,减速滴答 + 悬念揭晓',
  icon: 'chart-pie',
  accent: '#E1A100',
  offlineReady: true,
  entry: () => import('./Spinner').then((m) => ({ default: m.Spinner })),
};
