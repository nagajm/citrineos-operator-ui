import { getServerSession } from 'next-auth';
import authOptions from '@app/api/auth/[...nextauth]/options';

const KEY = process.env.ZAPPO_ADMIN_API_KEY ?? '';

// Every /api/zappo/** proxy route should build its outgoing headers with this,
// not a local `x-admin-key`-only object. x-admin-role is read server-side from
// the current admin's own NextAuth session — never something the browser sets
// directly — and is what ev-csms-api's PermissionsGuard checks on the other
// end. Hiding a nav item in the UI is a nicety; this header is what actually
// gets enforced.
export async function getAdminProxyHeaders(): Promise<Record<string, string>> {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role ?? '';
  return {
    'Content-Type': 'application/json',
    'x-admin-key': KEY,
    'x-admin-role': role,
  };
}
