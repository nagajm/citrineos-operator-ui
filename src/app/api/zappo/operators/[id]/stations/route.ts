import { NextRequest, NextResponse } from 'next/server';
import { getAdminProxyHeaders } from '@lib/server/admin-proxy-headers';

const API = process.env.ZAPPO_API_URL ?? 'http://65.0.157.6:3001/api/v1';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${API}/admin/operators/${id}/stations`, { headers: await getAdminProxyHeaders(), cache: 'no-store' });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { stationId } = await _req.json();
  const res = await fetch(`${API}/admin/operators/${id}/stations/${stationId}`, {
    method: 'POST',
    headers: await getAdminProxyHeaders(),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { stationId } = await _req.json();
  const res = await fetch(`${API}/admin/operators/${id}/stations/${stationId}`, {
    method: 'DELETE',
    headers: await getAdminProxyHeaders(),
  });
  return new NextResponse(null, { status: res.status });
}
