import config from "config/config";
import { fetch } from "./custom-fetch";

interface GoogleMapsApiLatLngResponse {
  results: {
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }[];
  status: string;
}

export enum GoogleApiErrorsEnum {
  ApiError = "ApiError",
  DataNotFound = "DataNotFound"
}

/**
 * Finds the latitude and longitude of an address
 */
export async function findLatLngFromAddress(address: string) {
  const encodedAddress = encodeURIComponent(address);
  const apiKey = config.GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    return [GoogleApiErrorsEnum.ApiError] as [GoogleApiErrorsEnum.ApiError];
  }

  const apiData = (await response.json()) as GoogleMapsApiLatLngResponse;

  if (apiData.status !== "OK") {
    return [GoogleApiErrorsEnum.ApiError] as [GoogleApiErrorsEnum.ApiError];
  }

  if (apiData.results.length === 0) {
    return [GoogleApiErrorsEnum.DataNotFound] as [GoogleApiErrorsEnum.DataNotFound];
  }

  return [
    null, 
    apiData.results[0].geometry.location
  ] as [
    null, 
    GoogleMapsApiLatLngResponse["results"][0]["geometry"]["location"]
  ];
}

interface GoogleMapsApiDistanceResponse {
  rows: {
    elements: {
      distance: {
        value: number // meters
      }
    }[]
  }[]
  status: string;
}

/**
 * Finds the distance in meters for two points
 * origin and destintion
 */
export async function findDrivingDistance(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) {
  const apiKey = config.GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&mode=driving&key=${apiKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    return [GoogleApiErrorsEnum.ApiError] as [GoogleApiErrorsEnum.ApiError];
  }

  const apiData = (await response.json()) as GoogleMapsApiDistanceResponse;

  if (apiData.status !== "OK") {
    return [GoogleApiErrorsEnum.ApiError] as [GoogleApiErrorsEnum.ApiError];
  }

  if (apiData.rows.length === 0) {
    return [GoogleApiErrorsEnum.DataNotFound] as [GoogleApiErrorsEnum.DataNotFound];
  }

  const distance = apiData.rows[0].elements[0].distance.value;

  return [null, distance] as [null, number];
}
