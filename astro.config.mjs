// @ts-check
import { defineConfig } from 'astro/config';

// Saída 100% estática: nenhum backend, nenhum formulário, nenhuma função de servidor.
// O host de preview do Cloud é liberado por variável de ambiente
// (__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS), portanto `vite.server.allowedHosts`
// NÃO é definido aqui — definir sobrescreveria a variável.
export default defineConfig({
  output: 'static',
  site: 'https://panificadoraoliveira.com.br',
  server: { host: true, port: 3000 },
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
