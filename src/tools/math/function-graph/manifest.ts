import type { ToolManifest } from '../../../core/types';

export const manifest: ToolManifest = {
  id: 'math.function-graph',
  title: '函数图像',
  subject: 'math',
  stage: ['junior'],
  tags: ['数学', '函数', '一次函数', '二次函数', '图像'],
  description: '拖滑杆实时画一次 / 二次函数图像',
  icon: 'math-function',
  accent: '#378ADD',
  offlineReady: true,
  entry: () => import('./FunctionGraph').then((m) => ({ default: m.FunctionGraph })),
};
