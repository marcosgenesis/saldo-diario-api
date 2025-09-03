export abstract class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    // Garantir que o stack trace seja preservado
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(
    message: string = "Requisição inválida",
    code: string = "BAD_REQUEST"
  ) {
    super(message, 400, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    message: string = "Não autorizado",
    code: string = "UNAUTHORIZED"
  ) {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Acesso negado", code: string = "FORBIDDEN") {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(
    message: string = "Recurso não encontrado",
    code: string = "NOT_FOUND"
  ) {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(
    message: string = "Conflito de dados",
    code: string = "CONFLICT"
  ) {
    super(message, 409, code);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string = "Dados inválidos",
    code: string = "VALIDATION_ERROR"
  ) {
    super(message, 422, code);
  }
}

export class InternalServerError extends AppError {
  constructor(
    message: string = "Erro interno do servidor",
    code: string = "INTERNAL_ERROR"
  ) {
    super(message, 500, code, false);
  }
}

export class DatabaseError extends AppError {
  constructor(
    message: string = "Erro de banco de dados",
    code: string = "DATABASE_ERROR"
  ) {
    super(message, 500, code, false);
  }
}
