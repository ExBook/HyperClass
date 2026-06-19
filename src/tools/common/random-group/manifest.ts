import type { ToolManifest } from '../../../core/types';

export const manifest: ToolManifest = {
  id: 'common.random-group',
  title: '随机分组',
  subject: 'common',
  stage: ['primary', 'junior', 'senior'],
  tags: ['分组', '随机', '课堂管理', '小组'],
  description: '把学生随机分成若干组,洗牌动画',
  icon: 'users-group',
  accent: '#7F77DD',
  offlineReady: true,
  entry: () => import('./RandomGroup').then((m) => ({ default: m.RandomGroup })),
};
