/**
 * Fonte única de verdade dos dados da padaria para exibição e para os dados
 * estruturados. Nada aqui é inventado: tudo sai de `site.json`.
 *
 * Horário confirmado pela padaria: segunda a domingo, 06:00–22:00, fuso de
 * Brasília sem horário de verão (America/Fortaleza).
 */
import site from '../content/site.json';

const { endereco, filial, horario, whatsapp, instagram } = site;

type Endereco = typeof endereco;

const linhaDe = (e: Endereco) => `${e.rua}, ${e.numero} — ${e.bairro}`;
const cidadeDe = (e: Endereco) => `${e.cidade}–${e.uf}`;
const consultaDe = (e: Endereco) =>
  encodeURIComponent(`${e.rua}, ${e.numero} - ${e.bairro}, ${e.cidade} - ${e.uf}`);

/** Busca pelo endereço no Google Maps (não depende de Place ID). */
const mapaDe = (e: Endereco) => `https://www.google.com/maps/search/?api=1&query=${consultaDe(e)}`;

/** Rota até o endereço a partir da localização de quem abre o link. */
const rotaDe = (e: Endereco) => `https://www.google.com/maps/dir/?api=1&destination=${consultaDe(e)}`;

export const enderecoLinha = linhaDe(endereco);
export const enderecoCidade = cidadeDe(endereco);
export const enderecoCompleto = `${enderecoLinha}, ${enderecoCidade}`;

export const mapaHref = mapaDe(endereco);
export const rotaHref = rotaDe(endereco);

/**
 * As duas unidades, Matriz e Filial, com o endereço pronto para a tela e os
 * links de mapa já montados a partir do mesmo endereço de `site.json`.
 */
export const unidades = [
  {
    rotulo: 'Matriz',
    bairro: endereco.bairro,
    linha: enderecoLinha,
    cidade: enderecoCidade,
    mapaHref,
    rotaHref,
  },
  {
    rotulo: 'Filial',
    bairro: filial.bairro,
    linha: linhaDe(filial),
    cidade: cidadeDe(filial),
    mapaHref: mapaDe(filial),
    rotaHref: rotaDe(filial),
  },
];

/** "06:00" → "6h"; "22:00" → "22h"; "22:30" → "22h30". */
export function horaCurta(hhmm: string): string {
  const [h, m] = hhmm.split(':');
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

export const horarioResumo = `Seg a dom, das ${horaCurta(horario.abre)} às ${horaCurta(horario.fecha)}`;
export const horarioLongo = `${horario.dias}, das ${horaCurta(horario.abre)} às ${horaCurta(horario.fecha)}`;

export const whatsappHref = (mensagem?: string): string =>
  mensagem ? `${whatsapp.href}?text=${encodeURIComponent(mensagem)}` : whatsapp.href;

/**
 * Dados estruturados Schema.org do tipo Bakery.
 * Só entra o que foi confirmado: nome, endereço, telefone, horário, imagem.
 * A nota do Google aparece como texto na página, nunca como aggregateRating:
 * as diretrizes do Google não permitem que o site declare avaliações próprias.
 */
export function dadosEstruturados(origem: URL) {
  const url = new URL('/', origem).href;

  return {
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    '@id': `${url}#padaria`,
    name: site.nome,
    description: site.seo.descricao,
    url,
    image: new URL(site.seo.imagem, origem).href,
    logo: new URL(site.seo.imagem, origem).href,
    telephone: whatsapp.e164,
    currenciesAccepted: 'BRL',
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${endereco.rua}, ${endereco.numero}`,
      addressLocality: endereco.cidade,
      addressRegion: endereco.uf,
      addressCountry: 'BR',
    },
    hasMap: mapaHref,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        opens: horario.abre,
        closes: horario.fecha,
      },
    ],
    sameAs: [instagram.url],
  };
}
