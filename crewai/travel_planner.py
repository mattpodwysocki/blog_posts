"""
Travel Planning Agent with Mapbox MCP and CrewAI

This example demonstrates how to integrate Mapbox's Model Context Protocol (MCP)
server with CrewAI to create location-aware agents that can geocode addresses,
calculate routes, and plan travel itineraries.
"""

import os
from dotenv import load_dotenv
from crewai import Agent, Task, Crew
from crewai.mcp import MCPServerStdio

# Load environment variables from .env file
load_dotenv()

# Verify Mapbox token is set
if not os.getenv("MAPBOX_ACCESS_TOKEN"):
    raise ValueError(
        "MAPBOX_ACCESS_TOKEN not found. Please set it in your .env file or environment."
    )

print("🗺️  Setting up Mapbox MCP server configuration...")

# Configure the Mapbox MCP server
# This will run locally and connect to Mapbox's cloud APIs
mapbox_mcp = MCPServerStdio(
    command="npx",
    args=["-y", "@mapbox/mcp-server"],
    env={"MAPBOX_ACCESS_TOKEN": os.getenv("MAPBOX_ACCESS_TOKEN")},
)

print("✅ MCP server configured\n")

# Create specialized agents
print("👥 Creating agents...")

location_agent = Agent(
    role="Location Specialist",
    goal="Accurately geocode addresses and identify geographic coordinates for any location",
    backstory="""You are an expert in geography and location services.
    You can find the precise coordinates for any address, landmark, or place name.
    You always verify locations and provide accurate latitude/longitude data in decimal degrees format.
    Use the search_and_geocode_tool to convert addresses to coordinates.""",
    mcps=[mapbox_mcp],
    verbose=True,
)

route_agent = Agent(
    role="Route Planner",
    goal="Calculate efficient routes and provide accurate travel time estimates",
    backstory="""You are a route optimization specialist.
    You calculate the best routes between locations, considering travel time,
    distance, and transportation mode. You provide clear directions and realistic time estimates.
    You convert times from seconds to minutes and distances from meters to miles or kilometers.
    Use directions_tool and matrix_tool to calculate routes.""",
    mcps=[mapbox_mcp],
    verbose=True,
)

print("✅ Agents created\n")

# Define the travel planning tasks
print("📋 Setting up tasks...")

geocode_task = Task(
    description="""Find the geographic coordinates for these San Francisco attractions:
    1. Golden Gate Bridge
    2. Fisherman's Wharf
    3. Alcatraz Island Ferry Terminal
    4. Golden Gate Park (main entrance)

    Provide the latitude and longitude for each location in decimal degrees format.""",
    agent=location_agent,
    expected_output="A list of locations with their precise coordinates (latitude and longitude)",
)

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
    context=[geocode_task],  # This task depends on the geocoding task
)

print("✅ Tasks configured\n")

# Create and run the crew
print("🚀 Starting travel planning crew...\n")
print("=" * 60)

travel_crew = Crew(
    agents=[location_agent, route_agent],
    tasks=[geocode_task, route_task],
    verbose=True,
)

# Execute the travel planning
result = travel_crew.kickoff()

# Display the final result
print("\n" + "=" * 60)
print("🗺️  TRAVEL PLAN")
print("=" * 60)
print(result)
print("=" * 60)
