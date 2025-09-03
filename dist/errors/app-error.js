export class AppError extends Error {
    statusCode;
    code;
    isOperational;
    constructor(message, statusCode, code, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        // Garantir que o stack trace seja preservado
        Error.captureStackTrace(this, this.constructor);
    }
}
export class BadRequestError extends AppError {
    constructor(message = "Requisição inválida", code = "BAD_REQUEST") {
        super(message, 400, code);
    }
}
export class UnauthorizedError extends AppError {
    constructor(message = "Não autorizado", code = "UNAUTHORIZED") {
        super(message, 401, code);
    }
}
export class ForbiddenError extends AppError {
    constructor(message = "Acesso negado", code = "FORBIDDEN") {
        super(message, 403, code);
    }
}
export class NotFoundError extends AppError {
    constructor(message = "Recurso não encontrado", code = "NOT_FOUND") {
        super(message, 404, code);
    }
}
export class ConflictError extends AppError {
    constructor(message = "Conflito de dados", code = "CONFLICT") {
        super(message, 409, code);
    }
}
export class ValidationError extends AppError {
    constructor(message = "Dados inválidos", code = "VALIDATION_ERROR") {
        super(message, 422, code);
    }
}
export class InternalServerError extends AppError {
    constructor(message = "Erro interno do servidor", code = "INTERNAL_ERROR") {
        super(message, 500, code, false);
    }
}
export class DatabaseError extends AppError {
    constructor(message = "Erro de banco de dados", code = "DATABASE_ERROR") {
        super(message, 500, code, false);
    }
}
