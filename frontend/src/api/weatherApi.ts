import axios from 'axios';

// Define the base URL for the backend API
// In development, this will likely be localhost:5000 or similar
// In production, this should be the URL of your deployed backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5090/api/weather';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface BackendWeatherResponse {
    localTime: string;
    name?: string;
    city?: string;
    country?: string;
    lat?: number;
    lon?: number;
    temp: number;
    humidity: number;
    wind: number;
    windDeg: number;
    weather?: string;
    desc?: string;
}

export const weatherApi = {
    // Get weather by coordinates
    getByCoordinates: async (lat: number, lon: number): Promise<BackendWeatherResponse> => {
        const response = await api.get<BackendWeatherResponse>('/by-coord', {
            params: { lat, lon },
        });
        return response.data;
    },

    // Get current weather by city
    getByCity: async (city: string): Promise<BackendWeatherResponse> => {
        const response = await api.get<BackendWeatherResponse>('/', {
            params: { city },
        });
        return response.data;
    },

    // Get global weather (auto-detect)
    getGlobalWeather: async (): Promise<BackendWeatherResponse> => {
        const response = await api.get<BackendWeatherResponse>('/global');
        return response.data;
    },

    // Get 5-day forecast by city
    getForecastByCity: async (city: string): Promise<any> => {
        const response = await api.get<any>('/forecast', {
            params: { city },
        });
        return response.data;
    },
};
