import { useEffect, useMemo, useRef, useState } from 'react';
import { geoPath } from 'd3-geo';
import { ensureWinding } from '../../../primitives/drag-label/geo';
import { buildProjection } from '../../../primitives/drag-label/projection';
import type { FeatureMap } from '../../../primitives/drag-label/types';
import { Btn, Icon } from '../../../app/ui';
import { CLIMATES, PROVINCE_CLIMATE } from './climate';

const MAP_URL = import.meta.env.BASE_URL + 'content/geography/china-provinces/map.json';
const W = 800, H = 600;
type Mode = 'present' | 'practice';

function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export function ChinaClimate() {
  const [geo, setGeo] = useState<FeatureMap | null>(null);
  const [mode, setMode] = useState<Mode>('present');
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [graded, setGraded] = useState(false);
  const [drag, setDrag] = useState<{ id: string; name: string; x: number; y: number } | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const boardRef = useRef<SVGSVGElement | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const [sound, setSound] = useState(true);

  useEffect(() => { let on = true; fetch(MAP_URL).then((r) => r.json()).then((d) => { if (on) setGeo(d as FeatureMap); }).catch(() => {}); return () => { on = false; }; }, []);

  const wound = useMemo(() => (geo ? ensureWinding(geo) : null), [geo]);
  const pathGen = useMemo(() => (wound ? geoPath(buildProjection(wound, W, H)) : null), [wound]);
  const featCentroids = useMemo(() => {
    const m = new Map<string, [number, number]>();
    if (wound && pathGen) for (const f of wound.features) { const c = pathGen.centroid(f); if (Number.isFinite(c[0])) m.set(f.properties.id, c); }
    return m;
  }, [wound, pathGen]);
  const regionCentroid = useMemo(() => {
    const m = new Map<string, [number, number]>();
    for (const cl of CLIMATES) {
      const pts = Object.keys(PROVINCE_CLIMATE).filter((p) => PROVINCE_CLIMATE[p] === cl.id).map((p) => featCentroids.get(p)).filter(Boolean) as [number, number][];
      if (pts.length) m.set(cl.id, [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length]);
    }
    return m;
  }, [featCentroids]);

  function beep(freq: number, dur = 0.08) {
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

  function toSvg(cx: number, cy: number): [number, number] | null {
    const svg = boardRef.current; if (!svg) return null;
    const pt = svg.createSVGPoint(); pt.x = cx; pt.y = cy;
    const ctm = svg.getScreenCTM(); if (!ctm) return null;
    const p = pt.matrixTransform(ctm.inverse()); return [p.x, p.y];
  }
  function nearestClimate(sx: number, sy: number): string | null {
    let best: string | null = null, bd = Infinity;
    for (const [id, [x, y]] of featCentroids) { const d = (x - sx) ** 2 + (y - sy) ** 2; if (d < bd) { bd = d; best = id; } }
    return best ? PROVINCE_CLIMATE[best] ?? null : null;
  }

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => { setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : null)); const s = toSvg(e.clientX, e.clientY); if (s) setHover(nearestClimate(s[0], s[1])); };
    const up = (e: PointerEvent) => { const s = toSvg(e.clientX, e.clientY); const t = s ? nearestClimate(s[0], s[1]) : null; if (t) assign(drag.id, t); setDrag(null); setHover(null); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, featCentroids]);

  function assign(labelId: string, climateId: string) {
    if (graded) return;
    setPlacements((prev) => { const n = { ...prev }; for (const k of Object.keys(n)) if (n[k] === climateId) delete n[k]; n[labelId] = climateId; return n; });
    beep(520, 0.05);
  }
  function unassign(labelId: string) { if (graded) return; setPlacements((prev) => { const n = { ...prev }; delete n[labelId]; return n; }); }
  function setMd(m: Mode) { if (m === mode) return; setMode(m); setPlacements({}); setGraded(false); }
  function submit() {
    const placed = Object.keys(placements).length; if (!placed || graded) return;
    setGraded(true);
    const c = CLIMATES.filter((cl) => placements[cl.id] === cl.id).length;
    if (c === CLIMATES.length) [523, 659, 784, 1047].forEach((f, i) => window.setTimeout(() => beep(f, 0.2), i * 130));
    else { beep(660, 0.12); window.setTimeout(() => beep(523, 0.16), 150); }
  }
  function redo() { setPlacements({}); setGraded(false); }

  if (!geo || !wound || !pathGen) return <div className="hc-loading">地图加载中…</div>;

  const isPractice = mode === 'practice';
  const unplaced = CLIMATES.filter((cl) => !(cl.id in placements));
  const placedCount = Object.keys(placements).length;
  const correctCount = CLIMATES.filter((cl) => placements[cl.id] === cl.id).length;
  const allCorrect = graded && correctCount === CLIMATES.length;

  // 演示态:每个气候标在自己区域;练习态:已放置标签标在所分到的区域
  const shownLabels = isPractice
    ? Object.entries(placements).map(([labelId, climId]) => ({ labelId, climId }))
    : CLIMATES.map((cl) => ({ labelId: cl.id, climId: cl.id }));

  return (
    <div className="tool-wrap">
      <div className="tool-bar">
        <div className="seg">
          <button className={!isPractice ? 'on' : ''} onClick={() => setMd('present')}>演示</button>
          <button className={isPractice ? 'on' : ''} onClick={() => setMd('practice')}>练习</button>
        </div>
        {isPractice && !graded && <span className="tool-progress">已放置 {placedCount} / {CLIMATES.length}</span>}
        {isPractice && graded && <span className={`tool-score${allCorrect ? ' ok' : ''}`}>正确 {correctCount} / {CLIMATES.length}</span>}
        <div style={{ flex: 1 }} />
        <button className={`tg${sound ? ' on' : ''}`} onClick={() => setSound((s) => !s)}><Icon name={sound ? 'volume' : 'volume-off'} size={16} /> 音效</button>
        {isPractice && !graded && <Btn variant="coral" onClick={submit} disabled={placedCount === 0}><Icon name="circle-check" /> 提交批改</Btn>}
        {isPractice && graded && <Btn onClick={redo}><Icon name="refresh" /> 重做</Btn>}
      </div>

      <div className={`dl${isPractice ? '' : ' dl--present'}`}>
        {isPractice && (
          <div className="dl-side">
            <div className="dl-side-head"><span>气候类型</span><span className="dl-count">{unplaced.length} / {CLIMATES.length}</span></div>
            <ul className="dl-tags">
              {unplaced.map((cl) => (
                <li key={cl.id} className={`dl-tag${drag?.id === cl.id ? ' dragging' : ''}`}
                  style={{ borderLeft: `4px solid ${cl.color}` }}
                  onPointerDown={(e) => setDrag({ id: cl.id, name: cl.name, x: e.clientX, y: e.clientY })}>{cl.name}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="dl-board">
          <svg ref={boardRef} className="dl-map" viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg">
            {wound.features.map((f) => {
              const cid = PROVINCE_CLIMATE[f.properties.id];
              const cl = CLIMATES.find((c) => c.id === cid);
              const lit = drag && hover === cid;
              return <path key={f.properties.id} d={pathGen(f) ?? ''}
                fill={cl ? rgba(cl.color, lit ? 0.6 : 0.3) : 'rgba(44,62,80,0.05)'}
                stroke={cl ? cl.color : 'var(--ink-faint)'} strokeWidth={lit ? 1.6 : 0.7} />;
            })}
            {shownLabels.map(({ labelId, climId }) => {
              const c = regionCentroid.get(climId); if (!c) return null;
              const cl = CLIMATES.find((x) => x.id === labelId);
              const ok = graded ? labelId === climId : null; // label matches the region it's on
              const fill = graded ? (ok ? 'var(--green)' : '#E24B4A') : 'var(--ink)';
              return <text key={labelId} x={c[0]} y={c[1]} className="dl-placed set" fill={fill} textAnchor="middle"
                onClick={() => isPractice && !graded && unassign(labelId)}>{cl?.name}</text>;
            })}
          </svg>
          {drag && <div className="dl-drag" style={{ left: drag.x, top: drag.y }}>{drag.name}</div>}
        </div>
      </div>

      {allCorrect && (
        <div className="hc-overlay" onClick={redo}>
          <div className="hc-overlay-card" onClick={(e) => e.stopPropagation()}>
            <div className="hc-overlay-mark"><Icon name="bell-ringing" size={34} /></div>
            <h2>全部正确!</h2>
            <p>5 种气候类型都对上了</p>
            <Btn variant="coral" onClick={redo}><Icon name="refresh" /> 再来一次</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
