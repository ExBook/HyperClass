/* eslint-disable react-hooks/purity -- 命令式转盘动画:随机落点与 rAF 计时在事件回调中执行,非渲染期 */
import { useEffect, useRef, useState } from 'react';
import { Btn, Icon } from '../../../app/ui';
import { load, save } from '../../../core/storage';

const KEY = 'hc.spinner';
const PALETTE = ['#FF6B6B', '#15A98B', '#378ADD', '#E1A100', '#6AB04C', '#7F77DD', '#D6336C', '#BA7517'];
const CX = 160, CY = 160, R = 150;
const DEFAULT_TEXT = '张三\n李四\n王五\n赵六\n钱七\n孙八';

type Prefs = { text: string; sound: boolean; remove: boolean };
const DEFAULTS: Prefs = { text: DEFAULT_TEXT, sound: true, remove: false };

// 极坐标 -> 直角坐标(角度从正上方顺时针)
const pt = (r: number, deg: number): [number, number] => {
  const a = (deg - 90) * Math.PI / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
};

export function Spinner() {
  const [p, setP] = useState<Prefs>(() => ({ ...DEFAULTS, ...load<Partial<Prefs>>(KEY, {}) }));
  const set = (patch: Partial<Prefs>) => setP((prev) => { const n = { ...prev, ...patch }; save(KEY, n); return n; });

  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const raf = useRef<number | undefined>(undefined);
  const lastSec = useRef(-1);
  const audio = useRef<AudioContext | null>(null);

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  const items = p.text.split('\n').map((s) => s.trim()).filter(Boolean);
  const n = items.length;
  const seg = n > 0 ? 360 / n : 360;

  function beep(freq: number, dur = 0.03, type: OscillatorType = 'triangle', vol = 0.05) {
    if (!p.sound) return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audio.current ?? (audio.current = new Ctx());
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = freq; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(vol, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch { /* audio unavailable */ }
  }
  const fanfare = () => [523, 659, 784, 1047].forEach((f, i) => window.setTimeout(() => beep(f, 0.18, 'triangle', 0.07), i * 110));

  // 指针(正上方)下当前落在哪个扇区
  const sectorAt = (r: number) => (n ? Math.floor((((-r) % 360) + 360) % 360 / seg) % n : 0);

  function spin() {
    if (spinning || n < 2) return;
    setWinner(null); setSpinning(true);
    const w = Math.floor(Math.random() * n);
    const start = rot;
    // 让 w 的中心停在正上方指针处:rot ≡ -(w+0.5)*seg (mod 360)
    const targetMod = ((360 - (w + 0.5) * seg) % 360 + 360) % 360;
    let end = start - (((start % 360) + 360) % 360) + targetMod;
    if (end <= start + 1) end += 360;
    end += 360 * (4 + Math.floor(Math.random() * 2)); // 多转几圈
    const dur = 4200 + Math.random() * 800;
    const t0 = performance.now();
    lastSec.current = sectorAt(start);
    const ease = (x: number) => 1 - Math.pow(1 - x, 3); // easeOutCubic
    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      const cur = start + (end - start) * ease(t);
      setRot(cur);
      const s = sectorAt(cur);
      if (s !== lastSec.current) { lastSec.current = s; beep(620, 0.025, 'square', 0.04); }
      if (t < 1) { raf.current = requestAnimationFrame(frame); }
      else {
        setSpinning(false); setWinner(w); fanfare();
        if (p.remove) window.setTimeout(() => removeItem(w), 1200);
      }
    };
    raf.current = requestAnimationFrame(frame);
  }

  function removeItem(i: number) {
    const next = items.filter((_, k) => k !== i);
    set({ text: next.join('\n') }); setWinner(null);
  }
  function reset() { if (raf.current) cancelAnimationFrame(raf.current); setSpinning(false); setWinner(null); setRot(0); }

  const result = winner != null ? items[winner] : null;

  return (
    <div className="wheel">
      <div className="wheel-stage">
        <div className="wheel-wrap">
          <div className="wheel-pointer" />
          <svg viewBox="0 0 320 320" className="wheel-svg">
            <g transform={`rotate(${rot} ${CX} ${CY})`} style={{ willChange: 'transform' }}>
              {n >= 2 ? items.map((label, i) => {
                const a0 = i * seg, a1 = (i + 1) * seg;
                const [x0, y0] = pt(R, a0), [x1, y1] = pt(R, a1);
                const large = seg > 180 ? 1 : 0;
                const mid = (i + 0.5) * seg;
                const [lx, ly] = pt(R * 0.64, mid);
                return (
                  <g key={i}>
                    <path d={`M ${CX} ${CY} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`}
                      fill={PALETTE[i % PALETTE.length]} stroke="var(--paper)" strokeWidth={2}
                      opacity={winner != null && winner !== i ? 0.38 : 1} />
                    <text x={lx} y={ly} fill="#fff" fontSize={n > 12 ? 11 : n > 8 ? 13 : 15} fontWeight={700} textAnchor="middle" dominantBaseline="middle"
                      style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.22)', strokeWidth: 2.5 }}>
                      {label.length > 5 ? label.slice(0, 5) + '…' : label}
                    </text>
                  </g>
                );
              }) : (
                <circle cx={CX} cy={CY} r={R} fill="var(--paper-2)" />
              )}
            </g>
            <circle cx={CX} cy={CY} r={20} fill="var(--paper)" stroke="var(--rule)" strokeWidth={2} />
          </svg>
          {result && <div className="wheel-result">{result}</div>}
        </div>

        <div className="wheel-actions">
          <Btn variant="coral" onClick={spin} disabled={spinning || n < 2}><Icon name="chart-pie" /> {spinning ? '转动中…' : '开始'}</Btn>
          <Btn onClick={reset} disabled={spinning}><Icon name="refresh" /> 复位</Btn>
        </div>
        {n < 2 && <p className="wheel-hint">至少输入 2 个选项 →</p>}
      </div>

      <div className="wheel-side">
        <div className="wheel-side-head">选项 <span>{n}</span></div>
        <textarea className="wheel-input" value={p.text} disabled={spinning}
          onChange={(e) => set({ text: e.target.value })} placeholder={'每行一个选项'} />
        <div className="wheel-toggles">
          <button className={`tg${p.sound ? ' on' : ''}`} onClick={() => set({ sound: !p.sound })}>
            <Icon name={p.sound ? 'volume' : 'volume-off'} size={16} /> 音效
          </button>
          <button className={`tg${p.remove ? ' on' : ''}`} onClick={() => set({ remove: !p.remove })}>
            <Icon name="rotate-2" size={16} /> 抽中后移除
          </button>
        </div>
      </div>
    </div>
  );
}
