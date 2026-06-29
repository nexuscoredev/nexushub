import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { PersonalAppShell } from '../components/personal/PersonalAppShell';
import { PersonalAppIcon } from '../components/personal/PersonalAppIcon';
import { PersonalAreaHome } from '../components/personal/PersonalAreaHome';
import { PersonalFinancePanel } from '../components/personal/PersonalFinancePanel';
import { ViniciusDrinksCarta } from '../components/personal/ViniciusDrinksCarta';
import { ViniciusPcGuide } from '../components/personal/ViniciusPcGuide';
import { ViniciusAdega } from '../components/personal/ViniciusAdega';
import { ViniciusCoffee } from '../components/personal/ViniciusCoffee';
import { PersonalPasswordVault } from '../components/personal/PersonalPasswordVault';
import { useAuth } from '../contexts/AuthContext';
import { resolveFinanceMonthKey } from '../lib/personalFinanceMonth';
import { isViniciusOnly } from '../lib/viniciusPersonalFinance';
import { PERSONAL_APP_ICON_PATHS } from '../lib/personalAppIconOptions';
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
  const vault = searchParams.get('vault') === '1';

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

  const openVault = () => {
    navigate('/pessoal?vault=1');
  };

  const backHome = () => {
    navigate('/pessoal');
  };

  const drinksBackToListRef = useRef<() => void>(() => {});
  const [drinksInDetail, setDrinksInDetail] = useState(false);

  const drinksShellBack = () => {
    if (drinksInDetail) {
      drinksBackToListRef.current();
      return;
    }
    backHome();
  };

  const drinksBackLabel = drinksInDetail ? 'Carta de Drinks' : 'Aplicativos';
  const drinksBackIcon = drinksInDetail ? (
    <PersonalAppIcon
      icon={{ type: 'image', src: '/img/personal/apps/drinks-carta.png' }}
      label="Carta de Drinks"
    />
  ) : (
    <PersonalAppIcon icon={{ type: 'material', name: 'apps', tone: 'cyan' }} label="Aplicativos" />
  );
  const drinksBackAria = drinksInDetail
    ? 'Voltar à carta de drinks'
    : 'Voltar aos aplicativos';

  const adegaBackToListRef = useRef<() => void>(() => {});
  const [adegaInDetail, setAdegaInDetail] = useState(false);

  const adegaShellBack = () => {
    if (adegaInDetail) {
      adegaBackToListRef.current();
      return;
    }
    backHome();
  };

  const adegaBackLabel = adegaInDetail ? 'Minha Adega' : 'Aplicativos';
  const adegaBackIcon = adegaInDetail ? (
    <PersonalAppIcon
      icon={{ type: 'image', src: PERSONAL_APP_ICON_PATHS.adega }}
      label="Minha Adega"
    />
  ) : (
    <PersonalAppIcon icon={{ type: 'material', name: 'apps', tone: 'cyan' }} label="Aplicativos" />
  );
  const adegaBackAria = adegaInDetail ? 'Voltar à adega' : 'Voltar aos aplicativos';

  const coffeeBackToListRef = useRef<() => void>(() => {});
  const [coffeeInDetail, setCoffeeInDetail] = useState(false);

  const coffeeShellBack = () => {
    if (coffeeInDetail) {
      coffeeBackToListRef.current();
      return;
    }
    backHome();
  };

  const coffeeBackLabel = coffeeInDetail ? 'Café' : 'Aplicativos';
  const coffeeBackIcon = coffeeInDetail ? (
    <PersonalAppIcon
      icon={{ type: 'image', src: PERSONAL_APP_ICON_PATHS.coffee }}
      label="Café"
    />
  ) : (
    <PersonalAppIcon icon={{ type: 'material', name: 'apps', tone: 'cyan' }} label="Aplicativos" />
  );
  const coffeeBackAria = coffeeInDetail ? 'Voltar ao café' : 'Voltar aos aplicativos';

  if (drinks && viniciusOnly) {
    return (
      <div className={`${styles.page} ${styles.personalAppPage}`}>
        <PersonalAppShell
          title="Carta de drinks"
          mobileTitle="Carta de Drinks"
          subtitle={`${firstName} · só seu`}
          onBack={drinksShellBack}
          backLabel={drinksBackLabel}
          backIcon={drinksBackIcon}
          backAriaLabel={drinksBackAria}
          variant="drinks"
        >
          <ViniciusDrinksCarta
            onBackToApps={backHome}
            onDetailChange={setDrinksInDetail}
            onRegisterBackToList={(fn) => {
              drinksBackToListRef.current = fn;
            }}
          />
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
          mobileTitle="Meu Café"
          subtitle={`${firstName} · cápsulas`}
          onBack={coffeeShellBack}
          backLabel={coffeeBackLabel}
          backIcon={coffeeBackIcon}
          backAriaLabel={coffeeBackAria}
          variant="coffee"
        >
          <ViniciusCoffee
            onBackToApps={backHome}
            onDetailChange={setCoffeeInDetail}
            onRegisterBackToList={(fn) => {
              coffeeBackToListRef.current = fn;
            }}
          />
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
          onBack={adegaShellBack}
          backLabel={adegaBackLabel}
          backIcon={adegaBackIcon}
          backAriaLabel={adegaBackAria}
          variant="adega"
        >
          <ViniciusAdega
            onBackToApps={backHome}
            onDetailChange={setAdegaInDetail}
            onRegisterBackToList={(fn) => {
              adegaBackToListRef.current = fn;
            }}
          />
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
      ) : vault ? (
        <>
          <div className={styles.financeTop}>
            <PageHeader compact title="Cofre pessoal" subtitle={`${firstName} · senhas criptografadas`} />
            <button type="button" className={styles.backBtn} onClick={backHome}>
              ← Cantinho
            </button>
          </div>
          <PersonalPasswordVault userId={user?.id} />
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
            onOpenVault={openVault}
          />
        </div>
      )}
    </div>
  );
}
