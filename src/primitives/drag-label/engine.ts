import { geoContains } from 'd3-geo';
import type { FeatureMap, HitResult } from './types';

/**
 * 给定经纬度,返回所在 feature 的 id。传入的 geo 必须已用 ensureWinding 修正过卷绕。
 */
export function hitTest(map: FeatureMap, lonLat: [number, number]): HitResult {
  for (const f of map.features) {
    if (geoContains(f, lonLat)) return { matched: true, featureId: f.properties.id };
  }
  return { matched: false, featureId: null };
}
