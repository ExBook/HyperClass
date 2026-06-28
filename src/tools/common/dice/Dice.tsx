import { useEffect, useRef, useState } from 'react';
import { Btn, Icon } from '../../../app/ui';
import { load, save } from '../../../core/storage';

const KEY = 'hc.dice';
const SIDES = [6, 8, 10, 12, 20];
// d6 点子在 100×100 骰面内的坐标
const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[30, 30], [50, 50], [70, 70]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
  6: [[30, 30], [70, 30], [30, 50], [70, 50], [30, 70], [70, 70]],
};

type Prefs = { count: number; sides: number; sound: boolean };
const DEFAULTS: Prefs = { count: 2, sides: 6, sound: true };

export function Dice() {
  const [p, setP] = useState<Prefs>(() => ({ ...DEFAULTS, ...load<Partial<Prefs>>(KEY, {}) }));
  const set = (patch: Partial<Prefs>) => setP((prev) => { const n = { ...prev, ...patch }; save(KEY, n); return n; });

  const [vals, setVals] = useState<number[]>(() => Array(DEFAULTS.count).fill(1));
  const [rolling, setRolling] = useState(false);
  const spin = useRef<number | undefined>(undefined);
  const audio = useRef<AudioContext | null>(null);

  useEffect(() => () => window.clearInterval(spin.current), []);
  // 显示的骰子按当前数量裁剪/补齐,无需用 effect 同步状态
  const dice = Array.from({ length: p.count }, (_, i) => vals[i] ?? 1);

  function beep(freq: number, dur = 0.04) {
    if (!p.sound) return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audio.current ?? (audio.current = new Ctx());
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square'; o.frequency.value = freq; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.05, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch { /* audio unavailable */ }
  }

  function roll() {
    if (rolling) return;
    setRolling(true);
    const finals = Array.from({ length: p.count }, () => 1 + Math.floor(Math.random() * p.sides));
    window.clearInterval(spin.current);
    let elapsed = 0; const total = 720, step = 70;
    spin.current = window.setInterval(() => {
      setVals(Array.from({ length: p.count }, () => 1 + Math.floor(Math.random() * p.sides)));
      beep(260 + Math.random() * 260, 0.02);
      elapsed += step;
      if (elapsed >= total) {
        window.clearInterval(spin.current);
        setVals(finals); setRolling(false);
        beep(680, 0.1); window.setTimeout(() => beep(900, 0.12), 90);
      }
    }, step);
  }

  const sum = dice.reduce((a, b) => a + b, 0);

  return (
    <div className="dice">
      <div className="dice-stage">
        <div className={`dice-tray${rolling ? ' rolling' : ''}`}>
          {dice.map((v, i) => (
            <div key={i} className="die" style={{ animationDelay: `${i * 70}ms` }}>
              {p.sides === 6 ? (
                <svg viewBox="0 0 100 100" aria-label={`${v} 点`}>
                  {PIPS[v].map((c, j) => <circle key={j} cx={c[0]} cy={c[1]} r={10} />)}
                </svg>
              ) : (
                <span className="die-num">{v}</span>
              )}
            </div>
          ))}
        </div>

        <div className="dice-sum">合计 <b>{sum}</b>{dice.length > 1 && <span className="dice-detail">（{dice.join(' + ')}）</span>}</div>

        <Btn variant="coral" onClick={roll} disabled={rolling}><Icon name="dice" /> {rolling ? '掷骰中…' : '掷骰'}</Btn>
      </div>

      <div className="dice-panel">
        <div className="dice-count">
          数量
          <button onClick={() => set({ count: Math.max(1, p.count - 1) })} disabled={rolling || p.count <= 1} aria-label="减少">−</button>
          <span>{p.count}</span>
          <button onClick={() => set({ count: Math.min(6, p.count + 1) })} disabled={rolling || p.count >= 6} aria-label="增加">+</button>
        </div>
        <div className="dice-sides">
          面数
          <div className="seg">
            {SIDES.map((s) => (
              <button key={s} className={p.sides === s ? 'on' : ''} disabled={rolling} onClick={() => set({ sides: s })}>{s}</button>
            ))}
          </div>
        </div>
        <button className={`tg${p.sound ? ' on' : ''}`} onClick={() => set({ sound: !p.sound })}>
          <Icon name={p.sound ? 'volume' : 'volume-off'} size={16} /> 音效
        </button>
      </div>
    </div>
  );
}
