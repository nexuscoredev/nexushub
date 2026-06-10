import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { PersonalAreaHome } from '../components/personal/PersonalAreaHome';
import { PersonalFinancePanel } from '../components/personal/PersonalFinancePanel';
import { useAuth } from '../contexts/AuthContext';
import { resolveFinanceMonthKey } from '../lib/personalFinanceMonth';
import styles from './PessoalPage.module.css';

export function PessoalPage() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const financeiro = searchParams.get('financeiro') === '1';

  const firstName = profile?.nome?.trim().split(/\s+/)[0] ?? 'você';
  const email = profile?.email ?? user?.email;

  const openFinance = () => {
    const mes = resolveFinanceMonthKey(searchParams.get('mes'));
    navigate(`/pessoal?financeiro=1&mes=${mes}`);
  };

  const backHome = () => {
    navigate('/pessoal');
  };

  return (
    <div className={styles.page}>
      {financeiro ? (
        <div className={styles.financeTop}>
          <PageHeader
            compact
            title="Finanças"
            subtitle={`${firstName} · privado`}
          />
          <button type="button" className={styles.backBtn} onClick={backHome}>
            ← Cantinho
          </button>
        </div>
      ) : (
        <PageHeader
          badge="Personal"
          title="Área pessoal"
          subtitle={`Olá, ${firstName}. Respira — este espaço é seu.`}
        />
      )}

      {financeiro ? (
        <PersonalFinancePanel userEmail={email} />
      ) : (
        <PersonalAreaHome onOpenFinance={openFinance} />
      )}
    </div>
  );
}
