import { FastifyReply, FastifyRequest } from "fastify";
import { auth } from "../../auth.js";
import { logError } from "../../utils/logger.js";

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Obter o token do header Authorization
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({
        error: "Token de autenticação não fornecido",
        message: "Usuário não está logado",
      });
    }

    // Extrair o token (remover "Bearer " do início)
    const token = authHeader.substring(7);

    // Criar headers para verificar a sessão
    const headers = new Headers();
    headers.set("authorization", `Bearer ${token}`);

    // Verificar se existe uma sessão válida
    const session = await auth.api.getSession({
      headers,
    });

    if (!session) {
      return reply.status(401).send({
        error: "Sessão inválida",
        message: "Usuário não está logado",
      });
    }

    // Adicionar informações do usuário ao request para uso posterior
    (request as any).user = session.user;
    (request as any).session = session;
  } catch (error) {
    logError("Authentication Middleware Error", error);
    return reply.status(401).send({
      error: "Erro na autenticação",
      message: "Usuário não está logado",
    });
  }
}
