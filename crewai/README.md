# Mapbox MCP + CrewAI Travel Planning Example

This example demonstrates how to integrate the Mapbox Model Context Protocol (MCP) server with CrewAI to create location-aware AI agents that can geocode addresses, calculate routes, and plan travel itineraries.

## What This Example Does

The example creates two specialized agents:
1. **Location Specialist**: Geocodes addresses and landmarks to precise coordinates
2. **Route Planner**: Calculates optimal routes and travel times

Together, they plan a day trip visiting four San Francisco attractions, determining the best route order and providing detailed directions.

## Prerequisites

- **Python 3.10+**
- **Node.js 20.6+** (for running the MCP server via npx)
- **uv** (Python package manager - recommended)
- **A Mapbox account** - [Sign up for free](https://account.mapbox.com/auth/signup/)
- **LLM API Key** - CrewAI requires an LLM. Options include:
  - OpenAI API key (default)
  - Anthropic (Claude) API key
  - Groq API key
  - Other providers supported by LiteLLM

## Setup Instructions

### 1. Install uv

If you don't have `uv` installed:

```bash
# On macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# On Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Or via pip
pip install uv
```

### 2. Clone/Download This Example

```bash
cd crewai
```

### 3. Install Dependencies

Using uv to create a virtual environment and install dependencies:

```bash
# Create virtual environment
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
uv pip install -r requirements.txt
```

Alternatively, if you prefer using pip:

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Copy the example environment file and add your API keys:

```bash
cp .env.example .env
```

Edit `.env` and add your tokens:

```bash
# Required: Your Mapbox access token
MAPBOX_ACCESS_TOKEN=pk.eyJ1...your_token_here

# Required: LLM API key (choose one)
OPENAI_API_KEY=sk-...your_key_here
# OR
# ANTHROPIC_API_KEY=sk-ant-...your_key_here
# OR
# GROQ_API_KEY=gsk_...your_key_here
```

**Getting your Mapbox token:**
1. Go to [https://account.mapbox.com/access-tokens/](https://account.mapbox.com/access-tokens/)
2. Create a new token or copy your default public token
3. The free tier is sufficient for this example

### 5. Run the Example

```bash
python travel_planner.py
```

## What You'll See

The script will:

1. Initialize the Mapbox MCP tools
2. Create the Location Specialist and Route Planner agents
3. Execute the geocoding task (finding coordinates for each attraction)
4. Execute the routing task (planning the optimal route)
5. Display the final travel plan with:
   - Ordered list of stops
   - Total distance and travel time
   - Turn-by-turn directions

Example output:

```
🗺️  Initializing Mapbox MCP tools...
✅ MCP tools initialized

👥 Creating agents...
✅ Agents created

📋 Setting up tasks...
✅ Tasks configured

🚀 Starting travel planning crew...

[Agent execution logs showing tool calls and reasoning...]

============================================================
🗺️  TRAVEL PLAN
============================================================
Here's your optimized San Francisco day trip:

1. Golden Gate Bridge (Start)
2. Golden Gate Park → 15 min, 3.2 miles
3. Fisherman's Wharf → 18 min, 4.5 miles
4. Alcatraz Ferry Terminal → 5 min, 0.8 miles

Total: 38 minutes, 8.5 miles

[Detailed turn-by-turn directions...]
============================================================
```

## Customizing the Example

### Change the Locations

Edit `travel_planner.py` and modify the `geocode_task` description:

```python
geocode_task = Task(
    description="""Find coordinates for:
    1. Your first location
    2. Your second location
    3. etc.
    """,
    agent=location_agent,
    expected_output="A list of locations with their coordinates",
)
```

### Add More Agents

Create specialized agents for different tasks:

```python
isochrone_tool = MCPTool(
    name="mapbox_isochrone",
    server_command="uvx mapbox-mcp",
    description="Calculate areas reachable within a time threshold"
)

service_agent = Agent(
    role="Service Area Analyst",
    goal="Determine reachable areas for service planning",
    backstory="You analyze geographic coverage and accessibility",
    tools=[geocode_tool, isochrone_tool],
    verbose=True,
)
```

### Use Different Transport Modes

The directions tool supports multiple profiles:
- `driving` (default)
- `walking`
- `cycling`
- `driving-traffic` (considers live traffic)

Specify in your task description:

```python
route_task = Task(
    description="""Plan a walking route visiting these locations...""",
    agent=route_agent,
    expected_output="Walking route with times and directions",
)
```

### Switch to Hosted MCP Server

Instead of running the MCP server locally, you can use Mapbox's hosted endpoint:

```python
geocode_tool = MCPTool(
    name="mapbox_geocode",
    # Replace server_command with server_url
    server_url="https://mcp.mapbox.com/mcp",
    description="Convert an address to coordinates",
)
```

See the [Hosted MCP Server Guide](https://github.com/mapbox/mcp-server) for configuration details.

## Troubleshooting

### "MAPBOX_ACCESS_TOKEN not found"

Make sure you've:
1. Created a `.env` file (not just `.env.example`)
2. Added your Mapbox token to the `.env` file
3. The token starts with `pk.` for public tokens

### "MCP server failed to start"

Ensure `uv` is installed and in your PATH:

```bash
uv --version
```

If not found, reinstall uv or try using `npx` instead:

```python
geocode_tool = MCPTool(
    name="mapbox_geocode",
    server_command="npx @mapbox/mcp-server-mapbox",
    description="...",
)
```

### "OpenAI API key not found" (or similar)

CrewAI needs an LLM to run. Add one of these to your `.env`:

```bash
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...
# OR
GROQ_API_KEY=gsk_...
```

### Rate Limiting

If you hit Mapbox API rate limits:
- The free tier allows 100,000 requests/month for geocoding
- 5,000 requests/month for directions
- Distance matrix counts as multiple requests (origins × destinations)

Consider adding delays between requests or upgrade your Mapbox plan.

## Available Mapbox MCP Tools

The Mapbox MCP server provides these tools:

| Tool | Description | Use Case |
|------|-------------|----------|
| `mapbox_geocode` | Convert addresses to coordinates | Find locations for routing |
| `mapbox_reverse_geocode` | Convert coordinates to addresses | Identify what's at a location |
| `mapbox_directions` | Calculate routes with turn-by-turn | Plan trips, commutes |
| `mapbox_distance_matrix` | Travel times between multiple points | Route optimization |
| `mapbox_isochrone` | Areas reachable in time/distance | Service area analysis |
| `mapbox_static_map` | Generate map images | Visualizations, reports |

## Learn More

- [Blog Post](../mapbox-mcp-crewai.md) - Full tutorial and explanation
- [Mapbox MCP Server](https://github.com/mapbox/mcp-server) - MCP server documentation
- [CrewAI Documentation](https://docs.crewai.com/) - Learn about multi-agent systems
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification

## License

This example is provided as-is for educational purposes. Refer to Mapbox's terms of service for API usage and CrewAI's license for framework usage.
