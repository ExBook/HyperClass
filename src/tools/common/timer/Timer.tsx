import { useEffect, useRef, useState } from 'react';
import { Btn, Icon } from '../../../app/ui';
import { load, save } from '../../../core/storage';

const KEY = 'hc.timer';
const PRESETS = [60, 180, 300, 600];
type Mode = 'down' | 'up';
type Status = 'idle' | 'running' | 'paused' | 'done';

function fmt(ms: number, ceil: boolean): string {
  const s = Math.max(0, ceil ? Math.ceil(ms / 1000) : Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(ss)}` : `${pad(m)}:${pad(ss)}`;
}

export function Timer() {
  const init = load<{ mode?: Mode; durationSec?: number; sound?: boolean }>(KEY, {});
  const [mode, setMode] = useState<Mode>(init.mode ?? 'down');
  const [durationSec, setDurationSec] = useState<number>(init.durationSec ?? 180);
  const [sound, setSound] = useState<boolean>(init.sound ?? true);
  const [leftMs, setLeftMs] = useState<number>((init.durationSec ?? 180) * 1000);
  const [upMs, setUpMs] = useState<number>(0);
  const [status, setStatus] = useState<Status>('idle');

  const deadline = useRef(0), startAnchor = useRef(0), lastSec = useRef(-1);
  const audio = useRef<AudioContext | null>(null);

  useEffect(() => { save(KEY, { mode, durationSec, sound }); }, [mode, durationSec, sound]);

  function beep(freq: number, dur = 0.12) {
    if (!sound) return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audio.current ?? (audio.current = new Ctx());
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = freq;
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.08, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch { /* audio unavailable */ }
  }
  function alarm() { [880, 1175, 880, 1175].forEach((f, i) => setTimeout(() => beep(f, 0.2), i * 240)); }

  useEffect(() => {
    if (status !== 'running') return;
    const id = setInterval(() => {
      if (mode === 'down') {
        const left = Math.max(0, deadline.current - Date.now());
        setLeftMs(left);
        const sec = Math.ceil(left / 1000);
        if (sec <= 3 && sec > 0 && sec !== lastSec.current) { lastSec.current = sec; beep(700, 0.09); }
        if (left <= 0) { setStatus('done'); lastSec.current = -1; alarm(); }
      } else {
        setUpMs(Date.now() - startAnchor.current);
      }
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, mode, sound]);

  function run() {
    if (mode === 'down') {
      const ms = leftMs > 0 ? leftMs : durationSec * 1000;
      if (ms <= 0) return;
      setLeftMs(ms);
      deadline.current = Date.now() + ms;
    } else {
      startAnchor.current = Date.now() - upMs;
    }
    setStatus('running');
  }
  function pause() { setStatus('paused'); }
  function reset() { setStatus('idle'); setLeftMs(durationSec * 1000); setUpMs(0); lastSec.current = -1; }
  function chooseMode(m: Mode) { if (m === mode) return; setMode(m); setStatus('idle'); setLeftMs(durationSec * 1000); setUpMs(0); }
  function setPreset(sec: number) { setDurationSec(sec); setLeftMs(sec * 1000); setStatus('idle'); }
  function setCustom(min: number, sec: number) { const t = Math.max(1, min * 60 + sec); setDurationSec(t); setLeftMs(t * 1000); setStatus('idle'); }

  const total = durationSec * 1000;
  const frac = total > 0 ? leftMs / total : 0;
  const warn = mode === 'down' && status !== 'idle' && leftMs <= 10000 && leftMs > 0;
  const done = status === 'done';
  const display = mode === 'down' ? fmt(leftMs, true) : fmt(upMs, false);
  const min = Math.floor(durationSec / 60), sec = durationSec % 60;
  const R = 130, C = 2 * Math.PI * R;

  return (
    <div className="timer">
      <div className="timer-stage">
        {mode === 'down' ? (
          <div className={`timer-ring${warn ? ' warn' : ''}`}>
            <svg viewBox="0 0 300 300">
              <circle cx="150" cy="150" r={R} fill="none" stroke="var(--rule)" strokeWidth="14" />
              <circle
                cx="150" cy="150" r={R} fill="none" strokeWidth="14" strokeLinecap="round"
                stroke={warn ? 'var(--coral)' : 'var(--teal)'}
                strokeDasharray={C} strokeDashoffset={C * (1 - frac)}
                style={{ transition: 'stroke-dashoffset 0.2s linear' }}
              />
            </svg>
            <div className="timer-time">{display}</div>
          </div>
        ) : (
          <div className="timer-time up">{display}</div>
        )}

        {done && <div className="timer-done"><Icon name="bell-ringing" /> 时间到</div>}

        <div className="timer-controls">
          {status === 'running'
            ? <Btn variant="coral" onClick={pause}><Icon name="player-pause" /> 暂停</Btn>
            : <Btn variant="coral" onClick={run} disabled={done}><Icon name="player-play" /> {status === 'paused' ? '继续' : '开始'}</Btn>}
          <Btn onClick={reset} disabled={status === 'idle'}><Icon name="refresh" /> 重置</Btn>
        </div>
      </div>

      <div className="timer-panel">
        <div className="seg">
          <button className={mode === 'down' ? 'on' : ''} onClick={() => chooseMode('down')}>倒计时</button>
          <button className={mode === 'up' ? 'on' : ''} onClick={() => chooseMode('up')}>正计时</button>
        </div>
        {mode === 'down' && (
          <>
            <div className="timer-presets">
              {PRESETS.map((s) => (
                <button key={s} className={`preset${durationSec === s ? ' on' : ''}`} onClick={() => setPreset(s)} disabled={status === 'running'}>
                  {s / 60} 分
                </button>
              ))}
            </div>
            <div className="timer-custom">
              自定义
              <input type="number" min={0} value={min} onChange={(e) => setCustom(Math.max(0, Number(e.target.value) || 0), sec)} disabled={status === 'running'} /> 分
              <input type="number" min={0} max={59} value={sec} onChange={(e) => setCustom(min, Math.max(0, Number(e.target.value) || 0))} disabled={status === 'running'} /> 秒
            </div>
          </>
        )}
        <button className={`tg${sound ? ' on' : ''}`} onClick={() => setSound((s) => !s)}>
          <Icon name={sound ? 'volume' : 'volume-off'} size={16} /> 响铃
        </button>
      </div>
    </div>
  );
}
