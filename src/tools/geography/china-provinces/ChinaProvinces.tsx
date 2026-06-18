import { useEffect, useRef, useState } from 'react';
import { DragLabelStage } from '../../../primitives/drag-label/DragLabelStage';
import type { FeatureMap, Usage } from '../../../primitives/drag-label/types';
import { Btn, Icon } from '../../../app/ui';
import { LABELS } from './labels';

const MAP_URL = '/content/geography/china-provinces/map.json';

export function ChinaProvinces() {
  const [geo, setGeo] = useState<FeatureMap | null>(null);
  const [usage, setUsage] = useState<Usage>('present');
  const [placed, setPlaced] = useState<{ labelId: string; featureId: string }[]>([]);
  const [done, setDone] = useState(false);
  const [sound, setSound] = useState(true);
  const audio = useRef<AudioContext | null>(null);

  useEffect(() => {
    let on = true;
    fetch(MAP_URL).then((r) => r.json()).then((d) => { if (on) setGeo(d as FeatureMap); }).catch(() => {});
    return () => { on = false; };
  }, []);

  const isPractice = usage === 'practice';
  const placedLabelIds = new Set(placed.map((p) => p.labelId));
  const correctFeatureIds = new Set(placed.map((p) => p.featureId));

  function beep(freq: number, dur = 0.1, type: OscillatorType = 'triangle') {
    if (!sound) return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audio.current ?? (audio.current = new Ctx());
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = freq; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.07, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch { /* audio unavailable */ }
  }

  function setMode(u: Usage) { if (u === usage) return; setUsage(u); setPlaced([]); setDone(false); }
  function reset() { setPlaced([]); setDone(false); }

  function handlePlace(labelId: string, isCorrect: boolean, featureId: string | null) {
    if (!isPractice) return;
    if (!isCorrect || !featureId) { beep(180, 0.13, 'sawtooth'); return; }
    if (placedLabelIds.has(labelId)) return;
    beep(660, 0.07); window.setTimeout(() => beep(990, 0.1), 70);
    const next = [...placed, { labelId, featureId }];
    setPlaced(next);
    if (next.length === LABELS.length) {
      setDone(true);
      [523, 659, 784, 1047].forEach((f, i) => window.setTimeout(() => beep(f, 0.2), i * 130));
    }
  }

  if (!geo) return <div className="hc-loading">地图加载中…</div>;

  return (
    <div className="tool-wrap">
      <div className="tool-bar">
        <div className="seg">
          <button className={!isPractice ? 'on' : ''} onClick={() => setMode('present')}>演示</button>
          <button className={isPractice ? 'on' : ''} onClick={() => setMode('practice')}>练习</button>
        </div>
        {isPractice && <span className="tool-progress">已放置 {placed.length} / {LABELS.length}</span>}
        <div style={{ flex: 1 }} />
        <button className={`tg${sound ? ' on' : ''}`} onClick={() => setSound((s) => !s)}>
          <Icon name={sound ? 'volume' : 'volume-off'} size={16} /> 音效
        </button>
        {isPractice && <Btn onClick={reset} disabled={placed.length === 0}><Icon name="refresh" /> 重置</Btn>}
      </div>

      <DragLabelStage
        geo={geo}
        labels={LABELS}
        usage={usage}
        onPlace={handlePlace}
        placedLabelIds={placedLabelIds}
        correctFeatureIds={correctFeatureIds}
      />

      {done && (
        <div className="hc-overlay" onClick={reset}>
          <div className="hc-overlay-card" onClick={(e) => e.stopPropagation()}>
            <div className="hc-overlay-mark"><Icon name="bell-ringing" size={34} /></div>
            <h2>全部就位!</h2>
            <p>{LABELS.length} 个省级行政区都放对了</p>
            <Btn variant="coral" onClick={reset}><Icon name="refresh" /> 再来一次</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
