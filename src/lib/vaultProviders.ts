export type VaultProvedorId =
  | 'vercel'
  | 'supabase'
  | 'github'
  | 'gmail'
  | 'google'
  | 'aws'
  | 'cloudflare'
  | 'stripe'
  | 'notion'
  | 'slack'
  | 'microsoft'
  | 'todoist'
  | 'docker'
  | 'npm'
  | 'outro';

export interface VaultProvedor {
  id: VaultProvedorId;
  label: string;
  defaultUrl?: string;
}

export const VAULT_PROVEDORES: VaultProvedor[] = [
  { id: 'vercel', label: 'Vercel', defaultUrl: 'https://vercel.com' },
  { id: 'supabase', label: 'Supabase', defaultUrl: 'https://supabase.com/dashboard' },
  { id: 'github', label: 'GitHub', defaultUrl: 'https://github.com' },
  { id: 'gmail', label: 'Gmail', defaultUrl: 'https://mail.google.com' },
  { id: 'google', label: 'Google', defaultUrl: 'https://accounts.google.com' },
  { id: 'aws', label: 'AWS', defaultUrl: 'https://console.aws.amazon.com' },
  { id: 'cloudflare', label: 'Cloudflare', defaultUrl: 'https://dash.cloudflare.com' },
  { id: 'stripe', label: 'Stripe', defaultUrl: 'https://dashboard.stripe.com' },
  { id: 'notion', label: 'Notion', defaultUrl: 'https://www.notion.so' },
  { id: 'slack', label: 'Slack', defaultUrl: 'https://slack.com' },
  { id: 'microsoft', label: 'Microsoft', defaultUrl: 'https://portal.office.com' },
  { id: 'todoist', label: 'Todoist', defaultUrl: 'https://todoist.com' },
  { id: 'docker', label: 'Docker', defaultUrl: 'https://hub.docker.com' },
  { id: 'npm', label: 'npm', defaultUrl: 'https://www.npmjs.com' },
  { id: 'outro', label: 'Outro' },
];

export function getVaultProvedor(id: string | null | undefined): VaultProvedor | undefined {
  if (!id) return undefined;
  return VAULT_PROVEDORES.find((p) => p.id === id);
}
