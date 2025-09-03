import { AppError } from "../errors/app-error";
export class ApiResponseBuilder {
    static success(reply, data, message = "Operação realizada com sucesso", statusCode = 200) {
        const response = {
            success: true,
            data,
            message,
            statusCode,
            timestamp: new Date().toISOString(),
        };
        return reply.status(statusCode).send(response);
    }
    static error(reply, error, details) {
        let statusCode = 500;
        let code = "INTERNAL_ERROR";
        let message = "Erro interno do servidor";
        if (error instanceof AppError) {
            statusCode = error.statusCode;
            code = error.code;
            message = error.message;
        }
        else {
            // Para erros não tratados, logar para debugging
            console.error("Erro não tratado:", error);
        }
        const response = {
            success: false,
            error: {
                code,
                message,
                details,
            },
            statusCode,
            timestamp: new Date().toISOString(),
        };
        return reply.status(statusCode).send(response);
    }
    static validationError(reply, message = "Dados inválidos", details) {
        const response = {
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message,
                details,
            },
            statusCode: 422,
            timestamp: new Date().toISOString(),
        };
        return reply.status(422).send(response);
    }
    static notFound(reply, message = "Recurso não encontrado") {
        const response = {
            success: false,
            error: {
                code: "NOT_FOUND",
                message,
            },
            statusCode: 404,
            timestamp: new Date().toISOString(),
        };
        return reply.status(404).send(response);
    }
    static unauthorized(reply, message = "Não autorizado") {
        const response = {
            success: false,
            error: {
                code: "UNAUTHORIZED",
                message,
            },
            statusCode: 401,
            timestamp: new Date().toISOString(),
        };
        return reply.status(401).send(response);
    }
    static conflict(reply, message = "Conflito de dados") {
        const response = {
            success: false,
            error: {
                code: "CONFLICT",
                message,
            },
            statusCode: 409,
            timestamp: new Date().toISOString(),
        };
        return reply.status(409).send(response);
    }
}
