/* eslint-disable react-hooks/purity -- 命令式音量检测:rAF 循环读写 ref 在渲染期之外执行 */
import { useEffect, useRef, useState } from 'react';
import { Btn, Icon } from '../../../app/ui';
import { load, save } from '../../../core/storage';

const KEY = 'hc.noise-meter';
const CX = 160, CY = 160, R = 128;
const HIST = 56; // 历史条数(约 ~9s)
const OVER_HOLD = 1200; // 持续超阈值多久判定"太吵"(ms)

type Prefs = { threshold: number; sound: boolean };
const DEFAULTS: Prefs = { threshold: 65, sound: false };

// 半圆仪表:level(0..100) -> 弧上点(180°在左,0°在右)
const arcPt = (r: number, level: number): [number, number] => {
  const deg = 180 - (level / 100) * 180, a = deg * Math.PI / 180;
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
};
const zoneColor = (l: number) => (l < 45 ? '#15A98B' : l < 70 ? '#E1A100' : '#E24B4A');

export function NoiseMeter() {
  const [p, setP] = useState<Prefs>(() => ({ ...DEFAULTS, ...load<Partial<Prefs>>(KEY, {}) }));
  const set = (patch: Partial<Prefs>) => setP((prev) => { const n = { ...prev, ...patch }; save(KEY, n); return n; });

  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [peak, setPeak] = useState(0);
  const [over, setOver] = useState(false);
  const [hist, setHist] = useState<number[]>([]);

  const stream = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const raf = useRef<number | undefined>(undefined);
  const smooth = useRef(0);
  const peakRef = useRef(0);
  const overSince = useRef<number | null>(null);
  const lastPush = useRef(0);
  const lastAlert = useRef(0);
  const thresholdRef = useRef(p.threshold);
  const soundRef = useRef(p.sound);
  useEffect(() => { thresholdRef.current = p.threshold; }, [p.threshold]);
  useEffect(() => { soundRef.current = p.sound; }, [p.sound]);

  function alertBeep() {
    if (!soundRef.current) return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = ctxRef.current ?? new Ctx();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = 440; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.08, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      o.start(); o.stop(ctx.currentTime + 0.25);
    } catch { /* ignore */ }
  }

  async function start() {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      stream.current = s;
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx(); ctxRef.current = ctx;
      const src = ctx.createMediaStreamSource(s);
      const an = ctx.createAnalyser(); an.fftSize = 1024; an.smoothingTimeConstant = 0.4;
      src.connect(an); analyser.current = an;
      setRunning(true);
      loop();
    } catch (e) {
      setError(e instanceof DOMException && e.name === 'NotAllowedError' ? '麦克风权限被拒绝,请在浏览器允许后重试' : '无法访问麦克风');
    }
  }

  function teardown() {
    if (raf.current) cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close().catch(() => {});
    stream.current = null; ctxRef.current = null; analyser.current = null;
  }
  useEffect(() => teardown, []); // 卸载时停止麦克风
  function stop() { teardown(); setRunning(false); setLevel(0); setOver(false); overSince.current = null; }

  function loop() {
    const an = analyser.current; if (!an) return;
    const buf = new Uint8Array(an.fftSize);
    an.getByteTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
    const rms = Math.sqrt(sum / buf.length);
    const db = 20 * Math.log10(rms + 1e-7);          // ~ -70(静) .. 0(满)
    const lvl = Math.max(0, Math.min(100, (db + 55) / 55 * 100));
    smooth.current += (lvl - smooth.current) * 0.28;
    const sm = smooth.current;

    peakRef.current = Math.max(peakRef.current * 0.992, sm);

    const now = performance.now();
    // 超阈值持续判定
    if (sm >= thresholdRef.current) {
      if (overSince.current == null) overSince.current = now;
      if (now - overSince.current >= OVER_HOLD) {
        setOver(true);
        if (now - lastAlert.current > 1600) { lastAlert.current = now; alertBeep(); }
      }
    } else { overSince.current = null; setOver(false); }

    // ~30fps 推进显示与历史
    if (now - lastPush.current > 90) {
      lastPush.current = now;
      setLevel(sm); setPeak(peakRef.current);
      setHist((h) => { const n = [...h, sm]; return n.length > HIST ? n.slice(n.length - HIST) : n; });
    }
    raf.current = requestAnimationFrame(loop);
  }

  const bgArc = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;
  const [tx, ty] = arcPt(R + 10, p.threshold);
  const [ti] = [arcPt(R - 14, p.threshold)];
  const status = !running ? '未开始' : over ? '太吵啦!' : level < 45 ? '安静' : level < 70 ? '正常' : '偏吵';

  return (
    <div className={`nm${over ? ' over' : ''}`}>
      <div className="nm-stage">
        <div className="nm-gauge">
          <svg viewBox="0 0 320 200">
            <defs>
              <linearGradient id="nm-grad" x1={CX - R} y1="0" x2={CX + R} y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#15A98B" /><stop offset="0.55" stopColor="#E1A100" /><stop offset="1" stopColor="#E24B4A" />
              </linearGradient>
            </defs>
            <path d={bgArc} fill="none" stroke="var(--rule)" strokeWidth={20} strokeLinecap="round" />
            <path d={bgArc} fill="none" stroke="url(#nm-grad)" strokeWidth={20} strokeLinecap="round"
              pathLength={100} strokeDasharray={`${level} 100`} style={{ transition: 'stroke-dasharray 0.1s linear' }} />
            {/* 阈值标记 */}
            <line x1={ti[0]} y1={ti[1]} x2={tx} y2={ty} stroke="var(--ink)" strokeWidth={2.5} strokeLinecap="round" />
            <text x={tx} y={ty - 4} fontSize={11} fill="var(--ink-soft)" textAnchor="middle">阈值</text>
            {/* 峰值小三角 */}
            {running && (() => { const [px, py] = arcPt(R, peak); return <circle cx={px} cy={py} r={4} fill="var(--ink)" />; })()}
          </svg>
          <div className="nm-readout">
            <div className="nm-level">{Math.round(level)}</div>
            <div className={`nm-status s-${over ? 'over' : level < 45 ? 'calm' : level < 70 ? 'ok' : 'loud'}`}>
              <Icon name={over ? 'bell-ringing' : 'mood-smile'} size={18} /> {status}
            </div>
          </div>
        </div>

        {/* 历史声浪 */}
        <div className="nm-hist">
          {hist.map((v, i) => (
            <span key={i} className="nm-bar" style={{ height: `${Math.max(3, v)}%`, background: zoneColor(v), opacity: 0.35 + (i / HIST) * 0.65 }} />
          ))}
        </div>

        {error && <div className="nm-error">{error}</div>}

        <div className="nm-actions">
          {running
            ? <Btn variant="coral" onClick={stop}><Icon name="player-pause" /> 停止</Btn>
            : <Btn variant="coral" onClick={start}><Icon name="microphone" /> 开始检测</Btn>}
        </div>
      </div>

      <div className="nm-panel">
        <div className="nm-thresh">
          <label>报警阈值 <b>{p.threshold}</b></label>
          <input type="range" min={20} max={95} value={p.threshold} onChange={(e) => set({ threshold: Number(e.target.value) })} />
          <div className="nm-thresh-hint">超过该音量并持续约 1 秒即提醒</div>
        </div>
        <button className={`tg${p.sound ? ' on' : ''}`} onClick={() => set({ sound: !p.sound })}>
          <Icon name={p.sound ? 'volume' : 'volume-off'} size={16} /> 报警声
        </button>
        {over && <div className="nm-overflag"><Icon name="bell-ringing" size={16} /> 请安静</div>}
      </div>
    </div>
  );
}
