FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# A base da API entra no BUILD (o Vite embute as VITE_* no bundle). Sem esta linha o build cai no
# fallback do api-client e a imagem publicada aponta para localhost — foi exatamente isso que
# derrubou o app em 18/10: o bundle servido chamava http://localhost:8081/api.
ARG VITE_API_BACKEND=https://enois.ia.br/api
ENV VITE_API_BACKEND=$VITE_API_BACKEND

# Origem pública que o SSR declara ao backend (X-Client-Origin). No browser o front usa
# window.location.origin; no servidor não existe location, então a URL entra no build — QA e prod
# precisam de valores diferentes.
ARG VITE_SITE_URL=https://enois.ia.br
ENV VITE_SITE_URL=$VITE_SITE_URL

RUN NITRO_PRESET=node-server npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
