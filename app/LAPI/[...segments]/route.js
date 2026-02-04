import { NextResponse } from 'next/server';
import { handleUnvWebhook } from '@/app/lib/unvWebhook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const { ack, stored } = await handleUnvWebhook(request, request.nextUrl.pathname);

  if (!stored) {
    console.log(`ℹ️ UNV callback acknowledged on ${request.nextUrl.pathname}`);
  }

  return NextResponse.json(ack);
}

export async function GET() {
  return NextResponse.json({ ok: true, message: 'UNV LAPI callback route is active' });
}
