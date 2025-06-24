import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Cancel meeting request body:', body);

    const response = await fetch('https://g2.pupa-ai.com/webhook/9cf764fa-8824-4a5e-827b-2b94e9667d5c', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    console.log('External cancel API response status:', response.status);

    const data = await response.json().catch((error) => {
      console.error('Failed to parse JSON response:', error);
      return { error: 'Failed to parse response' };
    });

    console.log('External cancel API response data:', data);

    return new NextResponse(JSON.stringify(data), { 
      status: response.status, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('Cancel meeting error:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
} 