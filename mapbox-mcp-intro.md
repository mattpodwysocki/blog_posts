# Introducing the Mapbox MCP Server: Location Intelligence for AI Agents

AI agents are getting smarter every day—they can write code, analyze data, and answer complex questions. But when it comes to understanding *where* things are, most agents hit a wall. They can tell you about restaurants in San Francisco, but they can't geocode an address, calculate a route, or determine if two locations are within walking distance.

That's where the **Mapbox Model Context Protocol (MCP) Server** comes in. It gives AI agents access to Mapbox's powerful location services through a simple, standardized interface. No custom API integration required—just connect your agent to the MCP server, and it can instantly geocode addresses, plan routes, analyze travel times, and create maps.

## What is the Model Context Protocol (MCP)?

The [Model Context Protocol](https://modelcontextprotocol.io/) is an open standard created by Anthropic for connecting AI models to external tools and data sources. Think of it as USB for AI agents—a universal connector that works across different frameworks and platforms.

Instead of writing custom code to integrate with each API, you:
1. Connect your agent to an MCP server
2. The server exposes its tools in a standardized format
3. Your agent can discover and use those tools automatically

MCP is supported by popular frameworks like CrewAI, LangGraph, Pydantic AI, and Mastra, as well as by AI assistants like Claude Desktop.

## What Does the Mapbox MCP Server Provide?

The Mapbox MCP Server exposes nine powerful geospatial tools that give your agents comprehensive location intelligence.

> **Note:** Mapbox also offers the [DevKit MCP Server](https://github.com/mapbox/mcp-devkit-server) (hosted at `https://mcp-devkit.mapbox.com`), which is designed to help developers *build* Mapbox applications by providing code examples, documentation search, and development assistance. This post focuses on the main MCP server for location intelligence. We'll cover the DevKit in a future post.

### Core Tools

| Tool | Purpose | Example Use |
|------|---------|-------------|
| **search_and_geocode_tool** | Convert addresses/places to coordinates | "Find coordinates for '1600 Pennsylvania Ave, Washington DC'" |
| **reverse_geocoding_tool** | Convert coordinates to addresses | "What's the address at 38.8977, -77.0365?" |
| **directions_tool** | Calculate routes between points | "Driving directions from Boston to New York with traffic" |
| **matrix_tool** | Travel times between multiple points | "Calculate delivery times from 3 warehouses to 10 addresses" |
| **isochrone_tool** | Areas reachable within time/distance | "Show everywhere I can drive in 30 minutes from downtown" |
| **static_image_tool** | Generate map images | "Create a map showing my delivery route" |
| **category_search_tool** | Find POIs by category | "Find all museums near Central Park" |
| **resource_reader_tool** | Access reference data | "Get list of available POI categories" |

### What Makes These Tools Special

**Unified Search & Geocoding**: The `search_and_geocode_tool` consolidates forward geocoding and POI search into one powerful tool. It handles everything from "123 Main St" to "Starbucks near Times Square" to "Eiffel Tower."

**Traffic-Aware Routing**: The `directions_tool` supports real-time traffic data, alternative routes, and can optimize for different transportation modes (driving, walking, cycling).

**Multi-Point Optimization**: The `matrix_tool` efficiently calculates travel times between dozens of locations—essential for logistics, delivery planning, and service area analysis.

**Reachability Analysis**: The `isochrone_tool` generates polygons showing areas reachable within specific time or distance thresholds—perfect for analyzing coverage areas, commute zones, or delivery ranges.

**Visual Output**: The `static_image_tool` creates customizable map images with markers, routes, and overlays—great for reports, notifications, or sharing with users.

## Getting Started: Setup Options

You have two ways to use the Mapbox MCP Server:

### Option 1: Hosted Server (Easiest to Get Started)

Mapbox provides a hosted MCP endpoint at **`https://mcp.mapbox.com/mcp`** that's always available—no installation required!

**Authentication:**
- **Interactive clients** (Claude Desktop, VS Code): Uses OAuth flow with browser-based login
- **Programmatic access**: Uses Bearer token authentication with your Mapbox access token

**Setup:**

For interactive tools like Claude Desktop, VS Code, or Cursor, add this to your MCP settings (typically in `settings.json` or similar config file):

```json
{
  "mcpServers": {
    "mapbox": {
      "url": "https://mcp.mapbox.com/mcp"
    }
  }
}
```

**For Claude Desktop specifically**, the config file is located at:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

The first time you connect, a browser window will open asking you to log in to your Mapbox account and authorize access via OAuth.

**For programmatic access** (like in agent frameworks), you'll need:
- A Mapbox account (free tier available) - [Sign up here](https://account.mapbox.com/auth/signup/)
- Your Mapbox access token from [your account dashboard](https://account.mapbox.com/access-tokens/)

Then use Bearer token authentication in your code (see framework-specific tutorials for examples).

Check the [Hosted MCP Server Guide](https://github.com/mapbox/mcp-server/blob/main/docs/hosted-mcp-guide.md) for detailed setup instructions for different clients.

**Pros:**
- No local setup or dependencies required
- Managed infrastructure by Mapbox
- Always available
- Automatic updates
- Perfect for getting started quickly

**Cons:**
- Additional network hop (your machine → hosted MCP → Mapbox APIs)
- Requires stable internet connection
- Less control over configuration

### Option 2: Local Server (For Development & Customization)

Run the MCP server as a local process on your machine. This gives you full control and is ideal for development, debugging, or customization.

**Prerequisites:**
- Node.js LTS+ (for npx method) OR Python 3.10+ with uv (for uvx method)
- A Mapbox account (free tier available) - [Sign up here](https://account.mapbox.com/auth/signup/)
- Your Mapbox access token from [your account dashboard](https://account.mapbox.com/access-tokens/)

**Setup:**

For interactive tools like Claude Desktop, VS Code, or Cursor, add this to your MCP settings:

```json
{
  "mcpServers": {
    "mapbox": {
      "command": "npx",
      "args": ["-y", "@mapbox/mcp-server"],
      "env": {
        "MAPBOX_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

**For Claude Desktop specifically**, the config file is located at:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**For command-line testing**, you can run the server directly:

```bash
# Set your access token
export MAPBOX_ACCESS_TOKEN="your_token_here"

# Run with npx (recommended)
npx -y @mapbox/mcp-server

# OR run with uvx (Python users)
pip install uv
uvx mapbox-mcp
```

**Test it with MCP Inspector:**

```bash
npx @modelcontextprotocol/inspector npx -y @mapbox/mcp-server
```

This opens a web interface where you can explore available tools and test them interactively.

**Pros:**
- Full control over the server process
- Lower latency (direct connection to Mapbox APIs)
- Works with any Mapbox token
- Can customize or extend if needed
- Better for development and debugging

**Cons:**
- Requires Node.js or Python tooling
- Server process management
- Must ensure dependencies are installed

## Example Use Cases and Prompts

Once connected, your agents can handle natural language requests like these:

### Location Discovery
- "Find coffee shops within walking distance of the Empire State Building"
- "Show me gas stations along the route from Boston to New York"
- "What restaurants are near Times Square?"

### Navigation & Travel
- "Get driving directions from LAX to Hollywood with current traffic"
- "How long would it take to walk from Central Park to Times Square?"
- "Calculate travel time from my hotel (Four Seasons) to JFK Airport by taxi"
- "What's the fastest route visiting Salesforce Tower, Twitter HQ, and Uber headquarters?"

### Visualization & Maps
- "Create a map image showing the route from Golden Gate Bridge to Fisherman's Wharf"
- "Show me a satellite view of Manhattan with key landmarks marked"
- "Generate a map highlighting all Starbucks locations within a mile of downtown Seattle"

### Analysis & Planning
- "Show me areas reachable within 30 minutes of downtown Portland by car"
- "Calculate a travel time matrix between 3 hotel locations and the convention center"
- "Find the optimal route visiting 3 tourist attractions in San Francisco"
- "I'm staying at the Fairmont. Show me everywhere I can reach by walking in 15 minutes"

### Behind the Scenes

When you ask: *"How long does it take to drive from the Space Needle to Pike Place Market?"*

The agent automatically:
1. Uses `search_and_geocode_tool` to find Space Needle coordinates
2. Uses `search_and_geocode_tool` to find Pike Place Market coordinates
3. Calls `directions_tool` with driving profile
4. Returns: "約 8 minutes, 1.2 miles"

No manual API calls, no coordinate formatting, no error handling—the agent figures it all out.

## Supported Frameworks and Tools

The Mapbox MCP Server works with any MCP-compatible client, including:

### AI Agent Frameworks
- **CrewAI** (Python) - Multi-agent collaboration
- **LangGraph** (Python) - Stateful agent workflows
- **Pydantic AI** (Python) - Type-safe agent development
- **Mastra** (TypeScript) - Production AI applications
- **Smolagents** (Python) - Lightweight agents from Hugging Face

### Development Tools
- **Claude Desktop** - Anthropic's AI assistant
- **ChatGPT** - OpenAI's desktop application
- **Gemini CLI** - Google's command-line tool
- **VS Code** - Via MCP extensions
- **Cursor** - AI-powered IDE
- **Goose** - Terminal-based AI assistant

### Integration Approaches

Each framework has slightly different integration patterns, but they all follow the same basic flow:

1. Configure the MCP server connection
2. Add the configuration to your agent
3. The agent automatically discovers available tools
4. Use natural language to invoke tools

We'll be publishing detailed tutorials for each major framework. Stay tuned for:
- **CrewAI**: Building multi-agent location-aware systems
- **Pydantic AI**: Type-safe location intelligence
- **Smolagents**: Lightweight location-enabled agents
- **Mastra**: Production TypeScript agents with Mapbox

## Key Advantages of Using MCP

**No Custom API Integration**: Traditional approach requires writing geocoding logic, formatting coordinates, handling errors, chaining API calls. With MCP, you just describe what you want in natural language.

**Automatic Tool Discovery**: The MCP server exposes its tools in a standardized format. Your agent discovers available tools automatically—no manual configuration of each tool.

**Framework Agnostic**: Write once, use everywhere. The same Mapbox MCP server works with CrewAI, LangGraph, Claude Desktop, and any other MCP-compatible client.

**Natural Language Interface**: Agents interpret your task descriptions and choose the right tools. Say "plan a route visiting three restaurants" and the agent figures out it needs to geocode, then calculate directions, then optimize the order.

**Intelligent Tool Chaining**: Agents understand dependencies between tools. They know addresses must be geocoded before calculating routes, and they handle this automatically.

## Real-World Applications

### Travel & Hospitality
- Hotel concierge bots that provide directions and local recommendations
- Trip planning assistants that optimize multi-stop itineraries
- Event coordinators calculating travel times for attendees

### Logistics & Delivery
- Route optimization for delivery fleets
- Service area analysis for expansion planning
- Warehouse location analysis based on customer distribution

### Real Estate
- Commute time calculators for property listings
- School district and amenity proximity analysis
- Neighborhood boundary visualization

### Field Services
- Technician dispatch optimization
- Service area coverage analysis
- Emergency response time calculations

### Location-Based Marketing
- Store locators with accurate directions
- Coverage area mapping for service offerings
- Competitive location analysis

## Getting Help and Resources

### Documentation
- [Mapbox MCP Server GitHub](https://github.com/mapbox/mcp-server) - Source code and documentation
- [Hosted MCP Server Guide](https://github.com/mapbox/mcp-server/blob/main/docs/hosted-mcp-guide.md) - Setup for different clients
- [Model Context Protocol Spec](https://modelcontextprotocol.io/) - MCP standard documentation
- [Mapbox API Docs](https://docs.mapbox.com/api/) - Underlying API reference

### Support
- **Email**: mcp-feedback@mapbox.com
- **Issues**: [GitHub Issues](https://github.com/mapbox/mcp-server/issues)
- **Community**: Join discussions in the MCP community

## Pricing and Rate Limits

The Mapbox MCP Server uses your Mapbox account and access token. Pricing follows standard Mapbox API rates:

- **Geocoding**: 100,000 requests/month free
- **Directions**: 5,000 requests/month free
- **Matrix**: Counts as multiple requests (origins × destinations)
- **Static Maps**: 50,000 requests/month free

The free tier is generous for development and small projects. For production use, check [Mapbox pricing](https://www.mapbox.com/pricing/) for details.

## Next Steps

Ready to add location intelligence to your AI agents?

1. **Sign up for Mapbox**: Get your free access token at [mapbox.com/signup](https://account.mapbox.com/auth/signup/)
2. **Try the MCP Inspector**: Test the server and explore available tools
3. **Pick a framework**: Start with CrewAI, LangGraph, or your preferred agent framework
4. **Build something**: Check out our framework-specific tutorials (coming soon!)

In our next post, we'll dive deep into building a multi-agent travel planning system with CrewAI and Mapbox MCP, complete with working code you can run and customize.

**Also coming soon:** A guide to the [Mapbox DevKit MCP Server](https://github.com/mapbox/mcp-devkit-server), which helps AI assistants write Mapbox code by providing documentation, examples, and API guidance—perfect for developers building Mapbox applications.

---

*Have questions or want to share what you're building? Reach out to mcp-feedback@mapbox.com or open an issue on [GitHub](https://github.com/mapbox/mcp-server/issues).*
