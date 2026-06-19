import { useEffect, useRef, useState } from 'react';
import { load, save } from '../../../core/storage';

const KEY = 'hc.function-graph';
type FType = 'linear' | 'quadratic';
const W = 560, CX = 280, CY = 280, PAD = 22;
const r1 = (n: number) => Math.round(n * 10) / 10;
const clampR = (r: number) => Math.max(3, Math.min(200, r));

function niceStep(viewR: number): number {
  const raw = (2 * viewR) / 12;
  for (const s of [0.5, 1, 2, 5, 10, 20, 25, 50, 100, 200, 500]) if (s >= raw) return s;
  return 1000;
}

function fmtNum(n: number): string {
  const v = r1(n);
  return Number.isInteger(v) ? String(v) : String(v);
}

function eq(type: FType, a: number, b: number, c: number): string {
  const t: string[] = [];
  const push = (coef: number, v: string) => {
    const k = r1(coef);
    if (k === 0) return;
    const m = Math.abs(k);
    const num = v && m === 1 ? '' : String(m);
    t.push((k < 0 ? '− ' : '+ ') + num + v);
  };
  if (type === 'linear') { push(a, 'x'); push(b, ''); }
  else { push(a, 'x²'); push(b, 'x'); push(c, ''); }
  const s = t.join(' ').replace(/^\+ /, '').replace(/^− /, '−');
  return 'y = ' + (s || '0');
}

function curve(type: FType, a: number, b: number, c: number, S: number): string {
  let d = '';
  for (let px = 0; px <= W; px += 2) {
    const x = (px - CX) / S;
    const y = type === 'linear' ? a * x + b : a * x * x + b * x + c;
    const py = Math.max(-4000, Math.min(W + 4000, CY - y * S));
    d += (px === 0 ? 'M' : 'L') + px + ' ' + py.toFixed(1) + ' ';
  }
  return d;
}

function autoFitR(type: FType, a: number, b: number, c: number): number {
  const xs = [0], ys = [0];
  if (type === 'linear') {
    ys.push(b);
    if (a !== 0) xs.push(-b / a);
  } else {
    ys.push(c);
    if (a !== 0) {
      const vx = -b / (2 * a);
      xs.push(vx); ys.push(a * vx * vx + b * vx + c);
      const disc = b * b - 4 * a * c;
      if (disc >= 0) { const sq = Math.sqrt(disc); xs.push((-b + sq) / (2 * a), (-b - sq) / (2 * a)); }
    }
  }
  const mx = Math.max(...xs.map(Math.abs), ...ys.map(Math.abs), 4);
  return clampR(Math.ceil(mx * 1.25));
}

export function FunctionGraph() {
  const init = load<{ type?: FType; a?: number; b?: number; c?: number; viewR?: number }>(KEY, {});
  const [type, setType] = useState<FType>(init.type ?? 'linear');
  const [a, setA] = useState(init.a ?? 1);
  const [b, setB] = useState(init.b ?? 0);
  const [c, setC] = useState(init.c ?? 0);
  const [viewR, setViewR] = useState(init.viewR ?? 10);
  const boardRef = useRef<SVGSVGElement | null>(null);

  const persist = (p: Partial<{ type: FType; a: number; b: number; c: number; viewR: number }>) =>
    save(KEY, { type, a, b, c, viewR, ...p });
  const upType = (t: FType) => { setType(t); persist({ type: t }); };
  const upA = (v: number) => { setA(v); persist({ a: v }); };
  const upB = (v: number) => { setB(v); persist({ b: v }); };
  const upC = (v: number) => { setC(v); persist({ c: v }); };
  const setR = (r: number) => { const rr = clampR(r); setViewR(rr); persist({ viewR: rr }); };
  const fit = () => setR(autoFitR(type, a, b, c));

  // 滚轮缩放(非被动监听以便 preventDefault)
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setViewR((r) => { const rr = clampR(r * (e.deltaY > 0 ? 1.12 : 1 / 1.12)); save(KEY, { type, a, b, c, viewR: rr }); return rr; });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [type, a, b, c]);

  const S = (CX - PAD) / viewR;
  const sx = (x: number) => CX + x * S;
  const sy = (y: number) => CY - y * S;
  const step = niceStep(viewR);
  const N = Math.floor(viewR / step);
  const lines: number[] = [];
  for (let i = -N; i <= N; i++) lines.push(i * step);

  const vx = type === 'quadratic' && a !== 0 ? r1(-b / (2 * a)) : null;
  const vy = vx !== null ? r1(a * vx * vx + b * vx + c) : null;
  const disc = b * b - 4 * a * c;

  return (
    <div className="fg">
      <div className="fg-plot">
        <div className="fg-eq">{eq(type, a, b, c)}</div>
        <div className="fg-zoom">
          <button className="fg-zbtn" onClick={() => setR(viewR * 1.4)} aria-label="缩小">−</button>
          <button className="fg-zfit" onClick={fit}>适应</button>
          <button className="fg-zbtn" onClick={() => setR(viewR / 1.4)} aria-label="放大">+</button>
        </div>
        <svg ref={boardRef} viewBox={`0 0 ${W} ${W}`} className="fg-svg" xmlns="http://www.w3.org/2000/svg">
          {lines.map((u) => <line key={`v${u}`} x1={sx(u)} y1={0} x2={sx(u)} y2={W} className={u === 0 ? 'fg-axis' : 'fg-grid'} />)}
          {lines.map((u) => <line key={`h${u}`} x1={0} y1={sy(u)} x2={W} y2={sy(u)} className={u === 0 ? 'fg-axis' : 'fg-grid'} />)}
          {lines.filter((u) => u !== 0).map((u) => <text key={`tx${u}`} x={sx(u)} y={CY + 15} className="fg-tick" textAnchor="middle">{fmtNum(u)}</text>)}
          {lines.filter((u) => u !== 0).map((u) => <text key={`ty${u}`} x={CX - 7} y={sy(u) + 4} className="fg-tick" textAnchor="end">{fmtNum(u)}</text>)}
          {type === 'quadratic' && vx !== null && <line x1={sx(vx)} y1={0} x2={sx(vx)} y2={W} className="fg-sym" />}
          <path d={curve(type, a, b, c, S)} className="fg-curve" />
          {type === 'quadratic' && vx !== null && vy !== null && <circle cx={sx(vx)} cy={sy(vy)} r={5} className="fg-pt" />}
          {type === 'linear' && <circle cx={sx(0)} cy={sy(b)} r={5} className="fg-pt" />}
        </svg>
      </div>

      <div className="fg-controls">
        <div className="seg">
          <button className={type === 'linear' ? 'on' : ''} onClick={() => upType('linear')}>一次函数</button>
          <button className={type === 'quadratic' ? 'on' : ''} onClick={() => upType('quadratic')}>二次函数</button>
        </div>

        <div className="fg-row"><span className="fg-k">a</span><input type="range" className="fg-range" min={-10} max={10} step={0.1} value={a} onChange={(e) => upA(Number(e.target.value))} /><span className="fg-vv">{r1(a)}</span></div>
        <div className="fg-row"><span className="fg-k">b</span><input type="range" className="fg-range" min={-30} max={30} step={0.5} value={b} onChange={(e) => upB(Number(e.target.value))} /><span className="fg-vv">{r1(b)}</span></div>
        {type === 'quadratic' && <div className="fg-row"><span className="fg-k">c</span><input type="range" className="fg-range" min={-30} max={30} step={0.5} value={c} onChange={(e) => upC(Number(e.target.value))} /><span className="fg-vv">{r1(c)}</span></div>}

        <div className="fg-feats">
          <div><span>视野</span>±{r1(viewR)}</div>
          {type === 'linear' ? (
            <>
              <div><span>斜率</span>{r1(a)}{a === 0 ? '(水平线)' : ''}</div>
              <div><span>与 y 轴</span>(0, {r1(b)})</div>
              <div><span>与 x 轴</span>{a !== 0 ? `(${r1(-b / a)}, 0)` : '无'}</div>
            </>
          ) : (
            <>
              <div><span>开口</span>{a === 0 ? '退化为直线' : a > 0 ? '向上' : '向下'}</div>
              <div><span>顶点</span>{vx !== null ? `(${vx}, ${vy})` : '—'}</div>
              <div><span>对称轴</span>{vx !== null ? `x = ${vx}` : '—'}</div>
              <div><span>与 x 轴</span>{a === 0 ? '—' : disc > 0 ? '两个交点' : disc === 0 ? '一个交点' : '无交点'}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
