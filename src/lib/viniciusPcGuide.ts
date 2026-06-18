export type PcGuideCategory = 'controle' | 'conexao' | 'streaming';

export interface PcGuideEntry {
  slug: string;
  title: string;
  subtitle: string;
  category: PcGuideCategory;
  imageUrl: string;
}

export const PC_GUIDE_CATEGORIES: Record<PcGuideCategory, string> = {
  controle: 'Controles',
  conexao: 'Conexão',
  streaming: 'Streaming',
};

/** Guias PC do Vinícius — imagens em public/img/pc-guide/ */
export const VINICIUS_PC_GUIDES: PcGuideEntry[] = [
  {
    slug: 'joyxoff-mapeamento',
    title: 'JOYXOFF — Mapeamento',
    subtitle: 'Perfil personalizado · L1 / L1+R1',
    category: 'controle',
    imageUrl: '/img/pc-guide/joyxoff-mapeamento.png',
  },
  {
    slug: 'xinput-conexao',
    title: 'XInput — Conexão',
    subtitle: 'DualSense, Inova e adaptadores',
    category: 'conexao',
    imageUrl: '/img/pc-guide/xinput-conexao.png',
  },
  {
    slug: 'inova-controles',
    title: 'INOVA CON-12865 / 67',
    subtitle: 'Modos Android, iOS e PC/TV',
    category: 'conexao',
    imageUrl: '/img/pc-guide/inova-controles.png',
  },
  {
    slug: '8bitdo2-dualsense',
    title: 'Adaptador 8BitDo2',
    subtitle: 'DualSense · modos e LEDs',
    category: 'conexao',
    imageUrl: '/img/pc-guide/8bitdo2-dualsense.png',
  },
  {
    slug: 'moonlight-atalhos',
    title: 'Moonlight',
    subtitle: 'Atalhos e controles',
    category: 'streaming',
    imageUrl: '/img/pc-guide/moonlight-atalhos.png',
  },
];

export function findPcGuide(slug: string | null | undefined): PcGuideEntry | null {
  if (!slug) return null;
  return VINICIUS_PC_GUIDES.find((g) => g.slug === slug) ?? null;
}

export function pcGuidesByCategory(): { category: PcGuideCategory; label: string; guides: PcGuideEntry[] }[] {
  const order: PcGuideCategory[] = ['controle', 'conexao', 'streaming'];
  return order
    .map((category) => ({
      category,
      label: PC_GUIDE_CATEGORIES[category],
      guides: VINICIUS_PC_GUIDES.filter((g) => g.category === category),
    }))
    .filter((group) => group.guides.length > 0);
}
