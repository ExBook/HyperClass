import type { ToolManifest } from '../../../core/types';

export const manifest: ToolManifest = {
  id: 'geography.climate-graph',
  title: '气候直方图判读',
  subject: 'geography',
  stage: ['junior', 'senior'],
  tags: ['气候', '气温曲线', '降水量', '判读', '以温定带', '以水定型'],
  description: '气温曲线 + 降水柱状图,判断气候类型',
  icon: 'cloud-rain',
  accent: '#378ADD',
  offlineReady: true,
  entry: () => import('./ClimateGraph').then((m) => ({ default: m.ClimateGraph })),
};
