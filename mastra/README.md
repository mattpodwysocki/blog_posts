# Washington, DC Interactive Tour Planner

A beautiful, interactive web application for planning your perfect Washington, DC tour. Built with [Mastra](https://mastra.ai/), [Next.js](https://nextjs.org/), and the [Mapbox MCP Server](https://github.com/mapbox/mcp-server).

![DC Tour Planner](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Mapbox](https://img.shields.io/badge/Mapbox-000000?style=for-the-badge&logo=mapbox&logoColor=white)

## Features

🗺️ **Interactive Map** - Visualize your tour route on a beautiful Mapbox map
📍 **Smart Attraction Selection** - Choose from 8 iconic DC landmarks
🚶 **Optimized Routing** - Calculate the best walking route between attractions
⏱️ **Real-time Calculations** - See distance, duration, and turn-by-turn directions
🎨 **Modern UI** - Clean, responsive interface built with Tailwind CSS
🤖 **AI-Powered** - Uses Mapbox MCP Server for intelligent location services

## What It Does

Select any combination of Washington, DC's most famous attractions:
- **White House** - The President's residence
- **Lincoln Memorial** - Iconic monument to Abraham Lincoln
- **Washington Monument** - 555-foot marble obelisk
- **US Capitol** - Home of Congress
- **Jefferson Memorial** - Beautiful memorial on the Tidal Basin
- **Air and Space Museum** - Smithsonian's most visited museum
- **Natural History Museum** - Dinosaurs, gems, and more
- **Vietnam Veterans Memorial** - Moving tribute to fallen soldiers

The app will:
1. **Geocode** each attraction to precise coordinates
2. **Calculate** the optimal walking route
3. **Display** the route visually on an interactive map
4. **Provide** distance, duration, and turn-by-turn directions

## Technology Stack

- **[Next.js 14](https://nextjs.org/)** - React framework with App Router
- **[React](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)** - Interactive maps
- **[react-map-gl](https://visgl.github.io/react-map-gl/)** - React wrapper for Mapbox
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS
- **[Mastra](https://mastra.ai/)** - TypeScript agent framework
- **[Mapbox MCP](https://github.com/mapbox/mcp-server)** - Model Context Protocol for location intelligence

## Prerequisites

- **Node.js 20.6+** (LTS recommended)
- **npm** or **yarn** or **pnpm**
- **A Mapbox account** (free tier available) - [Sign up here](https://account.mapbox.com/auth/signup/)
- **Your Mapbox access token** - Get it from your [account dashboard](https://account.mapbox.com/access-tokens/)

## Quick Start

### 1. Install Dependencies

```bash
cd mastra
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your Mapbox access token:

```env
MAPBOX_ACCESS_TOKEN=your_token_here
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_token_here
```

> **Note:** You need the same token in both variables:
> - `MAPBOX_ACCESS_TOKEN` - Used by the backend API to call MCP server
> - `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` - Used by the frontend to render the map

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

## How to Use

1. **Select Attractions** - Check the boxes for attractions you want to visit (minimum 2)
2. **Click "Plan Route"** - The app will calculate the optimal walking route
3. **View Your Route** - See numbered markers and the route drawn on the map
4. **Check Details** - View total distance, duration, and stop order in the sidebar

## Project Structure

```
mastra/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── plan/
│   │   │       └── route.ts      # API endpoint for route planning
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Main page with sidebar and map
│   │   └── globals.css           # Global styles
│   ├── components/
│   │   ├── DCMap.tsx             # Interactive Mapbox map component
│   │   └── AttractionSelector.tsx # Checkbox list for attractions
│   ├── lib/
│   │   └── mcp.ts                # MCP client setup and helpers
│   └── types/
│       └── index.ts              # TypeScript type definitions
├── public/                       # Static assets
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── next.config.js                # Next.js configuration
└── README.md                     # This file
```

## How It Works

### Frontend (Client-Side)

1. **User selects attractions** in the `AttractionSelector` component
2. **Clicks "Plan Route"** which sends a POST request to `/api/plan`
3. **Receives route data** including coordinates, route geometry, distance, and duration
4. **Displays on map** using `DCMap` component with Mapbox GL JS

### Backend (API Route)

1. **Receives attraction list** from the frontend
2. **Connects to Mapbox MCP Server** using the Model Context Protocol SDK
3. **Geocodes each attraction** using `search_and_geocode_tool`
4. **Calculates walking route** using `directions_tool`
5. **Returns formatted data** including GeoJSON route geometry

### MCP Integration

The app uses the Mapbox MCP Server for all location services:
- **No direct API calls** - Everything goes through the MCP protocol
- **Automatic tool discovery** - MCP client finds available Mapbox tools
- **Type-safe** - Full TypeScript support for requests and responses
- **Serverless-friendly** - Runs on Next.js API routes

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

Available profiles:
- `walking` (default)
- `cycling`
- `driving`
- `driving-traffic`

### Add Isochrone Visualization

Show 15-minute walking radius from a hotel:

```typescript
// In src/lib/mcp.ts, add:
export async function calculateIsochrone(
  coordinates: [number, number],
  minutes: number
) {
  const client = await getMCPClient();
  const result = await client.callTool({
    name: 'isochrone_tool',
    arguments: {
      coordinates,
      contours_minutes: [minutes],
      profile: 'walking',
    },
  });
  return JSON.parse(result.content[0].text);
}
```

Then display it on the map!

### Change Map Style

Edit `src/components/DCMap.tsx`:

```typescript
<Map
  mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
  // ... other props
>
```

Available styles:
- `streets-v12` (default)
- `outdoors-v12`
- `light-v11`
- `dark-v11`
- `satellite-v9`
- `satellite-streets-v12`

## Building for Production

```bash
# Build the app
npm run build

# Start production server
npm start
```

For deployment to Vercel, Netlify, or other platforms, set environment variables in your hosting dashboard.

## Troubleshooting

### Map not displaying

- Check that `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is set in `.env`
- Verify the token starts with `pk.` (public token)
- Clear browser cache and reload

### Route planning fails

- Check that `MAPBOX_ACCESS_TOKEN` is set in `.env`
- Ensure Node.js is 20.6+ (`node --version`)
- Check server logs for MCP connection errors

### TypeScript errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### MCP Connection Issues

The MCP server runs as a subprocess. If you see connection errors:
- Ensure `npx` is available (`npx --version`)
- Check that `@mapbox/mcp-server` can be downloaded
- Try running `npx -y @mapbox/mcp-server` manually to test

## Learn More

### Blog Posts
- [Introduction to Mapbox MCP Server](../mapbox-mcp-intro.md)
- [Building with CrewAI and Mapbox MCP](../mapbox-mcp-crewai-updated.md)

### Documentation
- [Mapbox MCP Server](https://github.com/mapbox/mcp-server) - Official MCP server docs
- [Mastra](https://mastra.ai/docs) - TypeScript agent framework
- [Next.js](https://nextjs.org/docs) - React framework
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) - Map rendering
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification

## Next Steps

- 🏨 **Add hotel selection** - Start your tour from any DC hotel
- 🚇 **Metro integration** - Show nearby Metro stations
- 🍽️ **Restaurant recommendations** - Find places to eat along your route
- 📸 **Photo spots** - Highlight best views and photo locations
- 🌤️ **Weather integration** - Check conditions before your tour
- 📱 **Mobile app** - Build with React Native using the same MCP backend

## Support

- **Email**: mcp-feedback@mapbox.com
- **Issues**: [GitHub Issues](https://github.com/mapbox/mcp-server/issues)
- **Mastra Community**: [Discord](https://discord.gg/mastra)

## License

MIT License - See LICENSE file for details

---

*Built with ❤️ using Mapbox MCP, Mastra, and Next.js*
