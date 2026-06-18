import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shell, StageBar } from '../app/ui';
import { load, save } from '../core/storage';

const THEMES = [
  { id: 'light', name: '日光' },
  { id: 'dark', name: '月夜' },
  { id: 'system', name: '跟随系统' },
] as const;

export function applyTheme(theme: string) {
  const dark = theme === 'dark'
    || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}

export function Settings() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<string>(() => load('hc.theme', 'system'));

  function choose(next: string) {
    setTheme(next);
    save('hc.theme', next);
    applyTheme(next);
  }

  return (
    <Shell>
      <StageBar crumb="工具箱" title="设置" onBack={() => navigate('/')} />
      <div className="settings">
        <section className="settings-group">
          <h2>主题</h2>
          <div className="settings-opts">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`settings-opt${theme === t.id ? ' on' : ''}`}
                onClick={() => choose(t.id)}
              >{t.name}</button>
            ))}
          </div>
        </section>
        <section className="settings-group">
          <h2>关于</h2>
          <p className="settings-about">HyperClass · 课堂工具箱 · v0.1</p>
        </section>
      </div>
    </Shell>
  );
}
