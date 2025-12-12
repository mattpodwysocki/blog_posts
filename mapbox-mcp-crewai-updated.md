# Building Location-Aware Multi-Agent Systems with Mapbox MCP and CrewAI

Modern AI agents can write code, analyze data, and answer complex questions—but most can't tell you how long it takes to drive between two locations, calculate optimal delivery routes, or determine service coverage areas. In our [introduction to the Mapbox MCP Server](./mapbox-mcp-intro.md), we showed how the Model Context Protocol brings location intelligence to AI agents through a standardized interface.

In this tutorial, we'll put that power to work with **CrewAI**, one of the most popular frameworks for building multi-agent systems in Python. CrewAI excels at orchestrating multiple specialized agents that collaborate on complex tasks—perfect for location-based workflows that require geocoding, route planning, and spatial analysis working together.

## Why CrewAI for Location-Aware Agents?

CrewAI's architecture is particularly well-suited for geospatial tasks:

**Multi-Agent Collaboration**: Create specialized agents for different aspects of location intelligence—one for geocoding, one for routing, one for analysis. They share context and work together seamlessly.

**Role-Based Specialization**: Define clear roles like "Location Specialist" or "Route Optimizer" with specific goals and expertise, mirroring how location-based businesses actually work.

**Sequential and Parallel Processing**: Research multiple locations simultaneously, then calculate routes sequentially. CrewAI handles the orchestration.

**Task Dependencies**: Define workflows where route planning waits for geocoding to complete. CrewAI manages the dependency chain automatically.

**Native MCP Support**: As of version 0.80.0, CrewAI has built-in MCP integration through the `mcps` field on agents—no additional adapters needed.

## At a Glance: What You'll Build

By the end of this tutorial, you'll have a working multi-agent travel planner that:

- **Uses two specialized agents**: A Location Specialist for geocoding and a Route Planner for optimization
- **Handles natural language requests**: "Plan a day trip visiting Golden Gate Bridge, Fisherman's Wharf, Alcatraz Ferry Terminal, and Golden Gate Park"
- **Produces comprehensive plans**: Coordinates, optimal visit order, total distance, travel time, and turn-by-turn directions
- **Runs locally**: Complete code in the `crewai/` folder ready to customize

**What you'll learn:**
- Connecting CrewAI agents to the Mapbox MCP server
- Creating specialized location-aware agents
- Defining tasks with dependencies
- Natural language patterns that work best
- Advanced multi-agent patterns for complex workflows

## Prerequisites

Before we dive in, you'll need:

1. **Python 3.10+** installed
2. **Node.js LTS+** (for running the MCP server via npx)
3. **A Mapbox account** (free tier works great) - [Sign up here](https://account.mapbox.com/auth/signup/)
4. **Your Mapbox access token** - Find it in your [Mapbox account dashboard](https://account.mapbox.com/access-tokens/)
5. **An LLM API key** - CrewAI needs an LLM. Options: OpenAI (default), Anthropic, Groq, or others supported by LiteLLM

**Familiarity with:**
- Basic Python programming
- CrewAI concepts (agents, tasks, crews) - see [CrewAI docs](https://docs.crewai.com/) for an intro
- The [Mapbox MCP Server basics](./mapbox-mcp-intro.md) (recommended but not required)

## Quick MCP Setup

If you haven't already, set up your Mapbox access token:

```bash
export MAPBOX_ACCESS_TOKEN="your_token_here"
```

The Mapbox MCP Server will run automatically when your agents need it—no manual server management required. We'll use the published npm package via `npx`.

For a deep dive into the available tools and setup options, see our [Introduction to Mapbox MCP Server](./mapbox-mcp-intro.md).

## Installing CrewAI and Dependencies

Using uv (recommended):

```bash
uv pip install crewai crewai-tools mcp
```

Or with pip:

```bash
pip install crewai crewai-tools mcp
```

## Connecting CrewAI to Mapbox MCP

CrewAI's native MCP support makes integration straightforward. You configure the MCP server once, then add it to any agent that needs location intelligence.

You have two options: use Mapbox's hosted endpoint (easiest to get started) or run the MCP server locally (better for development).

### Option 1: Using the Hosted Server (Recommended for Quick Start)

The fastest way to get started is using Mapbox's hosted MCP endpoint:

```python
from crewai import Agent, Task, Crew
from crewai.mcp import MCPServerHTTP
import os

# Ensure your Mapbox token is set
os.environ["MAPBOX_ACCESS_TOKEN"] = "your_token_here"

# Configure the hosted Mapbox MCP server
mapbox_mcp = MCPServerHTTP(
    url="https://mcp.mapbox.com/mcp",
    headers={"Authorization": f"Bearer {os.environ['MAPBOX_ACCESS_TOKEN']}"},
)
```

**Pros:** No installation, no dependencies, always available, perfect for testing and prototyping.

### Option 2: Running the Local Server (For Development)

For local development, debugging, or customization, run the MCP server as a subprocess:

```python
from crewai import Agent, Task, Crew
from crewai.mcp import MCPServerStdio
import os

# Ensure your Mapbox token is set
os.environ["MAPBOX_ACCESS_TOKEN"] = "your_token_here"

# Configure the local Mapbox MCP server
# This tells CrewAI how to start the MCP server as a subprocess
mapbox_mcp = MCPServerStdio(
    command="npx",
    args=["-y", "@mapbox/mcp-server"],
    env={"MAPBOX_ACCESS_TOKEN": os.environ["MAPBOX_ACCESS_TOKEN"]},
)
```

**Pros:** Lower latency, full control, better for debugging, works offline (once packages are cached).

**Note:** The local approach requires Node.js LTS+ installed.

---

Either way, the MCP server will automatically expose all available Mapbox tools ([see full tool list](./mapbox-mcp-intro.md#core-tools)) to any agent that includes this configuration.

**For this tutorial, we'll use the local server** since it provides the best development experience and the code example is already configured for it. But feel free to swap in the hosted configuration—everything else works exactly the same!

## Building a Multi-Agent Travel Planner

Now let's build something practical: a travel planning system with two specialized agents working together.

### Creating Specialized Agents

CrewAI's strength is coordinating multiple agents with distinct roles:

```python
# Location Specialist Agent
location_agent = Agent(
    role="Location Specialist",
    goal="Accurately geocode addresses and identify geographic coordinates for any location",
    backstory="""You are an expert in geography and location services.
    You can find the precise coordinates for any address, landmark, or place name.
    You always verify locations and provide accurate latitude/longitude data.
    Use the search_and_geocode_tool to convert addresses to coordinates.""",
    mcps=[mapbox_mcp],
    verbose=True
)

# Route Planning Agent
route_agent = Agent(
    role="Route Planner",
    goal="Calculate efficient routes and provide accurate travel time estimates",
    backstory="""You are a route optimization specialist.
    You calculate the best routes between locations, considering travel time,
    distance, and transportation mode. You provide clear directions and realistic time estimates.
    Use directions_tool to calculate routes between locations.""",
    mcps=[mapbox_mcp],
    verbose=True
)
```

**Key points:**
- The `mcps` field gives each agent access to all Mapbox tools
- The `backstory` hints at which tools to use, but agents discover and choose tools automatically
- Both agents share the same `mapbox_mcp` configuration—no duplication needed
- `verbose=True` lets you see the agent's reasoning and tool calls

### Defining Tasks with Dependencies

Tasks define what each agent should accomplish:

```python
# Task 1: Geocode all the locations we want to visit
geocode_task = Task(
    description="""Find the geographic coordinates for these San Francisco attractions:
    1. Golden Gate Bridge
    2. Fisherman's Wharf
    3. Alcatraz Island Ferry Terminal
    4. Golden Gate Park (main entrance)

    Provide the latitude and longitude for each location in decimal degrees format.""",
    agent=location_agent,
    expected_output="A list of locations with their precise coordinates (latitude and longitude)"
)

# Task 2: Plan the route
route_task = Task(
    description="""Using the coordinates from the previous task, plan an efficient
    driving route that visits all four locations starting from the Golden Gate Bridge.

    Provide:
    1. The optimal order to visit locations
    2. Total travel time (in minutes)
    3. Total distance (in miles)
    4. Key turn-by-turn directions for each segment

    Consider that this is a day trip, so minimize total driving time.""",
    agent=route_agent,
    expected_output="A complete route plan with ordered stops, travel times, distances, and directions",
    context=[geocode_task]  # This task depends on the geocoding task
)
```

**Key points:**
- The `context` parameter creates a dependency—the Route Planner waits for the Location Specialist
- `expected_output` helps agents understand what format you want
- Natural language descriptions work best—be specific about what you need

### Running the Crew

Bring it all together:

```python
# Create the crew
travel_crew = Crew(
    agents=[location_agent, route_agent],
    tasks=[geocode_task, route_task],
    verbose=True
)

# Execute the travel planning
result = travel_crew.kickoff()

print("\n" + "="*50)
print("TRAVEL PLAN")
print("="*50)
print(result)
```

### What You'll See

When you run this code, you'll observe:

1. The **Location Specialist** activating the `search_and_geocode_tool` for each attraction
2. Structured output with precise coordinates
3. The **Route Planner** receiving that data and using `directions_tool`
4. A final plan with:
   - Optimal visit order
   - Total distance and time
   - Turn-by-turn directions for each segment

The agents collaborate automatically—no manual data passing required.

## Complete Working Example

The `crewai/` folder contains a complete, runnable example. Here's the full code:

```python
from crewai import Agent, Task, Crew
from crewai.mcp import MCPServerStdio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Verify Mapbox token
if not os.getenv("MAPBOX_ACCESS_TOKEN"):
    raise ValueError("MAPBOX_ACCESS_TOKEN not found. Set it in your .env file.")

# Configure the Mapbox MCP server
mapbox_mcp = MCPServerStdio(
    command="npx",
    args=["-y", "@mapbox/mcp-server"],
    env={"MAPBOX_ACCESS_TOKEN": os.getenv("MAPBOX_ACCESS_TOKEN")},
)

# Create agents
location_agent = Agent(
    role="Location Specialist",
    goal="Accurately geocode addresses and identify geographic coordinates",
    backstory="""You are an expert in geography and location services.
    You can find precise coordinates for any address, landmark, or place name.
    Use the search_and_geocode_tool to convert addresses to coordinates.""",
    mcps=[mapbox_mcp],
    verbose=True
)

route_agent = Agent(
    role="Route Planner",
    goal="Calculate efficient routes and provide accurate travel time estimates",
    backstory="""You are a route optimization specialist.
    You calculate the best routes between locations considering travel time and distance.
    Use directions_tool to calculate routes.""",
    mcps=[mapbox_mcp],
    verbose=True
)

# Create tasks
geocode_task = Task(
    description="""Find the geographic coordinates for these San Francisco attractions:
    1. Golden Gate Bridge
    2. Fisherman's Wharf
    3. Alcatraz Island Ferry Terminal
    4. Golden Gate Park

    Provide the latitude and longitude for each location.""",
    agent=location_agent,
    expected_output="A list of locations with their coordinates"
)

route_task = Task(
    description="""Using the coordinates from the previous task, plan an efficient
    driving route that visits all four locations starting from the Golden Gate Bridge.

    Provide:
    1. The optimal order to visit locations
    2. Total travel time
    3. Total distance
    4. Key directions for each segment""",
    agent=route_agent,
    expected_output="A complete route plan with stops, times, distances, and directions",
    context=[geocode_task]
)

# Create and run the crew
travel_crew = Crew(
    agents=[location_agent, route_agent],
    tasks=[geocode_task, route_task],
    verbose=True
)

result = travel_crew.kickoff()

print("\n" + "="*50)
print("TRAVEL PLAN")
print("="*50)
print(result)
```

### Running the Example

```bash
cd crewai
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -r requirements.txt

# Create .env file with your tokens
cp .env.example .env
# Edit .env and add MAPBOX_ACCESS_TOKEN and OPENAI_API_KEY

python travel_planner.py
```

See the `crewai/README.md` for complete setup instructions and troubleshooting.

## Natural Language Patterns That Work

The power of MCP is that agents interpret natural language and choose the right tools. Here are proven patterns:

### Location Discovery
- "Find coffee shops within walking distance of the Empire State Building"
- "Show me gas stations along the route from Boston to New York"
- "What's the address at coordinates 37.7749, -122.4194?"

### Navigation & Travel
- "Get driving directions from LAX to Hollywood with current traffic"
- "How long would it take to walk from Central Park to Times Square?"
- "What's the fastest route visiting Salesforce Tower, Twitter HQ, and Uber HQ?"

### Analysis & Planning
- "Show me areas reachable within 30 minutes of downtown Portland by car"
- "Calculate travel time matrix between 3 hotels and the convention center"
- "I'm staying at the Fairmont. Show me everywhere I can reach by walking in 15 minutes"

### Agent Capabilities

Agents automatically:
- **Infer transportation modes** from context ("drive" → driving, "walk" → walking)
- **Chain tools together** (geocode addresses, then calculate routes)
- **Handle errors gracefully** (retry with different queries if geocoding fails)
- **Format coordinates** properly for API calls
- **Parse and summarize results** in readable format

## Advanced Multi-Agent Patterns

Once you have the basics working, here are patterns to explore:

### 1. Multi-Agent Specialization

Create more specialized agents for complex workflows:

```python
# Geocoding specialist
geocoder_agent = Agent(
    role="Geocoding Specialist",
    goal="Convert any address or place name to precise coordinates",
    backstory="Expert in address lookup and coordinate validation",
    mcps=[mapbox_mcp],
    verbose=True
)

# Route optimizer
optimizer_agent = Agent(
    role="Route Optimizer",
    goal="Find the most efficient routes considering time and distance",
    backstory="Specialist in logistics and route optimization using matrix_tool",
    mcps=[mapbox_mcp],
    verbose=True
)

# Map visualizer
visualizer_agent = Agent(
    role="Map Visualizer",
    goal="Create visual map representations",
    backstory="Expert in cartography using static_image_tool",
    mcps=[mapbox_mcp],
    verbose=True
)
```

### 2. Parallel Research

Research multiple cities simultaneously:

```python
research_task = Task(
    description="""Research these three cities and find:
    - Top 3 attractions in each
    - Coordinates for each attraction
    - Brief description

    Cities: Seattle, Portland, Vancouver""",
    agent=location_agent,
    expected_output="Structured list of attractions with coordinates for all three cities"
)
```

CrewAI can parallelize independent sub-tasks automatically.

### 3. Service Area Analysis

Use isochrone tool for coverage analysis:

```python
service_agent = Agent(
    role="Service Area Analyst",
    goal="Determine which areas can be served based on travel time constraints",
    backstory="""You analyze geographic coverage and accessibility for service planning.
    Use isochrone_tool to calculate reachable areas and search_and_geocode_tool to find locations.""",
    mcps=[mapbox_mcp],
    verbose=True
)

coverage_task = Task(
    description="""We have a delivery hub at 1355 Market St, San Francisco.
    Calculate and describe the area we can serve with:
    - 15-minute driving radius
    - 30-minute driving radius

    Which major neighborhoods fall within each zone?""",
    agent=service_agent,
    expected_output="Service coverage analysis with neighborhood breakdown"
)
```

**Use cases:**
- Delivery service coverage areas
- Emergency response zones
- Restaurant delivery ranges
- Real estate commute analysis

### 4. Visual Output with Static Maps

Generate shareable visualizations:

```python
map_agent = Agent(
    role="Map Visualizer",
    goal="Create clear visual representations of locations and routes",
    backstory="""You generate map images that make geographic data easy to understand.
    Use static_image_tool to create visual map outputs.""",
    mcps=[mapbox_mcp],
    verbose=True
)

visualization_task = Task(
    description="""Create a map showing:
    - Our office location (marker at 37.7749, -122.4194)
    - Client locations (markers at 37.7849, -122.4094 and 37.7649, -122.4294)
    - Routes between them

    Save the map image as office-client-map.png""",
    agent=map_agent,
    expected_output="Map image file path and description"
)
```

**Use cases:**
- Route visualizations for sharing
- Location previews in reports
- Automated map exports
- Embedding maps in emails/PDFs

### 5. Real-World Data Integration

Combine Mapbox MCP with other data sources:

```python
analyst_agent = Agent(
    role="Location Analyst",
    goal="Combine location data with business intelligence",
    backstory="You integrate geographic analysis with business data",
    mcps=[mapbox_mcp],
    tools=[database_tool, analytics_tool],  # Add other tools
    verbose=True
)

analysis_task = Task(
    description="""For each of our 5 store locations:
    1. Geocode the address
    2. Calculate 10-minute drive-time area
    3. Query our customer database for customers in that area
    4. Provide count and demographics

    Store addresses: [list of addresses]""",
    agent=analyst_agent,
    expected_output="Store coverage analysis with customer counts"
)
```

## Best Practices

### 1. Handle API Rate Limits

The Mapbox free tier is generous, but be mindful:

- **Geocoding**: 100,000 requests/month
- **Directions**: 5,000 requests/month
- **Matrix**: Counts as origins × destinations requests

```python
# For distance matrix, limit batch sizes
# Instead of 50 × 50 (2,500 requests), use 10 × 10 (100 requests)
```

### 2. Cache Geocoding Results

If geocoding the same addresses repeatedly:

```python
# Add caching in your workflow
geocode_cache = {}

def get_or_geocode(address):
    if address in geocode_cache:
        return geocode_cache[address]
    # Let agent geocode...
    geocode_cache[address] = result
    return result
```

### 3. Provide Context to Agents

Help agents understand formats and units:

```python
backstory="""You work with coordinates in decimal degrees (e.g., 37.7749, -122.4194).
Travel times are in seconds, distances in meters. Always convert to human-readable formats
like minutes and miles/kilometers."""
```

### 4. Use Clear Expected Outputs

Define structured output expectations:

```python
expected_output="""Return a JSON-like structure with:
{
  "locations": [{"name": "...", "lat": ..., "lon": ...}],
  "route": {"distance_km": ..., "duration_minutes": ..., "steps": [...]}
}"""
```

### 5. Monitor Agent Reasoning

Use `verbose=True` during development to see:
- Which tools agents choose
- How they interpret your instructions
- What data they pass between tools
- Where they might be struggling

## Troubleshooting

### MCP Server Not Starting
- Ensure Node.js is installed: `node --version`
- Verify npx works: `npx --version`
- Check your Mapbox token is set: `echo $MAPBOX_ACCESS_TOKEN`

### Tools Not Being Called
- Make sure tool descriptions are specific in the backstory
- Verify the agent's goal aligns with using location tools
- Check that `mcps=[mapbox_mcp]` is included
- Use `verbose=True` to see agent reasoning

### Incorrect Results
- Addresses must be specific (include city/state/country)
- Coordinate ordering is latitude, longitude (not lon, lat)
- Review actual tool calls in verbose output

### Rate Limiting
- Monitor your Mapbox dashboard for usage
- Implement caching for repeated queries
- Batch operations when possible
- Consider upgrading Mapbox plan for production

## What We Built

In this tutorial, we created a location-aware multi-agent system using CrewAI and Mapbox MCP that can:

✅ **Geocode addresses** and landmarks to precise coordinates
✅ **Calculate optimal routes** between multiple locations
✅ **Estimate accurate travel times** and distances
✅ **Collaborate seamlessly** with task dependencies
✅ **Handle natural language** requests without explicit programming
✅ **Generate visual outputs** with static maps
✅ **Analyze service areas** with isochrone calculations

The key insight: By using MCP, we added powerful location capabilities without writing any custom API integration code. Our agents interact with Mapbox services through the same standardized interface they use for everything else.

## Next Steps

### Extend Your Implementation
- Add more specialized agents (visualizer, analyst, optimizer)
- Implement parallel processing for multiple locations
- Integrate with your business data sources
- Add caching and error handling for production

### Explore Other Frameworks
This is part of our series on integrating Mapbox MCP with agent frameworks. Coming soon:
- **Pydantic AI**: Type-safe location intelligence with Python's newest agent framework
- **Smolagents**: Lightweight location-aware agents with Hugging Face's simple framework
- **Mastra**: Bringing location intelligence to TypeScript agents in production

### Learn More
- [Mapbox MCP Server Intro](./mapbox-mcp-intro.md) - Deep dive into available tools
- [Mapbox MCP Server GitHub](https://github.com/mapbox/mcp-server) - Source code and docs
- [CrewAI Documentation](https://docs.crewai.com/) - Learn more about multi-agent systems
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification
- [Example Code](https://github.com/mapbox/mcp-server/tree/ai_poland/examples/crewai) - Official CrewAI examples

Ready to build location-intelligent agents? The code is in the `crewai/` folder—customize it for your use case!

---

*Have questions or built something cool with Mapbox MCP and CrewAI? Share your experience at mcp-feedback@mapbox.com or open an issue on [GitHub](https://github.com/mapbox/mcp-server/issues).*
