export type PersonalAppIcon =
  | { type: 'image'; src: string }
  | { type: 'material'; name: string; tone?: 'cyan' | 'green' | 'violet' }
  | { type: 'todoist' }
  | { type: 'the-news' }
  | { type: 'emoji'; value: string }
  | { type: 'piggy' };

export type PersonalExternalApp = {
  id: string;
  label: string;
  subtitle?: string;
  href: string;
  icon: PersonalAppIcon;
  viniciusOnly?: boolean;
};

export type PersonalInternalAppId = 'finance' | 'drinks';

export const PERSONAL_EXTERNAL_APPS: PersonalExternalApp[] = [
  {
    id: 'jardim-elizabeth',
    label: 'Jardim Elizabeth',
    subtitle: 'Congregação',
    href: 'https://jardimelizabeth.vercel.app/',
    icon: { type: 'material', name: 'nature_people', tone: 'green' },
    viniciusOnly: true,
  },
  {
    id: 'todoist',
    label: 'Todoist',
    subtitle: 'Tarefas',
    href: 'https://todoist.com/app',
    icon: { type: 'todoist' },
  },
  {
    id: 'texto-diario',
    label: 'Texto diário',
    subtitle: 'Leitura',
    href: 'https://wol.jw.org/pt/wol/h/r5/lp-t',
    icon: { type: 'material', name: 'menu_book', tone: 'cyan' },
  },
  {
    id: 'the-news',
    label: 'the news',
    subtitle: 'Podcast',
    href: 'https://open.spotify.com/show/5cYtKjFwlRCSZKyV6ZC8Wq',
    icon: { type: 'the-news' },
  },
  {
    id: 'spotify',
    label: 'Spotify',
    subtitle: 'Música',
    href: 'https://open.spotify.com/',
    icon: { type: 'image', src: '/img/streaming/spotify.png' },
  },
  {
    id: 'youtube-music',
    label: 'YouTube Music',
    subtitle: 'Música',
    href: 'https://music.youtube.com/',
    icon: { type: 'image', src: '/img/streaming/youtube-music.png' },
  },
];

export const PERSONAL_INTERNAL_APPS: {
  id: PersonalInternalAppId;
  label: string;
  subtitle: string;
  icon: PersonalAppIcon;
  viniciusOnly?: boolean;
}[] = [
  {
    id: 'finance',
    label: 'Finanças',
    subtitle: 'Contas pessoais',
    icon: { type: 'piggy' },
  },
  {
    id: 'drinks',
    label: 'Carta de drinks',
    subtitle: 'Receitas',
    icon: { type: 'emoji', value: '🍸' },
    viniciusOnly: true,
  },
];
