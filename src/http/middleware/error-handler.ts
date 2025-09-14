import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import {
  AppError,
  DatabaseError,
  ForbiddenError,
  InternalServerError,
} from "../../errors/app-error";
import { ApiResponseBuilder } from "../../utils/api-response";
import {
  extractRequestData,
  formatRequestLog,
  generateCurlCommand,
} from "../../utils/request-logger.js";

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Extrair dados da requisição
  const requestData = extractRequestData(request);

  // Gerar comando curl para reprodução
  const curlCommand = generateCurlCommand(request, process.env.API_BASE_URL);

  // Formatar log estruturado
  const logData = formatRequestLog(requestData, error, curlCommand);

  // Log detalhado do erro para debugging e reprodução
  request.log.error(logData, `Request failed: ${error.message}`);

  // Console log adicional para debug
  console.log("[ERROR-HANDLER] Error occurred:", error.message);
  console.log("[ERROR-HANDLER] Curl command:", curlCommand);

  // Tratar erros de validação do Zod
  if (error instanceof ZodError) {
    return ApiResponseBuilder.validationError(
      reply,
      "Dados inválidos",
      error.issues
    );
  }

  // Tratar erros customizados da aplicação
  if (error instanceof AppError) {
    return ApiResponseBuilder.error(reply, error);
  }

  // Tratar erros de validação do Fastify
  if (error.validation) {
    return ApiResponseBuilder.validationError(
      reply,
      "Dados de entrada inválidos",
      error.validation
    );
  }

  // Tratar erros de autenticação
  if (error.statusCode === 401) {
    return ApiResponseBuilder.unauthorized(
      reply,
      "Token de autenticação inválido ou expirado"
    );
  }

  // Tratar erros de autorização
  if (error.statusCode === 403) {
    return ApiResponseBuilder.error(reply, new ForbiddenError());
  }

  // Tratar erros de not found
  if (error.statusCode === 404) {
    return ApiResponseBuilder.notFound(reply, "Rota não encontrada");
  }

  // Tratar erros de conflito
  if (error.statusCode === 409) {
    return ApiResponseBuilder.conflict(reply, "Conflito de dados");
  }

  // Tratar erros de banco de dados
  if (
    error.code === "ER_DUP_ENTRY" ||
    error.code === "SQLITE_CONSTRAINT_UNIQUE"
  ) {
    return ApiResponseBuilder.conflict(reply, "Dados duplicados");
  }

  if (
    error.code === "ER_NO_REFERENCED_ROW" ||
    error.code === "SQLITE_CONSTRAINT_FOREIGNKEY"
  ) {
    return ApiResponseBuilder.validationError(reply, "Referência inválida");
  }

  // Tratar outros erros de banco de dados
  if (error.code?.startsWith("ER_") || error.code?.startsWith("SQLITE_")) {
    return ApiResponseBuilder.error(reply, new DatabaseError(), {
      originalError: error.message,
    });
  }

  // Erro genérico para casos não tratados
  return ApiResponseBuilder.error(reply, new InternalServerError(), {
    originalError: error.message,
  });
}

// Middleware para capturar erros assíncronos
export function asyncErrorHandler<T extends FastifyRequest = FastifyRequest>(
  handler: (request: T, reply: FastifyReply) => Promise<any>
) {
  return async (request: T, reply: FastifyReply) => {
    try {
      return await handler(request, reply);
    } catch (error) {
      // Adicionar contexto adicional se o erro não for um FastifyError
      if (!(error instanceof Error)) {
        const errorObj = new Error(`Async handler failed: ${String(error)}`);
        return errorHandler(errorObj as FastifyError, request, reply);
      }
      return errorHandler(error as FastifyError, request, reply);
    }
  };
}
