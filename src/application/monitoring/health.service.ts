import { db } from "@/lib/db";

export type HealthCheckResult = {
  status: "ok" | "error";
  database: "ok" | "error";
  timestamp: string;
  version: string;
};

export async function checkHealth(): Promise<{ data: HealthCheckResult | null; error: string | null }> {
  try {
    // Check database connection
    // We use a simple SELECT 1 to verify connectivity
    await db.$queryRaw`SELECT 1`;
    
    return {
      data: {
        status: "ok",
        database: "ok",
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "1.0.0",
      },
      error: null,
    };
  } catch (err) {
    console.error("Health check failed:", err);
    
    return {
      data: {
        status: "error",
        database: "error",
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "1.0.0",
      },
      error: err instanceof Error ? err.message : "Unknown database error",
    };
  }
}
