import { FastifyReply } from "fastify";
import { AppError } from "../errors/app-error";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  statusCode: number;
  timestamp: string;
}

export class ApiResponseBuilder {
  static success<T>(
    reply: FastifyReply,
    data: T,
    message: string = "Operação realizada com sucesso",
    statusCode: number = 200
  ): FastifyReply {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
    };

    return reply.status(statusCode).send(response);
  }

  static error(
    reply: FastifyReply,
    error: AppError | Error,
    details?: any
  ): FastifyReply {
    let statusCode = 500;
    let code = "INTERNAL_ERROR";
    let message = "Erro interno do servidor";

    if (error instanceof AppError) {
      statusCode = error.statusCode;
      code = error.code;
      message = error.message;
    } else {
      // Para erros não tratados, logar para debugging
      console.error("Erro não tratado:", error);
    }

    const response: ApiResponse = {
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

  static validationError(
    reply: FastifyReply,
    message: string = "Dados inválidos",
    details?: any
  ): FastifyReply {
    const response: ApiResponse = {
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

  static notFound(
    reply: FastifyReply,
    message: string = "Recurso não encontrado"
  ): FastifyReply {
    const response: ApiResponse = {
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

  static unauthorized(
    reply: FastifyReply,
    message: string = "Não autorizado"
  ): FastifyReply {
    const response: ApiResponse = {
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

  static conflict(
    reply: FastifyReply,
    message: string = "Conflito de dados"
  ): FastifyReply {
    const response: ApiResponse = {
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
