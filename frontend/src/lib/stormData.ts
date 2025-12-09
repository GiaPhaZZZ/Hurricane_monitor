// lib/stormData.ts

export type StormCategory = "Áp thấp nhiệt đới" | "Bão cấp 1" | "Bão cấp 2" | "Bão cấp 3" | "Bão cấp 4" | "Siêu bão";

export type StormStatus = "active" | "developing" | "dissipated";

export interface StormPoint {
    timestamp: number;
    lat: number;
    lng: number;
    windSpeed: number;
    pressure: number;
    category: string;
}

export interface StormDataRow {
    id: string;
    latitude: string;
    longitude: string;
}

export interface PredictionResult {
    storm_id: string;
    storm_name: string;
    prediction_time: string;
    totalDistance: number;
    actualDistance: number;
    lifespan: number;
    forecastHours: number;
    forecast: StormPoint[];
    // Legacy support
    path?: StormPoint[];
}

export interface Storm {
    id: string;
    nameVi: string;
    nameInt: string;
    status: StormStatus;
    lastPointTime: number;
    currentPosition: StormPoint;
    historical: StormPoint[];
    forecast: StormPoint[];
    maxWindKmh: number;
    _timelineMetadata?: {
        isHistorical: boolean;
        isForecast: boolean;
        interpolated: boolean;
        stormStartTime: number;
        stormEndTime: number;
    };
}

export function getCategoryColor(category: string): string {
    switch (category) {
        case "Áp thấp nhiệt đới":
            return "#4CAF50";
        case "Bão cấp 1":
            return "#2196F3";
        case "Bão cấp 2":
            return "#FFC107";
        case "Bão cấp 3":
            return "#FF9800";
        case "Bão cấp 4":
            return "#F44336";
        case "Siêu bão":
            return "#9C27B0";
        default:
            return "#607D8B";
    }
}