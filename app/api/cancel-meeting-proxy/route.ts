import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const response = await fetch('https://g2.pupa-ai.com/webhook/9cf764fa-8824-4a5e-827b-2b94e9667d5c', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return new NextResponse(JSON.stringify(data), { status: response.status, headers: { 'Content-Type': 'application/json' } });
} 