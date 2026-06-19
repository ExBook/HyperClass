import { useRef, useState } from 'react';
import { Btn, Icon } from '../../../app/ui';
import { load, save } from '../../../core/storage';

const KEY = 'hc.score-board';
const COLORS = ['#FF6B6B', '#15A98B', '#378ADD', '#E1A100', '#6AB04C', '#7F77DD', '#D6336C', '#BA7517'];

type Group = { id: string; name: string; score: number };
const uid = () => 'g' + Math.random().toString(36).slice(2, 8);
const makeGroups = (n: number): Group[] => Array.from({ length: n }, (_, i) => ({ id: uid(), name: `第 ${i + 1} 组`, score: 0 }));

export function ScoreBoard() {
  const init = load<{ groups?: Group[]; sound?: boolean }>(KEY, {});
  const [groups, setGroups] = useState<Group[]>(init.groups?.length ? init.groups : makeGroups(4));
  const [sound, setSound] = useState(init.sound ?? true);
  const [history, setHistory] = useState<Group[][]>([]);
  const audio = useRef<AudioContext | null>(null);

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
    const c = Math.max(2, Math.min(8, n));
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

  return (
    <div className="sb">
      <div className="sb-grid">
        {groups.map((g, i) => {
          const leader = g.score === max && max > 0;
          return (
            <div key={g.id} className={`sb-card${leader ? ' leader' : ''}`} style={{ ['--gc' as string]: COLORS[i % COLORS.length] } as React.CSSProperties}>
              {leader && <span className="sb-crown"><Icon name="crown" size={18} /></span>}
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

      <div className="sb-bar">
        <div className="sb-count">
          组数
          <button onClick={() => setCount(groups.length - 1)} aria-label="减少组">−</button>
          <span>{groups.length}</span>
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
