import type { ToolManifest } from '../../../core/types';

export const manifest: ToolManifest = {
  id: 'common.timer',
  title: '计时器',
  subject: 'common',
  stage: ['primary', 'junior', 'senior'],
  tags: ['计时', '倒计时', '正计时', '课堂管理'],
  description: '倒计时 / 正计时,大屏圆环 + 响铃',
  icon: 'clock',
  accent: '#15A98B',
  offlineReady: true,
  entry: () => import('./Timer').then((m) => ({ default: m.Timer })),
};
