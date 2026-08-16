import type { ReactNode } from 'react';
import Archive from './pages/Archive';
import Conversation from './pages/Conversation';
import Landing from './pages/Landing';
import Map from './pages/Map';
import Mirror from './pages/Mirror';
import Onboarding from './pages/Onboarding';
import Result from './pages/Result';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Landing',
    path: '/',
    element: <Landing />
  },
  {
    name: 'Onboarding',
    path: '/onboarding',
    element: <Onboarding />
  },
  {
    name: 'Conversation',
    path: '/conversation/:pathType',
    element: <Conversation />
  },
  {
    name: 'Mirror',
    path: '/mirror/:pathType',
    element: <Mirror />
  },
  {
    name: 'Result',
    path: '/result/:pathType',
    element: <Result />
  },
  {
    name: 'Archive',
    path: '/archive',
    element: <Archive />
  },
  {
    name: 'Map',
    path: '/map',
    element: <Map />
  }
];

export default routes;
