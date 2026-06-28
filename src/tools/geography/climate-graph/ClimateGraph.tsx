import { useRef, useState } from 'react';
import { Btn, Icon } from '../../../app/ui';
import { load, save } from '../../../core/storage';
import { CLIMATES, byId, read, type ClimateType } from './data';

const KEY = 'hc.climate-graph';
const W = 580, H = 360, mL = 46, mR = 48, mT = 18, mB = 44;
const PW = W - mL - mR, PH = H - mT - mB;
const T_LO = -20, T_HI = 40;
const MONTHS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const niceCeil = (v: number) => { const s = v <= 100 ? 20 : v <= 300 ? 50 : 100; return Math.max(s, Math.ceil(v / s) * s); };

type Mode = 'present' | 'practice';

function shuffle<T>(a: T[]): T[] { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }
function makeQuestion(): { answer: string; options: string[] } {
  const answer = CLIMATES[Math.floor(Math.random() * CLIMATES.length)];
  const same = CLIMATES.filter((c) => c.id !== answer.id && c.zone === answer.zone);
  const other = CLIMATES.filter((c) => c.id !== answer.id && c.zone !== answer.zone);
  const distract = shuffle(same).slice(0, 2).concat(shuffle(other)).slice(0, 3);
  return { answer: answer.id, options: shuffle([answer.id, ...distract.map((c) => c.id)]) };
}

export function ClimateGraph() {
  const init = load<{ sound?: boolean }>(KEY, {});
  const [mode, setMode] = useState<Mode>('present');
  const [sound, setSound] = useState(init.sound ?? true);
  const [curId, setCurId] = useState(CLIMATES[0].id);
  const [q, setQ] = useState(makeQuestion);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const audio = useRef<AudioContext | null>(null);

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

  function chooseMode(m: Mode) { if (m === mode) return; setMode(m); setPicked(null); }
  function toggleSound() { setSound((s) => { const v = !s; save(KEY, { sound: v }); return v; }); }
  function answer(id: string) {
    if (picked) return;
    setPicked(id);
    const ok = id === q.answer;
    setScore((s) => ({ right: s.right + (ok ? 1 : 0), total: s.total + 1 }));
    if (ok) { beep(880, 0.12); window.setTimeout(() => beep(1175, 0.16), 100); } else { beep(300, 0.18); }
  }
  function next() { setQ(makeQuestion()); setPicked(null); }

  const shownId = mode === 'present' ? curId : q.answer;
  const c = byId(shownId);
  const reveal = mode === 'present' || picked !== null;
  const pHi = niceCeil(Math.max(...c.precip));

  const xAt = (i: number) => mL + (i + 0.5) / 12 * PW;
  const tY = (t: number) => mT + (T_HI - t) / (T_HI - T_LO) * PH;
  const pY = (v: number) => mT + PH - v / pHi * PH;
  const barW = PW / 12 * 0.56;
  const tTicks = [-20, -10, 0, 10, 20, 30, 40];
  const pTicks = Array.from({ length: 6 }, (_, i) => Math.round(pHi / 5 * i));
  const linePts = c.temps.map((t, i) => `${xAt(i).toFixed(1)},${tY(t).toFixed(1)}`).join(' ');

  const Chart = (
    <svg className="cg-svg" viewBox={`0 0 ${W} ${H}`} role="img">
      {/* 横向网格 + 左温度轴刻度 */}
      {tTicks.map((t) => (
        <g key={`t${t}`}>
          <line x1={mL} y1={tY(t)} x2={mL + PW} y2={tY(t)} stroke="var(--rule)" strokeWidth={t === 0 ? 1.4 : 0.8} strokeDasharray={t === 0 ? undefined : '3 3'} />
          <text x={mL - 8} y={tY(t) + 4} className="cg-tick" textAnchor="end">{t}</text>
        </g>
      ))}
      {/* 右降水轴刻度 */}
      {pTicks.map((v) => <text key={`p${v}`} x={mL + PW + 8} y={pY(v) + 4} className="cg-tick" textAnchor="start">{v}</text>)}
      {/* 月份 */}
      {MONTHS.map((m, i) => <text key={m} x={xAt(i)} y={mT + PH + 18} className="cg-tick" textAnchor="middle">{m}</text>)}
      <text x={mL - 30} y={mT - 4} className="cg-axis">℃</text>
      <text x={mL + PW + 18} y={mT - 4} className="cg-axis">mm</text>

      <g key={shownId} className="cg-anim">
        {/* 降水柱 */}
        {c.precip.map((v, i) => (
          <rect key={i} className="cg-precip" x={xAt(i) - barW / 2} y={pY(v)} width={barW} height={mT + PH - pY(v)} rx={2}
            style={{ animationDelay: `${i * 35}ms` }} />
        ))}
        {/* 气温曲线 */}
        <polyline className="cg-temp" points={linePts} fill="none" />
        {c.temps.map((t, i) => <circle key={i} className="cg-dot" cx={xAt(i)} cy={tY(t)} r={3.2} />)}
      </g>
    </svg>
  );

  return (
    <div className="cg">
      <div className="cg-top">
        <div className="seg">
          <button className={mode === 'present' ? 'on' : ''} onClick={() => chooseMode('present')}>演示</button>
          <button className={mode === 'practice' ? 'on' : ''} onClick={() => chooseMode('practice')}>练习</button>
        </div>
        {mode === 'practice' && <span className="cg-score">得分 {score.right} / {score.total}</span>}
        <div style={{ flex: 1 }} />
        <button className={`tg${sound ? ' on' : ''}`} onClick={toggleSound}><Icon name={sound ? 'volume' : 'volume-off'} size={16} /> 音效</button>
        {mode === 'practice' && <Btn variant="coral" onClick={next} disabled={!picked}><Icon name="refresh" /> 下一题</Btn>}
      </div>

      <div className="cg-main">
        <div className="cg-board">
          <div className="cg-legend">
            <span><i className="cg-lg-temp" /> 气温(℃)</span>
            <span><i className="cg-lg-prec" /> 降水量(mm)</span>
            {mode === 'present' && <b className="cg-title">{c.name} · {c.example}</b>}
            {mode === 'practice' && <b className="cg-title">{reveal ? c.name : '这是哪种气候类型?'}</b>}
          </div>
          {Chart}
        </div>

        <div className="cg-side">
          {mode === 'present' ? (
            <>
              <div className="cg-side-head">气候类型</div>
              <ul className="cg-list">
                {CLIMATES.map((cl) => (
                  <li key={cl.id}>
                    <button className={cl.id === curId ? 'on' : ''} onClick={() => setCurId(cl.id)}>
                      <span className={`cg-zone z-${cl.zone}`}>{cl.zone}</span>{cl.name}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <div className="cg-side-head">选出气候类型</div>
              <ul className="cg-options">
                {q.options.map((id) => {
                  const cl = byId(id);
                  const state = picked == null ? '' : id === q.answer ? ' ok' : id === picked ? ' no' : '';
                  return <li key={id}><button className={`cg-opt${state}`} disabled={picked != null} onClick={() => answer(id)}>{cl.name}</button></li>;
                })}
              </ul>
            </>
          )}

          {reveal && <ClimateReadout c={c} />}
        </div>
      </div>
    </div>
  );
}

function ClimateReadout({ c }: { c: ClimateType }) {
  const r = read(c);
  return (
    <div className="cg-read">
      <div className="cg-read-row"><span>最热月</span><b>{r.tHot}℃（{r.tHotMon}月）</b></div>
      <div className="cg-read-row"><span>最冷月</span><b>{r.tCold}℃（{r.tColdMon}月）</b></div>
      <div className="cg-read-row"><span>气温年较差</span><b>{r.tRange}℃</b></div>
      <div className="cg-read-row"><span>年降水量</span><b>{r.annual} mm</b></div>
      <div className="cg-read-key"><Icon name="circle-check" size={14} /> 以温定带:{r.zoneBy}</div>
      <div className="cg-read-key"><Icon name="cloud-rain" size={14} /> 以水定型:{r.rainType}</div>
      <div className="cg-read-hint">{c.hint}</div>
    </div>
  );
}
