import { useEffect, useMemo, useRef, useState } from 'react';
import { geoPath } from 'd3-geo';
import type { FeatureMap, Label, Usage } from './types';
import { hitTest } from './engine';
import { ensureWinding } from './geo';
import { buildProjection } from './projection';

const W = 800, H = 600;
type ErrPulse = { x: number; y: number; key: number };

type Props = {
  geo: FeatureMap;
  labels: Label[];
  usage?: Usage;
  onPlace: (labelId: string, isCorrect: boolean, matchedFeatureId: string | null) => void;
  placedLabelIds: Set<string>;
  correctFeatureIds: Set<string>;
};

export function DragLabelStage({ geo, labels, usage = 'practice', onPlace, placedLabelIds, correctFeatureIds }: Props) {
  const isPractice = usage === 'practice';
  const boardRef = useRef<SVGSVGElement | null>(null);
  const [dragging, setDragging] = useState<{ label: Label; x: number; y: number } | null>(null);
  const [pulses, setPulses] = useState<ErrPulse[]>([]);
  const pulseKey = useRef(0);

  const wound = useMemo(() => ensureWinding(geo), [geo]);
  const { projection, pathGen } = useMemo(() => {
    const proj = buildProjection(wound, W, H);
    return { projection: proj, pathGen: geoPath(proj) };
  }, [wound]);

  function screenToLonLat(cx: number, cy: number): [number, number] | null {
    const svg = boardRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = cx; pt.y = cy;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const local = pt.matrixTransform(ctm.inverse());
    const ll = projection.invert?.([local.x, local.y]);
    return ll ? [ll[0], ll[1]] : null;
  }

  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => setDragging((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : null));
    const up = (e: PointerEvent) => {
      const ll = screenToLonLat(e.clientX, e.clientY);
      if (!ll) { setDragging(null); return; }
      const r = hitTest(wound, ll);
      const correct = r.matched && r.featureId === dragging.label.targetFeatureId;
      if (!correct) {
        const svg = boardRef.current;
        if (svg) {
          const pt = svg.createSVGPoint();
          pt.x = e.clientX; pt.y = e.clientY;
          const local = pt.matrixTransform(svg.getScreenCTM()!.inverse());
          const k = pulseKey.current++;
          setPulses((a) => [...a, { x: local.x, y: local.y, key: k }]);
          setTimeout(() => setPulses((a) => a.filter((p) => p.key !== k)), 600);
        }
      }
      onPlace(dragging.label.id, correct, r.featureId);
      setDragging(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [dragging, wound, onPlace, projection]);

  function startDrag(label: Label, ev: React.PointerEvent) {
    setDragging({ label, x: ev.clientX, y: ev.clientY });
  }

  const unplaced = labels.filter((l) => !placedLabelIds.has(l.id));
  const labelsToShow = isPractice ? labels.filter((l) => correctFeatureIds.has(l.targetFeatureId)) : labels;

  return (
    <div className={`dl${isPractice ? '' : ' dl--present'}`}>
      {isPractice && (
        <div className="dl-side">
          <div className="dl-side-head"><span>未放置</span><span className="dl-count">{unplaced.length} / {labels.length}</span></div>
          <ul className="dl-tags">
            {unplaced.map((l) => (
              <li key={l.id} className={`dl-tag${dragging?.label.id === l.id ? ' dragging' : ''}`} onPointerDown={(e) => startDrag(l, e)}>
                {l.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="dl-board">
        <svg ref={boardRef} className="dl-map" viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg">
          {wound.features.map((f) => {
            const locked = isPractice && correctFeatureIds.has(f.properties.id);
            return (
              <path key={f.properties.id} d={pathGen(f) ?? ''}
                className={`dl-feature${locked ? ' locked' : ''}${isPractice ? '' : ' shown'}`} />
            );
          })}
          {labelsToShow.map((l) => {
            const f = wound.features.find((ft) => ft.properties.id === l.targetFeatureId);
            if (!f) return null;
            const c = pathGen.centroid(f);
            if (!Number.isFinite(c[0])) return null;
            return <text key={l.id} x={c[0]} y={c[1]} className="dl-label" textAnchor="middle">{l.text}</text>;
          })}
          {pulses.map((p) => <circle key={p.key} cx={p.x} cy={p.y} r={8} className="dl-pulse" />)}
        </svg>
        {dragging && <div className="dl-drag" style={{ left: dragging.x, top: dragging.y }}>{dragging.label.text}</div>}
      </div>
    </div>
  );
}
