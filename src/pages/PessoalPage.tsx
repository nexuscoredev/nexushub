import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { PersonalAreaHome } from '../components/personal/PersonalAreaHome';
import { PersonalFinancePanel } from '../components/personal/PersonalFinancePanel';
import { useAuth } from '../contexts/AuthContext';
import { currentMonthKey } from '../lib/personalFinanceMonth';
import styles from './PessoalPage.module.css';

export function PessoalPage() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const financeiro = searchParams.get('financeiro') === '1';

  const firstName = profile?.nome?.trim().split(/\s+/)[0] ?? 'você';
  const email = profile?.email ?? user?.email;

  const openFinance = () => {
    navigate(`/pessoal?financeiro=1&mes=${currentMonthKey()}`);
  };

  const backHome = () => {
    navigate('/pessoal');
  };

  return (
    <div className={styles.page}>
      <PageHeader
        badge="Personal"
        title="Área pessoal"
        subtitle={
          financeiro
            ? `Finanças de ${firstName} — privado e só seu.`
            : `Olá, ${firstName}. Respira — este espaço é seu.`
        }
      />

      {financeiro ? (
        <>
          <button type="button" className={styles.backBtn} onClick={backHome}>
            ← Voltar ao cantinho
          </button>
          <PersonalFinancePanel userEmail={email} />
        </>
      ) : (
        <PersonalAreaHome onOpenFinance={openFinance} />
      )}
    </div>
  );
}
