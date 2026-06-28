import type { ToolManifest } from '../../../core/types';

export const manifest: ToolManifest = {
  id: 'common.noise-meter',
  title: '噪音检测仪',
  subject: 'common',
  stage: ['primary', 'junior', 'senior'],
  tags: ['噪音', '音量', '分贝', '麦克风', '课堂管理', '控场'],
  description: '麦克风实时音量,仪表 + 超阈值提醒',
  icon: 'microphone',
  accent: '#FF6B6B',
  offlineReady: true,
  entry: () => import('./NoiseMeter').then((m) => ({ default: m.NoiseMeter })),
};
