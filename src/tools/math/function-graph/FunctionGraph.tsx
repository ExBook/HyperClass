import { useState } from 'react';
import { load, save } from '../../../core/storage';

const KEY = 'hc.function-graph';
type FType = 'linear' | 'quadratic';
const W = 560, CX = 280, CY = 280, S = 26;
const r1 = (n: number) => Math.round(n * 10) / 10;

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

function curve(type: FType, a: number, b: number, c: number): string {
  let d = '';
  for (let px = 0; px <= W; px += 2) {
    const x = (px - CX) / S;
    const y = type === 'linear' ? a * x + b : a * x * x + b * x + c;
    const py = Math.max(-3000, Math.min(W + 3000, CY - y * S));
    d += (px === 0 ? 'M' : 'L') + px + ' ' + py.toFixed(1) + ' ';
  }
  return d;
}

export function FunctionGraph() {
  const init = load<{ type?: FType; a?: number; b?: number; c?: number }>(KEY, {});
  const [type, setType] = useState<FType>(init.type ?? 'linear');
  const [a, setA] = useState(init.a ?? 1);
  const [b, setB] = useState(init.b ?? 0);
  const [c, setC] = useState(init.c ?? 0);

  const persist = (p: Partial<{ type: FType; a: number; b: number; c: number }>) => save(KEY, { type, a, b, c, ...p });
  const upType = (t: FType) => { setType(t); persist({ type: t }); };
  const upA = (v: number) => { setA(v); persist({ a: v }); };
  const upB = (v: number) => { setB(v); persist({ b: v }); };
  const upC = (v: number) => { setC(v); persist({ c: v }); };

  const ticks: number[] = [];
  for (let i = -10; i <= 10; i++) ticks.push(i);

  const vx = type === 'quadratic' && a !== 0 ? r1(-b / (2 * a)) : null;
  const vy = vx !== null ? r1(a * vx * vx + b * vx + c) : null;
  const disc = b * b - 4 * a * c;

  return (
    <div className="fg">
      <div className="fg-plot">
        <div className="fg-eq">{eq(type, a, b, c)}</div>
        <svg viewBox={`0 0 ${W} ${W}`} className="fg-svg" xmlns="http://www.w3.org/2000/svg">
          {ticks.map((i) => <line key={`v${i}`} x1={CX + i * S} y1={0} x2={CX + i * S} y2={W} className={i === 0 ? 'fg-axis' : 'fg-grid'} />)}
          {ticks.map((i) => <line key={`h${i}`} x1={0} y1={CY - i * S} x2={W} y2={CY - i * S} className={i === 0 ? 'fg-axis' : 'fg-grid'} />)}
          {ticks.filter((i) => i !== 0 && i % 2 === 0).map((i) => <text key={`tx${i}`} x={CX + i * S} y={CY + 15} className="fg-tick" textAnchor="middle">{i}</text>)}
          {ticks.filter((i) => i !== 0 && i % 2 === 0).map((i) => <text key={`ty${i}`} x={CX - 7} y={CY - i * S + 4} className="fg-tick" textAnchor="end">{i}</text>)}
          {type === 'quadratic' && vx !== null && <line x1={CX + vx * S} y1={0} x2={CX + vx * S} y2={W} className="fg-sym" />}
          <path d={curve(type, a, b, c)} className="fg-curve" />
          {type === 'quadratic' && vx !== null && vy !== null && <circle cx={CX + vx * S} cy={CY - vy * S} r={5} className="fg-pt" />}
          {type === 'linear' && <circle cx={CX} cy={CY - b * S} r={5} className="fg-pt" />}
        </svg>
      </div>

      <div className="fg-controls">
        <div className="seg">
          <button className={type === 'linear' ? 'on' : ''} onClick={() => upType('linear')}>一次函数</button>
          <button className={type === 'quadratic' ? 'on' : ''} onClick={() => upType('quadratic')}>二次函数</button>
        </div>

        <div className="fg-row"><span className="fg-k">a</span><input type="range" className="fg-range" min={-5} max={5} step={0.1} value={a} onChange={(e) => upA(Number(e.target.value))} /><span className="fg-vv">{r1(a)}</span></div>
        <div className="fg-row"><span className="fg-k">b</span><input type="range" className="fg-range" min={-10} max={10} step={0.5} value={b} onChange={(e) => upB(Number(e.target.value))} /><span className="fg-vv">{r1(b)}</span></div>
        {type === 'quadratic' && <div className="fg-row"><span className="fg-k">c</span><input type="range" className="fg-range" min={-10} max={10} step={0.5} value={c} onChange={(e) => upC(Number(e.target.value))} /><span className="fg-vv">{r1(c)}</span></div>}

        <div className="fg-feats">
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
