import type { NavigateFunction } from 'react-router-dom';
import { togglePersonalContaPago } from '../components/personal/PersonalContaFixaForm';
import type { JarvisAction } from '../types/jarvis';

export async function executeJarvisActions(
  actions: JarvisAction[],
  navigate: NavigateFunction,
): Promise<string[]> {
  const executed: string[] = [];

  for (const action of actions) {
    if (action.type === 'navigate') {
      navigate(action.path);
      executed.push(`Navegou para ${action.path}`);
      continue;
    }

    if (action.type === 'open_url') {
      window.open(action.url, '_blank', 'noopener,noreferrer');
      executed.push('Abriu link externo');
      continue;
    }

    if (action.type === 'toggle_conta_pago') {
      const { error, row } = await togglePersonalContaPago(action.transactionId, action.pago);
      if (error) {
        executed.push(`Não foi possível atualizar conta: ${error}`);
      } else if (row) {
        executed.push(
          action.pago
            ? `Marcou "${row.descricao}" como paga`
            : `Desmarcou pagamento de "${row.descricao}"`,
        );
      }
    }
  }

  return executed;
}
