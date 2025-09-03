# API Saldo Diário

## Visão Geral

API robusta para gerenciamento de saldos diários com sistema avançado de tratamento de erros, autenticação segura e arquitetura modular.

## Requisitos Técnicos

- **Runtime**: Node.js
- **Framework**: Fastify (substituindo Hono para melhor performance)
- **Arquitetura**: Modular (Controller, Service, Repository, Use Cases)
- **ORM**: Drizzle
- **Autenticação**: Better Auth
- **Banco de Dados**: PostgreSQL via Docker
- **Gerenciador de Pacotes**: pnpm

## Funcionalidades

### Autenticação
- Registro e login de usuários via Better Auth
- Middleware de autenticação para rotas protegidas
- Tokens JWT seguros

### Gestão de Saldos
- Criar, ler, atualizar e deletar saldos
- Validação de períodos (data início < data fim)
- Controle de duplicação por período
- Associação com usuários autenticados

### Transações
- Criar despesas e receitas
- Associação com saldos específicos
- Consulta de saldos com transações

## Sistema de Gerenciamento de Erros

### Características
- **Classes de erro customizadas** para diferentes cenários
- **Middleware global** de tratamento de erros
- **Respostas padronizadas** com formato consistente
- **Logging estruturado** para debugging
- **Tratamento automático** de erros de validação

### Tipos de Erro Suportados
- Validação de dados (422)
- Recursos não encontrados (404)
- Conflitos de dados (409)
- Erros de autenticação (401)
- Erros de banco de dados (500)
- Erros internos do servidor (500)

### Formato de Resposta
```json
{
  "success": true|false,
  "data": { ... }, // apenas em sucessos
  "error": {        // apenas em erros
    "code": "ERROR_CODE",
    "message": "Descrição do erro",
    "details": { ... }
  },
  "statusCode": 200,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Estrutura do Projeto

```
src/
├── errors/           # Classes de erro customizadas
├── http/            # Camada HTTP (rotas, controllers, middleware)
├── db/              # Configuração e schema do banco
├── repositories/    # Camada de acesso a dados
├── use-cases/       # Lógica de negócio
├── utils/           # Utilitários (respostas, validações)
└── types/           # Definições de tipos TypeScript
```

## Instalação e Execução

### Pré-requisitos
- Node.js 18+
- Docker e Docker Compose
- pnpm

### Comandos
```bash
# Instalar dependências
pnpm install

# Subir banco de dados
docker-compose up -d

# Executar migrações
pnpm drizzle-kit push

# Iniciar servidor
pnpm dev
```

## Documentação

- [Sistema de Gerenciamento de Erros](./ERROR_HANDLING.md)
- [Estrutura da API](./docs/API_STRUCTURE.md)
- [Guia de Desenvolvimento](./docs/DEVELOPMENT.md)

## Tecnologias Utilizadas

- **Fastify**: Framework web rápido e eficiente
- **Drizzle**: ORM moderno e type-safe
- **Better Auth**: Sistema de autenticação robusto
- **PostgreSQL**: Banco de dados relacional
- **TypeScript**: Tipagem estática para melhor qualidade de código
- **Zod**: Validação de schemas
- **Docker**: Containerização da aplicação