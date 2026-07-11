import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@lib/server/require-session';

const API = process.env.ZAPPO_API_URL ?? 'http://65.0.157.6:3001/api/v1';

// Lets a super admin link their OWN driver identity (phone + OTP) to claim a super-admin
// test card — same consent-boundary flow the driver app uses, not a shortcut around it.
export async function POST(req: NextRequest) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const res = await fetch(`${API}/auth/driver/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
