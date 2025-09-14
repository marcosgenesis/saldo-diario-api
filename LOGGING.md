# Sistema de Logging de Requisições com Erro

Este documento descreve o sistema de logging implementado para capturar detalhes de requisições que resultaram em erro, facilitando a reprodução e debug dos problemas.

## Funcionalidades Implementadas

### 1. Logging Automático de Erros
- **Captura automática**: Todas as requisições que resultam em erro são automaticamente logadas
- **Dados sanitizados**: Informações sensíveis (passwords, tokens) são mascaradas nos logs
- **Comando curl**: Geração automática de comando curl para reprodução do erro

### 2. Estrutura do Log

Cada erro gera um log estruturado contendo:

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "ERROR",
  "message": "Request failed",
  "error": {
    "message": "Validation failed",
    "name": "ZodError",
    "stack": "..."
  },
  "request": {
    "method": "POST",
    "url": "/api/balance",
    "headers": {
      "content-type": "application/json",
      "authorization": "[REDACTED]"
    },
    "body": {
      "amount": "invalid_value",
      "description": "Test transaction"
    },
    "params": {},
    "query": {},
    "userAgent": "Mozilla/5.0...",
    "ip": "192.168.1.1"
  },
  "reproduction": {
    "curl": "curl -X POST \"http://localhost:4000/api/balance\" \\\n  -H \"content-type: application/json\" \\\n  -H \"authorization: Bearer [TOKEN_MASCARADO]\" \\\n  -d '{\"amount\":\"invalid_value\",\"description\":\"Test transaction\"}'",
    "note": "Use este comando curl para reproduzir o erro. Tokens foram mascarados por segurança."
  }
}
```

### 3. Tipos de Logging

#### Logging Automático (Error Handler)
- Captura todos os erros não tratados
- Inclui stack trace completo
- Geração automática de curl

#### Logging de Status HTTP (Middleware)
- Monitora requisições com status 4xx e 5xx
- Inclui tempo de resposta
- Log de nível WARN para 4xx, ERROR para 5xx

#### Logging Manual
```typescript
import { logFailedRequest } from '../middleware/request-logger';

// Em qualquer controller ou middleware
logFailedRequest(request, {
  customContext: 'Informação adicional sobre o erro',
  userId: user.id
});
```

## Configuração

### Pré-requisitos
- O Fastify foi configurado com logger habilitado
- Em desenvolvimento, logs são mais verbosos (level: debug)
- Em produção, apenas logs importantes (level: info)

### Variáveis de Ambiente

```bash
# URL base para geração de comandos curl (opcional)
API_BASE_URL=https://api.saldodiario.com.br

# Ambiente de desenvolvimento para logs verbosos
NODE_ENV=development
```

### Como Testar o Logging

1. **Inicie a API em modo desenvolvimento:**
```bash
npm run dev
```

2. **Faça uma requisição que gere erro:**
```bash
# Exemplo: dados inválidos
curl -X POST "http://localhost:4000/api/expense" \
  -H "content-type: application/json" \
  -H "authorization: Bearer invalid_token" \
  -d '{"amount":"invalid","description":"Test"}'
```

3. **Verifique o console** - você deve ver:
   - Log do middleware: `[REQUEST-LOGGER] POST /api/expense - Status: 401`
   - Log do error handler: `[ERROR-HANDLER] Error occurred: ...`
   - Comando curl para reprodução
   - Log estruturado do Fastify (JSON)

### Personalização

#### Mascarar Campos Adicionais
Edite o arquivo `src/utils/request-logger.ts`:

```typescript
// Adicionar novos headers sensíveis
const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-custom-token'];

// Adicionar novos campos sensíveis no body
const sensitiveFields = ['password', 'token', 'secret', 'key', 'cpf', 'email'];
```

#### Personalizar Comando Curl
```typescript
// Adicionar headers personalizados ao curl
const importantHeaders = [
  'content-type',
  'authorization', 
  'accept',
  'user-agent',
  'x-requested-with',
  'x-custom-header' // Adicionar aqui
];
```

## Exemplos de Uso

### 1. Erro de Validação
```bash
# Log gerado automaticamente ao enviar dados inválidos
curl -X POST "http://localhost:4000/api/expense" \
  -H "content-type: application/json" \
  -H "authorization: Bearer [TOKEN_MASCARADO]" \
  -d '{"amount":"invalid","description":"Test"}'
```

### 2. Erro de Autenticação
```bash
# Log gerado automaticamente com token inválido
curl -X GET "http://localhost:4000/api/balance" \
  -H "authorization: Bearer invalid_token"
```

### 3. Erro de Banco de Dados
```bash
# Log gerado automaticamente com contexto adicional
curl -X POST "http://localhost:4000/api/income" \
  -H "content-type: application/json" \
  -H "authorization: Bearer [TOKEN_MASCARADO]" \
  -d '{"amount":1000,"categoryId":"non_existent_id"}'
```

## Benefícios

1. **Reprodução Fácil**: Comando curl pronto para uso
2. **Debug Eficiente**: Todos os dados da requisição em um lugar
3. **Segurança**: Informações sensíveis são mascaradas
4. **Monitoramento**: Logs estruturados para ferramentas de monitoramento
5. **Análise**: Facilita identificação de padrões de erro

## Monitoramento

Os logs podem ser integrados com ferramentas de monitoramento como:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Grafana + Loki**
- **Datadog**
- **New Relic**

Exemplo de query para buscar erros específicos:
```json
{
  "query": {
    "bool": {
      "must": [
        {"match": {"level": "ERROR"}},
        {"match": {"request.url": "/api/balance"}}
      ]
    }
  }
}
```
