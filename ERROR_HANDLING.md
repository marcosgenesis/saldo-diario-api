# Sistema de Gerenciamento de Erros

## Visão Geral

Este projeto implementa uma estratégia robusta de gerenciamento de erros que garante consistência, rastreabilidade e uma experiência de usuário melhorada.

## Arquitetura

### 1. Classes de Erro Customizadas (`src/errors/app-error.ts`)

- **AppError**: Classe base abstrata para todos os erros da aplicação
- **BadRequestError**: Para requisições inválidas (400)
- **UnauthorizedError**: Para usuários não autenticados (401)
- **ForbiddenError**: Para acesso negado (403)
- **NotFoundError**: Para recursos não encontrados (404)
- **ConflictError**: Para conflitos de dados (409)
- **ValidationError**: Para dados inválidos (422)
- **InternalServerError**: Para erros internos (500)
- **DatabaseError**: Para erros de banco de dados (500)

### 2. Utilitários de Resposta (`src/utils/api-response.ts`)

- **ApiResponseBuilder**: Classe estática para construir respostas padronizadas
- Respostas de sucesso e erro seguem o mesmo formato
- Inclui timestamp automático para rastreabilidade

### 3. Middleware de Tratamento de Erros (`src/http/middleware/error-handler.ts`)

- **errorHandler**: Função global para capturar e tratar todos os erros
- **asyncErrorHandler**: Wrapper para métodos assíncronos
- Tratamento automático de diferentes tipos de erro
- Logging estruturado para debugging

## Uso

### Em Controllers

```typescript
import { asyncErrorHandler } from "../middleware/error-handler";
import { ApiResponseBuilder } from "../../utils/api-response";
import { NotFoundError } from "../../errors";

export class ExampleController {
  static getExample = asyncErrorHandler(async (request, reply) => {
    const data = await someOperation();
    
    if (!data) {
      throw new NotFoundError("Dados não encontrados");
    }
    
    return ApiResponseBuilder.success(reply, data, "Operação realizada com sucesso");
  });
}
```

### Em Repositórios

```typescript
import { ConflictError, DatabaseError } from "../../errors/app-error";

export class ExampleRepository {
  async create(data: any) {
    try {
      // Operação de banco
      const result = await db.insert(table).values(data).returning();
      return result[0];
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        throw new ConflictError("Dados duplicados");
      }
      throw new DatabaseError(`Erro ao criar: ${error.message}`);
    }
  }
}
```

### Em Use Cases

```typescript
import { ValidationError } from "../../errors";

export class ExampleUseCase {
  async execute(data: any) {
    if (!data.requiredField) {
      throw new ValidationError("Campo obrigatório não fornecido");
    }
    
    // Lógica de negócio
    return result;
  }
}
```

## Formato de Resposta

### Sucesso
```json
{
  "success": true,
  "data": { ... },
  "message": "Operação realizada com sucesso",
  "statusCode": 200,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Erro
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Recurso não encontrado",
    "details": { ... }
  },
  "statusCode": 404,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Códigos de Erro

| Código | Descrição | HTTP Status |
|--------|-----------|-------------|
| `BAD_REQUEST` | Requisição inválida | 400 |
| `UNAUTHORIZED` | Não autorizado | 401 |
| `FORBIDDEN` | Acesso negado | 403 |
| `NOT_FOUND` | Recurso não encontrado | 404 |
| `CONFLICT` | Conflito de dados | 409 |
| `VALIDATION_ERROR` | Dados inválidos | 422 |
| `INTERNAL_ERROR` | Erro interno do servidor | 500 |
| `DATABASE_ERROR` | Erro de banco de dados | 500 |

## Logging

- Todos os erros são logados automaticamente
- Inclui contexto da requisição (URL, método, parâmetros)
- Stack trace preservado para debugging
- Diferentes níveis de log baseados no tipo de erro

## Benefícios

1. **Consistência**: Todas as respostas seguem o mesmo formato
2. **Rastreabilidade**: Timestamps e códigos de erro padronizados
3. **Debugging**: Logging estruturado e stack traces preservados
4. **Manutenibilidade**: Código limpo sem try-catch repetitivos
5. **Experiência do Usuário**: Mensagens de erro claras e úteis
6. **Segurança**: Detalhes internos não expostos em produção
