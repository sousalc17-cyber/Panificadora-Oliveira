/**
 * Origem pública do site no ambiente em que a build foi gerada.
 *
 * Produção usa o domínio final. Builds de preview (Vercel) usam o próprio host
 * do deploy, para que canonical, Open Graph, robots.txt e sitemap apontem para
 * a URL que aquela build realmente serve — em vez de anunciar o domínio de
 * produção a partir de uma pré-visualização.
 */
export const URL_PRODUCAO = 'https://panificadoraoliveira.com.br';

type VariaveisDeAmbiente = Record<string, string | undefined>;

const ambiente: VariaveisDeAmbiente =
  (globalThis as { process?: { env?: VariaveisDeAmbiente } }).process?.env ?? {};

function comEsquema(hostOuUrl: string): URL {
  const valor = hostOuUrl.trim();
  return new URL(/^https?:\/\//i.test(valor) ? valor : `https://${valor}`);
}

/** `PUBLIC_SITE_URL` força a origem (útil em testes locais de build). */
export function origemDoSite(): URL {
  const fixada = ambiente.PUBLIC_SITE_URL?.trim();
  if (fixada) return comEsquema(fixada);

  if (ambiente.VERCEL_ENV === 'production') return new URL(URL_PRODUCAO);

  const deploy = ambiente.VERCEL_BRANCH_URL?.trim() || ambiente.VERCEL_URL?.trim();
  if (ambiente.VERCEL_ENV && deploy) return comEsquema(deploy);

  return new URL(URL_PRODUCAO);
}

/** Só o deploy de produção pode ser indexado; preview e dev ficam fora. */
export function ehProducao(): boolean {
  return ambiente.VERCEL_ENV === undefined || ambiente.VERCEL_ENV === 'production';
}
