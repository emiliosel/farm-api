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
interface GoogleMapsApiDistanceResponse {
  rows: {
    elements: {
      distance: {
        value: number; // meters
      };
    }[];
  }[];
  status: string;
}

export class GeoService {
  /**
   * Finds the latitude and longitude of an address
   */
  public async findLatLngFromAddress(address: string) {
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

    try {
      return [
        null, 
        apiData.results[0].geometry.location
      ] as [
        null, 
        GoogleMapsApiLatLngResponse["results"][0]["geometry"]["location"]
      ];
    } catch (er) {
      return [GoogleApiErrorsEnum.DataNotFound] as [GoogleApiErrorsEnum.DataNotFound];
    }
  }

  /**
   * Finds the distance in meters for two points
   * origin and destintion
   */
  public async findDrivingDistance(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) {
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

    try {
      const distance = apiData.rows[0].elements[0].distance.value;

      return [null, distance] as [null, number];

    } catch (er) {
      return [GoogleApiErrorsEnum.DataNotFound] as [GoogleApiErrorsEnum.DataNotFound];
    }
  }
}
