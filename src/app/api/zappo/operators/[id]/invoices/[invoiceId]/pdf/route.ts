import { NextRequest, NextResponse } from 'next/server';
import { getAdminProxyHeaders } from '@lib/server/admin-proxy-headers';

const API = process.env.ZAPPO_API_URL ?? 'http://65.0.157.6:3001/api/v1';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; invoiceId: string }> },
) {
  const { id, invoiceId } = await params;
  const res = await fetch(`${API}/admin/operators/${id}/invoices/${invoiceId}/pdf`, {
    headers: await getAdminProxyHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: 'Failed to generate invoice PDF' }));
    return NextResponse.json(data, { status: res.status });
  }
  const buffer = await res.arrayBuffer();
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': res.headers.get('content-disposition') ?? 'attachment; filename="invoice.pdf"',
    },
  });
}
