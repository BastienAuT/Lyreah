import { auth } from "@/auth/server";

export const { GET, POST, PUT, DELETE, PATCH } = auth.handler();
