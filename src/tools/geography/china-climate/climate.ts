// 中国主要气候类型(初中地理 5 类),按【实际气候带】划分(非省界)。
// 关键边界用多顶点折线描真实走向:
//   北回归线 ~23.5°N(热带/亚热带)、秦岭—淮河 ~33°N(亚热带/温带季风)、
//   大兴安岭—阴山—贺兰山—巴颜喀拉一线(季风/大陆性)、青藏高原边缘(高原山地)。
// 渲染采用画家算法:下层向上层底下大幅延伸,可见边界 = 上层的精确边界,既无缝隙也无错位。
// 所有多边形最终裁剪到中国轮廓。
export type Climate = { id: string; name: string; color: string; ring: [number, number][]; labelAt: [number, number] };

// 渲染由下到上(数组顺序即叠放顺序,后者盖前者):大陆性 → 温带季风 → 亚热带 → 热带 → 高原。
export const CLIMATES: Climate[] = [
  // 温带大陆性:覆盖西北内陆,作底层大块,东/南被其他带盖住,可见部分=新疆/内蒙古西/甘北/宁夏
  { id: 'continental', name: '温带大陆性气候', color: '#BA7517', labelAt: [85, 41],
    ring: [[70, 28], [126, 28], [126, 58], [70, 58]] },
  // 温带季风:精确【西界】= 季风分界(大兴安岭—阴山—贺兰山—巴颜喀拉),向北/东/南延伸到国界外
  { id: 'temperate', name: '温带季风气候', color: '#15A98B', labelAt: [120, 43],
    ring: [[100, 34], [102, 35.5], [104, 36.5], [106, 38], [108, 39], [110, 40], [112, 41], [115, 42], [118, 45], [120, 48], [122, 50], [124, 52], [135, 53], [135, 28], [103, 28], [100, 34]] },
  // 亚热带季风:精确【北界】= 秦岭—淮河、精确【西界】= 横断山/青藏东缘,向南(到热带下方)与向东延伸,西缘西扩填满云南
  { id: 'subtropical', name: '亚热带季风气候', color: '#E1A100', labelAt: [114, 28],
    ring: [[101, 31.5], [103, 33], [106, 33.4], [109, 33.4], [112, 33], [115, 33.2], [118, 33], [121, 32.6], [124, 32], [124, 15], [97, 15], [96.5, 22], [96.5, 29], [98, 30.5], [100, 31], [101, 31.5]] },
  // 热带季风:精确【北界】≈ 北回归线(微起伏),向南/东/西延伸
  { id: 'tropical', name: '热带季风气候', color: '#E24B4A', labelAt: [110, 19],
    ring: [[95, 9], [122, 9], [126, 14], [124, 22], [121, 22.4], [118, 22.6], [115, 22.4], [112, 22], [110, 21.8], [107, 22.6], [104, 22.3], [101, 22], [98, 22.3], [96, 21], [95, 18]] },
  // 高原山地:精确【青藏高原轮廓】(昆仑—阿尔金—祁连 / 横断 / 喜马拉雅),南缘 ~28.5–29°N,叠在最上
  { id: 'highland', name: '高原山地气候', color: '#7F77DD', labelAt: [88, 33],
    ring: [[75, 37], [80, 36.5], [85, 36], [90, 36], [95, 36.5], [100, 37.5], [103, 37], [103, 33], [102, 31], [101, 29.5], [100, 28.5], [97, 28], [95, 27.5], [93, 25], [88, 24.5], [83, 25], [79, 28], [76, 33], [75, 37]] },
];

// 气候带之间的【明确分界线】。各折线与上面环的"精确边界"一致,描在实色块之上即为干脆的分界。
// 经裁剪到国界内绘制;伸出国界的部分自动消失。
export type Boundary = { id: string; name: string; dash: boolean; labelAt: [number, number]; pts: [number, number][] };
export const BOUNDARIES: Boundary[] = [
  { id: 'tropic', name: '北回归线', dash: true, labelAt: [113.5, 24.4],
    pts: [[96, 21], [98, 22.3], [101, 22], [104, 22.3], [107, 22.6], [110, 21.8], [112, 22], [115, 22.4], [118, 22.6], [121, 22.4], [124, 22]] },
  { id: 'qinhuai', name: '秦岭—淮河', dash: false, labelAt: [108.5, 34.7],
    pts: [[101, 31.5], [103, 33], [106, 33.4], [109, 33.4], [112, 33], [115, 33.2], [118, 33], [121, 32.6], [124, 32]] },
  { id: 'monsoon', name: '季风区界', dash: false, labelAt: [113.5, 45.5],
    pts: [[100, 34], [102, 35.5], [104, 36.5], [106, 38], [108, 39], [110, 40], [112, 41], [115, 42], [118, 45], [120, 48], [122, 50], [124, 52]] },
  { id: 'plateau', name: '青藏高原边缘', dash: false, labelAt: [90, 38.5],
    pts: [[75, 37], [80, 36.5], [85, 36], [90, 36], [95, 36.5], [100, 37.5], [103, 37], [103, 33], [102, 31], [101, 29.5], [100, 28.5], [97, 28], [95, 27.5]] },
];

// 渲染顺序(由下到上)= 数组顺序
export const RENDER_ORDER = CLIMATES.map((c) => c.id);
// 命中优先级 = 叠放从上到下(可见的那层优先),与渲染顺序相反
export const HIT_ORDER = [...RENDER_ORDER].reverse();

export const byId = (id: string) => CLIMATES.find((c) => c.id === id);

function pointInRing(lon: number, lat: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (((yi > lat) !== (yj > lat)) && (lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

/** 经纬度落在哪个气候带:按可见优先级(上层优先)判断;都不在则取最近气候带质心。 */
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
