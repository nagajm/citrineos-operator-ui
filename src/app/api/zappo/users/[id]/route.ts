import { NextRequest, NextResponse } from 'next/server';

const API = process.env.ZAPPO_API_URL ?? process.env.VOLTSTATION_API_URL ?? 'http://65.0.157.6:3001/api/v1';
const KEY = process.env.ZAPPO_ADMIN_API_KEY ?? process.env.VOLTSTATION_ADMIN_API_KEY ?? '';
const headers = () => ({ 'Content-Type': 'application/json', 'x-admin-key': KEY });

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await req.json();
  const res = await fetch(`${API}/admin/users/${id}`, {
    method: 'PATCH', headers: headers(), body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const res = await fetch(`${API}/admin/users/${id}`, {
    method: 'DELETE', headers: headers(),
  });
  return new NextResponse(null, { status: res.status });
}