import type { ToolManifest } from '../core/types';
import { manifest as randomPicker } from './common/random-picker/manifest';
import { manifest as randomGroup } from './common/random-group/manifest';
import { manifest as scoreBoard } from './common/score-board/manifest';
import { manifest as drawBox } from './common/draw-box/manifest';
import { manifest as timer } from './common/timer/manifest';
import { manifest as dice } from './common/dice/manifest';
import { manifest as spinner } from './common/spinner/manifest';
import { manifest as noiseMeter } from './common/noise-meter/manifest';
import { manifest as chinaProvinces } from './geography/china-provinces/manifest';
import { manifest as latlonGrid } from './geography/latlon-grid/manifest';
import { manifest as chinaClimate } from './geography/china-climate/manifest';
import { manifest as climateGraph } from './geography/climate-graph/manifest';
import { manifest as chinaRegions } from './geography/china-regions/manifest';
import { manifest as contourMap } from './geography/contour-map/manifest';
import { manifest as functionGraph } from './math/function-graph/manifest';

/** 工具注册中心。新增工具 = import 它的 manifest 并加进这个数组。 */
export const tools: ToolManifest[] = [
  randomPicker,
  randomGroup,
  scoreBoard,
  drawBox,
  timer,
  spinner,
  dice,
  noiseMeter,
  chinaProvinces,
  latlonGrid,
  chinaClimate,
  climateGraph,
  chinaRegions,
  contourMap,
  functionGraph,
];

export const getTool = (id: string): ToolManifest | undefined =>
  tools.find((t) => t.id === id);

export const toolsBySubject = (subjectId: string): ToolManifest[] =>
  tools.filter((t) => t.subject === subjectId);
