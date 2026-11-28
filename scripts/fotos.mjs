#!/usr/bin/env node
/**
 * npm run fotos — prepara as fotos reais do site.
 *
 * Você solta os arquivos originais em `public/images/originais` (qualquer nome,
 * JPG, JPEG, PNG, WebP, AVIF ou TIFF) e roda `npm run fotos`. O script:
 *
 *   1. descobre qual arquivo é de qual slot;
 *   2. recorta no centro (fit: cover) na proporção do slot, sem esticar;
 *   3. converte para WebP e baixa a qualidade até caber em 220 KB;
 *   4. grava em `public/images/<slot>.webp`, que é onde o site procura.
 *
 * Com `--limpar` ele apaga os originais depois de converter, para os arquivos
 * pesados não ficarem em `public/` (que é copiada para o site).
 *
 * O pareamento tenta, nesta ordem: nome igual ao do slot, palavra-chave no
 * nome do arquivo, e por último a ordem alfabética. No fim ele imprime o que
 * fez — se algum pareamento estiver errado, renomeie o arquivo e rode de novo.
 */
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const ORIGEM = path.join(RAIZ, 'public', 'images', 'originais');
const DESTINO = path.join(RAIZ, 'public', 'images');
const LIMITE_BYTES = 220 * 1024;
const QUALIDADE_INICIAL = 82;
const QUALIDADE_MINIMA = 52;
const PASSO_QUALIDADE = 6;

const EXTENSOES_ENTRADA = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff'];

/** Os quatro espaços do site, na ordem em que aparecem na página. */
const SLOTS = [
  {
    base: 'cuscuz-carne-de-sol',
    onde: 'Hero — imagem principal',
    proporcao: '4:5',
    largura: 960,
    altura: 1200,
    posicao: 'centre',
    chaves: ['hero', 'carne', 'garfo', 'desfiada', 'puxando'],
  },
  {
    base: 'pao-de-queijo-cafe',
    onde: 'Vitrine — bloco alto',
    proporcao: '4:5',
    largura: 960,
    altura: 1200,
    posicao: 'centre',
    chaves: ['pao', 'queijo', 'cafe'],
  },
  {
    base: 'cuscuz-gratinado',
    onde: 'Vitrine — bloco horizontal',
    proporcao: '3:2',
    largura: 1200,
    altura: 800,
    posicao: 'centre',
    chaves: ['gratinado', 'prato', 'bolinho', 'cuscuz'],
  },
  {
    base: 'fachada-panificadora-oliveira',
    onde: 'Faixa — fundo do texto do horário',
    proporcao: '16:9',
    largura: 1600,
    altura: 900,
    posicao: 'centre',
    chaves: ['fachada', 'frente', 'entrada', 'predio', 'loja', 'noite'],
  },
];

const semAcento = (texto) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

function escolherArquivos(fotos) {
  const atribuicoes = new Map();
  const usados = new Set();
  const porOrdem = new Set();

  // 1. Nome idêntico ao do slot (ex.: cuscuz-gratinado.jpg).
  for (const slot of SLOTS) {
    const exato = fotos.find(
      (arquivo) => !usados.has(arquivo) && semAcento(path.parse(arquivo).name) === slot.base,
    );
    if (exato) {
      atribuicoes.set(slot.base, exato);
      usados.add(exato);
    }
  }

  // 2. Palavra-chave no nome (ex.: "fachada-noite.jpg").
  for (const slot of SLOTS) {
    if (atribuicoes.has(slot.base)) continue;
    const porChave = fotos.find(
      (arquivo) =>
        !usados.has(arquivo) && slot.chaves.some((chave) => semAcento(arquivo).includes(chave)),
    );
    if (porChave) {
      atribuicoes.set(slot.base, porChave);
      usados.add(porChave);
    }
  }

  // 3. Sobrou arquivo e sobrou slot: preenche na ordem alfabética.
  const restantes = fotos.filter((arquivo) => !usados.has(arquivo)).sort();
  for (const slot of SLOTS) {
    if (atribuicoes.has(slot.base)) continue;
    const proximo = restantes.shift();
    if (proximo) {
      atribuicoes.set(slot.base, proximo);
      usados.add(proximo);
      porOrdem.add(slot.base);
    }
  }

  return { atribuicoes, porOrdem, ignorados: fotos.filter((arquivo) => !usados.has(arquivo)) };
}

async function converter(entrada, slot) {
  let escala = 1;
  let menor;

  // Duas alças: primeiro baixa a qualidade até o piso; se ainda não couber,
  // reduz a dimensão em 15% e recomeça na qualidade inicial. Para quando
  // couber em 220 KB ou quando a largura chegar ao piso legível (640 px).
  for (let tentativa = 0; tentativa < 12; tentativa += 1) {
    const largura = Math.round(slot.largura * escala);
    const altura = Math.round(slot.altura * escala);
    let qualidade = QUALIDADE_INICIAL;

    while (true) {
      const resultado = await sharp(entrada)
        .rotate() // respeita a orientação EXIF da câmera
        .resize(largura, altura, { fit: 'cover', position: slot.posicao ?? 'centre', kernel: 'lanczos3' })
        .webp({ quality: qualidade, effort: 5 })
        .toBuffer({ resolveWithObject: true });

      const atual = { ...resultado, qualidade, escala };
      if (!menor || resultado.info.size < menor.info.size) menor = atual;
      if (resultado.info.size <= LIMITE_BYTES) return atual;
      if (qualidade <= QUALIDADE_MINIMA) break;
      qualidade -= PASSO_QUALIDADE;
    }

    escala *= 0.85;
    if (Math.round(slot.largura * escala) < 640) break;
  }

  return menor;
}

async function main() {
  const limpar = process.argv.includes('--limpar');

  // A pasta é ignorada pelo git, então pode não existir num clone novo.
  await mkdir(ORIGEM, { recursive: true });
  const arquivos = await readdir(ORIGEM);

  const fotos = arquivos
    .filter((arquivo) => EXTENSOES_ENTRADA.includes(path.extname(arquivo).toLowerCase()))
    .sort();

  if (fotos.length === 0) {
    console.error(`\nNenhuma imagem em ${path.relative(RAIZ, ORIGEM)}.`);
    console.error(`Formatos aceitos: ${EXTENSOES_ENTRADA.join(', ')}\n`);
    process.exit(1);
  }

  await mkdir(DESTINO, { recursive: true });
  const { atribuicoes, porOrdem, ignorados } = escolherArquivos(fotos);

  console.log(`\n${fotos.length} arquivo(s) em public/images/originais\n`);

  let convertidos = 0;

  for (const slot of SLOTS) {
    const arquivo = atribuicoes.get(slot.base);

    if (!arquivo) {
      console.log(`— ${slot.base} · ${slot.proporcao} · ${slot.onde}`);
      console.log('  nenhum arquivo correspondente; o slot continua reservado\n');
      continue;
    }

    const entrada = path.join(ORIGEM, arquivo);
    const saida = path.join(DESTINO, `${slot.base}.webp`);

    try {
      const { data, info, qualidade, escala } = await converter(entrada, slot);
      await writeFile(saida, data);

      // Remove sobras do mesmo slot com outra extensão, para não haver dúvida
      // de qual arquivo o site vai encontrar.
      for (const extensao of ['.jpg', '.jpeg', '.png']) {
        await rm(path.join(DESTINO, `${slot.base}${extensao}`), { force: true });
      }

      const aviso = info.size > LIMITE_BYTES ? '  ⚠ acima de 220 KB' : '';
      const reduzida = escala < 1 ? ` · reduzida a ${Math.round(escala * 100)}% da largura` : '';
      console.log(`✓ ${arquivo} → ${slot.base}.webp`);
      console.log(
        `  ${slot.proporcao} · ${info.width}×${info.height} · ${kb(info.size)} · qualidade ${qualidade}${reduzida}${aviso}`,
      );
      if (porOrdem.has(slot.base)) {
        console.log('  ⚠ pareado por ordem alfabética — confira se a foto é a certa');
      }
      console.log('');

      convertidos += 1;
    } catch (erro) {
      console.error(`✗ ${arquivo}: ${erro.message}\n`);
    }
  }

  if (ignorados.length > 0) {
    console.log(`Ignorado(s), não coube em nenhum slot: ${ignorados.join(', ')}\n`);
  }

  if (convertidos === 0) {
    console.error('Nada foi convertido.\n');
    process.exit(1);
  }

  if (limpar) {
    for (const arquivo of atribuicoes.values()) {
      await rm(path.join(ORIGEM, arquivo), { force: true });
    }
    console.log(`Originais usados apagados de ${path.relative(RAIZ, ORIGEM)}.\n`);
  } else {
    console.log(
      `Pronto: ${convertidos} foto(s) em public/images. Rode com --limpar para apagar os originais.\n`,
    );
  }
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
