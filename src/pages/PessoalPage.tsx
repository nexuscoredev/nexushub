import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { PersonalAppShell } from '../components/personal/PersonalAppShell';
import { PersonalAreaHome } from '../components/personal/PersonalAreaHome';import { PersonalFinancePanel } from '../components/personal/PersonalFinancePanel';
import { ViniciusDrinksCarta } from '../components/personal/ViniciusDrinksCarta';
import { ViniciusPcGuide } from '../components/personal/ViniciusPcGuide';
import { ViniciusAdega } from '../components/personal/ViniciusAdega';
import { ViniciusCoffee } from '../components/personal/ViniciusCoffee';
import { useAuth } from '../contexts/AuthContext';
import { resolveFinanceMonthKey } from '../lib/personalFinanceMonth';
import { isViniciusOnly } from '../lib/viniciusPersonalFinance';
import styles from './PessoalPage.module.css';
import '../styles/personalAppMobile.css';
export function PessoalPage() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const financeiro = searchParams.get('financeiro') === '1';
  const drinks = searchParams.get('drinks') === '1';
  const pcGuide = searchParams.get('pc-guide') === '1';
  const adega = searchParams.get('adega') === '1';
  const coffee = searchParams.get('coffee') === '1';

  const firstName = profile?.nome?.trim().split(/\s+/)[0] ?? 'você';
  const email = profile?.email ?? user?.email;
  const viniciusOnly = isViniciusOnly(email);

  useEffect(() => {
    if ((drinks || pcGuide || adega || coffee) && !viniciusOnly) {
      navigate('/pessoal', { replace: true });
    }
  }, [drinks, pcGuide, adega, coffee, viniciusOnly, navigate]);

  const openFinance = () => {
    const mes = resolveFinanceMonthKey(searchParams.get('mes'));
    navigate(`/pessoal?financeiro=1&mes=${mes}`);
  };

  const openDrinks = () => {
    navigate('/pessoal?drinks=1');
  };

  const openPcGuide = () => {
    navigate('/pessoal?pc-guide=1');
  };

  const openAdega = () => {
    navigate('/pessoal?adega=1');
  };

  const openCoffee = () => {
    navigate('/pessoal?coffee=1');
  };

  const backHome = () => {
    navigate('/pessoal');
  };

  if (drinks && viniciusOnly) {
    return (
      <div className={`${styles.page} ${styles.personalAppPage}`}>
        <PersonalAppShell
          title="Carta de drinks"
          mobileTitle="Carta de Drinks"
          subtitle={`${firstName} · só seu`}
          onBack={backHome}
          variant="drinks"
        >
          <ViniciusDrinksCarta />
        </PersonalAppShell>
      </div>
    );
  }
  if (pcGuide && viniciusOnly) {
    return (
      <div className={`${styles.page} ${styles.drinksPage}`}>
        <div className={styles.financeTop}>
          <PageHeader compact title="PC Guide" subtitle={`${firstName} · referências`} />
          <button type="button" className={styles.backBtn} onClick={backHome}>
            ← Cantinho
          </button>
        </div>
        <ViniciusPcGuide />
      </div>
    );
  }

  if (coffee && viniciusOnly) {
    return (
      <div className={`${styles.page} ${styles.personalAppPage}`}>
        <PersonalAppShell
          title="Café"
          subtitle={`${firstName} · cápsulas`}
          onBack={backHome}
          variant="coffee"
        >
          <ViniciusCoffee onBack={backHome} />
        </PersonalAppShell>
      </div>
    );
  }

  if (adega && viniciusOnly) {
    return (
      <div className={`${styles.page} ${styles.personalAppPage}`}>
        <PersonalAppShell
          title="Minha adega"
          mobileTitle="Minha Adega"
          subtitle={`${firstName} · coleção`}
          onBack={backHome}
          variant="adega"
        >
          <ViniciusAdega />
        </PersonalAppShell>
      </div>
    );
  }
  return (
    <div className={styles.page}>
      {financeiro ? (
        <>
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
          <PersonalFinancePanel userEmail={email} userId={user?.id} />
        </>
      ) : (
        <div className={styles.homeShell}>
          <PageHeader
            centered
            badge="Personal"
            title="Área pessoal"
            subtitle={`Olá, ${firstName}. Sua central pessoal — apps, humor e finanças.`}
          />
          <PersonalAreaHome
            onOpenFinance={openFinance}
            onOpenDrinks={viniciusOnly ? openDrinks : undefined}
            onOpenPcGuide={viniciusOnly ? openPcGuide : undefined}
            onOpenAdega={viniciusOnly ? openAdega : undefined}
            onOpenCoffee={viniciusOnly ? openCoffee : undefined}
          />
        </div>
      )}
    </div>
  );
}
