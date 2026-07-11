import { NextRequest, NextResponse } from 'next/server';
import { getAdminProxyHeaders } from '@lib/server/admin-proxy-headers';

const API = process.env.ZAPPO_API_URL ?? 'http://65.0.157.6:3001/api/v1';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${API}/admin/operators/${id}`, { headers: await getAdminProxyHeaders(), cache: 'no-store' });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const res = await fetch(`${API}/admin/operators/${id}`, {
    method: 'PATCH',
    headers: await getAdminProxyHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${API}/admin/operators/${id}`, {
    method: 'DELETE',
    headers: await getAdminProxyHeaders(),
  });
  if (res.status >= 400) {
    const data = await res.json().catch(() => ({ message: 'Failed to delete operator' }));
    return NextResponse.json(data, { status: res.status });
  }
  return new NextResponse(null, { status: res.status });
}
