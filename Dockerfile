# syntax=docker/dockerfile:1
# Base image pinned by digest (node:22-alpine, multi-arch index); bump it deliberately.
FROM node:22-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS builder

WORKDIR /app

COPY package.json package-lock.json .npmrc ./

# A TOKEN IS REQUIRED HERE. @rede-enois/design-system comes from GitHub Packages, which needs a
# token with `read:packages` even for public packages. It arrives as a BuildKit secret, never as a
# build arg (build args stay in the image history):
#   docker build --secret id=npm_token,env=NODE_AUTH_TOKEN .
RUN --mount=type=secret,id=npm_token \
    if [ ! -s /run/secrets/npm_token ]; then \
      echo "ERROR: missing build secret 'npm_token'. Installing @rede-enois/design-system from GitHub Packages requires a token with read:packages: docker build --secret id=npm_token,env=NODE_AUTH_TOKEN ." >&2; \
      exit 1; \
    fi \
    && NODE_AUTH_TOKEN="$(cat /run/secrets/npm_token)" npm ci

COPY . .

# A base da API entra no BUILD (o Vite embute as VITE_* no bundle). Sem esta linha o build cai no
# fallback do api-client e a imagem publicada aponta para localhost — foi exatamente isso que
# derrubou o app em 18/10: o bundle servido chamava http://localhost:8081/api.
ARG VITE_API_BACKEND=https://api.enois.ia.br/api
ENV VITE_API_BACKEND=$VITE_API_BACKEND

# Origem pública que o SSR declara ao backend (X-Client-Origin). No browser o front usa
# window.location.origin; no servidor não existe location, então a URL entra no build — QA e prod
# precisam de valores diferentes.
ARG VITE_SITE_URL=https://enois.ia.br
ENV VITE_SITE_URL=$VITE_SITE_URL

# Domínios que servem este build, o principal primeiro (ex.: enois.ia.br,isweee.com). No espelho o
# navegador chama a API do próprio domínio (api.isweee.com), onde moram os cookies de sessão dele.
# Vazio: um domínio só, a API é sempre VITE_API_BACKEND.
ARG VITE_SITE_DOMAINS=
ENV VITE_SITE_DOMAINS=$VITE_SITE_DOMAINS

# Verificação de identidade (Didit) no painel de Segurança e Verificação. Não é segredo: só
# mostra/esconde a seção; quem autoriza de verdade é o backend. Sem a flag o painel não exibe a
# verificação — é o estado "homologação pendente" documentado no componente.
ARG VITE_IDENTITY_ENABLED=
ENV VITE_IDENTITY_ENABLED=$VITE_IDENTITY_ENABLED

RUN NITRO_PRESET=node-server npm run build

FROM node:22-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/.output ./.output

# Processo sem privilégios (E-17): o runtime não precisa de root para servir o SSR.
# Remove o npm/npx do runtime: o app só precisa do Node, e o npm da imagem-base carrega
# dependências (pacote/sigstore/brace-expansion) que só existem no build.
RUN addgroup -S app && adduser -S app -G app \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
USER app

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
