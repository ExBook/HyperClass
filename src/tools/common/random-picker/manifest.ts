import type { ToolManifest } from '../../../core/types';

export const manifest: ToolManifest = {
  id: 'common.random-picker',
  title: '随机点名',
  subject: 'common',
  stage: ['primary', 'junior', 'senior'],
  tags: ['点名', '随机', '课堂管理'],
  description: '从名单里随机抽取学生,不重复',
  icon: 'user-check',
  accent: '#FF6B6B',
  offlineReady: true,
  entry: () => import('./RandomPicker').then((m) => ({ default: m.RandomPicker })),
};
