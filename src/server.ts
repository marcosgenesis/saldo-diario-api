import fastifyCors from "@fastify/cors";
import "dotenv/config";
import Fastify from "fastify";
import { auth } from "./auth"; // Your configured Better Auth instance
import { errorHandler } from "./http/middleware/error-handler.js";
import { requestLoggerPlugin } from "./http/middleware/request-logger.js";
import { registerRoutes } from "./http/routes/index.js";
import { logError, logInfo, logRequest } from "./utils/logger.js";

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
  },
});
fastify.get("/", (request, reply) => {
  reply.send("Hello World");
});
const allowedOrigin =
  process.env.CLIENT_ORIGIN || "https://app.saldodiario.com.br";

// Lista de origens permitidas (incluindo localhost para desenvolvimento)
const allowedOrigins = [
  allowedOrigin,
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

fastify.register(fastifyCors, {
  origin: (origin, cb) => {
    // Em desenvolvimento, permitir todas as origens locais
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
      return;
    }
    // Em produção, apenas a origem permitida
    if (allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error("Not allowed by CORS"), false);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Access-Control-Allow-Origin",
    "x-timezone",
  ],
  credentials: true,
  maxAge: 86400,
});

// Register authentication endpoint
fastify.route({
  method: ["GET", "POST", "OPTIONS"],
  url: "/api/auth/*",
  async handler(request, reply) {
    try {
      // Handle preflight OPTIONS request
      if (request.method === "OPTIONS") {
        const origin = request.headers.origin;
        const allowedOrigin = origin && allowedOrigins.includes(origin) 
          ? origin 
          : allowedOrigins[0];
        
        reply.header("Access-Control-Allow-Origin", allowedOrigin);
        reply.header("Access-Control-Allow-Credentials", "true");
        reply.header(
          "Access-Control-Allow-Methods",
          "GET, POST, PUT, DELETE, OPTIONS"
        );
        reply.header(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization, X-Requested-With, x-timezone"
        );
        reply.status(200).send();
        return;
      }

      logRequest(request.method, request.url, {
        headers: request.headers,
      });
      // Construct request URL
      const url = new URL(request.url, `http://${request.headers.host}`);

      // Convert Fastify headers to standard Headers object
      const headers = new Headers();
      Object.entries(request.headers).forEach(([key, value]) => {
        if (value) headers.append(key, value.toString());
      });

      // Create Fetch API-compatible request
      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        body: request.body ? JSON.stringify(request.body) : undefined,
      });

      // Process authentication request
      const response = await auth.handler(req);

      // Forward response to client
      reply.status(response.status);

      // Determinar origem permitida dinamicamente
      const origin = request.headers.origin;
      const responseOrigin = origin && allowedOrigins.includes(origin) 
        ? origin 
        : allowedOrigins[0];

      response.headers.forEach((value, key) => reply.header(key, value));
      reply.header("Access-Control-Allow-Origin", responseOrigin);
      reply.header("Access-Control-Allow-Credentials", "true");
      reply.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      reply.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, x-timezone"
      );
      reply.send(response.body ? await response.text() : null);
    } catch (error: any) {
      logError("Authentication Error", error);
      reply.status(500).send({
        error: "Internal authentication error",
        code: "AUTH_FAILURE",
      });
    }
  },
});

// Registrar middleware de logging de requisições
await fastify.register(requestLoggerPlugin);

// Registrar middleware de tratamento de erros
fastify.setErrorHandler(errorHandler);

// Registrar rotas da aplicação
await registerRoutes(fastify);

// Initialize server
fastify.listen(
  { port: Number(process.env.PORT) || 4000, host: "0.0.0.0" },
  (err) => {
    if (err) {
      logError("Server Startup Error", err);
      process.exit(1);
    }
    logInfo("Server Started", {
      port: process.env.PORT || 4000,
      environment: process.env.NODE_ENV || "development",
    });
  }
);
