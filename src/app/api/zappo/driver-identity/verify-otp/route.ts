import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@lib/server/require-session';

const API = process.env.ZAPPO_API_URL ?? 'http://65.0.157.6:3001/api/v1';

// Returns the driver JWT straight to the browser — it's held client-side (not in this
// admin's own NextAuth session) and attached as x-driver-token on subsequent
// claim/wallet calls. Never stored server-side here.
export async function POST(req: NextRequest) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const res = await fetch(`${API}/auth/driver/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
