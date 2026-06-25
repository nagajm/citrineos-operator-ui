import { NextResponse } from 'next/server';

const API = process.env.ZAPPO_API_URL ?? 'http://65.0.157.6:3001/api/v1';
const KEY = process.env.ZAPPO_ADMIN_API_KEY ?? '';

export async function GET() {
  const res = await fetch(`${API}/admin/stations`, {
    headers: { 'Content-Type': 'application/json', 'x-admin-key': KEY },
    cache: 'no-store',
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
