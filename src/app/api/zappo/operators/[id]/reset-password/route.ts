import { NextRequest, NextResponse } from 'next/server';

const API = process.env.ZAPPO_API_URL ?? 'http://65.0.157.6:3001/api/v1';
const KEY = process.env.ZAPPO_ADMIN_API_KEY ?? '';

const headers = () => ({ 'Content-Type': 'application/json', 'x-admin-key': KEY });

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${API}/admin/operators/${id}/reset-password`, {
    method: 'POST',
    headers: headers(),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
