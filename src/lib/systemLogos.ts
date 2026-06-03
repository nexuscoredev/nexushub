/** Logos placeholder — substituir por assets oficiais de cada produto em public/img/systems/ */
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
    aliases: ['ligeirinho', 'ligeirinho hub', 'ligeirinhohub', 'ligeirinho bebidas'],
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

export function systemLogoUrl(systemId: string): string {
  return SYSTEM_LOGOS[systemId] ?? '/img/favicon.png';
}

export function matchProjectToSystem(projectName: string): ClientSystem | null {
  const n = normalize(projectName);
  if (!n || n === 'inbox') return null;

  for (const sys of CLIENT_SYSTEMS) {
    if (normalize(sys.nome) === n) return sys;
    for (const alias of sys.aliases) {
      if (n.includes(alias) || alias.includes(n)) return sys;
    }
  }
  return null;
}

export function projectLogoUrl(projectName: string): string {
  const sys = matchProjectToSystem(projectName);
  return sys ? systemLogoUrl(sys.id) : '/img/favicon.png';
}

export function projectDisplayName(projectName: string): string {
  return matchProjectToSystem(projectName)?.nome ?? projectName;
}

export function sortProjectsByClient<T extends { name: string }>(projects: T[]): T[] {
  return [...projects].sort((a, b) => {
    const aInbox = normalize(a.name) === 'inbox';
    const bInbox = normalize(b.name) === 'inbox';
    if (aInbox && !bInbox) return 1;
    if (!aInbox && bInbox) return -1;
    const aClient = matchProjectToSystem(a.name);
    const bClient = matchProjectToSystem(b.name);
    if (aClient && !bClient) return -1;
    if (!aClient && bClient) return 1;
    return a.name.localeCompare(b.name, 'pt-BR');
  });
}
