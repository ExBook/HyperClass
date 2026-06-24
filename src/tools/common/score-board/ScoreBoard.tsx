import { useLayoutEffect, useRef, useState } from 'react';
import { Btn, Icon } from '../../../app/ui';
import { load, save } from '../../../core/storage';

const KEY = 'hc.score-board';
const MAX_GROUPS = 64;
const PALETTE = ['#FF6B6B', '#15A98B', '#378ADD', '#E1A100', '#6AB04C', '#7F77DD', '#D6336C', '#BA7517'];
// 前 8 个用手挑的暖色,超出后用黄金角生成互不相同的色相
const colorFor = (i: number) => (i < PALETTE.length ? PALETTE[i] : `hsl(${Math.round((i * 137.508) % 360)} 52% 58%)`);

type Group = { id: string; name: string; score: number };
const uid = () => 'g' + Math.random().toString(36).slice(2, 8);
const makeGroups = (n: number): Group[] => Array.from({ length: n }, (_, i) => ({ id: uid(), name: `第 ${i + 1} 组`, score: 0 }));

export function ScoreBoard() {
  const init = load<{ groups?: Group[]; sound?: boolean }>(KEY, {});
  const [groups, setGroups] = useState<Group[]>(init.groups?.length ? init.groups : makeGroups(4));
  const [sound, setSound] = useState(init.sound ?? true);
  const [history, setHistory] = useState<Group[][]>([]);
  const audio = useRef<AudioContext | null>(null);

  // 排行榜 FLIP:行换位时从旧位置平滑滑到新位置
  const rowRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const prevPos = useRef<Map<string, number>>(new Map());
  useLayoutEffect(() => {
    const next = new Map<string, number>();
    rowRefs.current.forEach((el, id) => next.set(id, el.getBoundingClientRect().top));
    rowRefs.current.forEach((el, id) => {
      const before = prevPos.current.get(id);
      const after = next.get(id) ?? 0;
      if (before != null && before !== after) {
        el.style.transition = 'none';
        el.style.transform = `translateY(${before - after}px)`;
        requestAnimationFrame(() => {
          el.style.transition = 'transform 0.42s cubic-bezier(.2,.8,.2,1)';
          el.style.transform = '';
        });
      }
    });
    prevPos.current = next;
  });

  const persist = (g: Group[], s = sound) => save(KEY, { groups: g, sound: s });
  const push = () => setHistory((h) => [...h.slice(-29), groups]);

  function beep(freq: number, dur = 0.08) {
    if (!sound) return;
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

  function adjust(id: string, delta: number) {
    push();
    setGroups((gs) => { const n = gs.map((g) => g.id === id ? { ...g, score: g.score + delta } : g); persist(n); return n; });
    beep(delta > 0 ? 780 : 320, 0.08);
  }
  function rename(id: string, name: string) {
    setGroups((gs) => { const n = gs.map((g) => g.id === id ? { ...g, name } : g); persist(n); return n; });
  }
  function undo() {
    setHistory((h) => { if (!h.length) return h; const prev = h[h.length - 1]; setGroups(prev); persist(prev); return h.slice(0, -1); });
  }
  function reset() { push(); setGroups((gs) => { const n = gs.map((g) => ({ ...g, score: 0 })); persist(n); return n; }); }
  function setCount(n: number) {
    const c = Math.max(2, Math.min(MAX_GROUPS, n || 0));
    if (c === groups.length) return;
    push();
    setGroups((gs) => {
      let next: Group[];
      if (c <= gs.length) next = gs.slice(0, c);
      else next = [...gs, ...Array.from({ length: c - gs.length }, (_, i) => ({ id: uid(), name: `第 ${gs.length + i + 1} 组`, score: 0 }))];
      persist(next); return next;
    });
  }
  function toggleSound() { setSound((s) => { const v = !s; persist(groups, v); return v; }); }

  const max = Math.max(0, ...groups.map((g) => g.score));
  const colorById = new Map(groups.map((g, i) => [g.id, colorFor(i)]));
  const ranked = groups.map((g, i) => ({ ...g, i })).sort((a, b) => b.score - a.score || a.i - b.i);

  // 组数越多卡片越紧凑
  const cols = groups.length;
  const sbMin = cols > 32 ? 104 : cols > 16 ? 128 : cols > 8 ? 158 : 196;
  const sbScore = cols > 32 ? 30 : cols > 16 ? 38 : cols > 8 ? 48 : 60;
  const gridStyle = { ['--sb-min' as string]: `${sbMin}px`, ['--sb-score' as string]: `${sbScore}px` } as React.CSSProperties;

  return (
    <div className="sb">
      <div className="sb-main">
        <div className={`sb-grid-wrap${cols > 16 ? ' dense' : ''}`}>
          <div className="sb-grid" style={gridStyle}>
            {groups.map((g, i) => {
              const leader = g.score === max && max > 0;
              return (
                <div key={g.id} className={`sb-card${leader ? ' leader' : ''}`} style={{ ['--gc' as string]: colorFor(i) } as React.CSSProperties}>
                  {leader && <span className="sb-crown"><Icon name="crown" size={16} /></span>}
                  <div className="sb-name"><input value={g.name} onChange={(e) => rename(g.id, e.target.value)} aria-label="组名" /></div>
                  <div className="sb-score"><span key={g.score} className="sb-num">{g.score}</span></div>
                  <div className="sb-btns">
                    <button className="minus" onClick={() => adjust(g.id, -1)}>−1</button>
                    <button className="plus" onClick={() => adjust(g.id, 1)}>+1</button>
                    <button className="plus" onClick={() => adjust(g.id, 5)}>+5</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="sb-rank">
          <div className="sb-rank-head"><Icon name="trophy" size={18} /> 排行榜</div>
          <ol className="sb-rank-list">
            {ranked.map((g, r) => {
              const pct = max > 0 ? Math.max(0, g.score) / max * 100 : 0;
              const rc = colorById.get(g.id) ?? '#999';
              return (
                <li key={g.id} ref={(el) => { if (el) rowRefs.current.set(g.id, el); else rowRefs.current.delete(g.id); }}
                  className="sb-rank-row" style={{ ['--rc' as string]: rc } as React.CSSProperties}>
                  <span className="sb-rank-fill" style={{ width: `${pct}%` }} />
                  <span className={`sb-rank-no r${r + 1}`}>{r + 1}</span>
                  <span className="sb-rank-dot" style={{ background: rc }} />
                  <span className="sb-rank-name" title={g.name}>{g.name}</span>
                  <span className="sb-rank-score">{g.score}</span>
                </li>
              );
            })}
          </ol>
        </aside>
      </div>

      <div className="sb-bar">
        <div className="sb-count">
          组数
          <button onClick={() => setCount(groups.length - 1)} aria-label="减少组">−</button>
          <input type="number" min={2} max={MAX_GROUPS} value={groups.length}
            onChange={(e) => setCount(parseInt(e.target.value, 10))} aria-label="组数" />
          <button onClick={() => setCount(groups.length + 1)} aria-label="增加组">+</button>
        </div>
        <div style={{ flex: 1 }} />
        <Btn onClick={undo} disabled={history.length === 0}><Icon name="arrow-back-up" /> 撤销</Btn>
        <Btn onClick={reset}><Icon name="refresh" /> 清零</Btn>
        <button className={`tg${sound ? ' on' : ''}`} onClick={toggleSound}><Icon name={sound ? 'volume' : 'volume-off'} size={16} /> 音效</button>
      </div>
    </div>
  );
}
