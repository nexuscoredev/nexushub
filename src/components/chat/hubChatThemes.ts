export type HubChatHeadThemeId = 'prata' | 'grafite' | 'neve' | 'aco';

export const HUB_CHAT_HEAD_THEMES: Record<
  HubChatHeadThemeId,
  { label: string; gradient: string }
> = {
  prata: {
    label: 'Prata NEXUS',
    gradient: 'linear-gradient(180deg, #52525b 0%, #3f3f46 48%, #27272a 100%)',
  },
  grafite: {
    label: 'Grafite',
    gradient: 'linear-gradient(180deg, #18181b 0%, #09090b 48%, #18181b 100%)',
  },
  neve: {
    label: 'Neve',
    gradient: 'linear-gradient(180deg, #f4f4f5 0%, #d4d4d8 48%, #a1a1aa 100%)',
  },
  aco: {
    label: 'Aço',
    gradient: 'linear-gradient(180deg, #71717a 0%, #52525b 48%, #3f3f46 100%)',
  },
};

export const HUB_CHAT_HEAD_THEME_IDS = Object.keys(HUB_CHAT_HEAD_THEMES) as HubChatHeadThemeId[];
