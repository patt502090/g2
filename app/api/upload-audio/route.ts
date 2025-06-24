import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Parse the incoming form data
    const formData = await req.formData();
    const file = formData.get('file');
    const meetingId = formData.get('meetingId');

    console.log('Upload audio request:', { 
      hasFile: !!file, 
      fileType: file instanceof File ? file.type : typeof file,
      meetingId: meetingId 
    });

    if (!file || typeof file === 'string') {
      return new NextResponse(JSON.stringify({ error: 'No file uploaded' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Forward the file to the real webhook as multipart/form-data
    const outForm = new FormData();
    outForm.append('file', file);

    // Construct URL with meetingId as query parameter
    const baseUrl = 'https://g2.pupa-ai.com/form/2b511dae-ba48-4060-b4bd-e703a5f39f00';
    const url = meetingId ? `${baseUrl}?meetingId=${meetingId}` : baseUrl;

    console.log('Sending request to:', url);

    const response = await fetch(url, {
      method: 'POST',
      body: outForm,
    });

    console.log('External API response status:', response.status);

    const text = await response.text();
    console.log('External API response text:', text.substring(0, 200) + '...');

    return new NextResponse(text, { 
      status: response.status, 
      headers: { 'Content-Type': response.headers.get('content-type') || 'text/plain' } 
    });
  } catch (error) {
    console.error('Upload audio error:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
} 