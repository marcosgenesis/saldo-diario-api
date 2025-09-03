import { Session, User } from "better-auth";
import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    user?: User;
    session?: Session;
  }
}
