// 中国四大地理区域(八下):北方、南方、西北、青藏。
// 用画家算法(下层向上层底下延伸,可见边界=上层精确边界)在中国轮廓内拼出四大区,
// 三条分界线与气候工具一致:秦岭—淮河、季风区界、青藏高原边缘。
export type Facts = { climate: string; terrain: string; farm: string; key: string };
export type Region = { id: string; name: string; color: string; ring: [number, number][]; labelAt: [number, number]; facts: Facts };

// 渲染由下到上(数组顺序):西北 → 南方 → 北方 → 青藏
export const REGIONS: Region[] = [
  { id: 'xibei', name: '西北地区', color: '#BA7517', labelAt: [85, 42],
    ring: [[70, 28], [126, 28], [126, 58], [70, 58]],
    facts: { climate: '温带大陆性气候', terrain: '内蒙古高原、塔里木/准噶尔盆地', farm: '草原畜牧、绿洲农业', key: '深居内陆,干旱少雨' } },
  { id: 'nanfang', name: '南方地区', color: '#15A98B', labelAt: [113, 27],
    ring: [[99, 36], [125, 36], [125, 17], [99, 17]],
    facts: { climate: '亚热带季风气候', terrain: '长江中下游平原、东南丘陵、云贵高原', farm: '水田为主,种水稻', key: '1月均温>0℃,湿润多雨' } },
  { id: 'beifang', name: '北方地区', color: '#E1A100', labelAt: [117, 40],
    ring: [[101, 31.5], [103, 33], [106, 33.4], [109, 33.4], [112, 33], [115, 33.2], [118, 33], [121, 32.6], [124, 32], [135, 32], [135, 54], [125, 54], [124, 52], [122, 50], [120, 48], [118, 45], [115, 42], [112, 41], [110, 40], [108, 39], [106, 38], [104, 36.5], [102, 35.5], [100, 34]],
    facts: { climate: '温带季风气候', terrain: '东北平原、华北平原、黄土高原', farm: '旱地为主,种小麦', key: '1月均温<0℃,年降水<800mm' } },
  { id: 'qingzang', name: '青藏地区', color: '#7F77DD', labelAt: [88, 33],
    ring: [[75, 37], [80, 36.5], [85, 36], [90, 36], [95, 36.5], [100, 37.5], [103, 37], [103, 33], [102, 31], [101, 29.5], [100, 28.5], [97, 28], [95, 27.5], [93, 25], [88, 24.5], [83, 25], [79, 28], [76, 33], [75, 37]],
    facts: { climate: '高寒气候', terrain: '青藏高原(雪山、河谷)', farm: '河谷农业、高寒牧业(青稞、牦牛)', key: '海拔高、气温低、日照强' } },
];

export type Boundary = { id: string; name: string; dash: boolean; labelAt: [number, number]; pts: [number, number][] };
export const BOUNDARIES: Boundary[] = [
  { id: 'qinhuai', name: '秦岭—淮河', dash: false, labelAt: [108.5, 34.7],
    pts: [[101, 31.5], [103, 33], [106, 33.4], [109, 33.4], [112, 33], [115, 33.2], [118, 33], [121, 32.6], [124, 32]] },
  { id: 'monsoon', name: '季风区界', dash: false, labelAt: [113.5, 45.5],
    pts: [[100, 34], [102, 35.5], [104, 36.5], [106, 38], [108, 39], [110, 40], [112, 41], [115, 42], [118, 45], [120, 48], [122, 50], [124, 52]] },
  { id: 'plateau', name: '青藏高原边缘', dash: false, labelAt: [90, 38.5],
    pts: [[75, 37], [80, 36.5], [85, 36], [90, 36], [95, 36.5], [100, 37.5], [103, 37], [103, 33], [102, 31], [101, 29.5], [100, 28.5], [97, 28], [95, 27.5]] },
];

export const RENDER_ORDER = REGIONS.map((r) => r.id);
export const HIT_ORDER = [...RENDER_ORDER].reverse();
export const byId = (id: string) => REGIONS.find((r) => r.id === id)!;

function pointInRing(lon: number, lat: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (((yi > lat) !== (yj > lat)) && (lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

/** 经纬度落在哪个区:按可见优先级(上层优先);都不在则取最近区质心。 */
export function zoneAt(lon: number, lat: number): string {
  for (const id of HIT_ORDER) { const r = REGIONS.find((x) => x.id === id); if (r && pointInRing(lon, lat, r.ring)) return id; }
  let best = REGIONS[0].id, bd = Infinity;
  for (const r of REGIONS) {
    const cx = r.ring.reduce((s, p) => s + p[0], 0) / r.ring.length;
    const cy = r.ring.reduce((s, p) => s + p[1], 0) / r.ring.length;
    const d = (cx - lon) ** 2 + (cy - lat) ** 2;
    if (d < bd) { bd = d; best = r.id; }
  }
  return best;
}
