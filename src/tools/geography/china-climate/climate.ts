// 中国主要气候类型(初中地理 5 类)。按省级行政区主导气候归类 —— 这是教材级简化,
// 秦岭—淮河等跨省分界做了近似,二维平面演示足够。
export type Climate = { id: string; name: string; color: string };

export const CLIMATES: Climate[] = [
  { id: 'tropical', name: '热带季风气候', color: '#E24B4A' },
  { id: 'subtropical', name: '亚热带季风气候', color: '#E1A100' },
  { id: 'temperate', name: '温带季风气候', color: '#15A98B' },
  { id: 'continental', name: '温带大陆性气候', color: '#BA7517' },
  { id: 'highland', name: '高原山地气候', color: '#7F77DD' },
];

/** 省级行政区代码 → 气候类型 id(主导气候)。 */
export const PROVINCE_CLIMATE: Record<string, string> = {
  '460000': 'tropical',
  // 亚热带季风
  '310000': 'subtropical', '320000': 'subtropical', '330000': 'subtropical', '340000': 'subtropical',
  '360000': 'subtropical', '420000': 'subtropical', '430000': 'subtropical', '350000': 'subtropical',
  '440000': 'subtropical', '450000': 'subtropical', '520000': 'subtropical', '500000': 'subtropical',
  '510000': 'subtropical', '530000': 'subtropical', '710000': 'subtropical', '810000': 'subtropical', '820000': 'subtropical',
  // 温带季风
  '110000': 'temperate', '120000': 'temperate', '130000': 'temperate', '140000': 'temperate',
  '370000': 'temperate', '410000': 'temperate', '610000': 'temperate', '210000': 'temperate',
  '220000': 'temperate', '230000': 'temperate',
  // 温带大陆性
  '150000': 'continental', '650000': 'continental', '640000': 'continental', '620000': 'continental',
  // 高原山地
  '540000': 'highland', '630000': 'highland',
};
