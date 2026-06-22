// 中国主要气候类型(初中地理 5 类),按【实际气候带】划分(非省界)。
// 边界为简化近似:北回归线 ~23.5°N(热带/亚热带)、秦岭—淮河 ~34°N(亚热带/温带季风)、
// 大兴安岭—阴山一线(季风/大陆性)、青藏高原边缘(高原山地)。多边形会裁剪到中国轮廓。
export type Climate = { id: string; name: string; color: string; ring: [number, number][]; labelAt: [number, number] };

// 展示/出题顺序(教学顺序:由南到北、内陆、高原)
export const CLIMATES: Climate[] = [
  { id: 'tropical', name: '热带季风气候', color: '#E24B4A', labelAt: [110, 19.5], ring: [[96, 15], [123, 15], [123, 23.5], [108, 23.5], [100, 23.5], [97, 21]] },
  { id: 'subtropical', name: '亚热带季风气候', color: '#E1A100', labelAt: [113, 28], ring: [[100, 23.5], [124, 23.5], [124, 34], [112, 34], [104, 34], [103, 30], [101, 26]] },
  { id: 'temperate', name: '温带季风气候', color: '#15A98B', labelAt: [119, 41], ring: [[102, 34], [124, 34], [128, 43], [135, 50], [125, 54], [120, 49], [112, 43], [106, 40], [102, 37]] },
  { id: 'continental', name: '温带大陆性气候', color: '#BA7517', labelAt: [86, 42], ring: [[72, 37], [83, 38], [93, 38], [101, 38], [107, 39], [112, 43], [120, 49], [125, 54], [88, 55], [72, 50]] },
  { id: 'highland', name: '高原山地气候', color: '#7F77DD', labelAt: [88, 32], ring: [[72, 36], [80, 31], [88, 28], [95, 27], [101, 27], [104, 31], [106, 37], [103, 40], [93, 39], [83, 39], [74, 37]] },
];

// 命中优先级(高原、热带优先,以解决边界重叠);渲染由下到上(高原最上)
export const HIT_ORDER = ['highland', 'tropical', 'subtropical', 'temperate', 'continental'];
export const RENDER_ORDER = ['continental', 'temperate', 'subtropical', 'tropical', 'highland'];

export const byId = (id: string) => CLIMATES.find((c) => c.id === id);

function pointInRing(lon: number, lat: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (((yi > lat) !== (yj > lat)) && (lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

/** 经纬度落在哪个气候带;都不在则返回最近气候带质心对应的 id。 */
export function zoneAt(lon: number, lat: number): string {
  for (const id of HIT_ORDER) { const z = byId(id); if (z && pointInRing(lon, lat, z.ring)) return id; }
  let best = CLIMATES[0].id, bd = Infinity;
  for (const z of CLIMATES) {
    const cx = z.ring.reduce((s, p) => s + p[0], 0) / z.ring.length;
    const cy = z.ring.reduce((s, p) => s + p[1], 0) / z.ring.length;
    const d = (cx - lon) ** 2 + (cy - lat) ** 2;
    if (d < bd) { bd = d; best = z.id; }
  }
  return best;
}
