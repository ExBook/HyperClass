import type { ToolManifest } from '../../../core/types';

export const manifest: ToolManifest = {
  id: 'common.score-board',
  title: '小组计分板',
  subject: 'common',
  stage: ['primary', 'junior', 'senior'],
  tags: ['计分', '小组', '课堂管理', '竞赛'],
  description: '小组加减分,大屏计分,撤销/清零',
  icon: 'trophy',
  accent: '#E1A100',
  offlineReady: true,
  entry: () => import('./ScoreBoard').then((m) => ({ default: m.ScoreBoard })),
};
