import { FastifyRequest } from "fastify";

export interface RequestLogData {
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  timestamp: string;
  userAgent?: string;
  ip?: string;
}

/**
 * Gera um comando curl para reproduzir uma requisição
 */
export function generateCurlCommand(
  request: FastifyRequest,
  baseUrl?: string
): string {
  const { method, url, headers, body } = request;
  
  // URL base para o curl
  const fullUrl = baseUrl 
    ? `${baseUrl}${url}`
    : `http://localhost:${process.env.PORT || 4000}${url}`;

  let curlCommand = `curl -X ${method.toUpperCase()} "${fullUrl}"`;

  // Adicionar headers importantes (excluindo alguns sensíveis)
  const importantHeaders = [
    'content-type',
    'authorization',
    'accept',
    'user-agent',
    'x-requested-with'
  ];

  Object.entries(headers).forEach(([key, value]) => {
    if (value && importantHeaders.includes(key.toLowerCase())) {
      // Mascarar tokens de autorização para segurança
      let headerValue = value.toString();
      if (key.toLowerCase() === 'authorization' && headerValue.includes('Bearer')) {
        headerValue = headerValue.replace(/Bearer\s+(.+)/, 'Bearer [TOKEN_MASCARADO]');
      }
      curlCommand += ` \\\n  -H "${key}: ${headerValue}"`;
    }
  });

  // Adicionar body se existir
  if (body && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT' || method.toUpperCase() === 'PATCH')) {
    const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
    curlCommand += ` \\\n  -d '${bodyString}'`;
  }

  return curlCommand;
}

/**
 * Extrai dados relevantes da requisição para logging
 */
export function extractRequestData(request: FastifyRequest): RequestLogData {
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
  const sanitizedHeaders: Record<string, string | string[] | undefined> = {};

  // Sanitizar headers sensíveis
  Object.entries(request.headers).forEach(([key, value]) => {
    if (sensitiveHeaders.includes(key.toLowerCase())) {
      sanitizedHeaders[key] = '[REDACTED]';
    } else {
      sanitizedHeaders[key] = value;
    }
  });

  // Sanitizar body se contiver informações sensíveis
  let sanitizedBody = request.body;
  if (sanitizedBody && typeof sanitizedBody === 'object') {
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    sanitizedBody = { ...sanitizedBody };
    
    Object.keys(sanitizedBody).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitizedBody[key] = '[REDACTED]';
      }
    });
  }

  return {
    method: request.method,
    url: request.url,
    headers: sanitizedHeaders,
    body: sanitizedBody,
    params: request.params,
    query: request.query,
    timestamp: new Date().toISOString(),
    userAgent: request.headers['user-agent'],
    ip: request.ip || request.headers['x-forwarded-for']?.toString() || request.headers['x-real-ip']?.toString()
  };
}

/**
 * Formata os dados da requisição para log estruturado
 */
export function formatRequestLog(
  requestData: RequestLogData,
  error: Error,
  curlCommand: string
): Record<string, any> {
  return {
    timestamp: requestData.timestamp,
    level: 'ERROR',
    message: 'Request failed',
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack
    },
    request: {
      method: requestData.method,
      url: requestData.url,
      headers: requestData.headers,
      body: requestData.body,
      params: requestData.params,
      query: requestData.query,
      userAgent: requestData.userAgent,
      ip: requestData.ip
    },
    reproduction: {
      curl: curlCommand,
      note: 'Use este comando curl para reproduzir o erro. Tokens foram mascarados por segurança.'
    }
  };
}
