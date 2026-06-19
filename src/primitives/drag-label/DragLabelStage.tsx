import { useEffect, useMemo, useRef, useState } from 'react';
import { geoPath } from 'd3-geo';
import type { FeatureMap, Label } from './types';
import { ensureWinding } from './geo';
import { buildProjection } from './projection';

const W = 800, H = 600;

type Props = {
  geo: FeatureMap;
  labels: Label[];
  interactive: boolean;                 // false = 演示(答案), true = 练习
  placements: Record<string, string>;   // labelId -> featureId
  graded: boolean;
  onAssign: (labelId: string, featureId: string) => void;
  onUnassign: (labelId: string) => void;
};

export function DragLabelStage({ geo, labels, interactive, placements, graded, onAssign, onUnassign }: Props) {
  const boardRef = useRef<SVGSVGElement | null>(null);
  const [drag, setDrag] = useState<{ label: Label; x: number; y: number } | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const wound = useMemo(() => ensureWinding(geo), [geo]);
  const { projection, pathGen } = useMemo(() => {
    const proj = buildProjection(wound, W, H);
    return { projection: proj, pathGen: geoPath(proj) };
  }, [wound]);
  void projection;

  const centroids = useMemo(() => {
    const m = new Map<string, [number, number]>();
    for (const f of wound.features) {
      const c = pathGen.centroid(f);
      if (Number.isFinite(c[0])) m.set(f.properties.id, [c[0], c[1]]);
    }
    return m;
  }, [wound, pathGen]);
  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of wound.features) m.set(f.properties.id, f.properties.name);
    return m;
  }, [wound]);

  function toSvg(cx: number, cy: number): [number, number] | null {
    const svg = boardRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = cx; pt.y = cy;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const p = pt.matrixTransform(ctm.inverse());
    return [p.x, p.y];
  }
  function nearest(sx: number, sy: number): string | null {
    let best: string | null = null, bd = Infinity;
    for (const [id, [x, y]] of centroids) {
      const d = (x - sx) ** 2 + (y - sy) ** 2;
      if (d < bd) { bd = d; best = id; }
    }
    return best;
  }

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : null));
      const s = toSvg(e.clientX, e.clientY);
      if (s) setHover(nearest(s[0], s[1]));
    };
    const up = (e: PointerEvent) => {
      const s = toSvg(e.clientX, e.clientY);
      const target = s ? nearest(s[0], s[1]) : null;
      if (target) onAssign(drag.label.id, target);
      setDrag(null); setHover(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, centroids, onAssign]);

  // ===== 演示态:直接显示答案 =====
  if (!interactive) {
    return (
      <div className="dl dl--present">
        <div className="dl-board">
          <svg className="dl-map" viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg">
            {wound.features.map((f) => <path key={f.properties.id} d={pathGen(f) ?? ''} className="dl-feature shown" />)}
            {labels.map((l) => {
              const c = centroids.get(l.targetFeatureId);
              return c ? <text key={l.id} x={c[0]} y={c[1]} className="dl-placed" textAnchor="middle">{l.text}</text> : null;
            })}
          </svg>
        </div>
      </div>
    );
  }

  // ===== 练习态 =====
  const featureToLabel = new Map<string, Label>();
  for (const l of labels) { const fid = placements[l.id]; if (fid) featureToLabel.set(fid, l); }
  const unplaced = labels.filter((l) => !placements[l.id]);
  const isCorrect = (l: Label) => placements[l.id] === l.targetFeatureId;

  function startDrag(label: Label, ev: React.PointerEvent) { setDrag({ label, x: ev.clientX, y: ev.clientY }); }

  return (
    <div className="dl">
      <div className="dl-side">
        <div className="dl-side-head"><span>未放置</span><span className="dl-count">{unplaced.length} / {labels.length}</span></div>
        <ul className="dl-tags">
          {unplaced.map((l) => (
            <li key={l.id} className={`dl-tag${drag?.label.id === l.id ? ' dragging' : ''}`} onPointerDown={(e) => startDrag(l, e)}>{l.text}</li>
          ))}
        </ul>
        {unplaced.length === 0 && <p className="dl-hint">都放好了,点「提交批改」</p>}
      </div>

      <div className="dl-board">
        <svg ref={boardRef} className="dl-map" viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg">
          {wound.features.map((f) => {
            const id = f.properties.id;
            const lab = featureToLabel.get(id);
            let cls = 'dl-feature';
            if (drag && hover === id) cls += ' target';
            else if (lab) cls += graded ? (isCorrect(lab) ? ' correct' : ' wrong') : ' assigned';
            return <path key={id} d={pathGen(f) ?? ''} className={cls} />;
          })}
          {[...featureToLabel.entries()].map(([fid, lab]) => {
            const c = centroids.get(fid);
            if (!c) return null;
            const lc = `dl-placed${graded ? (isCorrect(lab) ? ' ok' : ' no') : ' set'}`;
            return (
              <text key={lab.id} x={c[0]} y={c[1]} className={lc} textAnchor="middle"
                onClick={() => !graded && onUnassign(lab.id)}>{lab.text}</text>
            );
          })}
        </svg>
        {drag && (
          <>
            <div className="dl-drag" style={{ left: drag.x, top: drag.y }}>{drag.label.text}</div>
            {hover && <div className="dl-target-hint" style={{ left: drag.x, top: drag.y + 28 }}>→ {nameById.get(hover)}</div>}
          </>
        )}
      </div>
    </div>
  );
}
