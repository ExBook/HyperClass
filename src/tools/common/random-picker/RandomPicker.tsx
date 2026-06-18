import { useState } from 'react';
import { Btn, Icon } from '../../../app/ui';
import { load, save } from '../../../core/storage';

const KEY = 'hc.random-picker.roster';

export function RandomPicker() {
  const [text, setText] = useState<string>(() => load(KEY, ''));
  const [picked, setPicked] = useState<string[]>([]);
  const [current, setCurrent] = useState<string | null>(null);

  const roster = text.split('\n').map((s) => s.trim()).filter(Boolean);
  const remaining = roster.filter((n) => !picked.includes(n));

  function pick() {
    if (remaining.length === 0) return;
    const next = remaining[Math.floor(Math.random() * remaining.length)];
    setCurrent(next);
    setPicked((p) => [...p, next]);
  }

  function reset() {
    setPicked([]);
    setCurrent(null);
  }

  function onText(value: string) {
    setText(value);
    save(KEY, value);
    setPicked([]);
    setCurrent(null);
  }

  const display = current ?? (roster.length ? '准备好了' : '先粘贴名单 →');

  return (
    <div className="picker">
      <div className="picker-stage">
        <div className="picker-name">{display}</div>
        <div className="picker-meta">剩余 {remaining.length} / {roster.length}</div>
        <div className="picker-actions">
          <Btn variant="coral" onClick={pick} disabled={remaining.length === 0}>
            <Icon name="hand-finger" /> 抽一个
          </Btn>
          <Btn onClick={reset} disabled={picked.length === 0}>
            <Icon name="refresh" /> 重置
          </Btn>
        </div>
      </div>
      <div className="picker-side">
        <label className="picker-label">名单(每行一个)</label>
        <textarea
          className="picker-input"
          value={text}
          onChange={(e) => onText(e.target.value)}
          placeholder={'张三\n李四\n王五'}
        />
      </div>
    </div>
  );
}
