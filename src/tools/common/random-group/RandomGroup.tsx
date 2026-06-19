import { useRef, useState } from 'react';
import { Btn, Icon } from '../../../app/ui';
import { load, save } from '../../../core/storage';

const KEY = 'hc.random-group';
const COLORS = ['#FF6B6B', '#15A98B', '#378ADD', '#E1A100', '#6AB04C', '#7F77DD', '#D6336C', '#BA7517'];

type Source = 'names' | 'numbers';
type Divide = 'groups' | 'size';
type Prefs = { source: Source; text: string; count: number; divide: Divide; num: number; sound: boolean };
const DEFAULTS: Prefs = { source: 'names', text: '', count: 40, divide: 'groups', num: 4, sound: true };

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

export function RandomGroup() {
  const [p, setP] = useState<Prefs>(() => ({ ...DEFAULTS, ...load<Partial<Prefs>>(KEY, {}) }));
  const set = (patch: Partial<Prefs>) => setP((prev) => { const next = { ...prev, ...patch }; save(KEY, next); return next; });
  const [groups, setGroups] = useState<string[][]>([]);
  const [busy, setBusy] = useState(false);
  const audio = useRef<AudioContext | null>(null);

  const roster = p.source === 'numbers'
    ? Array.from({ length: Math.max(0, Math.min(300, p.count)) }, (_, i) => String(i + 1))
    : p.text.split('\n').map((s) => s.trim()).filter(Boolean);

  function beep(freq: number, dur = 0.07) {
    if (!p.sound) return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audio.current ?? (audio.current = new Ctx());
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = freq; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.06, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch { /* audio unavailable */ }
  }

  function make() {
    if (busy || roster.length === 0) return;
    const arr = shuffle(roster);
    const g = p.divide === 'groups'
      ? Math.max(1, Math.min(p.num, arr.length))
      : Math.max(1, Math.ceil(arr.length / Math.max(1, p.num)));
    const out: string[][] = Array.from({ length: g }, () => []);
    arr.forEach((name, i) => out[i % g].push(name));
    // 洗牌过程感:先清空再短暂延迟出结果
    setBusy(true);
    setGroups([]);
    [600, 720, 860].forEach((f, i) => window.setTimeout(() => beep(f, 0.05), i * 80));
    window.setTimeout(() => { setGroups(out); beep(1040, 0.14); setBusy(false); }, 320);
  }

  return (
    <div className="rg">
      <div className="rg-stage">
        {groups.length === 0 ? (
          <div className="rg-empty">{busy ? '分组中…' : '设好人数与分组方式,点「分组」'}</div>
        ) : (
          <div className="rg-grid">
            {groups.map((g, i) => (
              <div key={i} className="rg-card" style={{ ['--gc' as string]: COLORS[i % COLORS.length], animationDelay: `${i * 60}ms` } as React.CSSProperties}>
                <div className="rg-head">第 {i + 1} 组 <span>{g.length} 人</span></div>
                <div className="rg-members">
                  {g.map((m, j) => <span key={m} className="rg-chip" style={{ animationDelay: `${i * 60 + j * 28}ms` }}>{m}</span>)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rg-side">
        <div className="seg">
          <button className={p.source === 'names' ? 'on' : ''} onClick={() => set({ source: 'names' })}>名单</button>
          <button className={p.source === 'numbers' ? 'on' : ''} onClick={() => set({ source: 'numbers' })}>学号</button>
        </div>
        {p.source === 'names'
          ? <textarea className="picker-input" value={p.text} onChange={(e) => set({ text: e.target.value })} placeholder={'张三\n李四\n王五'} />
          : <div className="rg-num">人数<input type="number" min={1} max={300} value={p.count} onChange={(e) => set({ count: Math.max(1, Number(e.target.value) || 1) })} />人</div>}

        <div className="seg">
          <button className={p.divide === 'groups' ? 'on' : ''} onClick={() => set({ divide: 'groups' })}>按组数</button>
          <button className={p.divide === 'size' ? 'on' : ''} onClick={() => set({ divide: 'size' })}>按每组人数</button>
        </div>
        <div className="rg-num">{p.divide === 'groups' ? '分' : '每组'}<input type="number" min={1} value={p.num} onChange={(e) => set({ num: Math.max(1, Number(e.target.value) || 1) })} />{p.divide === 'groups' ? '组' : '人'}</div>

        <div className="rg-actions">
          <Btn variant="coral" onClick={make} disabled={busy || roster.length === 0}><Icon name="users-group" /> 分组</Btn>
          <Btn onClick={make} disabled={busy || groups.length === 0}><Icon name="refresh" /> 重新分</Btn>
        </div>
        <button className={`tg${p.sound ? ' on' : ''}`} onClick={() => set({ sound: !p.sound })} style={{ alignSelf: 'flex-start' }}>
          <Icon name={p.sound ? 'volume' : 'volume-off'} size={16} /> 音效
        </button>
        <div className="rg-meta">共 {roster.length} 人</div>
      </div>
    </div>
  );
}
