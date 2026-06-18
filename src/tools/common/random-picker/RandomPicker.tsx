import { useEffect, useRef, useState } from 'react';
import { Btn, Icon } from '../../../app/ui';
import { load, save } from '../../../core/storage';

const KEY = 'hc.random-picker';
const ROLL = [50, 50, 55, 60, 70, 85, 105, 130, 160, 195, 240, 300];

type Mode = 'names' | 'numbers';
type Prefs = {
  mode: Mode; text: string; min: number; max: number;
  noRepeat: boolean; count: number; sound: boolean; speak: boolean;
};
const DEFAULTS: Prefs = {
  mode: 'names', text: '', min: 1, max: 45,
  noRepeat: true, count: 1, sound: true, speak: false,
};

export function RandomPicker() {
  const [p, setP] = useState<Prefs>(() => ({ ...DEFAULTS, ...load<Partial<Prefs>>(KEY, {}) }));
  const set = (patch: Partial<Prefs>) =>
    setP((prev) => { const next = { ...prev, ...patch }; save(KEY, next); return next; });

  const [picked, setPicked] = useState<string[]>([]);
  const [result, setResult] = useState<string[] | null>(null);
  const [roll, setRoll] = useState<string | null>(null);
  const rolling = roll !== null;
  const timer = useRef<number | undefined>(undefined);
  const audio = useRef<AudioContext | null>(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function candidates(): string[] {
    if (p.mode === 'numbers') {
      const a = Math.min(p.min, p.max), b = Math.max(p.min, p.max);
      const out: string[] = [];
      for (let i = a; i <= b && out.length < 1000; i++) out.push(String(i));
      return out;
    }
    return p.text.split('\n').map((s) => s.trim()).filter(Boolean);
  }
  const all = candidates();
  const pool = p.noRepeat ? all.filter((x) => !picked.includes(x)) : all;

  function beep(freq: number, dur = 0.05) {
    if (!p.sound) return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audio.current ?? (audio.current = new Ctx());
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = freq;
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.06, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch { /* audio unavailable */ }
  }

  function speakOut(names: string[]) {
    if (!p.speak || !('speechSynthesis' in window)) return;
    try {
      const u = new SpeechSynthesisUtterance(names.join('、'));
      u.lang = 'zh-CN';
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch { /* tts unavailable */ }
  }

  function shuffleTake(arr: string[], k: number): string[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a.slice(0, Math.min(k, a.length));
  }

  function pick() {
    if (rolling || pool.length === 0) return;
    const k = Math.max(1, Math.min(p.count, pool.length));
    const finals = shuffleTake(pool, k);
    setResult(null);
    let i = 0;
    const tick = () => {
      setRoll(pool[Math.floor(Math.random() * pool.length)] ?? '');
      beep(660, 0.03);
      i++;
      if (i >= ROLL.length) {
        timer.current = window.setTimeout(() => {
          setRoll(null);
          setResult(finals);
          if (p.noRepeat) setPicked((prev) => [...prev, ...finals]);
          beep(880, 0.12);
          window.setTimeout(() => beep(1175, 0.18), 90);
          speakOut(finals);
        }, 300);
        return;
      }
      timer.current = window.setTimeout(tick, ROLL[i]);
    };
    tick();
  }

  function reset() {
    window.clearTimeout(timer.current);
    setPicked([]); setResult(null); setRoll(null);
  }

  function switchMode(mode: Mode) {
    if (mode === p.mode) return;
    reset();
    set({ mode });
  }

  const placeholder = all.length ? '点「抽取」开始' : (p.mode === 'numbers' ? '设好范围 →' : '先准备名单 →');
  const single = result && result.length === 1;

  return (
    <div className="picker">
      <div className="picker-stage">
        {result && !single ? (
          <div className="picker-multi">
            {result.map((n) => <span key={n} className="picker-chip">{n}</span>)}
          </div>
        ) : (
          <div className={`picker-name${rolling ? ' rolling' : ''}${single ? ' landed' : ''}`}>
            {roll ?? result?.[0] ?? placeholder}
          </div>
        )}
        <div className="picker-meta">
          剩余 {pool.length} / {all.length}{p.noRepeat && picked.length ? ` · 已抽 ${picked.length}` : ''}
        </div>
        <div className="picker-actions">
          <Btn variant="coral" onClick={pick} disabled={rolling || pool.length === 0}>
            <Icon name="hand-finger" /> {rolling ? '抽取中…' : '抽取'}
          </Btn>
          <Btn onClick={reset} disabled={rolling || (picked.length === 0 && !result)}>
            <Icon name="refresh" /> 重置
          </Btn>
        </div>
        <div className="picker-toggles">
          <button className={`tg${p.sound ? ' on' : ''}`} onClick={() => set({ sound: !p.sound })}>
            <Icon name={p.sound ? 'volume' : 'volume-off'} size={16} /> 音效
          </button>
          <button className={`tg${p.speak ? ' on' : ''}`} onClick={() => set({ speak: !p.speak })}>
            <Icon name="microphone" size={16} /> 朗读
          </button>
          <button className={`tg${p.noRepeat ? ' on' : ''}`} onClick={() => set({ noRepeat: !p.noRepeat })}>
            <Icon name="rotate-2" size={16} /> 不重复
          </button>
        </div>
      </div>

      <div className="picker-side">
        <div className="seg">
          <button className={p.mode === 'names' ? 'on' : ''} onClick={() => switchMode('names')}>名单</button>
          <button className={p.mode === 'numbers' ? 'on' : ''} onClick={() => switchMode('numbers')}>学号</button>
        </div>

        {p.mode === 'names' ? (
          <textarea
            className="picker-input"
            value={p.text}
            onChange={(e) => set({ text: e.target.value })}
            placeholder={'张三\n李四\n王五'}
          />
        ) : (
          <div className="num-range">
            <label>从<input type="number" value={p.min} onChange={(e) => set({ min: Number(e.target.value) || 1 })} /></label>
            <label>到<input type="number" value={p.max} onChange={(e) => set({ max: Number(e.target.value) || 1 })} /></label>
          </div>
        )}

        <div className="count-row">
          一次抽
          <input type="number" min={1} value={p.count} onChange={(e) => set({ count: Math.max(1, Number(e.target.value) || 1) })} />
          个
        </div>

        {picked.length > 0 && <div className="history"><span>已抽</span>{picked.join('、')}</div>}
      </div>
    </div>
  );
}
