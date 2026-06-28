// 初中常见气候类型的"气温曲线·降水量柱状图"代表数据(北半球,12 个月)。
// 数据为教学用代表值(量级与典型形态符合教材),用于"以温定带、以水定型"判读训练。
export type Zone = '热带' | '亚热带' | '温带' | '亚寒带';
export type ClimateType = {
  id: string; name: string; zone: Zone; example: string;
  temps: number[];   // 12 月平均气温 °C
  precip: number[];  // 12 月降水量 mm
  hint: string;      // 一句话特征
};

export const CLIMATES: ClimateType[] = [
  { id: 'rainforest', name: '热带雨林气候', zone: '热带', example: '新加坡',
    temps: [27, 27, 28, 28, 28, 28, 27, 27, 27, 27, 27, 27],
    precip: [250, 180, 200, 190, 180, 170, 170, 190, 210, 250, 260, 280], hint: '全年高温多雨' },
  { id: 'savanna', name: '热带草原气候', zone: '热带', example: '巴马科',
    temps: [25, 28, 31, 33, 32, 29, 27, 26, 28, 28, 27, 25],
    precip: [0, 0, 3, 15, 60, 120, 200, 250, 160, 40, 3, 0], hint: '全年高温,分干湿两季' },
  { id: 'tmonsoon', name: '热带季风气候', zone: '热带', example: '孟买',
    temps: [24, 25, 27, 29, 30, 29, 27, 27, 27, 28, 27, 25],
    precip: [2, 1, 1, 2, 18, 490, 610, 560, 300, 55, 15, 3], hint: '全年高温,旱雨两季分明' },
  { id: 'desert', name: '热带沙漠气候', zone: '热带', example: '利雅得',
    temps: [14, 16, 21, 26, 31, 34, 35, 35, 32, 27, 21, 15],
    precip: [4, 3, 3, 1, 1, 0, 0, 0, 0, 1, 3, 5], hint: '全年炎热干燥少雨' },
  { id: 'submonsoon', name: '亚热带季风气候', zone: '亚热带', example: '上海',
    temps: [4, 6, 10, 16, 21, 25, 29, 29, 25, 19, 13, 7],
    precip: [45, 60, 85, 100, 115, 150, 135, 130, 135, 60, 50, 40], hint: '夏季高温多雨,冬季温和少雨' },
  { id: 'mediterranean', name: '地中海气候', zone: '亚热带', example: '罗马',
    temps: [8, 9, 11, 14, 18, 22, 25, 25, 22, 18, 13, 9],
    precip: [80, 75, 65, 55, 35, 18, 10, 15, 55, 95, 110, 95], hint: '夏季炎热干燥,冬季温和多雨' },
  { id: 'tempmonsoon', name: '温带季风气候', zone: '温带', example: '北京',
    temps: [-4, -1, 6, 14, 20, 25, 26, 25, 20, 13, 4, -2],
    precip: [3, 5, 9, 22, 35, 78, 185, 160, 50, 22, 9, 3], hint: '夏季高温多雨,冬季寒冷干燥' },
  { id: 'continental', name: '温带大陆性气候', zone: '温带', example: '乌兰巴托',
    temps: [-13, -9, -1, 7, 14, 19, 21, 19, 12, 3, -7, -12],
    precip: [2, 3, 4, 8, 22, 48, 65, 55, 28, 8, 4, 3], hint: '冬冷夏热,全年少雨' },
  { id: 'oceanic', name: '温带海洋性气候', zone: '温带', example: '伦敦',
    temps: [5, 5, 7, 9, 12, 15, 17, 17, 15, 11, 8, 6],
    precip: [55, 42, 48, 45, 52, 50, 48, 55, 58, 65, 62, 58], hint: '全年温和湿润,降水均匀' },
  { id: 'subarctic', name: '亚寒带针叶林气候', zone: '亚寒带', example: '莫斯科',
    temps: [-9, -8, -3, 5, 12, 16, 18, 16, 10, 4, -2, -7],
    precip: [40, 35, 32, 38, 48, 72, 78, 72, 60, 52, 45, 42], hint: '冬长严寒,夏短温暖,降水集中夏季' },
];

export const byId = (id: string) => CLIMATES.find((c) => c.id === id)!;
const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);
const argmax = (a: number[]) => a.reduce((m, v, i) => (v > a[m] ? i : m), 0);
const argmin = (a: number[]) => a.reduce((m, v, i) => (v < a[m] ? i : m), 0);

export type Reading = {
  tHotMon: number; tHot: number; tColdMon: number; tCold: number; tRange: number;
  annual: number; rainType: string; zoneBy: string;
};

/** 计算判读要点:以温定带、以水定型。*/
export function read(c: ClimateType): Reading {
  const hotM = argmax(c.temps), coldM = argmin(c.temps);
  const tHot = c.temps[hotM], tCold = c.temps[coldM];
  const annual = sum(c.precip);
  const summer = c.precip[5] + c.precip[6] + c.precip[7]; // 6—8 月
  const winter = c.precip[11] + c.precip[0] + c.precip[1]; // 12、1、2 月
  let rainType: string;
  if (annual < 350) rainType = '全年少雨';
  else if (summer > winter * 1.8) rainType = '夏季多雨(雨热同期)';
  else if (winter > summer * 1.4) rainType = '冬季多雨(雨热不同期)';
  else rainType = '全年湿润均匀';
  const zoneBy = tCold >= 15 ? '最冷月 >15℃ → 热带'
    : tCold > 0 ? (tHot >= 22 ? '最冷月 0—15℃、夏热 → 亚热带' : '最冷月 >0℃、夏凉 → 温带(海洋)')
      : tHot >= 10 ? '最冷月 <0℃ → 温带 / 亚寒带' : '最热月 <10℃ → 寒带';
  return { tHotMon: hotM + 1, tHot, tColdMon: coldM + 1, tCold, tRange: tHot - tCold, annual, rainType, zoneBy };
}
