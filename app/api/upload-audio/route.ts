import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Parse the incoming form data
  const formData = await req.formData();
  const file = formData.get('file');

  if (!file || typeof file === 'string') {
    return new NextResponse(JSON.stringify({ error: 'No file uploaded' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Forward the file to the real webhook as multipart/form-data
  const outForm = new FormData();
  outForm.append('file', file);

  const response = await fetch('https://g2.pupa-ai.com/form/a100ea76-2c51-419b-a50f-333a8919fad9', {
    method: 'POST',
    body: outForm,
  });

  const text = await response.text();
  return new NextResponse(text, { status: response.status, headers: { 'Content-Type': response.headers.get('content-type') || 'text/plain' } });
} 