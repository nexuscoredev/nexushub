import {
  LIGEIRINHO_HUB_ATTENTION_CLIENTE,
  LIGEIRINHO_HUB_DELIVERIES_CLIENTE,
  LIGEIRINHO_HUB_NEXT_STEPS_CLIENTE,
  LIGEIRINHO_HUB_READY_GROUPS_CLIENTE,
  LIGEIRINHO_HUB_SUMMARY_CLIENTE,
} from '../../lib/ligeirinhoHubCliente';
import {
  deliveryStatusLabel,
  LIGEIRINHO_HUB_URL,
  LIGEIRINHO_LOJA_URL,
  LIGEIRINHO_STATUS_DATE,
} from '../../lib/ligeirinhoProject';
import { systemLogoUrl } from '../../lib/systemLogos';
import { ClienteLigeirinhoReport } from './ClienteLigeirinhoReport';

export function ClienteLigeirinhoPage() {
  return (
    <ClienteLigeirinhoReport
      variant="hub"
      pageTitle="Ligeirinho Hub"
      pageSubtitle="Relatório de atividades · sistema central da operação"
      siteUrl={LIGEIRINHO_HUB_URL}
      siteHost="ligeirinhohub.vercel.app"
      statusDate={LIGEIRINHO_STATUS_DATE}
      statusDateIso="2026-06-10"
      brandLogoUrl={systemLogoUrl('ligeirinho')}
      heroTitle="Cadastros, vendas, pedidos e marketing em um só lugar"
      heroLead="O Ligeirinho Hub é o sistema central da operação — acessível pelo navegador, com PDV, fila operacional, catálogo unificado e ferramentas de marketing com IA."
      heroStage={
        <>
          Identidade <strong>amarelo/dourado</strong> no ar
        </>
      }
      summary={LIGEIRINHO_HUB_SUMMARY_CLIENTE}
      readySectionDesc="Melhorias entregues na operação, cadastros, pagamentos, marketing e organização do Hub."
      readyGroups={LIGEIRINHO_HUB_READY_GROUPS_CLIENTE}
      deliveries={LIGEIRINHO_HUB_DELIVERIES_CLIENTE}
      deliveryStatusLabel={(status) => deliveryStatusLabel(status as 'done' | 'pending' | 'study')}
      nextStepsSection={{
        label: 'Recomendado',
        title: 'Próximos passos',
        desc: 'Ações sugeridas para validar o marketing com IA e colocar tudo em uso na loja.',
        steps: LIGEIRINHO_HUB_NEXT_STEPS_CLIENTE,
      }}
      attentionPoints={LIGEIRINHO_HUB_ATTENTION_CLIENTE}
      ctaTitle="Acessar os sistemas"
      ctaText="Hub para operação interna; loja online para pedidos do cliente final."
      ctaPrimaryLabel="Abrir Ligeirinho Hub"
      ctaSecondary={{ href: LIGEIRINHO_LOJA_URL, label: 'Loja online (Parceiros)' }}
      otherReport={{ to: '/cliente/ligeirinho-parceiros', label: 'Relatório Parceiros' }}
    />
  );
}
