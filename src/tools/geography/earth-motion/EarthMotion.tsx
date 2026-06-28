import { useEffect, useRef, useState } from 'react';
import { Btn, Icon } from '../../../app/ui';

type Mode = 'revolve' | 'rotate';
const DAY = '#A9D8F5', NIGHT = '#33425A', TILT = 23.5;
const SEASONS = [
  { id: 'dongzhi', deg: 0, name: '冬至', date: '12 月 22 日前后' },
  { id: 'chunfen', deg: 90, name: '春分', date: '3 月 21 日前后' },
  { id: 'xiazhi', deg: 180, name: '夏至', date: '6 月 22 日前后' },
  { id: 'qiufen', deg: 270, name: '秋分', date: '9 月 23 日前后' },
];
const SPEEDS = [0.5, 1, 2];
const rad = (d: number) => d * Math.PI / 180;
const latText = (l: number) => (l > 0.4 ? `北纬 ${l.toFixed(1)}°` : l < -0.4 ? `南纬 ${(-l).toFixed(1)}°` : '赤道(0°)');
const MD = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function dateStr(phi: number): string {
  let doy = Math.round((356 + phi / 360 * 365) % 365); if (doy === 0) doy = 365;
  let m = 0; while (doy > MD[m]) { doy -= MD[m]; m++; }
  return `${m + 1} 月 ${doy} 日`;
}

export function EarthMotion() {
  const [mode, setMode] = useState<Mode>('revolve');
  const [phi, setPhi] = useState(180);
  const [spin, setSpin] = useState(300);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const speedRef = useRef(1);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      if (mode === 'revolve') setPhi((p) => (p + 0.28 * speedRef.current + 360) % 360);
      else setSpin((s) => (s + 1.1 * speedRef.current + 360) % 360);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, mode]);

  function chooseMode(m: Mode) { if (m === mode) return; setMode(m); setPlaying(false); }
  const jump = (deg: number) => { setPlaying(false); setPhi(deg); };

  // ── 公转量值 ──
  const sunLat = -TILT * Math.cos(rad(phi));
  const seasonN = phi >= 135 && phi < 225 ? '夏季' : phi >= 225 && phi < 315 ? '秋季' : phi >= 45 && phi < 135 ? '春季' : '冬季';
  const near = SEASONS.find((s) => Math.min(Math.abs(phi - s.deg), 360 - Math.abs(phi - s.deg)) < 3.5);
  const dayHintN = sunLat > 0.6 ? '昼长夜短' : sunLat < -0.6 ? '昼短夜长' : '昼夜平分';
  const polarBand = 90 - Math.abs(sunLat);
  const polarText = Math.abs(sunLat) < 0.6 ? '无极昼极夜' : sunLat > 0 ? `北纬 ${polarBand.toFixed(1)}° 以北极昼,南纬同纬度以南极夜` : `南纬 ${polarBand.toFixed(1)}° 以南极昼,北纬同纬度以北极夜`;

  // ── 光照图几何 ──
  const lcx = 220, lcy = 192, LR = 150;
  const latY = (f: number) => lcy - LR * Math.sin(rad(f));
  const latHalf = (f: number) => LR * Math.cos(rad(f));
  const sunAngle = Math.atan2(-Math.sin(rad(sunLat)), -Math.cos(rad(sunLat))) * 180 / Math.PI; // 指向太阳
  const directPt: [number, number] = [lcx - latHalf(sunLat), latY(sunLat)];
  const LATS = [
    { f: 66.5, name: '北极圈' }, { f: 23.5, name: '北回归线' }, { f: 0, name: '赤道' },
    { f: -23.5, name: '南回归线' }, { f: -66.5, name: '南极圈' },
  ];
  const ZONES = [{ f: 79, n: '北寒带' }, { f: 45, n: '北温带' }, { f: 0, n: '热带' }, { f: -45, n: '南温带' }, { f: -79, n: '南寒带' }];
  // 直射光线(平行)
  const rdx = Math.cos(rad(sunLat)), rdy = Math.sin(rad(sunLat)); // 行进方向
  const rays = [-60, -30, 0, 30, 60].map((off) => {
    const ox = -rdy, oy = rdx; // 垂直偏移
    const sx = directPt[0] + ox * off - rdx * 70, sy = directPt[1] + oy * off - rdy * 70;
    const ex = directPt[0] + ox * off, ey = directPt[1] + oy * off;
    return { sx, sy, ex, ey };
  });

  // ── 轨道缩略 ──
  const ocx = 610, ocy = 175, orx = 120, ory = 92;
  const epos = (deg: number): [number, number] => [ocx + orx * Math.cos(rad(deg)), ocy - ory * Math.sin(rad(deg))];
  const [oex, oey] = epos(phi);
  const oSun = Math.atan2(ocy - oey, ocx - oex) * 180 / Math.PI;

  // ── 自转(北极上空俯视)──
  // 太阳在右侧 → 正午(12 时);经度自正午逆时针增大,地方时 = 12 + spin/15。
  // 晨昏线随季节(直射点纬度 sunLat)倾斜:夏至北极圈内极昼、冬至极夜、二分过极点。
  const gcx = 300, gcy = 215, gr = 162;
  const declR = rad(sunLat);
  const tic = (deg: number, r: number): [number, number] => [gcx + r * Math.cos(rad(deg)), gcy - r * Math.sin(rad(deg))];
  // 晨昏线(北半球可见段)+ 夜半球区域路径
  const termPts: [number, number][] = Array.from({ length: 25 }, (_, i) => { const t = Math.PI * i / 24; return [gcx - gr * Math.sin(t) * Math.sin(declR), gcy - gr * Math.cos(t)]; });
  const nightD = `M ${termPts[0][0].toFixed(1)} ${termPts[0][1].toFixed(1)} ` +
    termPts.slice(1).map((p) => `L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') +
    ` A ${gr} ${gr} 0 0 1 ${termPts[0][0].toFixed(1)} ${termPts[0][1].toFixed(1)} Z`;
  // 城市:北纬 40°,昼夜由日照判定(随季节),地方时由经度(spin)决定
  const cLatR = rad(40), lamR = rad(spin), cityRr = gr * Math.cos(cLatR);
  const cityX = gcx + cityRr * Math.cos(lamR), cityY = gcy - cityRr * Math.sin(lamR);
  const cityDay = Math.cos(cLatR) * Math.cos(lamR) * Math.cos(declR) + Math.sin(cLatR) * Math.sin(declR) > 0;
  let h = (12 + spin / 15) % 24; if (h < 0) h += 24;
  const cityTime = `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`;
  const polar = Math.abs(sunLat) > 1 ? (sunLat > 0 ? '北极圈内极昼' : '北极圈内极夜') : null;

  const sliderVal = mode === 'revolve' ? phi : spin;
  const onSlide = (v: number) => { setPlaying(false); if (mode === 'revolve') setPhi(v); else setSpin(v); };

  return (
    <div className="em">
      <div className="em-top">
        <div className="seg">
          <button className={mode === 'revolve' ? 'on' : ''} onClick={() => chooseMode('revolve')}>公转</button>
          <button className={mode === 'rotate' ? 'on' : ''} onClick={() => chooseMode('rotate')}>自转</button>
        </div>
        <Btn variant="coral" onClick={() => setPlaying((p) => !p)}><Icon name={playing ? 'player-pause' : 'player-play'} /> {playing ? '暂停' : '播放'}</Btn>
        <div className="em-speed">{SPEEDS.map((s) => <button key={s} className={speed === s ? 'on' : ''} onClick={() => setSpeed(s)}>{s}×</button>)}</div>
        <div style={{ flex: 1 }} />
        <div className="em-jumps"><span className="em-jumps-l">{mode === 'revolve' ? '节气' : '季节'}</span>{SEASONS.map((s) => <button key={s.id} className={near?.id === s.id ? 'on' : ''} onClick={() => jump(s.deg)}>{s.name}</button>)}</div>
      </div>

      <div className="em-slider">
        <span>{mode === 'revolve' ? '公转进度(日期)' : '自转(地方时)'}</span>
        <input type="range" min={0} max={359} value={Math.round(sliderVal)} onChange={(e) => onSlide(Number(e.target.value))} />
        <span className="em-slider-v">{mode === 'revolve' ? dateStr(phi) : cityTime}</span>
      </div>

      <div className="em-main">
        <div className="em-board">
          {mode === 'revolve' ? (
            <svg viewBox="0 0 760 400" className="em-svg" xmlns="http://www.w3.org/2000/svg">
              {/* ── 光照图 ── */}
              <text x={20} y={28} className="em-h2">日照图</text>
              <defs>
                <clipPath id="em-earth"><circle cx={lcx} cy={lcy} r={LR} /></clipPath>
                <marker id="em-ray" markerWidth="9" markerHeight="9" refX="6.5" refY="3" orient="auto"><path d="M0,0 L6.5,3 L0,6 Z" fill="#E8A23C" /></marker>
              </defs>
              {/* 直射光线 */}
              {rays.map((r, i) => <line key={i} x1={r.sx} y1={r.sy} x2={r.ex} y2={r.ey} stroke="#E8A23C" strokeWidth={2} strokeOpacity={0.7} markerEnd="url(#em-ray)" />)}
              <text x={rays[0].sx - 2} y={rays[0].sy - 8} className="em-sun">太阳光</text>
              {/* 地球 + 昼夜 */}
              <g clipPath="url(#em-earth)">
                <circle cx={lcx} cy={lcy} r={LR} fill={DAY} />
                <rect x={lcx - 2 * LR} y={lcy - 2 * LR} width={2 * LR} height={4 * LR} fill={NIGHT} opacity={0.9} transform={`rotate(${sunAngle} ${lcx} ${lcy})`} />
                {/* 五带带名(底层) */}
                {ZONES.map((z) => <text key={z.n} x={lcx} y={latY(z.f) + 4} className="em-zone" textAnchor="middle">{z.n}</text>)}
                {/* 纬线 */}
                {LATS.map((L) => <line key={L.name} x1={lcx - latHalf(L.f)} y1={latY(L.f)} x2={lcx + latHalf(L.f)} y2={latY(L.f)} stroke="rgba(44,62,80,0.4)" strokeWidth={L.f === 0 ? 1.4 : 1} strokeDasharray={L.f === 0 ? undefined : '4 3'} />)}
              </g>
              <circle cx={lcx} cy={lcy} r={LR} fill="none" stroke="rgba(44,62,80,0.55)" strokeWidth={1.4} />
              {/* 地轴 */}
              <line x1={lcx} y1={lcy - LR - 14} x2={lcx} y2={lcy + LR + 14} stroke="var(--ink)" strokeWidth={1.6} strokeDasharray="3 2" />
              <text x={lcx} y={lcy - LR - 18} textAnchor="middle" className="em-pole">北极 N</text>
              <text x={lcx} y={lcy + LR + 26} textAnchor="middle" className="em-pole">南极 S</text>
              {/* 纬线名(右端) */}
              {LATS.map((L) => <text key={`t${L.name}`} x={lcx + latHalf(L.f) + 6} y={latY(L.f) + 4} className="em-lat">{L.name}</text>)}
              {/* 直射点 */}
              <circle cx={directPt[0]} cy={directPt[1]} r={5} fill="#E24B4A" stroke="#fff" strokeWidth={1.5} />
              <text x={directPt[0] - 8} y={directPt[1] - 9} textAnchor="end" className="em-direct">太阳直射点</text>
              {/* 极昼/极夜 标注:极昼在直射点所在半球的极点 */}
              {Math.abs(sunLat) > 1 && <>
                <text x={lcx - 52} y={latY(sunLat > 0 ? 82 : -82) + 4} className="em-polar" fill="#E8902C" textAnchor="middle">极昼</text>
                <text x={lcx - 52} y={latY(sunLat > 0 ? -82 : 82) + 4} className="em-polar" fill="#3a4a63" textAnchor="middle">极夜</text>
              </>}

              {/* ── 轨道缩略 ── */}
              <text x={520} y={28} className="em-h2">公转轨道</text>
              <ellipse cx={ocx} cy={ocy} rx={orx} ry={ory} fill="none" stroke="var(--rule)" strokeWidth={1.4} strokeDasharray="4 4" />
              <circle cx={ocx} cy={ocy} r={20} fill="#F6B73C" /><text x={ocx} y={ocy + 4} textAnchor="middle" style={{ fontSize: 11, fontWeight: 700, fill: '#7a5410' }}>太阳</text>
              {SEASONS.map((s) => { const [x, y] = epos(s.deg); return <g key={s.id}><circle cx={x} cy={y} r={3.5} fill="var(--ink-faint)" /><text x={x} y={y + (s.deg === 90 ? 18 : s.deg === 270 ? -10 : -9)} textAnchor="middle" style={{ fontSize: 11, fontWeight: 700, fill: near?.id === s.id ? 'var(--coral)' : 'var(--ink-soft)' }}>{s.name}</text></g>; })}
              <line x1={ocx} y1={ocy} x2={oex} y2={oey} stroke="#F6B73C" strokeWidth={1.5} strokeOpacity={0.5} />
              <EarthMini cx={oex} cy={oey} r={14} sunAngle={oSun} />
            </svg>
          ) : (
            <svg viewBox="0 0 700 430" className="em-svg" xmlns="http://www.w3.org/2000/svg">
              <text x={20} y={26} className="em-h2">自转(从北极上空俯视)</text>
              <defs>
                <clipPath id="em-globe"><circle cx={gcx} cy={gcy} r={gr} /></clipPath>
                <marker id="em-ray2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#E8A23C" /></marker>
                <marker id="em-ccw" markerWidth="9" markerHeight="9" refX="5" refY="3" orient="auto"><path d="M0,0 L6.5,3 L0,6 Z" fill="var(--ink-soft)" /></marker>
              </defs>
              {/* 太阳光(自右侧水平射入)*/}
              {[-78, -28, 28, 78].map((dy) => <line key={dy} x1={gcx + gr + 92} y1={gcy + dy} x2={gcx + gr + 12} y2={gcy + dy} stroke="#E8A23C" strokeWidth={2} strokeOpacity={0.6} markerEnd="url(#em-ray2)" />)}
              <text x={gcx + gr + 92} y={gcy - 96} textAnchor="end" className="em-sun">太阳光</text>
              {/* 地球(俯视:外缘=赤道,圆心=北极)*/}
              <g clipPath="url(#em-globe)">
                <circle cx={gcx} cy={gcy} r={gr} fill={DAY} />
                <path d={nightD} fill={NIGHT} opacity={0.9} />
                {[gr * 0.917, gr * 0.398].map((r, i) => <circle key={i} cx={gcx} cy={gcy} r={r} fill="none" stroke="rgba(44,62,80,0.22)" strokeWidth={1} strokeDasharray="4 3" />)}
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((m) => { const [x, y] = tic(m + spin, gr); return <line key={m} x1={gcx} y1={gcy} x2={x} y2={y} stroke="rgba(44,62,80,0.16)" strokeWidth={1} />; })}
              </g>
              <circle cx={gcx} cy={gcy} r={gr} fill="none" stroke="rgba(44,62,80,0.5)" strokeWidth={1.4} />
              {/* 晨昏线(随季节倾斜)*/}
              <polyline points={termPts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')} fill="none" stroke="var(--ink)" strokeWidth={1.8} strokeDasharray="6 3" />
              {polar && <text x={gcx} y={tic(sunLat > 0 ? 90 : 270, gr * 0.2)[1]} textAnchor="middle" className="em-polar" fill={sunLat > 0 ? '#E8902C' : '#3a4a63'}>{sunLat > 0 ? '极昼' : '极夜'}</text>}
              {/* 北极 / 赤道 */}
              <circle cx={gcx} cy={gcy} r={3.5} fill="var(--ink)" />
              <text x={gcx + 7} y={gcy - 6} className="em-pole">北极</text>
              <text x={tic(150, gr)[0] - 6} y={tic(150, gr)[1] - 4} className="em-lat" textAnchor="end">赤道</text>
              {/* 昼夜半球 + 时刻 */}
              <text x={gcx + gr * 0.5} y={gcy - 6} textAnchor="middle" className="em-half" fill="#2c6fb0">昼半球</text>
              <text x={gcx - gr * 0.5} y={gcy - 6} textAnchor="middle" className="em-half" fill="#cdd6e3">夜半球</text>
              <text x={gcx + gr * 0.52} y={gcy + 12} textAnchor="middle" className="em-time">正午 12 时</text>
              <text x={gcx - gr * 0.52} y={gcy + 12} textAnchor="middle" className="em-time" fill="#cdd6e3">午夜 0 时</text>
              <text x={gcx} y={gcy - gr - 24} textAnchor="middle" className="em-line">昏线(日落 18 时)</text>
              <text x={gcx} y={gcy + gr + 22} textAnchor="middle" className="em-line">晨线(日出 6 时)</text>
              {/* 自转方向:逆时针(顶部箭头向左)*/}
              <path d={`M ${gcx + 46} ${gcy - gr - 38} Q ${gcx} ${gcy - gr - 54} ${gcx - 46} ${gcy - gr - 38}`} fill="none" stroke="var(--ink-soft)" strokeWidth={2} markerEnd="url(#em-ccw)" />
              <text x={gcx} y={gcy - gr - 58} textAnchor="middle" style={{ fontSize: 12, fontWeight: 700, fill: 'var(--ink-soft)' }}>自西向东(逆时针)</text>
              {/* 城市点 + 当地时间 */}
              <line x1={gcx} y1={gcy} x2={cityX} y2={cityY} stroke="var(--coral)" strokeWidth={1.4} strokeOpacity={0.5} />
              <circle cx={cityX} cy={cityY} r={6.5} fill="var(--coral)" stroke="#fff" strokeWidth={2} />
              <text x={cityX} y={cityY - 12} textAnchor="middle" style={{ fontSize: 12, fontWeight: 800, fill: 'var(--ink)', paintOrder: 'stroke', stroke: 'rgba(255,255,255,0.85)', strokeWidth: 3 }}>城市 {cityTime}·{cityDay ? '昼' : '夜'}</text>
            </svg>
          )}
        </div>

        <div className="em-side">
          {mode === 'revolve' ? (
            <>
              <div className="em-card-h">{near ? `${near.name}` : seasonN} · {dateStr(phi)}</div>
              <div className="em-row"><span>太阳直射点</span><b>{latText(sunLat)}</b></div>
              <div className="em-row"><span>北半球季节</span><b>{seasonN}</b></div>
              <div className="em-row"><span>北半球昼夜</span><b>{dayHintN}</b></div>
              <div className="em-note"><b>极昼极夜</b>:{polarText}</div>
              <ul className="em-facts">
                <li>地轴倾斜约 23.5°,方向始终指向北极星</li>
                <li>直射点在南北回归线之间往返移动</li>
                <li>二分日全球昼夜平分;二至日昼夜差最大</li>
                <li>五带:热带有直射,寒带有极昼极夜,温带都没有</li>
              </ul>
            </>
          ) : (
            <>
              <div className="em-card-h">地球自转 · {near ? near.name : seasonN}</div>
              <div className="em-row"><span>日期 / 直射点</span><b>{dateStr(phi)} · {latText(sunLat)}</b></div>
              <div className="em-row"><span>城市(40°N)</span><b>{cityTime} · {cityDay ? '白天' : '黑夜'}</b></div>
              {polar && <div className="em-row"><span>极昼极夜</span><b>{polar}</b></div>}
              <div className="em-note"><b>自转</b>(约 24 小时、自西向东)产生<b>昼夜交替与时间</b>:正午对着太阳 12 时,午夜 0 时。<b>季节</b>(直射点移动)改变晨昏线的倾斜:夏至北极圈内极昼、冬至极夜、二分晨昏线过极点。可切换上方节气,再拖滑块看一天。</div>
              <ul className="em-facts">
                <li>从北极上空看,自转呈逆时针(自西向东)</li>
                <li>晨线:由夜进入昼(日出);昏线:由昼进入夜(日落)</li>
                <li>经度每差 15°,地方时差 1 小时;东边先看到日出</li>
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// 轨道上的小地球(含昼夜与倾斜地轴)
function EarthMini({ cx, cy, r, sunAngle }: { cx: number; cy: number; r: number; sunAngle: number }) {
  const id = `mini-${Math.round(cx)}-${Math.round(cy)}`;
  const ax = Math.sin(rad(TILT)), ay = -Math.cos(rad(TILT)), L = r * 1.3;
  return (
    <g>
      <defs><clipPath id={id}><circle cx={cx} cy={cy} r={r} /></clipPath></defs>
      <g clipPath={`url(#${id})`}>
        <circle cx={cx} cy={cy} r={r} fill={DAY} />
        <rect x={cx - 2 * r} y={cy - 2 * r} width={2 * r} height={4 * r} fill={NIGHT} opacity={0.9} transform={`rotate(${sunAngle} ${cx} ${cy})`} />
      </g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(44,62,80,0.5)" strokeWidth={1} />
      <line x1={cx - ax * L} y1={cy - ay * L} x2={cx + ax * L} y2={cy + ay * L} stroke="var(--ink)" strokeWidth={1.4} strokeDasharray="2 2" />
    </g>
  );
}
