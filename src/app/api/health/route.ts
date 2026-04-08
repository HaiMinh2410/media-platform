import { NextResponse } from "next/server";
import { checkHealth } from "@/application/monitoring/health.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await checkHealth();

  if (error || !data || data.status === "error") {
    return NextResponse.json(data || { status: "error", error }, { status: 503 });
  }

  return NextResponse.json(data);
}
