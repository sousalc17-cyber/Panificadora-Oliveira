import type { APIRoute } from 'astro';
import { origemDoSite } from '../lib/siteUrl';

/** Páginas públicas. Ao criar novas rotas, acrescente aqui. */
const rotas = ['/'];

/** Gerado na build com a origem do ambiente (produção ou preview). */
export const GET: APIRoute = () => {
  const origem = origemDoSite();
  const hoje = new Date().toISOString().slice(0, 10);

  const urls = rotas
    .map((rota) =>
      [
        '  <url>',
        `    <loc>${new URL(rota, origem).href}</loc>`,
        `    <lastmod>${hoje}</lastmod>`,
        '    <changefreq>monthly</changefreq>',
        '    <priority>1.0</priority>',
        '  </url>',
      ].join('\n'),
    )
    .join('\n');

  const corpo = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n');

  return new Response(corpo, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
