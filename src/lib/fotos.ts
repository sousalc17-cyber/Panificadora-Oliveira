import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Fotos reais do estabelecimento.
 *
 * Cada espaço do site aponta para um nome de arquivo fixo dentro de
 * `public/images`. Enquanto o arquivo não existir, o componente `Foto` desenha
 * a moldura na proporção certa (sem imagem quebrada e sem troca de layout);
 * quando o arquivo chega, a foto entra sozinha, sem mexer em código.
 *
 * Aqui não há imagem gerada: o site só mostra o que a padaria fotografou.
 */
export interface SlotFoto {
  /** Nome do arquivo em `public/images`. */
  arquivo: string;
  /** Proporção em CSS, pronta para `aspect-ratio`. */
  proporcao: string;
  /** Proporção legível, para textos e legendas. */
  formato: string;
  /** Texto alternativo da foto. */
  alt: string;
  /** Rótulo curto usado na moldura de reserva. */
  rotulo: string;
  /** Onde a foto entra no site. */
  onde: string;
}

const DIRETORIO = fileURLToPath(new URL('../../public/images', import.meta.url));

export const slots: SlotFoto[] = [
  {
    arquivo: 'cuscuz-carne-de-sol.webp',
    proporcao: '4 / 5',
    formato: '4:5',
    alt: 'Queijo gratinado aberto ao meio com um garfo, com recheio de carne desfiada e o queijo derretendo sobre o prato',
    rotulo: 'Queijo gratinado com carne',
    onde: 'Hero — imagem principal',
  },
  {
    arquivo: 'pao-de-queijo-cafe.webp',
    proporcao: '4 / 5',
    formato: '4:5',
    alt: 'Três pães de queijo dourados em um prato branco, ao lado de uma xícara de café preto',
    rotulo: 'Pão de queijo e café',
    onde: 'Vitrine — bloco alto',
  },
  {
    arquivo: 'cuscuz-gratinado.webp',
    proporcao: '3 / 2',
    formato: '3:2',
    alt: 'Prato de queijo gratinado com carne desfiada, servido em prato recortado com uma xícara de café ao fundo',
    rotulo: 'Prato gratinado da casa',
    onde: 'Vitrine — bloco horizontal',
  },
  {
    arquivo: 'fachada-panificadora-oliveira.webp',
    proporcao: '16 / 9',
    formato: '16:9',
    alt: 'Fachada da Panificadora Oliveira à noite, com o letreiro iluminado, mesas de madeira e guarda-sóis no calçadão em frente ao salão aberto',
    rotulo: 'Fachada iluminada',
    onde: 'Faixa — plano de fundo do texto do horário',
  },
];

/** Extensões que o componente `Foto` aceita, em ordem de preferência. */
const EXTENSOES = ['.webp', '.jpg', '.jpeg', '.png'];

/**
 * Nome real do arquivo do slot, com a extensão que estiver na pasta.
 * `cuscuz-gratinado` encontra `cuscuz-gratinado.webp`, `.jpg` ou `.png`.
 * Devolve `null` quando não existe nenhum — o slot fica reservado.
 */
export function encontrarFoto(arquivo: string): string | null {
  const base = arquivo.replace(/\.[^.]+$/, '');

  let nomes: string[];
  try {
    nomes = readdirSync(DIRETORIO);
  } catch {
    return null;
  }

  for (const extensao of EXTENSOES) {
    const candidato = `${base}${extensao}`;
    if (nomes.includes(candidato)) return candidato;
  }

  return null;
}

/** O slot já tem foto em `public/images`? */
export function temFoto(arquivo: string): boolean {
  return encontrarFoto(arquivo) !== null;
}

/** Slot pelo nome do arquivo, para não repetir strings nos componentes. */
export function slot(arquivo: string): SlotFoto {
  const encontrado = slots.find((item) => item.arquivo === arquivo);
  if (!encontrado) throw new Error(`Slot de foto desconhecido: ${arquivo}`);
  return encontrado;
}
