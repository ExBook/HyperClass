import { useEffect, useRef, useState } from 'react';
import { DragLabelStage } from '../../../primitives/drag-label/DragLabelStage';
import type { FeatureMap, Usage } from '../../../primitives/drag-label/types';
import { Btn, Icon } from '../../../app/ui';
import { LABELS } from './labels';

const MAP_URL = import.meta.env.BASE_URL + 'content/geography/china-provinces/map.json';

export function ChinaProvinces() {
  const [geo, setGeo] = useState<FeatureMap | null>(null);
  const [usage, setUsage] = useState<Usage>('present');
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [graded, setGraded] = useState(false);
  const [sound, setSound] = useState(true);
  const audio = useRef<AudioContext | null>(null);

  useEffect(() => {
    let on = true;
    fetch(MAP_URL).then((r) => r.json()).then((d) => { if (on) setGeo(d as FeatureMap); }).catch(() => {});
    return () => { on = false; };
  }, []);

  const isPractice = usage === 'practice';
  const placedCount = Object.keys(placements).length;
  const correctCount = LABELS.filter((l) => placements[l.id] === l.targetFeatureId).length;
  const allCorrect = graded && correctCount === LABELS.length;

  function beep(freq: number, dur = 0.1, type: OscillatorType = 'triangle') {
    if (!sound) return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audio.current ?? (audio.current = new Ctx());
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = freq; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.06, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch { /* audio unavailable */ }
  }

  function setMode(u: Usage) { if (u === usage) return; setUsage(u); setPlacements({}); setGraded(false); }

  function assign(labelId: string, featureId: string) {
    if (graded) return;
    setPlacements((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) if (next[k] === featureId) delete next[k];
      next[labelId] = featureId;
      return next;
    });
    beep(520, 0.05);
  }

  function unassign(labelId: string) {
    if (graded) return;
    setPlacements((prev) => { const next = { ...prev }; delete next[labelId]; return next; });
  }

  function submit() {
    if (placedCount === 0 || graded) return;
    setGraded(true);
    const c = LABELS.filter((l) => placements[l.id] === l.targetFeatureId).length;
    if (c === LABELS.length) [523, 659, 784, 1047].forEach((f, i) => window.setTimeout(() => beep(f, 0.2), i * 130));
    else { beep(660, 0.12); window.setTimeout(() => beep(523, 0.16), 150); }
  }

  function redo() { setPlacements({}); setGraded(false); }

  if (!geo) return <div className="hc-loading">地图加载中…</div>;

  return (
    <div className="tool-wrap">
      <div className="tool-bar">
        <div className="seg">
          <button className={!isPractice ? 'on' : ''} onClick={() => setMode('present')}>演示</button>
          <button className={isPractice ? 'on' : ''} onClick={() => setMode('practice')}>练习</button>
        </div>
        {isPractice && !graded && <span className="tool-progress">已放置 {placedCount} / {LABELS.length}</span>}
        {isPractice && graded && <span className={`tool-score${allCorrect ? ' ok' : ''}`}>正确 {correctCount} / {LABELS.length}</span>}
        <div style={{ flex: 1 }} />
        <button className={`tg${sound ? ' on' : ''}`} onClick={() => setSound((s) => !s)}>
          <Icon name={sound ? 'volume' : 'volume-off'} size={16} /> 音效
        </button>
        {isPractice && !graded && <Btn variant="coral" onClick={submit} disabled={placedCount === 0}><Icon name="circle-check" /> 提交批改</Btn>}
        {isPractice && graded && <Btn onClick={redo}><Icon name="refresh" /> 重做</Btn>}
      </div>

      <DragLabelStage
        geo={geo}
        labels={LABELS}
        interactive={isPractice}
        placements={placements}
        graded={graded}
        onAssign={assign}
        onUnassign={unassign}
      />

      {allCorrect && (
        <div className="hc-overlay" onClick={redo}>
          <div className="hc-overlay-card" onClick={(e) => e.stopPropagation()}>
            <div className="hc-overlay-mark"><Icon name="bell-ringing" size={34} /></div>
            <h2>全部正确!</h2>
            <p>{LABELS.length} 个省级行政区全对</p>
            <Btn variant="coral" onClick={redo}><Icon name="refresh" /> 再来一次</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
