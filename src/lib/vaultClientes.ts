import { CLIENT_SYSTEMS, matchProjectToSystem, systemLogoUrl } from './systemLogos';

export interface VaultClienteRef {
  nome: string;
  slug?: string | null;
}

/** Associa cliente do portal ao sistema NEXUS (logo em public/img/systems/). */
export function matchClienteToSystemId(cliente: VaultClienteRef): string | null {
  if (cliente.slug) {
    const bySlug = CLIENT_SYSTEMS.find((s) => s.id === cliente.slug);
    if (bySlug) return bySlug.id;
  }
  return matchProjectToSystem(cliente.nome)?.id ?? null;
}

export function clienteLogoUrl(cliente: VaultClienteRef): string | null {
  const systemId = matchClienteToSystemId(cliente);
  if (!systemId) return null;
  return systemLogoUrl(systemId);
}

export function clienteInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
