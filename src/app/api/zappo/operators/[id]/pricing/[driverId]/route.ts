import { NextResponse } from 'next/server';
import { getAdminProxyHeaders } from '@lib/server/admin-proxy-headers';

const API = process.env.ZAPPO_API_URL ?? 'http://65.0.157.6:3001/api/v1';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; driverId: string }> }) {
  const { id, driverId } = await params;
  const res = await fetch(`${API}/admin/operators/${id}/pricing/${driverId}`, {
    headers: await getAdminProxyHeaders(),
    cache: 'no-store',
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
