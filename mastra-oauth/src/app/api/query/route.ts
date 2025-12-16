import { NextRequest, NextResponse } from 'next/server';
import { processNaturalLanguageQuery } from '@/lib/agent';

export async function POST(request: NextRequest) {
  try {
    const { query, accessToken } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 401 }
      );
    }

    const response = await processNaturalLanguageQuery(query, accessToken);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Natural language query error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process query' },
      { status: 500 }
    );
  }
}
