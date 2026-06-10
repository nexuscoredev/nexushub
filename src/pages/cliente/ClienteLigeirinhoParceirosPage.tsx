import {
  LIGEIRINHO_PARCEIROS_ATTENTION_CLIENTE,
  LIGEIRINHO_PARCEIROS_CLIENT_FLOW,
  LIGEIRINHO_PARCEIROS_DELIVERIES,
  LIGEIRINHO_PARCEIROS_LOGO,
  LIGEIRINHO_PARCEIROS_READY_GROUPS,
  LIGEIRINHO_PARCEIROS_STATUS_DATE,
  LIGEIRINHO_PARCEIROS_SUMMARY,
  LIGEIRINHO_PARCEIROS_URL,
  parceirosDeliveryStatusLabel,
} from '../../lib/ligeirinhoParceirosProject';
import { LIGEIRINHO_HUB_URL } from '../../lib/ligeirinhoProject';
import { ClienteLigeirinhoReport } from './ClienteLigeirinhoReport';

export function ClienteLigeirinhoParceirosPage() {
  return (
    <ClienteLigeirinhoReport
      variant="parceiros"
      pageTitle="Ligeirinho Parceiros"
      pageSubtitle="Relatório de atividades · app de pedidos online"
      siteUrl={LIGEIRINHO_PARCEIROS_URL}
      siteHost="ligeirinhobebidas.vercel.app"
      statusDate={LIGEIRINHO_PARCEIROS_STATUS_DATE}
      statusDateIso="2026-06-10"
      brandLogoUrl={LIGEIRINHO_PARCEIROS_LOGO}
      heroTitle="Pedidos pela internet, prontos para o dia a dia da loja"
      heroLead="O Ligeirinho Parceiros é o app de pedidos que o cliente usa no celular ou no computador — catálogo, carrinho, login e pagamento online nas versões mais recentes."
      heroStage={
        <>
          Marca <strong>Parceiros</strong> com ícone próprio no ar
        </>
      }
      summary={LIGEIRINHO_PARCEIROS_SUMMARY}
      readySectionDesc="Loja online, login, identidade visual e pagamentos entregues para o cliente final."
      readyGroups={LIGEIRINHO_PARCEIROS_READY_GROUPS}
      deliveries={LIGEIRINHO_PARCEIROS_DELIVERIES}
      deliveryStatusLabel={(status) => parceirosDeliveryStatusLabel(status as 'done' | 'paused')}
      flowSection={{
        id: 'fluxo',
        label: 'Jornada',
        title: 'Como o cliente usa hoje',
        desc: 'Fluxo real, do primeiro acesso até a confirmação do pedido.',
        steps: LIGEIRINHO_PARCEIROS_CLIENT_FLOW,
      }}
      attentionPoints={LIGEIRINHO_PARCEIROS_ATTENTION_CLIENTE}
      ctaTitle="Ver o app funcionando"
      ctaText="Acesse a loja publicada, teste no celular e instale na tela inicial como PWA."
      ctaPrimaryLabel="Abrir loja ao vivo"
      ctaSecondary={{ href: LIGEIRINHO_HUB_URL, label: 'Ligeirinho Hub (operação)' }}
      otherReport={{ to: '/cliente/ligeirinho', label: 'Relatório Hub' }}
    />
  );
}
