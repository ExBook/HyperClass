import { useRef, useState } from 'react';
import { Btn, Icon } from '../../../app/ui';
import { load, save } from '../../../core/storage';

const KEY = 'hc.latlon-grid';
const W = 720, H = 360;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const sx = (lon: number) => (lon + 180) / 360 * W;
const sy = (lat: number) => (90 - lat) / 180 * H;
const lonText = (lon: number) => { const v = Math.round(lon); return v === 0 ? '0°' : v > 0 ? `东经 ${v}°` : `西经 ${-v}°`; };
const latText = (lat: number) => { const v = Math.round(lat); return v === 0 ? '0°' : v > 0 ? `北纬 ${v}°` : `南纬 ${-v}°`; };
const randTarget = () => ({ lon: (Math.floor(Math.random() * 35) - 17) * 10, lat: (Math.floor(Math.random() * 17) - 8) * 10 });

type Mode = 'present' | 'practice';

export function LatLonGrid() {
  const init = load<{ sound?: boolean }>(KEY, {});
  const [mode, setMode] = useState<Mode>('present');
  const [sound, setSound] = useState(init.sound ?? true);
  const [marker, setMarker] = useState({ lon: 120, lat: 30 });
  const [dragging, setDragging] = useState(false);
  const [target, setTarget] = useState(randTarget);
  const [guess, setGuess] = useState<{ lon: number; lat: number } | null>(null);
  const [result, setResult] = useState<boolean | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);
  const audio = useRef<AudioContext | null>(null);

  function beep(freq: number, dur = 0.1) {
    if (!sound) return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audio.current ?? (audio.current = new Ctx());
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = freq; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.06, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch { /* audio unavailable */ }
  }

  function toCoord(clientX: number, clientY: number) {
    // 用 SVG 的屏幕变换矩阵反算到 viewBox 用户坐标,正确处理 viewBox 偏移/缩放与留白
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint(); pt.x = clientX; pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { lon: 0, lat: 0 };
    const p = pt.matrixTransform(ctm.inverse());
    return { lon: clamp(p.x / W * 360 - 180, -180, 180), lat: clamp(90 - p.y / H * 180, -90, 90) };
  }

  function onDown(e: React.PointerEvent) {
    if (mode === 'present') {
      setDragging(true);
      svgRef.current?.setPointerCapture(e.pointerId);
      setMarker(toCoord(e.clientX, e.clientY));
    } else if (result === null) {
      const raw = toCoord(e.clientX, e.clientY);
      const g = { lon: Math.round(raw.lon / 5) * 5, lat: Math.round(raw.lat / 5) * 5 }; // 吸附到最近 5°
      setGuess(g);
      const ok = Math.abs(g.lon - target.lon) <= 5 && Math.abs(g.lat - target.lat) <= 5;
      setResult(ok);
      setScore((s) => ({ right: s.right + (ok ? 1 : 0), total: s.total + 1 }));
      if (ok) { beep(880, 0.1); window.setTimeout(() => beep(1175, 0.14), 90); } else beep(200, 0.16);
    }
  }
  function onMove(e: React.PointerEvent) { if (mode === 'present' && dragging) setMarker(toCoord(e.clientX, e.clientY)); }
  function onUp() { setDragging(false); }
  function next() { setTarget(randTarget()); setGuess(null); setResult(null); }
  function chooseMode(m: Mode) { setMode(m); setGuess(null); setResult(null); }
  function toggleSound() { setSound((s) => { const v = !s; save(KEY, { sound: v }); return v; }); }

  const lons: number[] = []; for (let l = -180; l <= 180; l += 10) lons.push(l);
  const lats: number[] = []; for (let l = -90; l <= 90; l += 10) lats.push(l);
  const axisLon = [-180, -120, -60, 0, 60, 120, 180];
  const axisLat = [90, 60, 30, 0, -30, -60, -90];

  return (
    <div className="ll">
      <div className="ll-bar">
        <div className="seg">
          <button className={mode === 'present' ? 'on' : ''} onClick={() => chooseMode('present')}>演示</button>
          <button className={mode === 'practice' ? 'on' : ''} onClick={() => chooseMode('practice')}>练习</button>
        </div>
        {mode === 'present' ? (
          <div className="ll-read">经度 <b>{lonText(marker.lon)}</b> · 纬度 <b>{latText(marker.lat)}</b></div>
        ) : (
          <>
            <div className="ll-read">目标:<b>{lonText(target.lon)},{latText(target.lat)}</b></div>
            {result !== null && <span className={`ll-result ${result ? 'ok' : 'no'}`}>{result ? '✓ 正确' : '✗ 再看看'}</span>}
            <span className="ll-score">得分 {score.right} / {score.total}</span>
          </>
        )}
        <div style={{ flex: 1 }} />
        {mode === 'practice' && <Btn variant="coral" onClick={next} disabled={result === null}><Icon name="refresh" /> 下一题</Btn>}
        <button className={`tg${sound ? ' on' : ''}`} onClick={toggleSound}><Icon name={sound ? 'volume' : 'volume-off'} size={16} /> 音效</button>
      </div>

      <div className="ll-board">
        <svg ref={svgRef} viewBox={`-46 -18 ${W + 76} ${H + 52}`} className="ll-svg"
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} xmlns="http://www.w3.org/2000/svg">
          {lons.map((l) => <line key={`o${l}`} x1={sx(l)} y1={0} x2={sx(l)} y2={H} className={l === 0 ? 'll-pm' : l % 30 === 0 ? 'll-major' : 'll-grid'} />)}
          {lats.map((l) => <line key={`a${l}`} x1={0} y1={sy(l)} x2={W} y2={sy(l)} className={l === 0 ? 'll-eq' : l % 30 === 0 ? 'll-major' : 'll-grid'} />)}
          {axisLon.map((l) => <text key={`lx${l}`} x={sx(l)} y={H + 18} className="ll-tick" textAnchor="middle">{l === 0 ? '0°' : l > 0 ? `${l}°E` : `${-l}°W`}</text>)}
          {axisLat.map((l) => <text key={`ly${l}`} x={-8} y={sy(l) + 4} className="ll-tick" textAnchor="end">{l === 0 ? '0°' : l > 0 ? `${l}°N` : `${-l}°S`}</text>)}
          {mode === 'present' && <>
            <line x1={sx(marker.lon)} y1={0} x2={sx(marker.lon)} y2={H} className="ll-cross" />
            <line x1={0} y1={sy(marker.lat)} x2={W} y2={sy(marker.lat)} className="ll-cross" />
            <circle cx={sx(marker.lon)} cy={sy(marker.lat)} r={7} className="ll-marker" />
          </>}
          {mode === 'practice' && guess && <circle cx={sx(guess.lon)} cy={sy(guess.lat)} r={7} className="ll-marker" />}
          {mode === 'practice' && result !== null && <circle cx={sx(target.lon)} cy={sy(target.lat)} r={10} className="ll-target" />}
        </svg>
      </div>
    </div>
  );
}
