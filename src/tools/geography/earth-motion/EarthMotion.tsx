import { useEffect, useRef, useState } from 'react';
import { Btn, Icon } from '../../../app/ui';

type Mode = 'revolve' | 'rotate';
const DAY = '#A9D8F5', NIGHT = '#33425A', AXIS_TILT = 23.5;
const SEASONS = [
  { id: 'dongzhi', deg: 0, name: '冬至', date: '12 月 22 日前后', day: '北半球昼最短夜最长;北极圈以北极夜' },
  { id: 'chunfen', deg: 90, name: '春分', date: '3 月 21 日前后', day: '全球昼夜平分' },
  { id: 'xiazhi', deg: 180, name: '夏至', date: '6 月 22 日前后', day: '北半球昼最长夜最短;北极圈以北极昼' },
  { id: 'qiufen', deg: 270, name: '秋分', date: '9 月 23 日前后', day: '全球昼夜平分' },
];
const rad = (d: number) => d * Math.PI / 180;
const latText = (l: number) => (l > 0.5 ? `北纬 ${l.toFixed(1)}°` : l < -0.5 ? `南纬 ${(-l).toFixed(1)}°` : '赤道(0°)');

// 画一个有昼夜、地轴的地球;sunAngle = 指向太阳的方向(屏幕角度,度)
function Globe({ cx, cy, r, sunAngle, cid, axis }: { cx: number; cy: number; r: number; sunAngle: number; cid: string; axis: boolean }) {
  return (
    <g>
      <defs><clipPath id={cid}><circle cx={cx} cy={cy} r={r} /></clipPath></defs>
      <g clipPath={`url(#${cid})`}>
        <circle cx={cx} cy={cy} r={r} fill={DAY} />
        {/* 夜半球:背向太阳的一侧 */}
        <rect x={cx - 2 * r} y={cy - 2 * r} width={2 * r} height={4 * r} fill={NIGHT} opacity={0.92}
          transform={`rotate(${sunAngle} ${cx} ${cy})`} />
      </g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(44,62,80,0.5)" strokeWidth={1.2} />
      {axis && (() => {
        const ax = Math.sin(rad(AXIS_TILT)), ay = -Math.cos(rad(AXIS_TILT));
        const L = r * 1.32;
        return <>
          <line x1={cx - ax * L} y1={cy - ay * L} x2={cx + ax * L} y2={cy + ay * L} stroke="var(--ink)" strokeWidth={1.6} strokeDasharray="3 2" />
          <circle cx={cx - ax * L} cy={cy - ay * L} r={2.6} fill="var(--ink)" />
          <text x={cx - ax * L} y={cy - ay * L - 6} textAnchor="middle" style={{ fontSize: 10, fill: 'var(--ink-soft)' }}>N</text>
        </>;
      })()}
    </g>
  );
}

export function EarthMotion() {
  const [mode, setMode] = useState<Mode>('revolve');
  const [phi, setPhi] = useState(180);   // 公转位置(夏至)
  const [spin, setSpin] = useState(20);  // 自转角度
  const [playing, setPlaying] = useState(false);
  const speedRef = useRef(1);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      if (mode === 'revolve') setPhi((p) => (p + 0.3 * speedRef.current) % 360);
      else setSpin((s) => (s + 1.1 * speedRef.current) % 360);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, mode]);

  function chooseMode(m: Mode) { if (m === mode) return; setMode(m); setPlaying(false); }
  const jump = (deg: number) => { setPlaying(false); setPhi(deg); };

  // ---- 公转计算 ----
  const sunLat = -AXIS_TILT * Math.cos(rad(phi));
  const seasonN = phi >= 135 && phi < 225 ? '夏季' : phi >= 225 && phi < 315 ? '秋季' : phi >= 45 && phi < 135 ? '春季' : '冬季';
  const near = SEASONS.find((s) => Math.min(Math.abs(phi - s.deg), 360 - Math.abs(phi - s.deg)) < 4);
  const dayHintN = sunLat > 1 ? '昼长夜短' : sunLat < -1 ? '昼短夜长' : '昼夜平分';

  // 轨道几何
  const OW = 640, OH = 460, ocx = 320, ocy = 230, rx = 250, ry = 165;
  const epos = (deg: number): [number, number] => [ocx + rx * Math.cos(rad(deg)), ocy - ry * Math.sin(rad(deg))];
  const [ex, ey] = epos(phi);
  const sunAngleOrbit = Math.atan2(ocy - ey, ocx - ex) * 180 / Math.PI;

  // ---- 自转几何 ----
  const GW = 520, GH = 430, gcx = 260, gcy = 215, gr = 150;

  return (
    <div className="em">
      <div className="em-top">
        <div className="seg">
          <button className={mode === 'revolve' ? 'on' : ''} onClick={() => chooseMode('revolve')}>公转</button>
          <button className={mode === 'rotate' ? 'on' : ''} onClick={() => chooseMode('rotate')}>自转</button>
        </div>
        <div style={{ flex: 1 }} />
        <Btn variant="coral" onClick={() => setPlaying((p) => !p)}>
          <Icon name={playing ? 'player-pause' : 'player-play'} /> {playing ? '暂停' : '播放'}
        </Btn>
        {mode === 'revolve' && <div className="em-jumps">{SEASONS.map((s) => <button key={s.id} className={near?.id === s.id ? 'on' : ''} onClick={() => jump(s.deg)}>{s.name}</button>)}</div>}
      </div>

      <div className="em-main">
        <div className="em-board">
          {mode === 'revolve' ? (
            <svg viewBox={`0 0 ${OW} ${OH}`} className="em-svg" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx={ocx} cy={ocy} rx={rx} ry={ry} fill="none" stroke="var(--rule)" strokeWidth={1.5} strokeDasharray="4 4" />
              {/* 太阳 */}
              <circle cx={ocx} cy={ocy} r={34} fill="#F6B73C" />
              <circle cx={ocx} cy={ocy} r={34} fill="none" stroke="#F6B73C" strokeOpacity={0.4} strokeWidth={12} />
              <text x={ocx} y={ocy + 5} textAnchor="middle" style={{ fontSize: 14, fontWeight: 700, fill: '#7a5410' }}>太阳</text>
              {/* 四季位置标记 */}
              {SEASONS.map((s) => { const [x, y] = epos(s.deg); return (
                <g key={s.id}>
                  <circle cx={x} cy={y} r={4} fill="var(--ink-faint)" />
                  <text x={x} y={y + (s.deg === 90 ? 22 : s.deg === 270 ? -14 : -12)} textAnchor="middle" style={{ fontSize: 12, fontWeight: 700, fill: near?.id === s.id ? 'var(--coral)' : 'var(--ink-soft)' }}>{s.name}</text>
                </g>
              ); })}
              {/* 太阳→地球 光线 */}
              <line x1={ocx} y1={ocy} x2={ex} y2={ey} stroke="#F6B73C" strokeWidth={2} strokeOpacity={0.5} />
              {/* 当前地球 */}
              <Globe cx={ex} cy={ey} r={28} sunAngle={sunAngleOrbit} cid="em-earth" axis />
            </svg>
          ) : (
            <svg viewBox={`0 0 ${GW} ${GH}`} className="em-svg" xmlns="http://www.w3.org/2000/svg">
              {/* 太阳光(自左) */}
              {[-60, -20, 20, 60].map((dy) => <line key={dy} x1={6} y1={gcy + dy} x2={gcx - gr - 6} y2={gcy + dy} stroke="#F6B73C" strokeWidth={2} strokeOpacity={0.55} markerEnd="url(#em-arrow)" />)}
              <defs><marker id="em-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#F6B73C" /></marker></defs>
              <text x={26} y={gcy - 78} style={{ fontSize: 12, fill: '#7a5410', fontWeight: 700 }}>太阳光</text>
              <Globe cx={gcx} cy={gcy} r={gr} sunAngle={180} cid="em-globe" axis={false} />
              {/* 经线(随自转旋转)+ 赤道 */}
              <g clipPath="url(#em-globe)">
                <line x1={gcx - gr} y1={gcy} x2={gcx + gr} y2={gcy} stroke="rgba(44,62,80,0.35)" strokeWidth={1} />
                {[0, 30, 60, 90, 120, 150].map((m) => { const rxm = Math.abs(gr * Math.cos(rad(m + spin))); const front = Math.cos(rad(m + spin)) >= 0; return (
                  <ellipse key={m} cx={gcx} cy={gcy} rx={rxm} ry={gr} fill="none" stroke={`rgba(44,62,80,${front ? 0.28 : 0.12})`} strokeWidth={1} />
                ); })}
              </g>
              {/* 晨昏线 + 标注 */}
              <line x1={gcx} y1={gcy - gr} x2={gcx} y2={gcy + gr} stroke="var(--ink)" strokeWidth={1.6} strokeDasharray="5 3" />
              <text x={gcx + 8} y={gcy - gr * 0.5} style={{ fontSize: 12, fill: 'var(--ink-soft)', paintOrder: 'stroke', stroke: 'rgba(255,255,255,0.7)', strokeWidth: 3 }}>晨昏线</text>
              <text x={gcx - gr / 2} y={gcy + gr + 24} textAnchor="middle" style={{ fontSize: 13, fontWeight: 700, fill: '#2c6fb0' }}>昼半球</text>
              <text x={gcx + gr / 2} y={gcy + gr + 24} textAnchor="middle" style={{ fontSize: 13, fontWeight: 700, fill: 'var(--ink-soft)' }}>夜半球</text>
              {/* 城市点(随自转移动) */}
              {(() => { const a = rad(spin); const vis = Math.cos(a) >= -0.01; const x = gcx + gr * 0.78 * Math.sin(a); const y = gcy - gr * 0.32; if (!vis) return null; const dayt = x < gcx; return (
                <g><circle cx={x} cy={y} r={6} fill="var(--coral)" stroke="#fff" strokeWidth={2} /><text x={x} y={y - 11} textAnchor="middle" style={{ fontSize: 11, fontWeight: 700, fill: 'var(--ink)' }}>城市·{dayt ? '白天' : '黑夜'}</text></g>
              ); })()}
              {/* 自转方向 */}
              <text x={gcx} y={gcy - gr - 14} textAnchor="middle" style={{ fontSize: 12, fontWeight: 700, fill: 'var(--ink-soft)' }}>自转方向:自西向东 →</text>
            </svg>
          )}
        </div>

        <div className="em-side">
          {mode === 'revolve' ? (
            <>
              <div className="em-card-h">{near ? `${near.name} · ${near.date}` : '公转中…'}</div>
              <div className="em-row"><span>太阳直射点</span><b>{latText(sunLat)}</b></div>
              <div className="em-row"><span>北半球季节</span><b>{seasonN}</b></div>
              <div className="em-row"><span>北半球昼夜</span><b>{dayHintN}</b></div>
              <div className="em-note">{near ? near.day : '直射点在南北回归线之间往返移动,带来四季更替与昼夜长短变化。'}</div>
              <ul className="em-facts">
                <li>地轴倾斜约 23.5°,且方向始终不变</li>
                <li>直射点最北:北回归线(夏至);最南:南回归线(冬至)</li>
                <li>二分日全球昼夜平分</li>
              </ul>
            </>
          ) : (
            <>
              <div className="em-card-h">地球自转</div>
              <div className="em-row"><span>周期</span><b>约 24 小时(一天)</b></div>
              <div className="em-row"><span>方向</span><b>自西向东</b></div>
              <div className="em-row"><span>产生现象</span><b>昼夜交替</b></div>
              <div className="em-note">面向太阳的半球是白天(昼半球),背向的是黑夜(夜半球);两者的分界叫晨昏线。地球不停自转,各地便昼夜交替。</div>
              <ul className="em-facts">
                <li>从北极上空看,自转呈逆时针</li>
                <li>晨线:由夜进入昼;昏线:由昼进入夜</li>
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
