import { NextRequest, NextResponse } from 'next/server';
import { categorySearch } from '@/lib/mcp';

export async function POST(request: NextRequest) {
  try {
    const { category, proximity, accessToken } = await request.json();

    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 401 }
      );
    }

    const results = await categorySearch(category, proximity, accessToken);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Category search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to search' },
      { status: 500 }
    );
  }
}
