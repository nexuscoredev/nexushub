import { useEffect } from 'react';

/** Redireciona a raiz do app para o site institucional estático em /site */
export function SiteRedirectPage() {
  useEffect(() => {
    window.location.replace('/site/home.html');
  }, []);

  return (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
      A abrir o site NEXUS…
    </div>
  );
}
