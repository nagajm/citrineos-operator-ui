import { NextRequest, NextResponse } from 'next/server';

const API = process.env.ZAPPO_API_URL ?? 'http://65.0.157.6:3001/api/v1';
const KEY = process.env.ZAPPO_ADMIN_API_KEY ?? '';

const headers = () => ({ 'Content-Type': 'application/json', 'x-admin-key': KEY });

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${API}/admin/operators/${id}/stations`, { headers: headers(), cache: 'no-store' });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { stationId } = await _req.json();
  const res = await fetch(`${API}/admin/operators/${id}/stations/${stationId}`, {
    method: 'POST',
    headers: headers(),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { stationId } = await _req.json();
  const res = await fetch(`${API}/admin/operators/${id}/stations/${stationId}`, {
    method: 'DELETE',
    headers: headers(),
  });
  return new NextResponse(null, { status: res.status });
}
