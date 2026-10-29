import { handleServeFile, handleOptions } from "@/lib/fileServer";

/**
 * Endpoint alternatif sous /api/uploads/... pour compatibilité avec les clients API
 */
export async function GET(req, context) {
  const params = await context.params;
  return handleServeFile(req, params?.path);
}

export async function HEAD(req, context) {
  const params = await context.params;
  return handleServeFile(req, params?.path);
}

export async function OPTIONS() {
  return handleOptions();
}
