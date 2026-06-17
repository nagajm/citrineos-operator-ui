import { NextRequest, NextResponse } from 'next/server';

const API = process.env.VOLTSTATION_API_URL ?? 'http://65.0.157.6:3001/api/v1';
const KEY = process.env.VOLTSTATION_ADMIN_API_KEY ?? '';

const headers = () => ({ 'Content-Type': 'application/json', 'x-admin-key': KEY });

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${API}/admin/operators/${id}`, { headers: headers(), cache: 'no-store' });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const res = await fetch(`${API}/admin/operators/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
