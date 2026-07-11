import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@lib/server/require-session';

const API = process.env.ZAPPO_API_URL ?? 'http://65.0.157.6:3001/api/v1';

export async function POST(req: NextRequest) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const driverToken = req.headers.get('x-driver-token');
  if (!driverToken) return NextResponse.json({ message: 'Missing driver token' }, { status: 401 });

  const body = await req.json();
  const res = await fetch(`${API}/driver/wallet/mock-topup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${driverToken}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
