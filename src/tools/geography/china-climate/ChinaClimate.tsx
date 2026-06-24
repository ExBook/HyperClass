import { useEffect, useMemo, useRef, useState } from 'react';
import { geoPath } from 'd3-geo';
import { ensureWinding } from '../../../primitives/drag-label/geo';
import { buildProjection } from '../../../primitives/drag-label/projection';
import type { FeatureMap } from '../../../primitives/drag-label/types';
import { Btn, Icon } from '../../../app/ui';
import { BOUNDARIES, CLIMATES, RENDER_ORDER, byId, zoneAt } from './climate';

const MAP_URL = import.meta.env.BASE_URL + 'content/geography/china-provinces/map.json';
const W = 800, H = 600;
type Mode = 'present' | 'practice';

// 不透明柔和色:把气候色向奶油底色混合,得到实色(上层干净盖下层,绝不透叠)
function tint(hex: string) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const k = 0.45, mix = (c: number, d: number) => Math.round(c * (1 - k) + d * k);
  return `rgb(${mix(r, 0xF4)}, ${mix(g, 0xED)}, ${mix(b, 0xD9)})`;
}

export function ChinaClimate() {
  const [geo, setGeo] = useState<FeatureMap | null>(null);
  const [mode, setMode] = useState<Mode>('present');
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [graded, setGraded] = useState(false);
  const [drag, setDrag] = useState<{ id: string; name: string; x: number; y: number } | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [sound, setSound] = useState(true);
  const boardRef = useRef<SVGSVGElement | null>(null);
  const audio = useRef<AudioContext | null>(null);

  useEffect(() => { let on = true; fetch(MAP_URL).then((r) => r.json()).then((d) => { if (on) setGeo(d as FeatureMap); }).catch(() => {}); return () => { on = false; }; }, []);

  const wound = useMemo(() => (geo ? ensureWinding(geo) : null), [geo]);
  const proj = useMemo(() => (wound ? buildProjection(wound, W, H) : null), [wound]);
  const pathGen = useMemo(() => (proj ? geoPath(proj) : null), [proj]);

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

  function clickZone(clientX: number, clientY: number): string | null {
    const svg = boardRef.current; if (!svg || !proj) return null;
    const pt = svg.createSVGPoint(); pt.x = clientX; pt.y = clientY;
    const ctm = svg.getScreenCTM(); if (!ctm) return null;
    const p = pt.matrixTransform(ctm.inverse());
    const ll = proj.invert?.([p.x, p.y]); if (!ll) return null;
    return zoneAt(ll[0], ll[1]);
  }

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => { setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : null)); setHover(clickZone(e.clientX, e.clientY)); };
    const up = (e: PointerEvent) => { const z = clickZone(e.clientX, e.clientY); if (z) assign(drag.id, z); setDrag(null); setHover(null); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, proj]);

  function assign(labelId: string, zoneId: string) {
    if (graded) return;
    setPlacements((prev) => { const n = { ...prev }; for (const k of Object.keys(n)) if (n[k] === zoneId) delete n[k]; n[labelId] = zoneId; return n; });
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

  if (!geo || !wound || !pathGen || !proj) return <div className="hc-loading">地图加载中…</div>;

  const isPractice = mode === 'practice';
  const showColors = !isPractice || graded;
  const unplaced = CLIMATES.filter((cl) => !(cl.id in placements));
  const placedCount = Object.keys(placements).length;
  const correctCount = CLIMATES.filter((cl) => placements[cl.id] === cl.id).length;
  const allCorrect = graded && correctCount === CLIMATES.length;
  // 直接投影顶点画平面多边形,避免 geoPath 球面卷绕把多边形反转
  const zonePoints = (id: string) => byId(id)!.ring
    .map(([lon, lat]) => { const p = proj([lon, lat]) as [number, number]; return `${p[0].toFixed(1)},${p[1].toFixed(1)}`; })
    .join(' ');

  const chinaPath = wound.features.map((f) => pathGen(f) ?? '').join(' ');
  const projPts = (pts: [number, number][]) => pts
    .map(([lon, lat]) => { const p = proj([lon, lat]) as [number, number]; return `${p[0].toFixed(1)},${p[1].toFixed(1)}`; })
    .join(' ');
  const shownLabels = isPractice
    ? Object.entries(placements).map(([labelId, zoneId]) => ({ labelId, zoneId }))
    : CLIMATES.map((cl) => ({ labelId: cl.id, zoneId: cl.id }));

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
                  onPointerDown={(e) => setDrag({ id: cl.id, name: cl.name, x: e.clientX, y: e.clientY })}>{cl.name}</li>
              ))}
            </ul>
            {unplaced.length === 0 && <p className="dl-hint">都放好了,点「提交批改」</p>}
          </div>
        )}
        <div className="dl-board">
          <svg ref={boardRef} className="dl-map" viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg">
            <defs><clipPath id="cnclip"><path d={chinaPath} /></clipPath></defs>
            {wound.features.map((f) => <path key={f.properties.id} d={pathGen(f) ?? ''} fill="rgba(44,62,80,0.05)" stroke="var(--ink-faint)" strokeWidth={0.6} />)}
            {/* 不透明实色填充:上层干净盖住下层,绝不透叠 */}
            {showColors && <g clipPath="url(#cnclip)">{RENDER_ORDER.map((id) => <polygon key={id} points={zonePoints(id)} fill={tint(byId(id)!.color)} />)}</g>}
            {/* 实色之上描省界,看清各省所属气候带 */}
            {showColors && <g clipPath="url(#cnclip)" pointerEvents="none">{wound.features.map((f) => <path key={`b${f.properties.id}`} d={pathGen(f) ?? ''} fill="none" stroke="rgba(44,62,80,0.18)" strokeWidth={0.5} />)}</g>}
            {/* 明确的气候分界线(北回归线 / 秦岭—淮河 / 季风区界 / 青藏高原边缘) */}
            {showColors && <g clipPath="url(#cnclip)" pointerEvents="none">{BOUNDARIES.map((b) => (
              <polyline key={b.id} points={projPts(b.pts)} fill="none" stroke="var(--ink)" strokeWidth={1.8} strokeOpacity={0.62} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={b.dash ? '6 4' : undefined} />
            ))}</g>}
            {showColors && BOUNDARIES.map((b) => { const p = proj(b.labelAt) as [number, number]; return (
              <text key={`l${b.id}`} x={p[0]} y={p[1]} textAnchor="middle"
                style={{ fontSize: 11, fill: 'var(--ink-soft)', paintOrder: 'stroke', stroke: 'rgba(255,255,255,0.85)', strokeWidth: 3 }}>{b.name}</text>
            ); })}
            {!showColors && drag && hover && <g clipPath="url(#cnclip)"><polygon points={zonePoints(hover)} fill="rgba(255,107,107,0.28)" stroke="var(--coral)" strokeWidth={1.8} /></g>}
            {shownLabels.map(({ labelId, zoneId }) => {
              const cl = byId(labelId)!;
              const pos = proj(byId(zoneId)!.labelAt) as [number, number];
              const fill = graded ? (labelId === zoneId ? 'var(--green)' : '#E24B4A') : 'var(--ink)';
              return <text key={labelId} x={pos[0]} y={pos[1]} className="dl-placed set" fill={fill} textAnchor="middle"
                onClick={() => isPractice && !graded && unassign(labelId)}>{cl.name}</text>;
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
