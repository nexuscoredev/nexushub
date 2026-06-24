import type { CoffeeCapsuleSystem } from './viniciusCoffeeStock';
import { capsuleSystemIcon } from './viniciusCoffeeStock';

export type CoffeeBrewMethod = 'capsula' | 'filtro' | 'prensa' | 'espresso-manual' | 'outro';

export interface ViniciusCoffeeRecipe {
  slug: string;
  title: string;
  tagline: string;
  imageUrl: string;
  method: CoffeeBrewMethod;
  capsuleSystem?: CoffeeCapsuleSystem;
  ingredients: string[];
  steps: string[];
  notes?: string;
}

export const VINICIUS_COFFEE_BANNER_URL = '/img/personal/coffee/banner.png?v=1';
export const VINICIUS_COFFEE_BANNER_WIDTH = 1024;
export const VINICIUS_COFFEE_BANNER_HEIGHT = 576;
export const COFFEE_FALLBACK_THUMB = '/img/personal/apps/coffee.png';

export function coffeeThumbPath(slug: string): string {
  return `/img/personal/coffee/thumbs/${slug}.jpg`;
}

function systemThumb(system: CoffeeCapsuleSystem): string {
  return capsuleSystemIcon(system) ?? '/img/personal/coffee/systems/dolce-gusto.svg';
}

export const VINICIUS_COFFEE_RECIPES: ViniciusCoffeeRecipe[] = [
  {
    slug: 'espresso-dolce-gusto',
    title: 'Espresso Dolce Gusto',
    tagline: 'Shot curto e intenso na sua máquina Dolce Gusto.',
    imageUrl: systemThumb('dolce-gusto'),
    method: 'capsula',
    capsuleSystem: 'dolce-gusto',
    ingredients: ['1 cápsula compatível Dolce Gusto', 'Água na máquina', 'Xícara pequena'],
    steps: [
      'Ligue a máquina e aguarde aquecer;',
      'Insira a cápsula de espresso;',
      'Selecione o modo curto / espresso;',
      'Sirva imediatamente.',
    ],
    notes: 'Ideal após a máquina estar totalmente aquecida.',
  },
  {
    slug: 'lungo-dolce-gusto',
    title: 'Lungo Dolce Gusto',
    tagline: 'Café longo, mais suave que o espresso.',
    imageUrl: systemThumb('dolce-gusto'),
    method: 'capsula',
    capsuleSystem: 'dolce-gusto',
    ingredients: ['1 cápsula Dolce Gusto (café longo ou espresso)', 'Água', 'Xícara média'],
    steps: [
      'Aqueça a máquina;',
      'Use cápsula de café longo ou rode o modo lungo;',
      'Deixe o fluxo completar até o volume desejado;',
      'Prove e ajuste na próxima vez.',
    ],
  },
  {
    slug: 'cappuccino-dolce-gusto',
    title: 'Cappuccino Dolce Gusto',
    tagline: 'Cápsula de leite + cápsula de café — clássico cremoso.',
    imageUrl: systemThumb('dolce-gusto'),
    method: 'capsula',
    capsuleSystem: 'dolce-gusto',
    ingredients: [
      '1 cápsula de leite Dolce Gusto',
      '1 cápsula de café Dolce Gusto',
      'Xícara grande',
    ],
    steps: [
      'Primeiro, insira a cápsula de leite e prepare o leite espumado;',
      'Troque pela cápsula de café e extraia o espresso por cima;',
      'Misture levemente se quiser;',
      'Sirva quente.',
    ],
    notes: 'A ordem leite → café dá melhor camada visual.',
  },
  {
    slug: 'mocha-dolce-gusto',
    title: 'Mocha Dolce Gusto',
    tagline: 'Chocolate com café — cápsula de chococino ou similar.',
    imageUrl: systemThumb('dolce-gusto'),
    method: 'capsula',
    capsuleSystem: 'dolce-gusto',
    ingredients: ['1 cápsula chocolate/chococino Dolce Gusto', '1 cápsula café (opcional)', 'Xícara'],
    steps: [
      'Prepare a cápsula de chocolate na máquina;',
      'Se quiser mais corpo, adicione uma cápsula de café em seguida;',
      'Misture e sirva.',
    ],
  },
  {
    slug: 'espresso-tres-coracoes',
    title: 'Espresso Três Corações',
    tagline: 'Shot na máquina de cápsulas Três Corações.',
    imageUrl: systemThumb('tres-coracoes'),
    method: 'capsula',
    capsuleSystem: 'tres-coracoes',
    ingredients: ['1 cápsula Três Corações', 'Água', 'Xícara pequena'],
    steps: [
      'Aqueça a máquina;',
      'Insira a cápsula desejada;',
      'Extraia no modo curto;',
      'Sirva quente.',
    ],
  },
  {
    slug: 'cafe-com-leite-tres',
    title: 'Café com leite Três Corações',
    tagline: 'Cápsula de café + leite quente ou cápsula combinada.',
    imageUrl: systemThumb('tres-coracoes'),
    method: 'capsula',
    capsuleSystem: 'tres-coracoes',
    ingredients: [
      '1 cápsula Três Corações (café ou combinada)',
      'Leite quente (se necessário)',
      'Xícara grande',
    ],
    steps: [
      'Extraia o café na máquina;',
      'Complete com leite quente na proporção que preferir (metade/metade é um bom começo);',
      'Adoce se quiser;',
      'Sirva.',
    ],
  },
  {
    slug: 'cafe-passo-a-passo',
    title: 'Café coado (passado)',
    tagline: 'Filtro de papel ou coador — controle total do sabor.',
    imageUrl: COFFEE_FALLBACK_THUMB,
    method: 'filtro',
    ingredients: [
      '15 g de café moído médio',
      '250 ml de água quente (92–96 °C)',
      'Filtro e coador',
    ],
    steps: [
      'Aqueça a água e molhe o filtro;',
      'Adicione o café moído;',
      'Despeje a água em espiral, do centro para fora;',
      'Aguarde o gotejamento completo e sirva.',
    ],
    notes: 'Proporção base: 1:16 (café:água).',
  },
  {
    slug: 'prensa-francesa',
    title: 'Prensa francesa',
    tagline: 'Corpo encorpado, preparo simples.',
    imageUrl: COFFEE_FALLBACK_THUMB,
    method: 'prensa',
    ingredients: ['30 g de café grosso', '500 ml de água quente', 'Prensa francesa'],
    steps: [
      'Coloque o café na prensa;',
      'Adicione água quente e mexa;',
      'Tampe e aguarde 4 minutos;',
      'Abaixe o êmbolo devagar e sirva.',
    ],
  },
  {
    slug: 'cafe-gelado-capsula',
    title: 'Café gelado (cápsula)',
    tagline: 'Espresso de cápsula sobre gelo.',
    imageUrl: COFFEE_FALLBACK_THUMB,
    method: 'capsula',
    ingredients: ['1 cápsula (Dolce Gusto ou Três Corações)', 'Gelo', 'Xícara grande'],
    steps: [
      'Encha a xícara com gelo;',
      'Extraia o café quente diretamente sobre o gelo;',
      'Misture e beba.',
    ],
    notes: 'Funciona com qualquer sistema de cápsula que você tiver.',
  },
];

export function findCoffeeRecipe(slug: string | null | undefined): ViniciusCoffeeRecipe | undefined {
  if (!slug) return undefined;
  return VINICIUS_COFFEE_RECIPES.find((recipe) => recipe.slug === slug);
}
