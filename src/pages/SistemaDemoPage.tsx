import { Navigate, useParams } from 'react-router-dom';
import { DEMO_CATALOG, resolveDemoId } from '../data/sistemaDemoCatalog';
import { DemoExperienceShell } from '../components/DemoExperienceShell';
import { ColetaDemoApp } from './coletaDemo/ColetaDemoApp';
import { LigeirinhoDemoApp } from './bebidasDemo/LigeirinhoDemoApp';

export function SistemaDemoPage() {
  const { demoId: rawId } = useParams<{ demoId: string }>();
  const resolvedId = resolveDemoId(rawId);

  if (rawId === 'adega' || rawId === 'varejo') {
    return <Navigate to="/sistemas/demo/ligeirinho" replace />;
  }

  if (rawId === 'logistica') {
    return <Navigate to="/sistemas" replace />;
  }

  if (!resolvedId) {
    return <Navigate to="/sistemas" replace />;
  }

  const meta = DEMO_CATALOG[resolvedId];

  return (
    <DemoExperienceShell accent={meta.accent} label={meta.brandName}>
      {resolvedId === 'coleta' ? <ColetaDemoApp /> : <LigeirinhoDemoApp />}
    </DemoExperienceShell>
  );
}
