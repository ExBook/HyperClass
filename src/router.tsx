import { createHashRouter } from 'react-router-dom';
import { Home } from './pages/Home';
import { SubjectPage } from './pages/SubjectPage';
import { ToolHost } from './pages/ToolHost';
import { Settings } from './pages/Settings';

export const router = createHashRouter([
  { path: '/', element: <Home /> },
  { path: '/subject/:subjectId', element: <SubjectPage /> },
  { path: '/tool/:toolId', element: <ToolHost /> },
  { path: '/settings', element: <Settings /> },
]);
