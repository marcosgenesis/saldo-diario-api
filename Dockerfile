# Use Node.js 20 Alpine como base
FROM node:20-alpine

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Definir diretório de trabalho
WORKDIR /app

# Recebe DATABASE_URL em tempo de build (opcional) e define como ENV
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
ARG CLIENT_ORIGIN
ENV CLIENT_ORIGIN=${CLIENT_ORIGIN}
ARG BETTER_AUTH_URL
ENV BETTER_AUTH_URL=${BETTER_AUTH_URL}
ARG BETTER_AUTH_SECRET
ENV BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml ./

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar código fonte
COPY . .

# Gerar build da aplicação e executar migrações
RUN pnpm run build && pnpm run db:migrate

# Expor porta 4000
EXPOSE 4000

# Comando para iniciar a aplicação
CMD ["pnpm", "start"]
