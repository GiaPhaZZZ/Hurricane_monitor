import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "../hooks/use-toast";
import { Trash2, Plus } from "lucide-react";
import { type PredictionResult } from "../lib/stormData";

interface Position {
  id: number;
  lat: string;
  lng: string;
}

interface StormPredictionFormProps {
  onPredictionResult: (result: PredictionResult) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const StormPredictionForm: React.FC<StormPredictionFormProps> = ({
  onPredictionResult,
  setIsLoading,
}) => {
  const { showToast } = useToast();
  const [stormName, setStormName] = useState("");
  const [positions, setPositions] = useState<Position[]>([
    { id: 1, lat: "", lng: "" }
  ]);
  const [nextId, setNextId] = useState(2);

  const handleAddPosition = () => {
    setPositions([...positions, { id: nextId, lat: "", lng: "" }]);
    setNextId(nextId + 1);
  };

  const handleRemovePosition = (id: number) => {
    if (positions.length > 1) {
      setPositions(positions.filter(p => p.id !== id));
    }
  };

  const handlePositionChange = (id: number, field: 'lat' | 'lng', value: string) => {
    setPositions(positions.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const validPositions = positions.filter(p => p.lat.trim() && p.lng.trim());
  const validCount = validPositions.length;

  const handleSubmit = async () => {
    // 1. Validate data
    if (validCount < 9) {
      showToast("error", `Need at least 9 positions. You have ${validCount} valid positions.`);
      return;
    }

    // 2. Parse positions
    const history = validPositions.map(p => ({
      lat: parseFloat(p.lat),
      lng: parseFloat(p.lng)
    }));

    // Check for invalid numbers
    if (history.some(p => isNaN(p.lat) || isNaN(p.lng))) {
      showToast("error", "Invalid coordinates. Please check your input.");
      return;
    }

    setIsLoading(true);
    console.log("🚀 Running prediction with", history.length, "positions...");

    try {
      const payload = {
        history,
        storm_name: stormName || "Unknown Storm"
      };

      // Call API - Use environment variable
      const API_BASE_URL = import.meta.env.VITE_PREDICTION_API_URL || "http://localhost:5000";
      const API_URL = `${API_BASE_URL}/predict`;

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const result: PredictionResult = await response.json();

      console.log("✅ Prediction result:", result);

      onPredictionResult(result);
      showToast("success", "Prediction successful!");

    } catch (err) {
      console.error("❌ Error:", err);
      showToast("error", "Failed to fetch prediction. Is the Python server running?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // CONTAINER CHÍNH - Thay h-full bằng flex-1 để tự động lấy không gian
    <div className="flex-1 overflow-y-auto p-4 min-h-0">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enter at least 9 consecutive storm positions for trajectory prediction.
        </p>

        <div className="space-y-2">
          <Label className="dark:text-gray-300">Storm Name (Optional)</Label>
          <Input
            placeholder="e.g., Typhoon Haiyan"
            value={stormName}
            onChange={(e) => setStormName(e.target.value)}
            className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label className="dark:text-gray-300">Storm Positions (Min 9)</Label>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${validCount >= 9 ? 'text-green-600' : 'text-orange-600'}`}>
              {validCount} / 9
            </span>
            <Button
              size="sm"
              onClick={handleAddPosition}
              className="h-7 px-2"
            >
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {positions.map((position, index) => (
            <div key={position.id} className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-6">
                {index + 1}.
              </span>
              <Input
                placeholder="Latitude"
                type="number"
                step="0.01"
                value={position.lat}
                onChange={(e) => handlePositionChange(position.id, 'lat', e.target.value)}
                className="flex-1 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              />
              <Input
                placeholder="Longitude"
                type="number"
                step="0.01"
                value={position.lng}
                onChange={(e) => handlePositionChange(position.id, 'lng', e.target.value)}
                className="flex-1 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemovePosition(position.id)}
                disabled={positions.length === 1}
                className="h-9 w-9"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t dark:border-gray-700">
          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={validCount < 9}
          >
            Run Prediction {validCount >= 9 ? '✓' : `(${9 - validCount} more needed)`}
          </Button>
        </div>
      </div>
    </div>
  );
};