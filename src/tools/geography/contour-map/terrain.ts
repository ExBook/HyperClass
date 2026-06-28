// 程序生成的教学用地形(高程场),刻意包含五种地形部位:
// 山峰、山脊、山谷、鞍部、陡崖。坐标用归一化 (u,v) ∈ [0,1],u 向右、v 向下。
export const GW = 160, GH = 112; // 网格分辨率
export const INTERVAL = 100;     // 等高距(米)

type Bump = { cu: number; cv: number; amp: number; su: number; sv: number };
const PEAKS: Bump[] = [
  { cu: 0.30, cv: 0.42, amp: 520, su: 0.15, sv: 0.15 }, // 山峰 A
  { cu: 0.64, cv: 0.36, amp: 450, su: 0.13, sv: 0.13 }, // 山峰 B(与 A 之间形成鞍部)
  { cu: 0.18, cv: 0.66, amp: 300, su: 0.10, sv: 0.21 }, // 由 A 向西南延伸的山脊
];
const VALLEYS: Bump[] = [
  { cu: 0.50, cv: 0.82, amp: 190, su: 0.07, sv: 0.26 }, // 自南向北切入的山谷
];

export function heightField(): { values: number[]; min: number; max: number } {
  const values = new Array(GW * GH);
  let min = Infinity, max = -Infinity;
  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      const u = x / GW, v = y / GH;
      let h = 200; // 基面
      for (const g of PEAKS) h += g.amp * Math.exp(-(((u - g.cu) ** 2) / (2 * g.su ** 2) + ((v - g.cv) ** 2) / (2 * g.sv ** 2)));
      for (const g of VALLEYS) h -= g.amp * Math.exp(-(((u - g.cu) ** 2) / (2 * g.su ** 2) + ((v - g.cv) ** 2) / (2 * g.sv ** 2)));
      // 陡崖:右侧窄带高程陡升,使等高线密集
      const band = Math.exp(-(((v - 0.5) ** 2) / (2 * 0.14 ** 2)));
      h += 280 * band / (1 + Math.exp(-(u - 0.83) / 0.010));
      values[y * GW + x] = h;
      if (h < min) min = h; if (h > max) max = h;
    }
  }
  return { values, min, max };
}

export type Landform = '山峰' | '山脊' | '山谷' | '鞍部' | '陡崖';
export type Feature = { id: string; type: Landform; u: number; v: number; how: string };
export const FEATURES: Feature[] = [
  { id: 'peakA', type: '山峰', u: 0.30, v: 0.42, how: '闭合等高线,中间高、四周低' },
  { id: 'peakB', type: '山峰', u: 0.64, v: 0.36, how: '闭合等高线,中间高、四周低' },
  { id: 'saddle', type: '鞍部', u: 0.475, v: 0.40, how: '相邻两个山峰之间的低地' },
  { id: 'ridge', type: '山脊', u: 0.205, v: 0.60, how: '等高线向海拔低处凸出(分水岭)' },
  { id: 'valley', type: '山谷', u: 0.50, v: 0.66, how: '等高线向海拔高处凸出,易发育河流' },
  { id: 'cliff', type: '陡崖', u: 0.84, v: 0.52, how: '多条等高线重叠或非常密集' },
];

// 山谷里的河流(从北向南顺地势),用于直观说明"河流发育在山谷"
export const RIVER: [number, number][] = [[0.49, 0.55], [0.50, 0.66], [0.50, 0.78], [0.51, 0.9], [0.52, 0.99]];

export const LANDFORMS: Landform[] = ['山峰', '山脊', '山谷', '鞍部', '陡崖'];
export const tintFor = (v: number): string =>
  v >= 700 ? '#C2854F' : v >= 600 ? '#D6A06A' : v >= 500 ? '#E6C386' : v >= 400 ? '#ECDD9B' : v >= 300 ? '#D6E3A0' : '#CBE3AE';
