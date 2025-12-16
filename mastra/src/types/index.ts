export interface Attraction {
  id: string;
  name: string;
  address: string;
}

export interface Location {
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
}

export interface RouteData {
  locations: Location[];
  route: GeoJSON.Feature<GeoJSON.LineString>;
  distance: number; // in miles
  duration: number; // in minutes
}
