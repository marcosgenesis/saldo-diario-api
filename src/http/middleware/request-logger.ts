import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { logJson } from "../../utils/logger.js";
import {
  extractRequestData,
  generateCurlCommand,
} from "../../utils/request-logger.js";

/**
 * Plugin para logging detalhado de requisições
 */
export async function requestLoggerPlugin(fastify: FastifyInstance) {
  // Hook para capturar todas as requisições
  fastify.addHook(
    "onRequest",
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Adicionar timestamp de início da requisição
      (request as any).startTime = Date.now();

      // Log básico da requisição entrante (apenas para debug se necessário)
      if (process.env.NODE_ENV === "development") {
        request.log.info(
          {
            method: request.method,
            url: request.url,
            userAgent: request.headers["user-agent"],
            ip: request.ip,
          },
          "Incoming request"
        );
      }
    }
  );

  // Hook para capturar requisições que resultaram em erro (status >= 400)
  fastify.addHook(
    "onSend",
    async (request: FastifyRequest, reply: FastifyReply, payload) => {
      const statusCode = reply.statusCode;
      const startTime = (request as any).startTime || Date.now();
      const duration = Date.now() - startTime;

      // Debug log formatado como JSON
      logJson("REQUEST-LOGGER", {
        method: request.method,
        url: request.url,
        status: statusCode,
        duration: `${duration}ms`,
      });

      // Log detalhado apenas para erros (4xx e 5xx)
      if (statusCode >= 400) {
        const requestData = extractRequestData(request);
        const curlCommand = generateCurlCommand(
          request,
          process.env.API_BASE_URL
        );

        const logData = {
          timestamp: new Date().toISOString(),
          level: statusCode >= 500 ? "ERROR" : "WARN",
          message: `Request completed with status ${statusCode}`,
          request: {
            method: requestData.method,
            url: requestData.url,
            headers: requestData.headers,
            body: requestData.body,
            params: requestData.params,
            query: requestData.query,
            userAgent: requestData.userAgent,
            ip: requestData.ip,
          },
          response: {
            statusCode,
            duration: `${duration}ms`,
            contentType: reply.getHeader("content-type"),
          },
          reproduction: {
            curl: curlCommand,
            note: "Use este comando curl para reproduzir a requisição. Tokens foram mascarados por segurança.",
          },
        };

        request.log.warn(logData, `Request failed with status ${statusCode}`);
      }
    }
  );
}

/**
 * Middleware para logging de requisições específicas (pode ser usado em rotas individuais)
 */
export function logFailedRequest(
  request: FastifyRequest,
  additionalContext?: Record<string, any>
) {
  const requestData = extractRequestData(request);
  const curlCommand = generateCurlCommand(request, process.env.API_BASE_URL);

  const logData = {
    timestamp: new Date().toISOString(),
    level: "ERROR",
    message: "Manual request logging",
    request: {
      method: requestData.method,
      url: requestData.url,
      headers: requestData.headers,
      body: requestData.body,
      params: requestData.params,
      query: requestData.query,
      userAgent: requestData.userAgent,
      ip: requestData.ip,
    },
    reproduction: {
      curl: curlCommand,
      note: "Use este comando curl para reproduzir a requisição. Tokens foram mascarados por segurança.",
    },
    context: additionalContext,
  };

  request.log.error(logData, "Request logged manually");
}
