import { useRef, useState } from 'react';
import { Btn, Icon } from '../../../app/ui';
import { load, save } from '../../../core/storage';

const KEY = 'hc.draw-box';
type Prefs = { text: string; noRepeat: boolean; sound: boolean };
const DEFAULTS: Prefs = { text: '', noRepeat: true, sound: true };

export function DrawBox() {
  const [p, setP] = useState<Prefs>(() => ({ ...DEFAULTS, ...load<Partial<Prefs>>(KEY, {}) }));
  const set = (patch: Partial<Prefs>) => setP((prev) => { const n = { ...prev, ...patch }; save(KEY, n); return n; });
  const [drawn, setDrawn] = useState<string[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [n, setN] = useState(0);
  const audio = useRef<AudioContext | null>(null);

  const items = p.text.split('\n').map((s) => s.trim()).filter(Boolean);
  const pool = p.noRepeat ? items.filter((i) => !drawn.includes(i)) : items;

  function beep(freq: number, dur = 0.08) {
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

  function draw() {
    if (pool.length === 0) return;
    const x = pool[Math.floor(Math.random() * pool.length)];
    setCurrent(x);
    setDrawn((d) => [...d, x]);
    setN((k) => k + 1);
    beep(440, 0.05);
    window.setTimeout(() => beep(880, 0.13), 130);
  }
  function reset() { setDrawn([]); setCurrent(null); }
  function onText(v: string) { set({ text: v }); setDrawn([]); setCurrent(null); }

  return (
    <div className="db">
      <div className="db-stage">
        {current === null
          ? <div className="db-deck">{items.length ? '点「抽一张」翻题' : '先在右侧放题目 →'}</div>
          : <div key={n} className="db-card">{current}</div>}
        <div className="db-meta">剩余 {pool.length} / {items.length}</div>
        <div className="db-actions">
          <Btn variant="coral" onClick={draw} disabled={pool.length === 0}><Icon name="cards" /> 抽一张</Btn>
          <Btn onClick={reset} disabled={drawn.length === 0}><Icon name="refresh" /> 重置</Btn>
        </div>
        <div className="picker-toggles">
          <button className={`tg${p.noRepeat ? ' on' : ''}`} onClick={() => set({ noRepeat: !p.noRepeat })}><Icon name="rotate-2" size={16} /> 不重复</button>
          <button className={`tg${p.sound ? ' on' : ''}`} onClick={() => set({ sound: !p.sound })}><Icon name={p.sound ? 'volume' : 'volume-off'} size={16} /> 音效</button>
        </div>
      </div>
      <div className="db-side">
        <label className="picker-label">题目 / 条目(每行一个)</label>
        <textarea className="picker-input" value={p.text} onChange={(e) => onText(e.target.value)} placeholder={'光合作用的场所?\n声音的传播需要介质吗?\n背诵《静夜思》'} />
      </div>
    </div>
  );
}
