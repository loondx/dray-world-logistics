import { detectFileType } from "@/lib/storage/file-types";
import { getCurrentUser } from "@/server/auth/guards";
import { getCompanySettings } from "@/server/services/company-settings.service";
import { readStoredFile } from "@/server/storage/file-storage";

// Company logo (Settings preview). Signed-in users only.
export async function GET() {
  if (!(await getCurrentUser())) return new Response(null, { status: 401 });
  const { logoStorageKey } = await getCompanySettings();
  const data = logoStorageKey ? await readStoredFile(logoStorageKey) : null;
  const type = data ? detectFileType(data.subarray(0, 16)) : null;
  if (!data || !type) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": type.mimeType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
