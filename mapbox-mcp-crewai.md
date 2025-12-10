# Bringing Location Intelligence to Your Agent with Mapbox MCP and CrewAI

*Part 1 of our series on integrating Mapbox MCP with popular agent frameworks*

Modern AI agents are getting smarter at understanding text, answering questions, and even writing code. But when it comes to understanding *where* things are—geocoding addresses, calculating routes, or analyzing geographic relationships—most agents hit a wall. That's where the Mapbox Model Context Protocol (MCP) server comes in.

In this series, we'll explore how to integrate location intelligence into agents built with different frameworks. We're starting with **CrewAI**, one of the most popular frameworks for building multi-agent systems in Python. In upcoming posts, we'll cover pydantic-ai, smolagents, and mastra for TypeScript users.

## What is Mapbox MCP?

The Model Context Protocol (MCP) is an open standard for connecting AI models to external tools and data sources. The Mapbox MCP server provides your agents with powerful location capabilities through a standardized interface:

- **Geocoding**: Convert addresses to coordinates and vice versa
- **Directions**: Calculate routes between points with turn-by-turn instructions
- **Distance Matrix**: Compute travel times and distances between multiple locations
- **Isochrone**: Generate areas reachable within a time or distance threshold
- **Static Maps**: Create map visualizations of locations and routes

Instead of writing custom API integration code, your agent can use these capabilities through MCP's standardized tool-calling interface.

## Why Location Intelligence Matters

Think about real-world use cases for AI agents:
- A travel assistant that plans optimal routes between attractions
- A logistics agent that calculates delivery times and service areas
- A real estate bot that analyzes property locations and commute times
- A field service scheduler that assigns technicians based on geography

Without location awareness, these agents can only offer generic advice. With Mapbox MCP, they can provide specific, actionable insights based on real geographic data.

## At a Glance: What You'll Learn

By the end of this tutorial, you'll know how to:

- **Run the Mapbox MCP server** locally via npx or connect to the hosted endpoint at `https://mcp.mapbox.com/mcp`
- **Integrate MCP with CrewAI** using simple Python configuration—no custom API wrappers needed
- **Build a multi-agent travel planner** that can:
  - Geocode addresses and landmarks to precise coordinates
  - Calculate optimal routes between multiple locations
  - Estimate travel times and distances
  - Generate static map visualizations
- **Leverage natural language processing** where agents automatically discover and chain Mapbox tools based on your task descriptions

We'll build a working example (included in the `crewai/` folder) that you can run and customize for your own projects.

## Prerequisites

Before we dive in, you'll need:

1. **Python 3.10+** installed
2. **Node.js 20.6+** (for running the MCP server via npx)
3. **A Mapbox account** (free tier works great) - [Sign up here](https://account.mapbox.com/auth/signup/)
4. **Your Mapbox access token** - Find it in your [Mapbox account dashboard](https://account.mapbox.com/access-tokens/)

## Setting Up Mapbox MCP

You have two options for using the Mapbox MCP server: running it locally or connecting to a hosted instance. We'll focus on the local approach, which gives you full control and is the most common setup.

### Option 1: Local MCP Server (Recommended)

Run the MCP server as a local process on your machine. This is what we'll use throughout this post.

The Mapbox MCP server is published as an npm package, so you can run it directly with `npx` (no installation needed):

```bash
# Node.js/npm approach (recommended)
# The -y flag auto-accepts the package installation
npx -y @mapbox/mcp-server
```

Alternatively, if you prefer Python tooling, you can use `uvx`:

```bash
# Python/uv approach
pip install uv
uvx mapbox-mcp
```

The Mapbox MCP server needs your access token. Set it as an environment variable:

```bash
export MAPBOX_ACCESS_TOKEN="your_access_token_here"
```

To verify the server works, you can test it with the MCP Inspector:

```bash
# Using the published npm package (recommended)
npx @modelcontextprotocol/inspector npx -y @mapbox/mcp-server

# OR using uvx (if you installed mapbox-mcp via pip)
npx @modelcontextprotocol/inspector uvx mapbox-mcp
```

This will open a web interface where you can explore the available tools and test them interactively.

**Pros of local:**
- Full control over the server process
- Lower latency (direct connection: your machine → Mapbox APIs)
- Works with any Mapbox token
- Can customize or extend the server if needed

**Cons of local:**
- Need to install dependencies (uv or Node.js)
- Server starts/stops with your agent

### Option 2: Hosted MCP Server

Mapbox provides a hosted MCP endpoint for quick access without local setup:

**Endpoint:** `https://mcp.mapbox.com/mcp`

The hosted server uses **OAuth authentication**. When you connect for the first time, a browser window will open asking you to log in to your Mapbox account and authorize access. This provides secure, token-based authentication without needing to manage access tokens manually.

For CrewAI with programmatic access (using an access token), you can use `MCPServerHTTP`:

```python
from crewai.mcp import MCPServerHTTP

mapbox_mcp = MCPServerHTTP(
    url="https://mcp.mapbox.com/mcp",
    headers={"Authorization": f"Bearer {os.environ['MAPBOX_ACCESS_TOKEN']}"},
)
```

**Note:** The hosted server supports both OAuth (for interactive clients) and Bearer token authentication (for programmatic access). For interactive tools like Claude Desktop, the OAuth flow provides a better user experience.

Then use it the same way in your agents with the `mcps` field. Check the [Hosted MCP Server Guide](https://github.com/mapbox/mcp-server/blob/main/docs/hosted-mcp-guide.md) for detailed setup instructions for different clients.

**Pros of hosted:**
- No local setup or dependency installation required
- Managed infrastructure maintained by Mapbox
- Always available
- Good for quick prototyping or testing

**Cons of hosted:**
- Additional network hop (your machine → hosted MCP → Mapbox APIs)
- Less control over the server configuration
- Dependent on hosted service availability

**Note:** Both approaches require a stable internet connection since the MCP server calls Mapbox's cloud APIs for geocoding, directions, and other services. The difference is whether the MCP server itself runs on your machine or on Mapbox's infrastructure.

For the rest of this tutorial, we'll use the **local approach** with `uvx mapbox-mcp`, as it's the most flexible and widely supported option.

## Understanding the Mapbox Tools

The Mapbox MCP server exposes several tools your agent can use:

| Tool | Purpose | Example Use |
|------|---------|-------------|
| `search_and_geocode_tool` | Convert address/place to coordinates | "Find lat/lon for '1600 Amphitheatre Parkway, Mountain View, CA'" |
| `reverse_geocoding_tool` | Convert coordinates to address | "What's the address at 37.4220, -122.0841?" |
| `directions_tool` | Get route between points | "Driving directions from SF to LA" |
| `matrix_tool` | Calculate travel times for multiple locations | "Travel times between 5 warehouses and 10 delivery addresses" |
| `isochrone_tool` | Calculate reachable area | "Show everywhere I can drive to in 30 minutes" |
| `static_image_tool` | Generate map image | "Create a map showing this route" |
| `category_search_tool` | Search for POI categories | "Find all museums near downtown" |

These tools return structured data that your agent can interpret and use for reasoning.

## Building a Travel Planning Agent with CrewAI

Now let's build something practical: a travel planning assistant that can geocode locations, calculate routes, and estimate travel times.

### Installing CrewAI

Using uv (recommended):

```bash
uv pip install crewai crewai-tools mcp
```

Or with pip:

```bash
pip install crewai crewai-tools mcp
```

### Connecting CrewAI to MCP

CrewAI has native MCP support through the `mcps` field on agents. You configure the MCP server once, then add it to your agents:

```python
from crewai import Agent, Task, Crew
from crewai.mcp import MCPServerStdio
import os

# Ensure your Mapbox token is set
os.environ["MAPBOX_ACCESS_TOKEN"] = "your_token_here"

# Configure the Mapbox MCP server
# This tells CrewAI how to start the MCP server as a subprocess
mapbox_mcp = MCPServerStdio(
    command="npx",
    args=["-y", "@mapbox/mcp-server"],
    env={"MAPBOX_ACCESS_TOKEN": os.environ["MAPBOX_ACCESS_TOKEN"]},
)
```

That's it! The MCP server will automatically expose all available Mapbox tools (geocoding, directions, distance matrix, etc.) to any agent that uses this configuration.

### Creating Location-Aware Agents

CrewAI's strength is coordinating multiple specialized agents. Let's create a crew with two agents:

1. **Location Specialist**: Handles geocoding and geographic lookups
2. **Route Planner**: Calculates optimal routes and travel times

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

Notice how both agents share the same `mapbox_mcp` configuration - the MCP server automatically exposes all its tools to any agent that includes it.

### Creating Tasks

Now let's define tasks for our agents. In this example, we'll plan a day trip visiting multiple locations:

```python
# Task 1: Geocode all the locations we want to visit
geocode_task = Task(
    description="""Find the geographic coordinates for these San Francisco attractions:
    1. Golden Gate Bridge
    2. Fisherman's Wharf
    3. Alcatraz Island Ferry Terminal
    4. Golden Gate Park

    Provide the latitude and longitude for each location.""",
    agent=location_agent,
    expected_output="A list of locations with their precise coordinates (latitude and longitude)"
)

# Task 2: Plan the route
route_task = Task(
    description="""Using the coordinates from the previous task, plan an efficient
    driving route that visits all four locations starting from the Golden Gate Bridge.

    Provide:
    1. The optimal order to visit locations
    2. Total travel time
    3. Total distance
    4. Key turn-by-turn directions for each segment

    Consider that this is a day trip, so minimize total driving time.""",
    agent=route_agent,
    expected_output="A complete route plan with ordered stops, travel times, distances, and directions",
    context=[geocode_task]  # This task depends on the geocoding task
)
```

### Running the Crew

Finally, let's create and run our crew:

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

### Complete Example

Here's the full working code you can run (also available in the `crewai/` folder):

```python
from crewai import Agent, Task, Crew
from crewai.mcp import MCPServerStdio
import os

# Set your Mapbox access token
os.environ["MAPBOX_ACCESS_TOKEN"] = "your_token_here"

# Configure the Mapbox MCP server
mapbox_mcp = MCPServerStdio(
    command="npx",
    args=["-y", "@mapbox/mcp-server"],
    env={"MAPBOX_ACCESS_TOKEN": os.environ["MAPBOX_ACCESS_TOKEN"]},
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

### What You'll See

When you run this code, you'll see:

1. The **Location Specialist** using the geocoding tool to find coordinates for each attraction
2. The **Route Planner** using the directions tool to calculate optimal routes
3. A final travel plan with ordered stops, estimated times, and turn-by-turn directions

The agents collaborate automatically—the Route Planner waits for the Location Specialist to finish before calculating routes with the precise coordinates.

## What Makes MCP Special: Natural Language Queries

One of the most powerful aspects of using MCP is that your agents can interpret natural language queries and intelligently choose which tools to use. You don't need to specify exact API calls—just describe what you want.

### Example Prompts That Work Great

Here are real-world prompts you can use with your location-aware agents, along with what happens behind the scenes.

**Location Discovery:**

**1. Vague Address Queries**
```
Prompt: "How long does it take to drive from the Space Needle to Pike Place Market?"

What happens:
→ Agent geocodes "Space Needle" to coordinates
→ Agent geocodes "Pike Place Market" to coordinates
→ Agent calls directions API with driving profile
→ Returns: "约 8 minutes, 1.2 miles"
```

The beauty: You didn't provide exact addresses or coordinates. The agent figured it out.

**2. Multi-Step Planning**
```
Prompt: "I'm staying at the Fairmont in San Francisco. Show me everywhere
I can reach by walking in 15 minutes."

What happens:
→ Agent geocodes "Fairmont San Francisco"
→ Agent calls isochrone API with walking profile, 15 minutes
→ Returns polygon showing reachable area + notable locations within it
```

**3. Comparison Queries**
```
Prompt: "Which Starbucks location is closer to Union Square: the one on
Powell Street or the one on Market Street?"

What happens:
→ Agent geocodes "Union Square, San Francisco"
→ Agent geocodes "Starbucks, Powell Street, San Francisco"
→ Agent geocodes "Starbucks, Market Street, San Francisco"
→ Agent calls distance matrix or directions for both
→ Returns comparison with distances
```

**4. Complex Multi-Stop Routes**
```
Prompt: "I need to visit three offices today: Salesforce Tower, Twitter HQ,
and Uber headquarters. What's the fastest route if I'm starting from Oracle Park?"

What happens:
→ Agent geocodes all four locations
→ Agent tries different route orderings using directions API
→ Returns optimal order with total time and turn-by-turn directions
```

**5. Reverse Geocoding for Context**
```
Prompt: "What neighborhood is at coordinates 37.7749, -122.4194?"

What happens:
→ Agent calls reverse_geocode with coordinates
→ Returns: "Civic Center, San Francisco, CA"
```

### Natural Language Features That Shine

**Transportation Mode Inference**
Your agent can infer the transportation mode from context:
- "drive to..." → driving profile
- "walk to..." → walking profile
- "bike from..." → cycling profile

**Implicit Geocoding**
No need to say "first geocode this address, then...". The agent understands that addresses need to be converted to coordinates before calculating routes.

**Smart Defaults**
Agents can apply reasonable defaults:
- Assumes current location if not specified (in context-aware apps)
- Defaults to driving if mode not mentioned
- Uses optimal settings for each tool

### Tool Chaining Without Explicit Instructions

The real magic of MCP is how agents chain tools together without you specifying each step. Here's an example task:

```python
Task(
    description="""I need to deliver packages to three addresses:
    1. 123 Main St, Portland, OR
    2. 456 Oak Ave, Portland, OR
    3. 789 Pine Rd, Portland, OR

    Starting from 100 SW 5th Ave, Portland, what's the total delivery time
    and which address should I visit first to minimize drive time?""",
    agent=route_agent,
    expected_output="Optimal delivery order with total time"
)
```

**What the agent does automatically:**
1. Geocodes all four addresses (origin + 3 destinations)
2. Uses distance_matrix to calculate all possible route times
3. Compares different orderings
4. Selects the fastest route
5. Uses directions API to get detailed route
6. Returns comprehensive answer with reasoning

You didn't tell it to do any of those steps—it figured them out based on the goal.

### Compound Queries That Showcase MCP Power

These examples show scenarios where multiple Mapbox tools work together:

**Service Area Analysis**
```python
Task(
    description="""Our new coffee shop is opening at 500 Howard St, San Francisco.
    Show me:
    1. All areas within a 10-minute walk
    2. Competing coffee shops within that area
    3. Residential density in the reachable zone

    Should we expect good foot traffic?""",
    agent=location_analyst,
    expected_output="Service area analysis with foot traffic assessment"
)
```

The agent uses: isochrone → geocoding for competitors → potentially static maps for visualization

**Event Planning**
```python
Task(
    description="""We're hosting a conference at Moscone Center. We have
    attendees coming from these hotels:
    - Marriott Marquis
    - Hilton Union Square
    - Palace Hotel

    For each hotel, provide walking directions and estimated walk time.
    Also create a map showing all hotels and the venue.""",
    agent=event_planner,
    expected_output="Walking directions for each hotel with map"
)
```

The agent uses: geocoding → directions (walking) for each hotel → static_map with all locations

**Real Estate Analysis**
```python
Task(
    description="""Analyze this property: 2000 Broadway, San Francisco.

    How long is the commute to:
    - Financial District (Montgomery St BART)
    - Salesforce Tower
    - Golden Gate Park

    Use both driving and public transit for comparison.""",
    agent=real_estate_agent,
    expected_output="Commute analysis with multiple destinations and modes"
)
```

The agent uses: geocoding → directions with different profiles (driving vs walking to transit)

### Why This Matters vs Direct API Calls

If you were calling the Mapbox API directly, you'd need to:
1. Write geocoding logic for every address
2. Parse responses and extract coordinates
3. Format coordinates for the directions API
4. Handle errors and retries
5. Chain API calls in the right order
6. Format results for readability

**With MCP, you just describe what you want.** The agent:
- Interprets the natural language
- Chooses the right tools
- Chains calls in the correct order
- Handles coordinate formatting automatically
- Presents results in a readable format

That's the power of combining location intelligence with agent reasoning.

## Advanced Patterns

Once you have the basics working, here are some patterns to explore:

### 1. Multi-Agent Specialization

Create more specialized agents:
- **Time Optimizer**: Uses distance matrix to compare multiple route options
- **Area Analyst**: Uses isochrone to determine service areas
- **Visualizer**: Uses static maps to create visual outputs

### 2. Dynamic Tool Selection

Let agents choose which Mapbox tool to use based on the query:

```python
explorer_agent = Agent(
    role="Location Explorer",
    goal="Answer any location-based questions using appropriate tools",
    backstory="""You are a versatile location intelligence expert who selects the right tool for each query.
    You have access to geocoding, directions, distance matrix, and isochrone tools.""",
    mcps=[mapbox_mcp],
    verbose=True
)
```

The agent will automatically use whichever Mapbox tool (geocode, directions, distance_matrix, isochrone, etc.) is most appropriate for the task.

### 3. Isochrone Analysis for Service Areas

The isochrone tool is particularly powerful for understanding reachability:

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

Use cases:
- Delivery service coverage areas
- Emergency response zones
- Restaurant delivery ranges
- Real estate "commute shed" analysis

### 4. Visual Output with Static Maps

Create shareable map visualizations:

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

The static map tool is great for:
- Generating shareable route visualizations
- Creating location previews for reports
- Building automated map exports for presentations
- Embedding maps in emails or PDFs

### 5. Real-World Data Integration

Combine Mapbox MCP with other data sources:
- Geocode business addresses, then analyze with demographic data
- Calculate routes, then check weather conditions along the way
- Find reachable areas, then identify businesses within them
- Generate maps, then embed in automated reports

## Best Practices

**1. Handle API Rate Limits**
The Mapbox free tier has generous limits, but be mindful with distance matrix calls (which can make many API requests):

```python
# For distance matrix, limit the number of locations
# Instead of 50 origins × 50 destinations (2,500 requests)
# Use 10 × 10 (100 requests) and batch if needed
```

**2. Cache Geocoding Results**
If you're geocoding the same addresses repeatedly, cache the results:

```python
# Simple caching pattern
geocode_cache = {}

def cached_geocode(address):
    if address not in geocode_cache:
        # Use the geocode tool
        geocode_cache[address] = result
    return geocode_cache[address]
```

**3. Provide Context to Agents**
Help agents understand coordinate format and units:

```python
backstory="""You work with coordinates in decimal degrees (e.g., 37.7749, -122.4194).
Travel times are in seconds, distances in meters. Always convert to human-readable formats."""
```

**4. Use Expected Outputs**
Give agents clear output expectations to ensure structured results:

```python
expected_output="""Return a JSON object with:
{
  "locations": [{"name": "...", "lat": ..., "lon": ...}],
  "route": {"distance_km": ..., "duration_minutes": ..., "steps": [...]}
}"""
```

## Troubleshooting

**MCP Server Not Starting**
- Ensure `uv` is installed: `pip install uv`
- Verify your Mapbox token is set: `echo $MAPBOX_ACCESS_TOKEN`
- Check the token has the necessary scopes in your Mapbox account

**Tools Not Being Called**
- Make sure tool descriptions are clear and specific
- Verify the agent's goal aligns with using location tools
- Use `verbose=True` to see the agent's reasoning

**Incorrect Results**
- Check coordinate ordering (latitude, longitude not longitude, latitude)
- Verify addresses are specific enough (include city/state/country)
- Review the actual tool calls in verbose output

## What We Built

In this post, we created a location-aware multi-agent system using CrewAI and Mapbox MCP. Our agents can:
- ✅ Geocode addresses and landmarks to precise coordinates
- ✅ Calculate optimal routes between multiple locations
- ✅ Estimate accurate travel times and distances
- ✅ Collaborate to solve complex travel planning problems

The key insight: By using MCP, we added powerful location capabilities without writing any custom API integration code. Our agents interact with Mapbox services through the same tool-calling interface they use for everything else.

## Coming Up Next

This is part 1 of our series on integrating Mapbox MCP with agent frameworks. In upcoming posts, we'll explore:

- **Pydantic AI**: Type-safe location intelligence with Python's newest agent framework
- **smolagents**: Lightweight location-aware agents with Hugging Face's simple framework
- **mastra**: Bringing location intelligence to TypeScript agents in production

Each framework has its own patterns and strengths. We'll show you how to leverage Mapbox MCP in each one.

## Resources

- [Mapbox MCP Server](https://github.com/mapbox/mcp-server-mapbox) - Official repository
- [CrewAI Documentation](https://docs.crewai.com/) - Learn more about multi-agent systems
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification and tools
- [Mapbox API Documentation](https://docs.mapbox.com/) - Deep dive into Mapbox capabilities

Ready to add location intelligence to your agents? Grab your Mapbox token and start building!

---

*Have questions or built something cool with Mapbox MCP? Share your experience in the comments below.*
