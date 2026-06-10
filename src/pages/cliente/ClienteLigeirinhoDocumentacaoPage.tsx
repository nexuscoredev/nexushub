import { Link } from 'react-router-dom';
import { LigeirinhoContratoView } from '../../components/ligeirinho/LigeirinhoContratoView';
import { LIGEIRINHO_CONTRATO } from '../../lib/ligeirinhoDocumentacao';
import styles from './ClienteLigeirinhoPage.module.css';

export function ClienteLigeirinhoDocumentacaoPage() {
  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.pageEyebrow}>Documentos</p>
          <h1 className={styles.pageTitle}>{LIGEIRINHO_CONTRATO.titulo}</h1>
          <p className={styles.pageSubtitle}>
            Contrato de prestação de serviços · assinado em {LIGEIRINHO_CONTRATO.dataAssinatura}
          </p>
        </div>
        <div className={styles.pageActions}>
          <Link to="/cliente#documentos" className={styles.btnGhost}>
            Voltar aos documentos
          </Link>
          <a
            href="/docs/ligeirinho/contrato-v8-pagina-1.png"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnPrimary}
          >
            Abrir imagem
          </a>
        </div>
      </header>
      <LigeirinhoContratoView theme="client" />
    </div>
  );
}
