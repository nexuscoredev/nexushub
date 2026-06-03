export type HubChatHeadThemeId = 'prata' | 'grafite' | 'neve' | 'aco';

export const HUB_CHAT_HEAD_THEMES: Record<
  HubChatHeadThemeId,
  { label: string; gradient: string }
> = {
  prata: {
    label: 'Prata NEXUS',
    gradient:
      'linear-gradient(180deg, #3f3f46 0%, #27272a 42%, #18181b 100%)',
  },
  grafite: {
    label: 'Grafite',
    gradient:
      'linear-gradient(180deg, #27272a 0%, #09090b 50%, #0a0a0a 100%)',
  },
  neve: {
    label: 'Neve',
    gradient:
      'linear-gradient(180deg, #fafafa 0%, #d4d4d8 48%, #a1a1aa 100%)',
  },
  aco: {
    label: 'Aço',
    gradient:
      'linear-gradient(180deg, #52525b 0%, #3f3f46 45%, #27272a 100%)',
  },
};

export const HUB_CHAT_HEAD_THEME_IDS = Object.keys(HUB_CHAT_HEAD_THEMES) as HubChatHeadThemeId[];
