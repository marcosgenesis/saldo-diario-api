import fastifyCors from "@fastify/cors";
import Fastify from "fastify";
import { auth } from "./auth"; // Your configured Better Auth instance
import { errorHandler } from "./http/middleware/error-handler.js";
import { registerRoutes } from "./http/routes/index.js";
const fastify = Fastify();
fastify.register(fastifyCors, {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    maxAge: 86400,
});
// Register authentication endpoint
fastify.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    async handler(request, reply) {
        try {
            // Construct request URL
            const url = new URL(request.url, `http://${request.headers.host}`);
            // Convert Fastify headers to standard Headers object
            const headers = new Headers();
            Object.entries(request.headers).forEach(([key, value]) => {
                if (value)
                    headers.append(key, value.toString());
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
            reply.send(response.body ? await response.text() : null);
        }
        catch (error) {
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
fastify.listen({ port: 4000 }, (err) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log("Server running on port 4000");
});
