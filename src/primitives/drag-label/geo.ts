import { geoArea } from 'd3-geo';
import type { Position } from 'geojson';
import type { FeatureMap, FeatureOne } from './types';

/**
 * 修正卷绕方向。底图(如 DataV 中国数据)外环常是顺时针,违反 RFC 7946(应逆时针)。
 * d3-geo 用球面几何,会把顺时针多边形当成"整个球面减去该区域",导致渲染成铺满画布的
 * blob、命中检测也全错。这里检测 geoArea > 2π(超过半个球面)即判定被反转,翻转所有环。
 * 条件触发一次后 geoArea < 2π,幂等安全。
 */
function reverse(coords: Position[][]): Position[][] {
  return coords.map((ring) => [...ring].reverse());
}

function reverseFeature(f: FeatureOne): FeatureOne {
  const g = f.geometry;
  if (g.type === 'Polygon') return { ...f, geometry: { ...g, coordinates: reverse(g.coordinates) } };
  if (g.type === 'MultiPolygon') return { ...f, geometry: { ...g, coordinates: g.coordinates.map(reverse) } };
  return f;
}

export function ensureWinding(map: FeatureMap): FeatureMap {
  return {
    ...map,
    features: map.features.map((f) => (geoArea(f) > 2 * Math.PI ? reverseFeature(f) : f)),
  };
}
