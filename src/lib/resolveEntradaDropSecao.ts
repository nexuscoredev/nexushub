import type { EntradaSecao } from './financeCategories';

const ENTRADA_SECOES: EntradaSecao[] = ['implantacoes', 'mensalidades'];

export function resolveEntradaDropSecao(
  clientX: number,
  clientY: number,
): EntradaSecao | null {
  const stack = document.elementsFromPoint(clientX, clientY);
  for (const el of stack) {
    if (!(el instanceof HTMLElement)) continue;
    const host = el.closest<HTMLElement>('[data-drop-secao]');
    const secao = host?.dataset.dropSecao;
    if (secao && ENTRADA_SECOES.includes(secao as EntradaSecao)) {
      return secao as EntradaSecao;
    }
  }
  return null;
}
