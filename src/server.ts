import fastifyCors from "@fastify/cors";
import "dotenv/config";
import Fastify from "fastify";
import { auth } from "./auth"; // Your configured Better Auth instance
import { errorHandler } from "./http/middleware/error-handler.js";
import { registerRoutes } from "./http/routes/index.js";

const fastify = Fastify();
fastify.get("/", (request, reply) => {
  reply.send("Hello World");
});
const allowedOrigin =
  process.env.CLIENT_ORIGIN || "https://app.saldodiario.com.br";
console.log(allowedOrigin);
fastify.register(fastifyCors, {
  origin: [allowedOrigin],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Access-Control-Allow-Origin",
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
        reply.status(200).send();
        return;
      }

      console.log(`Auth request: ${request.method} ${request.url}`);
      console.log("Headers:", request.headers);
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

      response.headers.forEach((value, key) => reply.header(key, value));
      reply.header("Access-Control-Allow-Origin", allowedOrigin);
      reply.header("Access-Control-Allow-Credentials", "true");
      reply.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      reply.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With"
      );
      reply.send(response.body ? await response.text() : null);
    } catch (error: any) {
      console.error("Authentication Error:", error);
      reply.status(500).send({
        error: "Internal authentication error",
        code: "AUTH_FAILURE",
      });
    }
  },
});

// Registrar middleware de tratamento de erros
fastify.setErrorHandler(errorHandler);

// Registrar rotas da aplicação
await registerRoutes(fastify);

// Initialize server
fastify.listen(
  { port: Number(process.env.PORT) || 4000, host: "0.0.0.0" },
  (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server running on port ${process.env.PORT || 4000}`);
  }
);
