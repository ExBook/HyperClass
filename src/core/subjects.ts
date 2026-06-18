import type { SubjectId } from './types';

export type Subject = { id: SubjectId; name: string; icon: string; accent: string };

/** 学科元数据。首页学科箱按此顺序展示,通用与各学科同级。 */
export const subjects: Subject[] = [
  { id: 'common',    name: '通用',     icon: 'tools',          accent: '#FF6B6B' },
  { id: 'chinese',   name: '语文',     icon: 'book',           accent: '#E24B4A' },
  { id: 'math',      name: '数学',     icon: 'math-function',  accent: '#378ADD' },
  { id: 'english',   name: '英语',     icon: 'abc',            accent: '#7F77DD' },
  { id: 'physics',   name: '物理',     icon: 'atom',           accent: '#15A98B' },
  { id: 'chemistry', name: '化学',     icon: 'flask',          accent: '#BA7517' },
  { id: 'biology',   name: '生物',     icon: 'leaf',           accent: '#6AB04C' },
  { id: 'history',   name: '历史',     icon: 'clock',          accent: '#D4537E' },
  { id: 'geography', name: '地理',     icon: 'world',          accent: '#1D9E75' },
  { id: 'moral',     name: '道法',     icon: 'scale',          accent: '#888780' },
  { id: 'music',     name: '音乐',     icon: 'music',          accent: '#D6336C' },
  { id: 'art',       name: '美术',     icon: 'palette',        accent: '#E1A100' },
  { id: 'pe',        name: '体育',     icon: 'run',            accent: '#2BAFA3' },
  { id: 'it',        name: '信息科技', icon: 'device-desktop', accent: '#534AB7' },
];

export const getSubject = (id: string): Subject | undefined =>
  subjects.find((s) => s.id === id);
