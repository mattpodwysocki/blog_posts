import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  // Validate required parameters
  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/?error=missing_parameters', request.url)
    );
  }

  // Redirect to home page with code and state in URL fragment
  // Token exchange will happen client-side where we have access to localStorage
  const redirectUrl = new URL('/', request.url);
  redirectUrl.hash = `code=${code}&state=${state}`;

  return NextResponse.redirect(redirectUrl);
}
