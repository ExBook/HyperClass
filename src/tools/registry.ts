import type { ToolManifest } from '../core/types';
import { manifest as randomPicker } from './common/random-picker/manifest';
import { manifest as timer } from './common/timer/manifest';

/** 工具注册中心。新增工具 = import 它的 manifest 并加进这个数组。 */
export const tools: ToolManifest[] = [
  randomPicker,
  timer,
];

export const getTool = (id: string): ToolManifest | undefined =>
  tools.find((t) => t.id === id);

export const toolsBySubject = (subjectId: string): ToolManifest[] =>
  tools.filter((t) => t.subject === subjectId);
