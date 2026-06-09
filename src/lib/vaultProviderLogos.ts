import type { VaultProvedorId } from './vaultProviders';

const VAULT_PROVIDER_LOGOS: Record<VaultProvedorId, string> = {
  vercel: '/img/providers/vercel.svg',
  supabase: '/img/providers/supabase.svg',
  github: '/img/providers/github.svg',
  gmail: '/img/providers/gmail.svg',
  google: '/img/providers/google.svg',
  aws: '/img/providers/aws.svg',
  cloudflare: '/img/providers/cloudflare.svg',
  outlook: '/img/providers/outlook.svg',
  notion: '/img/providers/notion.svg',
  slack: '/img/providers/slack.svg',
  microsoft: '/img/providers/microsoft.svg',
  todoist: '/img/providers/todoist.svg',
  docker: '/img/providers/docker.svg',
  npm: '/img/providers/npm.svg',
  outro: '/img/providers/outro.svg',
};

export function vaultProviderLogoUrl(provider: VaultProvedorId): string {
  return VAULT_PROVIDER_LOGOS[provider] ?? VAULT_PROVIDER_LOGOS.outro;
}
