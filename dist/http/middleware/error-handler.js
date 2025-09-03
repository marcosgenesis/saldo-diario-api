import { ZodError } from "zod";
import { AppError, DatabaseError, ForbiddenError, InternalServerError, } from "../../errors/app-error";
import { ApiResponseBuilder } from "../../utils/api-response";
export async function errorHandler(error, request, reply) {
    // Log do erro para debugging
    request.log.error({
        error: error.message,
        stack: error.stack,
        url: request.url,
        method: request.method,
        body: request.body,
        params: request.params,
        query: request.query,
    });
    // Tratar erros de validação do Zod
    if (error instanceof ZodError) {
        return ApiResponseBuilder.validationError(reply, "Dados inválidos", error.issues);
    }
    // Tratar erros customizados da aplicação
    if (error instanceof AppError) {
        return ApiResponseBuilder.error(reply, error);
    }
    // Tratar erros de validação do Fastify
    if (error.validation) {
        return ApiResponseBuilder.validationError(reply, "Dados de entrada inválidos", error.validation);
    }
    // Tratar erros de autenticação
    if (error.statusCode === 401) {
        return ApiResponseBuilder.unauthorized(reply, "Token de autenticação inválido ou expirado");
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
    if (error.code === "ER_DUP_ENTRY" ||
        error.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return ApiResponseBuilder.conflict(reply, "Dados duplicados");
    }
    if (error.code === "ER_NO_REFERENCED_ROW" ||
        error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
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
export function asyncErrorHandler(handler) {
    return async (request, reply) => {
        try {
            return await handler(request, reply);
        }
        catch (error) {
            return errorHandler(error, request, reply);
        }
    };
}
