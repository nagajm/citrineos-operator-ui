import { NextRequest, NextResponse } from 'next/server';
import { getAdminProxyHeaders } from '@lib/server/admin-proxy-headers';

const API = process.env.ZAPPO_API_URL ?? 'http://65.0.157.6:3001/api/v1';

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await req.json();
  const res = await fetch(`${API}/admin/users/${id}`, {
    method: 'PATCH', headers: await getAdminProxyHeaders(), body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const res = await fetch(`${API}/admin/users/${id}`, {
    method: 'DELETE', headers: await getAdminProxyHeaders(),
  });
  return new NextResponse(null, { status: res.status });
}