import { NextRequest, NextResponse } from 'next/server';

const API = process.env.ZAPPO_API_URL ?? 'http://65.0.157.6:3001/api/v1';
const KEY = process.env.ZAPPO_ADMIN_API_KEY ?? '';

type RouteContext = { params: Promise<{ path: string[] }> };

function upstream(path: string[], search: string): string {
  const base = `${API}/admin/crm/${path.join('/')}`;
  return search ? `${base}?${search}` : base;
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  const url = upstream(path, req.nextUrl.searchParams.toString());
  const res = await fetch(url, { headers: { 'x-admin-key': KEY }, cache: 'no-store' });

  // Binary response — stream through (images, PDFs, file downloads)
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    const body = await res.blob();
    const isImage = ct.startsWith('image/');
    const headers: Record<string, string> = { 'content-type': ct };
    const cd = res.headers.get('content-disposition');
    if (cd) headers['content-disposition'] = cd;
    else if (!isImage) headers['content-disposition'] = 'attachment';
    const cc = res.headers.get('cache-control');
    if (cc) headers['cache-control'] = cc;
    return new NextResponse(body, { status: res.status, headers });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  const url = upstream(path, req.nextUrl.searchParams.toString());
  const contentType = req.headers.get('content-type') ?? '';

  // Multipart (file upload) — stream body through unchanged
  if (contentType.includes('multipart/form-data')) {
    const body = await req.blob();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'x-admin-key': KEY, 'content-type': contentType },
      body,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  // JSON
  const body = await req.json();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-key': KEY },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  const url = upstream(path, req.nextUrl.searchParams.toString());
  const body = await req.json();
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-admin-key': KEY },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  const url = upstream(path, req.nextUrl.searchParams.toString());
  const res = await fetch(url, { method: 'DELETE', headers: { 'x-admin-key': KEY } });
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return new NextResponse(null, { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}