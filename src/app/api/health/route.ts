import { sql } from "drizzle-orm";
import { getDatabase } from "@/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const monitoringToken = process.env.MONITORING_TOKEN;
  const authorization = request.headers.get("authorization");
  const deepCheck =
    Boolean(monitoringToken) && authorization === `Bearer ${monitoringToken}`;

  try {
    if (deepCheck) await getDatabase().execute(sql`select 1`);
    return Response.json(
      {
        checks: deepCheck ? { database: "ok" } : undefined,
        commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || "local",
        status: "ok",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { checks: { database: "error" }, status: "degraded" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
