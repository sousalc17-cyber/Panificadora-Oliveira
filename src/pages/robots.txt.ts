import type { APIRoute } from 'astro';
import { ehProducao, origemDoSite, URL_PRODUCAO } from '../lib/siteUrl';

/**
 * Gerado na build para não apontar para o domínio de produção a partir de uma
 * pré-visualização. Preview: bloqueia toda a indexação e diz qual é o site público.
 */
export const GET: APIRoute = () => {
  const origem = origemDoSite();

  const corpo = ehProducao()
    ? [
        'User-agent: *',
        'Allow: /',
        '',
        '# Página interna de comparação de telas: não é conteúdo para buscadores.',
        'Disallow: /prototipo',
        '',
        `Sitemap: ${new URL('/sitemap.xml', origem).href}`,
        '',
      ].join('\n')
    : [
        `# Pré-visualização (${origem.host}): fora dos buscadores.`,
        `# Site público: ${URL_PRODUCAO}`,
        'User-agent: *',
        'Disallow: /',
        '',
      ].join('\n');

  return new Response(corpo, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
