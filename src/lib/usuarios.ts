/** Usuários de login do Hub (campo `usuario` em hub_profiles). */
export const HUB_USUARIOS = [
  { usuario: 'vinicius', email: 'vinicius@nexustech.com', nome: 'Vinícius', cargo: 'CTO' },
  { usuario: 'rafael', email: 'rafael@nexustech.com', nome: 'Rafael', cargo: 'CEO' },
  { usuario: 'felipe', email: 'felipe@nexustech.com', nome: 'Felipe', cargo: 'Desenvolvedor' },
] as const;

export function normalizeUsuario(usuario: string | undefined | null): string {
  return (usuario ?? '').trim().toLowerCase();
}
