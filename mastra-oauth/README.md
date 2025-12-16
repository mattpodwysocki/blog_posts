# Washington, DC Interactive Tour Planner (OAuth Version)

A beautiful, interactive web application for planning your perfect Washington, DC tour. Built with [Mastra](https://mastra.ai/), [Next.js](https://nextjs.org/), and the **hosted** [Mapbox MCP Server](https://github.com/mapbox/mcp-server) using **OAuth authentication**.

![DC Tour Planner](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Mapbox](https://img.shields.io/badge/Mapbox-000000?style=for-the-badge&logo=mapbox&logoColor=white)
![OAuth](https://img.shields.io/badge/OAuth-2.0-green?style=for-the-badge)

## What's Different in This Version?

This example demonstrates **OAuth authentication** with the **hosted Mapbox MCP server**, as opposed to the local server approach in the main `mastra/` example.

### Key Differences:

| Feature | Local Server (`mastra/`) | OAuth Server (`mastra-oauth/`) |
|---------|--------------------------|--------------------------------|
| **MCP Server** | Local subprocess (`npx @mapbox/mcp-server`) | Hosted server (`https://mcp.mapbox.com/mcp`) |
| **Authentication** | Environment variable token | OAuth 2.0 flow |
| **Transport** | StdioClientTransport | SSEClientTransport |
| **User Login** | Not required | Required via Mapbox OAuth |
| **Best For** | Development, tutorials | Production, multi-user apps |
| **Setup Complexity** | Simple | Moderate (requires OAuth app) |

## Features

🔐 **OAuth Authentication** - Secure user login via Mapbox OAuth
🗺️ **Interactive Map** - Visualize your tour route on a beautiful Mapbox map
📍 **Smart Attraction Selection** - Choose from 8 iconic DC landmarks
🚶 **Optimized Routing** - Calculate the best walking route between attractions
⏱️ **Real-time Calculations** - See distance, duration, and turn-by-turn directions
🎨 **Modern UI** - Clean, responsive interface built with Tailwind CSS
🤖 **Hosted MCP** - Uses Mapbox's hosted MCP server for reliability

## Prerequisites

- **Node.js 20.6+** (LTS recommended)
- **npm** or **yarn** or **pnpm**
- **A Mapbox account** (free tier available) - [Sign up here](https://account.mapbox.com/auth/signup/)
- **OAuth Application** - You'll need to register an OAuth app in your Mapbox account

## Quick Start

### 1. Register OAuth Application

1. Go to your [Mapbox Account Dashboard](https://account.mapbox.com/)
2. Navigate to **OAuth Applications**
3. Click **Create Application**
4. Set the **Redirect URI** to: `http://localhost:3000/auth/callback`
5. Copy your **Client ID**

### 2. Install Dependencies

```bash
cd mastra-oauth
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Your OAuth Client ID from step 1
NEXT_PUBLIC_MAPBOX_OAUTH_CLIENT_ID=your_oauth_client_id_here

# OAuth redirect URI (must match OAuth app configuration)
NEXT_PUBLIC_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback

# Your Mapbox access token (for map rendering only)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
```

> **Note:** You need:
> - `NEXT_PUBLIC_MAPBOX_OAUTH_CLIENT_ID` - For OAuth authentication
> - `NEXT_PUBLIC_OAUTH_REDIRECT_URI` - Where users return after login
> - `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` - Only for frontend map rendering

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

## How to Use

1. **Click "Login with Mapbox"** - You'll be redirected to Mapbox to authorize
2. **Authorize the Application** - Grant access to use the MCP server
3. **Select Attractions** - Check the boxes for attractions you want to visit (minimum 2)
4. **Click "Plan Route"** - The app will calculate the optimal walking route
5. **View Your Route** - See numbered markers and the route drawn on the map
6. **Check Details** - View total distance, duration, and stop order in the sidebar
7. **Logout** - Click logout to clear your session

## OAuth Flow Explained

This application uses OAuth 2.0 Authorization Code flow:

```
1. User clicks "Login with Mapbox"
   ↓
2. App redirects to https://mcp.mapbox.com/oauth/authorize
   ↓
3. User authorizes the application
   ↓
4. Mapbox redirects back to /auth/callback with authorization code
   ↓
5. App exchanges code for access token
   ↓
6. Access token stored in sessionStorage
   ↓
7. App uses token to authenticate MCP requests
```

### Security Notes:

- Access tokens are stored in `sessionStorage` (cleared on tab close)
- Tokens are never sent to client-side code via query parameters
- OAuth state parameter prevents CSRF attacks
- SSE transport provides secure, server-sent events connection

## Project Structure

```
mastra-oauth/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── callback/
│   │   │   │       └── route.ts    # OAuth callback handler
│   │   │   └── plan/
│   │   │       └── route.ts        # Route planning API
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Main page with OAuth
│   │   └── globals.css             # Global styles
│   ├── components/
│   │   ├── DCMap.tsx               # Interactive Mapbox map
│   │   └── AttractionSelector.tsx # Checkbox list
│   ├── lib/
│   │   ├── mcp.ts                  # MCP client (SSE transport)
│   │   └── oauth.ts                # OAuth helpers
│   └── types/
│       └── index.ts                # TypeScript types
├── public/                         # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

## How It Works

### OAuth Authentication Flow

1. **User visits app** → Sees login screen
2. **Clicks "Login with Mapbox"** → Redirected to Mapbox OAuth
3. **Authorizes app** → Mapbox redirects to `/auth/callback` with code
4. **Code exchange** → Server exchanges code for access token
5. **Token storage** → Token stored in sessionStorage
6. **Authenticated** → User can now plan routes

### MCP Integration with OAuth

```typescript
// lib/mcp.ts
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const transport = new SSEClientTransport(
  new URL('https://mcp.mapbox.com/mcp'),
  {
    headers: {
      Authorization: `Bearer ${accessToken}`, // OAuth token
    },
  }
);
```

### API Routes

**`/api/auth/callback` (GET)**
- Receives authorization code from Mapbox
- Exchanges code for access token
- Redirects to home with token

**`/api/plan` (POST)**
- Receives: `{ attractions, accessToken }`
- Geocodes each attraction using OAuth token
- Calculates walking route
- Returns GeoJSON route data

## Comparison with Local Server

### When to Use OAuth (Hosted Server):

✅ **Multi-user applications** - Each user has their own token
✅ **Production deployments** - No need to manage MCP server process
✅ **Scalability** - Hosted server handles load
✅ **User-specific quotas** - Rate limits per user
✅ **Security** - No shared API keys

### When to Use Local Server:

✅ **Development** - Faster iteration, no OAuth setup
✅ **Tutorials** - Simpler to understand and follow
✅ **Single-user apps** - When multi-user auth isn't needed
✅ **Offline work** - Local server can work without internet (for some operations)

## Customization Ideas

### Add More Attractions

Edit `src/app/page.tsx` and add to the `DC_ATTRACTIONS` array:

```typescript
const DC_ATTRACTIONS: Attraction[] = [
  // ... existing attractions
  {
    id: 'your-attraction',
    name: 'Your Attraction Name',
    address: 'Full address in Washington DC'
  },
];
```

### Change Transportation Mode

Edit `src/lib/mcp.ts` in the `calculateRoute` function:

```typescript
const result = await client.callTool({
  name: 'directions_tool',
  arguments: {
    coordinates,
    profile: 'cycling', // or 'driving-traffic'
    // ... other args
  },
});
```

### Add Persistent Token Storage

Replace `sessionStorage` with a more persistent solution:

```typescript
// In src/lib/oauth.ts
export const tokenStorage = {
  set(token: string) {
    localStorage.setItem('mapbox_mcp_token', token); // Persists across sessions
    // Or use cookies for server-side access
  },
  // ...
};
```

### Add Token Refresh

Implement refresh token flow for long-lived sessions:

```typescript
async function refreshToken(refreshToken: string) {
  const response = await fetch('https://mcp.mapbox.com/oauth/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: OAUTH_CONFIG.clientId,
    }),
  });
  return response.json();
}
```

## Building for Production

```bash
# Build the app
npm run build

# Start production server
npm start
```

### Production Deployment Checklist:

- [ ] Update `NEXT_PUBLIC_OAUTH_REDIRECT_URI` to production URL
- [ ] Register production redirect URI in Mapbox OAuth app
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS (required for OAuth)
- [ ] Consider implementing refresh tokens
- [ ] Add error logging and monitoring

## Troubleshooting

### OAuth login fails

- Verify `NEXT_PUBLIC_MAPBOX_OAUTH_CLIENT_ID` is correct
- Check redirect URI matches exactly in OAuth app config
- Ensure you're using HTTPS in production (OAuth requirement)
- Check browser console for OAuth errors

### "Access token required" error

- Check that token is stored in sessionStorage
- Verify token isn't expired
- Try logging out and logging in again

### Map not displaying

- Check that `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is set in `.env`
- This is separate from OAuth token and needed for map rendering
- Verify the token starts with `pk.` (public token)

### Route planning fails

- Ensure you're logged in (OAuth token present)
- Check network tab for API errors
- Verify OAuth token hasn't expired
- Check server logs for MCP connection errors

## Learn More

### Documentation
- [Mapbox MCP Server](https://github.com/mapbox/mcp-server) - Official MCP server docs
- [OAuth 2.0 Specification](https://oauth.net/2/) - OAuth protocol details
- [Mastra](https://mastra.ai/docs) - TypeScript agent framework
- [Next.js](https://nextjs.org/docs) - React framework
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification

### Related Examples
- [Local Server Version](../mastra/) - Simpler setup without OAuth
- [CrewAI Example](../crewai/) - Python-based MCP integration

## Support

- **Email**: mcp-feedback@mapbox.com
- **Issues**: [GitHub Issues](https://github.com/mapbox/mcp-server/issues)
- **Mastra Community**: [Discord](https://discord.gg/mastra)

## License

MIT License - See LICENSE file for details

---

*Built with ❤️ using Mapbox MCP (OAuth), Mastra, and Next.js*
