import { Link } from 'react-router-dom';
import { LigeirinhoContratoView } from '../components/ligeirinho/LigeirinhoContratoView';
import { PageHeader } from '../components/PageHeader';
import { LIGEIRINHO_CONTRATO } from '../lib/ligeirinhoDocumentacao';

export function LigeirinhoDocumentacaoPage() {
  return (
    <div>
      <PageHeader
        badge="Documentação"
        title="Ligeirinho Hub"
        subtitle={LIGEIRINHO_CONTRATO.subtitulo}
        actions={
          <>
            <Link to="/sistemas" className="btn-ghost">
              Voltar aos sistemas
            </Link>
            <a
              href="/docs/ligeirinho/contrato-v8-pagina-1.png"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Abrir PDF digitalizado
            </a>
          </>
        }
      />
      <LigeirinhoContratoView theme="hub" />
    </div>
  );
}
