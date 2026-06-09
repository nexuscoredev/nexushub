import type { HubClienteMarco, HubClienteProcesso } from '../types/clientePortal';

export function calcularProgressoGeral(
  marcos: HubClienteMarco[],
  processos: HubClienteProcesso[],
): number {
  if (marcos.length > 0) {
    const concluidos = marcos.filter((m) => m.status === 'concluido').length;
    const emCurso = marcos.filter((m) => m.status === 'em_curso').length;
    return Math.round(((concluidos + emCurso * 0.5) / marcos.length) * 100);
  }
  if (processos.length > 0) {
    const total = processos.reduce((acc, p) => acc + p.progresso_pct, 0);
    return Math.round(total / processos.length);
  }
  return 0;
}

export function marcoAtual(marcos: HubClienteMarco[]): HubClienteMarco | null {
  return marcos.find((m) => m.status === 'em_curso') ?? marcos.find((m) => m.status === 'pendente') ?? null;
}

export function processoPrincipal(processos: HubClienteProcesso[]): HubClienteProcesso | null {
  if (processos.length === 0) return null;
  return [...processos].sort((a, b) => b.progresso_pct - a.progresso_pct)[0];
}

export function mensagemBoasVindas(nomeCliente: string, progresso: number): string {
  if (progresso >= 85) {
    return `${nomeCliente}, estamos na reta final — falta pouco para você operar com tudo no ar.`;
  }
  if (progresso >= 45) {
    return `${nomeCliente}, o projeto avança bem. Aqui você acompanha cada passo, sem jargão técnico.`;
  }
  if (progresso > 0) {
    return `${nomeCliente}, sua jornada com a NEXUS já começou. Este painel mostra onde estamos hoje.`;
  }
  return `${nomeCliente}, em breve você verá aqui o andamento do seu projeto com a NEXUS.`;
}

export const MARCO_STATUS_LABEL: Record<string, string> = {
  pendente: 'Por vir',
  em_curso: 'Agora',
  concluido: 'Concluído',
};

export const ATUALIZACAO_TIPO_LABEL: Record<string, string> = {
  novidade: 'Novidade',
  marco: 'Marco',
  lembrete: 'Lembrete',
  entrega: 'Entrega',
};

export const PROCESSO_STATUS_AMIGAVEL: Record<string, string> = {
  novo: 'Começando',
  em_andamento: 'Em desenvolvimento',
  aguardando_cliente: 'Aguardando sua equipe',
  concluido: 'Concluído',
  pausado: 'Em pausa',
};

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `Há ${diffDays} dias`;
  if (diffDays < 30) return `Há ${Math.floor(diffDays / 7)} semana(s)`;
  return date.toLocaleDateString('pt-BR');
}
