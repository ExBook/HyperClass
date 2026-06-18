import type { ComponentType } from 'react';

export type SubjectId =
  | 'common' | 'chinese' | 'math' | 'english' | 'physics' | 'chemistry'
  | 'biology' | 'history' | 'geography' | 'moral' | 'music' | 'art' | 'pe' | 'it';

export type Stage = 'primary' | 'junior' | 'senior';

/** 工具元数据。新增工具 = 新增一个 manifest 并在 registry 注册。 */
export type ToolManifest = {
  id: string;                 // "common.random-picker"
  title: string;
  subject: SubjectId;
  stage: Stage[];
  tags: string[];
  description: string;
  icon: string;               // tabler 图标名(不含 ti- 前缀)
  accent: string;             // 工具主色(CSS 变量或 hex)
  offlineReady: boolean;
  entry: () => Promise<{ default: ComponentType }>;  // 懒加载工具组件
};
