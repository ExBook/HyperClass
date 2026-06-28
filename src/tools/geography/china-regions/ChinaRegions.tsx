import { useEffect, useMemo, useRef, useState } from 'react';
import { geoPath } from 'd3-geo';
import { ensureWinding } from '../../../primitives/drag-label/geo';
import { buildProjection } from '../../../primitives/drag-label/projection';
import type { FeatureMap } from '../../../primitives/drag-label/types';
import { Btn, Icon } from '../../../app/ui';
import { BOUNDARIES, REGIONS, RENDER_ORDER, byId, zoneAt } from './regions';

const MAP_URL = import.meta.env.BASE_URL + 'content/geography/china-provinces/map.json';
const W = 800, H = 600;
type Mode = 'present' | 'practice';

function tint(hex: string) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const k = 0.45, mix = (c: number, d: number) => Math.round(c * (1 - k) + d * k);
  return `rgb(${mix(r, 0xF4)}, ${mix(g, 0xED)}, ${mix(b, 0xD9)})`;
}

export function ChinaRegions() {
  const [geo, setGeo] = useState<FeatureMap | null>(null);
  const [mode, setMode] = useState<Mode>('present');
  const [focus, setFocus] = useState<string | null>(null);
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
  function setMd(m: Mode) { if (m === mode) return; setMode(m); setPlacements({}); setGraded(false); setFocus(null); }
  function submit() {
    const placed = Object.keys(placements).length; if (!placed || graded) return;
    setGraded(true);
    const c = REGIONS.filter((rg) => placements[rg.id] === rg.id).length;
    if (c === REGIONS.length) [523, 659, 784, 1047].forEach((f, i) => window.setTimeout(() => beep(f, 0.2), i * 130));
    else { beep(660, 0.12); window.setTimeout(() => beep(523, 0.16), 150); }
  }
  function redo() { setPlacements({}); setGraded(false); }

  if (!geo || !wound || !pathGen || !proj) return <div className="hc-loading">地图加载中…</div>;

  const isPractice = mode === 'practice';
  const showColors = !isPractice || graded;
  const unplaced = REGIONS.filter((rg) => !(rg.id in placements));
  const placedCount = Object.keys(placements).length;
  const correctCount = REGIONS.filter((rg) => placements[rg.id] === rg.id).length;
  const allCorrect = graded && correctCount === REGIONS.length;
  const highlight = isPractice ? (drag && hover ? hover : null) : focus;

  const zonePoints = (id: string) => byId(id).ring
    .map(([lon, lat]) => { const p = proj([lon, lat]) as [number, number]; return `${p[0].toFixed(1)},${p[1].toFixed(1)}`; })
    .join(' ');
  const chinaPath = wound.features.map((f) => pathGen(f) ?? '').join(' ');
  const projPts = (pts: [number, number][]) => pts
    .map(([lon, lat]) => { const p = proj([lon, lat]) as [number, number]; return `${p[0].toFixed(1)},${p[1].toFixed(1)}`; })
    .join(' ');
  const shownLabels = isPractice
    ? Object.entries(placements).map(([labelId, zoneId]) => ({ labelId, zoneId }))
    : REGIONS.map((rg) => ({ labelId: rg.id, zoneId: rg.id }));

  return (
    <div className="tool-wrap">
      <div className="tool-bar">
        <div className="seg">
          <button className={!isPractice ? 'on' : ''} onClick={() => setMd('present')}>演示</button>
          <button className={isPractice ? 'on' : ''} onClick={() => setMd('practice')}>练习</button>
        </div>
        {isPractice && !graded && <span className="tool-progress">已放置 {placedCount} / {REGIONS.length}</span>}
        {isPractice && graded && <span className={`tool-score${allCorrect ? ' ok' : ''}`}>正确 {correctCount} / {REGIONS.length}</span>}
        <div style={{ flex: 1 }} />
        <button className={`tg${sound ? ' on' : ''}`} onClick={() => setSound((s) => !s)}><Icon name={sound ? 'volume' : 'volume-off'} size={16} /> 音效</button>
        {isPractice && !graded && <Btn variant="coral" onClick={submit} disabled={placedCount === 0}><Icon name="circle-check" /> 提交批改</Btn>}
        {isPractice && graded && <Btn onClick={redo}><Icon name="refresh" /> 重做</Btn>}
      </div>

      <div className="dl">
        <div className="dl-side">
          {isPractice ? (
            <>
              <div className="dl-side-head"><span>四大区域</span><span className="dl-count">{unplaced.length} / {REGIONS.length}</span></div>
              <ul className="dl-tags">
                {unplaced.map((rg) => (
                  <li key={rg.id} className={`dl-tag${drag?.id === rg.id ? ' dragging' : ''}`}
                    onPointerDown={(e) => setDrag({ id: rg.id, name: rg.name, x: e.clientX, y: e.clientY })}>{rg.name}</li>
                ))}
              </ul>
              {unplaced.length === 0 && <p className="dl-hint">都放好了,点「提交批改」</p>}
            </>
          ) : (
            <>
              <div className="dl-side-head"><span>四大区域</span><span className="dl-count">点击查看</span></div>
              <ul className="rg-list">
                {REGIONS.map((rg) => (
                  <li key={rg.id}>
                    <button className={`rg-item${focus === rg.id ? ' on' : ''}`} onClick={() => setFocus(focus === rg.id ? null : rg.id)}>
                      <span className="rg-dot" style={{ background: rg.color }} />{rg.name}
                    </button>
                  </li>
                ))}
              </ul>
              {focus && (() => { const f = byId(focus); return (
                <div className="rg-facts">
                  <div className="rg-facts-row"><span>气候</span><b>{f.facts.climate}</b></div>
                  <div className="rg-facts-row"><span>地形</span><b>{f.facts.terrain}</b></div>
                  <div className="rg-facts-row"><span>农业</span><b>{f.facts.farm}</b></div>
                  <div className="rg-facts-key">{f.facts.key}</div>
                </div>
              ); })()}
            </>
          )}
        </div>

        <div className="dl-board">
          <svg ref={boardRef} className="dl-map" viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg">
            <defs><clipPath id="cnclip"><path d={chinaPath} /></clipPath></defs>
            {wound.features.map((f) => <path key={f.properties.id} d={pathGen(f) ?? ''} fill="rgba(44,62,80,0.05)" stroke="var(--ink-faint)" strokeWidth={0.6} />)}
            {showColors && <g clipPath="url(#cnclip)">{RENDER_ORDER.map((id) => <polygon key={id} points={zonePoints(id)} fill={tint(byId(id).color)} />)}</g>}
            {showColors && <g clipPath="url(#cnclip)" pointerEvents="none">{wound.features.map((f) => <path key={`b${f.properties.id}`} d={pathGen(f) ?? ''} fill="none" stroke="rgba(44,62,80,0.18)" strokeWidth={0.5} />)}</g>}
            {/* 三条分界线;前两条减去青藏区,避免折线西端扎进高原实色 */}
            {showColors && (
              <>
                <defs>
                  <mask id="rg-no-qz" maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
                    <path d={chinaPath} fill="#fff" />
                    <polygon points={zonePoints('qingzang')} fill="#000" />
                  </mask>
                </defs>
                <g pointerEvents="none" fill="none" stroke="var(--ink)" strokeWidth={1.8} strokeOpacity={0.62} strokeLinejoin="round" strokeLinecap="round">
                  {BOUNDARIES.map((b) => (
                    <polyline key={b.id} points={projPts(b.pts)} strokeDasharray={b.dash ? '6 4' : undefined}
                      clipPath={b.id === 'plateau' ? 'url(#cnclip)' : undefined}
                      mask={b.id === 'plateau' ? undefined : 'url(#rg-no-qz)'} />
                  ))}
                </g>
              </>
            )}
            {showColors && BOUNDARIES.map((b) => { const p = proj(b.labelAt) as [number, number]; return (
              <text key={`l${b.id}`} x={p[0]} y={p[1]} textAnchor="middle"
                style={{ fontSize: 11, fill: 'var(--ink-soft)', paintOrder: 'stroke', stroke: 'rgba(255,255,255,0.85)', strokeWidth: 3 }}>{b.name}</text>
            ); })}
            {/* 高亮"实际可见"的区域(画家算法):练习拖动 or 演示点选 */}
            {highlight && (
              <>
                <defs>
                  <mask id="rg-hl">
                    <polygon points={zonePoints(highlight)} fill="#fff" />
                    {RENDER_ORDER.slice(RENDER_ORDER.indexOf(highlight) + 1).map((id) => (
                      <polygon key={id} points={zonePoints(id)} fill="#000" />
                    ))}
                  </mask>
                </defs>
                <g clipPath="url(#cnclip)">
                  <rect x={0} y={0} width={W} height={H} fill="rgba(255,107,107,0.30)" mask="url(#rg-hl)" />
                </g>
              </>
            )}
            {shownLabels.map(({ labelId, zoneId }) => {
              const rg = byId(labelId);
              const pos = proj(byId(zoneId).labelAt) as [number, number];
              const fill = graded ? (labelId === zoneId ? 'var(--green)' : '#E24B4A') : 'var(--ink)';
              return <text key={labelId} x={pos[0]} y={pos[1]} className="dl-placed set" fill={fill} textAnchor="middle"
                onClick={() => isPractice && !graded && unassign(labelId)}>{rg.name}</text>;
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
            <p>四大地理区域都对上了</p>
            <Btn variant="coral" onClick={redo}><Icon name="refresh" /> 再来一次</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
