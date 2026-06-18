import { geoAlbers } from 'd3-geo';
import type { GeoProjection } from 'd3-geo';
import type { FeatureMap } from './types';

/**
 * 中国地图的标准二维平面投影(Albers 等积圆锥,中国参数)。配合 ensureWinding 修正后的
 * 几何,渲染出来就是课本里那种正常的中国地图形状(北朝上、东西不镜像)。
 */
export function buildProjection(geo: FeatureMap, width: number, height: number): GeoProjection {
  return geoAlbers()
    .rotate([-105, 0])
    .center([0, 36])
    .parallels([25, 47])
    .fitSize([width, height], geo as never);
}
