import { psaApi } from "./psaApi";

/**
 * Creates an invite record in the database and returns the full shareable URL.
 * Works for any authenticated user (trainers, supervisors, managers, owners).
 *
 * For "open" invites (no specific person), pass fullName="Team Member" and email="".
 */
export async function createInviteUrl(params: {
  fullName: string;
  email: string;
  role: string;
  warehouseId?: string | null;
  warehouseSlug?: string | null;
}): Promise<string> {
  const { token } = await psaApi.createInvite(params);
  return `${window.location.origin}/invite/${token}`;
}
