import { getServerSession } from 'next-auth';
import authOptions from '@app/api/auth/[...nextauth]/options';
import { NextResponse } from 'next/server';

// The driver-identity proxy routes call ev-csms-api's PUBLIC driver-auth endpoints —
// no x-admin-key involved, since they're not admin-scoped. The global middleware skips
// its own check entirely for the generic auth provider (see middleware.ts), so without
// this, these routes would be reachable by anyone, turning them into an open OTP-request
// relay. Call this first in any route that doesn't already go through getAdminProxyHeaders.
export async function requireSession(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  return null;
}
