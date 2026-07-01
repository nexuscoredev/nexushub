/** Logos placeholder — substituir por assets oficiais de cada produto em public/img/systems/ */
import { NEXUS_LOGO_URL } from './nexusBrand';

const SYSTEM_LOGOS: Record<string, string> = {
  'rh-ambiental': '/img/systems/rh-ambiental.png',
  ligeirinho: '/img/systems/ligeirinho.png',
  contabil: '/img/systems/contabil.svg',
};

export interface ClientSystem {
  id: string;
  nome: string;
  aliases: string[];
}

/** Clientes NEXUS — espelha hub_systems / página Sistemas */
export const CLIENT_SYSTEMS: ClientSystem[] = [
  {
    id: 'rh-ambiental',
    nome: 'RG Ambiental',
    aliases: ['rh ambiental', 'rg ambiental', 'ambiental', 'rh-ambiental', 'rg-ambiental'],
  },
  {
    id: 'ligeirinho',
    nome: 'Ligeirinho Hub',
    aliases: ['ligeirinho', 'ligeirinho hub', 'ligeirinhohub', 'ligeirinho bebidas', 'ligeirinho parceiros'],
  },
  {
    id: 'contabil',
    nome: 'Contábil Hub',
    aliases: ['contabil', 'contábil', 'contabil hub', 'contábil hub'],
  },
];

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

const GENERAL_PROJECT_NAMES = ['projeto geral', 'geral'];

/** Projeto Geral da equipe (substitui o Inbox na Fila). */
export function isGeneralProject(name: string): boolean {
  const n = normalize(name);
  return GENERAL_PROJECT_NAMES.some((token) => n === token || n.startsWith(`${token} `));
}

export function isInboxProject(name: string): boolean {
  return normalize(name) === 'inbox';
}

/** Projetos visíveis na Fila operacional (sem Inbox). */
export function filaOperacionalProjects<T extends { name: string }>(projects: T[]): T[] {
  return projects.filter((p) => !isInboxProject(p.name));
}

export function systemLogoUrl(systemId: string): string {
  return SYSTEM_LOGOS[systemId] ?? NEXUS_LOGO_URL;
}

/** Documentação interna no Hub (por sistema) */
export const SYSTEM_DOC_PATHS: Record<string, string> = {
  ligeirinho: '/sistemas/ligeirinho/documentacao',
};

export function systemDocPath(systemId: string): string | null {
  return SYSTEM_DOC_PATHS[systemId] ?? null;
}

/** URLs canônicas quando hub_systems ainda não foi atualizado no Supabase */
const SYSTEM_URL_OVERRIDES: Record<string, string> = {
  'rh-ambiental': 'https://rgambiental.com.br/',
  ligeirinho: 'https://ligeirinhohub.vercel.app/',
};

export function resolveSystemUrl(systemId: string, url: string, nome?: string): string {
  if (SYSTEM_URL_OVERRIDES[systemId]) return SYSTEM_URL_OVERRIDES[systemId];
  const n = normalize(nome ?? '');
  if (n.includes('rg ambiental') || n.includes('rh ambiental')) {
    return SYSTEM_URL_OVERRIDES['rh-ambiental'];
  }
  return url;
}

export function matchProjectToSystem(projectName: string): ClientSystem | null {
  const n = normalize(projectName);
  if (!n || isInboxProject(projectName) || isGeneralProject(projectName)) return null;

  for (const sys of CLIENT_SYSTEMS) {
    if (normalize(sys.nome) === n) return sys;
    for (const alias of sys.aliases) {
      if (n.includes(alias) || alias.includes(n)) return sys;
    }
  }
  return null;
}

export function projectLogoUrl(projectName: string): string {
  if (isGeneralProject(projectName) || isInboxProject(projectName)) {
    return NEXUS_LOGO_URL;
  }
  const sys = matchProjectToSystem(projectName);
  return sys ? systemLogoUrl(sys.id) : NEXUS_LOGO_URL;
}

export function projectDisplayName(projectName: string): string {
  return matchProjectToSystem(projectName)?.nome ?? projectName;
}

export function sortProjectsByClient<T extends { name: string }>(projects: T[]): T[] {
  return [...projects].sort((a, b) => {
    const aGeneral = isGeneralProject(a.name);
    const bGeneral = isGeneralProject(b.name);
    if (aGeneral && !bGeneral) return -1;
    if (!aGeneral && bGeneral) return 1;

    const aInbox = isInboxProject(a.name);
    const bInbox = isInboxProject(b.name);
    if (aInbox && !bInbox) return 1;
    if (!aInbox && bInbox) return -1;

    const aClient = matchProjectToSystem(a.name);
    const bClient = matchProjectToSystem(b.name);
    if (aClient && !bClient) return -1;
    if (!aClient && bClient) return 1;
    return a.name.localeCompare(b.name, 'pt-BR');
  });
}
