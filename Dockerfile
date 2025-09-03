# Use Node.js 20 Alpine como base
FROM node:20-alpine

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml ./

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar código fonte
COPY . .

# Gerar build da aplicação
RUN pnpm run build

# Expor porta 4000
EXPOSE 4000

# Comando para iniciar a aplicação
CMD ["pnpm", "start"]
