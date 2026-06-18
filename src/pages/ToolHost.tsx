import { Suspense, lazy, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTool } from '../tools/registry';
import { getSubject } from '../core/subjects';
import { Shell, StageBar } from '../app/ui';

export function ToolHost() {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();
  const tool = toolId ? getTool(toolId) : undefined;
  const Comp = useMemo(() => (tool ? lazy(tool.entry) : null), [tool]);

  if (!tool || !Comp) {
    return <Shell><StageBar title="工具不存在" onBack={() => navigate('/')} /></Shell>;
  }

  const subject = getSubject(tool.subject);
  return (
    <Shell>
      <StageBar
        crumb={subject?.name}
        title={tool.title}
        onBack={() => navigate(subject ? `/subject/${subject.id}` : '/')}
      />
      <Suspense fallback={<div className="hc-loading">加载中…</div>}>
        <Comp />
      </Suspense>
    </Shell>
  );
}
