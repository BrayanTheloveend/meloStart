import { handleServeFile, handleOptions } from "@/lib/fileServer";

export const dynamic = "force-dynamic";

/**
 * Endpoint de distribution publique pour les fichiers sous /uploads/...
 * Permet à Next.js de servir les fichiers médias générés dynamiquement (audio, covers)
 * avec support complet du streaming HTTP Range (code 206 Partial Content).
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
