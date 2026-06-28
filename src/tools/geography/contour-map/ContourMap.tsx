import { useMemo, useRef, useState } from 'react';
import { contours as d3contours } from 'd3-contour';
import { geoIdentity, geoPath } from 'd3-geo';
import { Btn, Icon } from '../../../app/ui';
import { load, save } from '../../../core/storage';
import { FEATURES, GH, GW, INTERVAL, LANDFORMS, RIVER, heightField, tintFor, type Landform } from './terrain';

const KEY = 'hc.contour-map';
const S = 4.5, SW = GW * S, SH = GH * S; // 720 × 504
type Mode = 'present' | 'practice';
const rand = () => FEATURES[Math.floor(Math.random() * FEATURES.length)].id;

export function ContourMap() {
  const init = load<{ sound?: boolean }>(KEY, {});
  const [mode, setMode] = useState<Mode>('present');
  const [sound, setSound] = useState(init.sound ?? true);
  const [qid, setQid] = useState<string>(rand);
  const [picked, setPicked] = useState<Landform | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const audio = useRef<AudioContext | null>(null);

  const bands = useMemo(() => {
    const f = heightField();
    const levels: number[] = [];
    for (let l = Math.ceil(f.min / INTERVAL) * INTERVAL; l < f.max; l += INTERVAL) levels.push(l);
    const cs = d3contours().size([GW, GH]).thresholds(levels)(f.values);
    const pg = geoPath(geoIdentity().scale(S));
    return cs.map((c) => ({ value: c.value, d: pg(c) ?? '' }));
  }, []);

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

  const ux = (u: number) => u * SW, vy = (v: number) => v * SH;
  const riverD = RIVER.map((p, i) => `${i ? 'L' : 'M'}${ux(p[0]).toFixed(1)} ${vy(p[1]).toFixed(1)}`).join(' ');
  const feat = FEATURES.find((f) => f.id === qid)!;
  const reveal = mode === 'present' || picked != null;

  function chooseMode(m: Mode) { if (m === mode) return; setMode(m); setPicked(null); }
  function answer(t: Landform) {
    if (picked) return;
    setPicked(t);
    const ok = t === feat.type;
    setScore((s) => ({ right: s.right + (ok ? 1 : 0), total: s.total + 1 }));
    if (ok) { beep(880, 0.12); window.setTimeout(() => beep(1175, 0.16), 100); } else beep(300, 0.18);
  }
  function next() { setQid(rand()); setPicked(null); }
  function toggleSound() { setSound((s) => { const v = !s; save(KEY, { sound: v }); return v; }); }

  return (
    <div className="cm">
      <div className="cm-top">
        <div className="seg">
          <button className={mode === 'present' ? 'on' : ''} onClick={() => chooseMode('present')}>演示</button>
          <button className={mode === 'practice' ? 'on' : ''} onClick={() => chooseMode('practice')}>练习</button>
        </div>
        {mode === 'practice' && <span className="cg-score">得分 {score.right} / {score.total}</span>}
        <div style={{ flex: 1 }} />
        <span className="cm-iv">等高距 {INTERVAL} 米</span>
        <button className={`tg${sound ? ' on' : ''}`} onClick={toggleSound}><Icon name={sound ? 'volume' : 'volume-off'} size={16} /> 音效</button>
        {mode === 'practice' && <Btn variant="coral" onClick={next} disabled={!picked}><Icon name="refresh" /> 下一题</Btn>}
      </div>

      <div className="cm-main">
        <div className="cm-board">
          <svg viewBox={`0 0 ${SW} ${SH}`} className="cm-svg" xmlns="http://www.w3.org/2000/svg">
            <rect x={0} y={0} width={SW} height={SH} fill="#CBE3AE" />
            {/* 分层设色 */}
            {bands.map((b, i) => <path key={`f${i}`} d={b.d} fill={tintFor(b.value)} />)}
            {/* 等高线(每 500 米为计曲线,加粗) */}
            {bands.map((b, i) => (
              <path key={`l${i}`} d={b.d} fill="none" stroke="#9A6B3F"
                strokeWidth={b.value % 500 === 0 ? 1.6 : 0.8} strokeOpacity={b.value % 500 === 0 ? 0.85 : 0.55} />
            ))}
            {/* 山谷里的河流 */}
            <path d={riverD} fill="none" stroke="#378ADD" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />

            {mode === 'present'
              ? FEATURES.map((f) => (
                <g key={f.id} transform={`translate(${ux(f.u)} ${vy(f.v)})`}>
                  <circle r={6} fill="var(--navy)" stroke="#fff" strokeWidth={2} />
                  <text y={-12} textAnchor="middle" className="cm-mk">{f.type}</text>
                </g>
              ))
              : (
                <g transform={`translate(${ux(feat.u)} ${vy(feat.v)})`}>
                  <circle className="cm-pulse" r={16} fill="none" stroke="var(--coral)" strokeWidth={2.5} />
                  <circle r={9} fill="var(--coral)" stroke="#fff" strokeWidth={2} />
                  <text y={5} textAnchor="middle" fill="#fff" fontWeight={800} fontSize={13}>?</text>
                </g>
              )}
          </svg>
        </div>

        <div className="cm-side">
          {mode === 'present' ? (
            <>
              <div className="cm-side-head">分层设色</div>
              <ul className="cm-legend">
                {[700, 600, 500, 400, 300].map((v) => (
                  <li key={v}><i style={{ background: tintFor(v) }} />{v}–{v + 100} 米</li>
                ))}
                <li><i style={{ background: '#CBE3AE' }} />200 米以下</li>
              </ul>
              <div className="cm-side-head" style={{ marginTop: 12 }}>地形部位判读</div>
              <ul className="cm-how">
                <li><b>山峰</b> 闭合等高线,中间高</li>
                <li><b>鞍部</b> 两山峰之间的低地</li>
                <li><b>山脊</b> 等高线向<u>低处</u>凸(分水岭)</li>
                <li><b>山谷</b> 等高线向<u>高处</u>凸(易有河流)</li>
                <li><b>陡崖</b> 等高线重叠 / 密集</li>
              </ul>
            </>
          ) : (
            <>
              <div className="cm-side-head">图中「?」处是哪种地形部位?</div>
              <ul className="cm-options">
                {LANDFORMS.map((t) => {
                  const state = picked == null ? '' : t === feat.type ? ' ok' : t === picked ? ' no' : '';
                  return <li key={t}><button className={`cg-opt${state}`} disabled={picked != null} onClick={() => answer(t)}>{t}</button></li>;
                })}
              </ul>
              {reveal && (
                <div className="cm-reveal">
                  <b>{feat.type}</b>:{feat.how}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
