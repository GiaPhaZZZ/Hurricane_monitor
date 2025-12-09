import json
import numpy as np
import torch
import torch.nn as nn
from pytorch_tcn import TCN
from torch.nn.utils.rnn import pack_padded_sequence
import boto3
from datetime import datetime
import os
import time
base_timestamp = int(time.time() * 1000)

# ==========================================
# CONFIGURATION
# ==========================================
device = 'cpu'
s3_client = boto3.client('s3')

MODEL_BUCKET = os.environ.get('MODEL_BUCKET', 'storm-ai-models-duc-2025')
DATA_BUCKET = os.environ.get('DATA_BUCKET', 'storm-frontend-hosting-duc-2025')

# ==========================================
# UTILITY FUNCTIONS
# ==========================================
def haversine(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in km"""
    R = 6371.0
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat/2)**2 + np.cos(lat1)*np.cos(lat2)*np.sin(dlon/2)**2
    c = 2 * np.arcsin(np.sqrt(a))
    return R * c

def bearing(lat1, lon1, lat2, lon2):
    """Calculate bearing between two points (normalized 0-1)"""
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlon = lon2 - lon1
    x = np.sin(dlon) * np.cos(lat2)
    y = np.cos(lat1)*np.sin(lat2) - np.sin(lat1)*np.cos(lat2)*np.cos(dlon)
    brng = np.arctan2(x, y)
    return (np.degrees(brng) % 360) / 360

def classify_storm_speed(speed):
    """Classify storm movement speed"""
    if speed < 5: return 1      # stationary
    elif speed < 20: return 2   # slow_moving
    elif speed < 50: return 3   # moderate
    elif speed < 80: return 4   # fast_moving
    else: return 5              # very fast

def calculate_category(windspeed_kmh):
    """Calculate storm category from windspeed"""
    if windspeed_kmh < 62:
        return "Áp thấp nhiệt đới"
    elif windspeed_kmh < 118:
        return "Bão"
    elif windspeed_kmh < 185:
        return "Bão rất mạnh"
    else:
        return "Siêu bão"

# ==========================================
# MODEL DEFINITIONS
# ==========================================
class StormLSTM(nn.Module):
    def __init__(self, input_size, hidden_size, num_layers, dropout):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            dropout=dropout,
            batch_first=True,
            bidirectional=False
        )
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Linear(hidden_size // 2, 1)
        )

    def forward(self, x, lengths):
        packed = pack_padded_sequence(x, lengths.cpu(), batch_first=True, enforce_sorted=False)
        _, (h_n, _) = self.lstm(packed)
        out = self.fc(h_n[-1])
        return out.squeeze(-1)


class StormTCN(nn.Module):
    def __init__(self, input_dim=4, hidden_units=256, num_layers=4, dropout=0.2, kernel_size=3):
        super().__init__()
        try:
            self.tcn = TCN(
                num_inputs=input_dim,
                num_channels=[hidden_units] * num_layers,
                kernel_size=kernel_size,
                dropout=dropout,
                causal=True,
                input_shape="NCL"
            )
        except TypeError:
            self.tcn = TCN(
                input_size=input_dim,
                output_size=hidden_units,
                num_channels=[hidden_units] * num_layers,
                kernel_size=kernel_size,
                dropout=dropout
            )

        self.head_latlon = nn.Linear(hidden_units, 2)
        self.head_aux = nn.Linear(hidden_units, 2)

    def forward(self, x):
        x_perm = x.permute(0, 2, 1)
        features = self.tcn(x_perm)
        if features.dim() == 3:
            features = features.permute(0, 2, 1)

        pred_latlon = self.head_latlon(features)
        pred_aux = self.head_aux(features)
        return pred_latlon, pred_aux


# ==========================================
# GLOBAL MODEL CACHING
# ==========================================
LSTM_MODEL = None
TCN_MODEL = None

def load_models():
    """Load models from S3 or local (cached after first invocation)"""
    global LSTM_MODEL, TCN_MODEL
    
    # Load LSTM
    if LSTM_MODEL is None:
        print("⏳ Loading LSTM model...")
        lstm_path = '/tmp/lstm_model.pt'
        
        # Try local first (for testing), then S3
        if not os.path.exists(lstm_path):
            try:
                s3_client.download_file(
                    MODEL_BUCKET,
                    'models/lstm_totald_256_4.pt',
                    lstm_path
                )
                print("✓ Downloaded LSTM from S3")
            except Exception as e:
                print(f"⚠️ Could not load LSTM from S3: {e}")
                print("⚠️ Will use fallback prediction")
                LSTM_MODEL = None
                # Continue to load TCN even if LSTM fails
        
        try:
            checkpoint = torch.load(lstm_path, map_location='cpu')
            LSTM_MODEL = StormLSTM(input_size=4, hidden_size=256, num_layers=2, dropout=0.0)
            LSTM_MODEL.load_state_dict(checkpoint['model_state_dict'])
            LSTM_MODEL.eval()
            print("✅ LSTM loaded successfully")
        except Exception as e:
            print(f"❌ Error loading LSTM: {e}")
            LSTM_MODEL = None

    # Load TCN
    if TCN_MODEL is None:
        print("⏳ Loading TCN model...")
        tcn_path = '/tmp/tcn_model.pth'
        
        # Check multiple possible locations
        possible_paths = [
            '/var/task/models/cropping_storm_7304_2l.pth',  # Primary location in Lambda
            'models/cropping_storm_7304_2l.pth',
            tcn_path
        ]
        
        model_found = False
        for path in possible_paths:
            print(f"🔍 Checking: {path}")
            if os.path.exists(path):
                tcn_path = path
                model_found = True
                print(f"✓ Found TCN at {path}")
                break
        
        # Download from S3 if not found locally
        if not model_found:
            print("⚠️ TCN not found locally, trying S3...")
            try:
                s3_client.download_file(
                    MODEL_BUCKET,
                    'models/cropping_storm_7304_2l.pth',
                    tcn_path
                )
                print("✓ Downloaded TCN from S3")
            except Exception as e:
                print(f"❌ Could not load TCN from S3: {e}")
                raise Exception("TCN model is required but not found")
        
        try:
            print(f"📦 Loading TCN from: {tcn_path}")
            TCN_MODEL = StormTCN(input_dim=4, hidden_units=1024, num_layers=2)
            TCN_MODEL.load_state_dict(torch.load(tcn_path, map_location='cpu'))
            TCN_MODEL.eval()
            print("✅ TCN loaded successfully")
        except Exception as e:
            print(f"❌ Error loading TCN: {e}")
            import traceback
            traceback.print_exc()
            raise


# ==========================================
# PREPROCESSING
# ==========================================
def preprocess_history(history):
    """
    Convert history to tensor format [Lat, Lon, Distance, Bearing]
    Input: List of {'lat': float, 'lng': float, 'windSpeed': float (optional)}
    """
    if len(history) < 2:
        raise ValueError("Need at least 2 points to calculate trajectory")
    
    processed = []
    
    # First point: 0 distance, 0 bearing
    processed.append([
        history[0]['lat'],
        history[0]['lng'],
        0.0,
        0.0
    ])
    
    # Calculate distance and bearing for subsequent points
    for i in range(1, len(history)):
        lat1, lon1 = history[i-1]['lat'], history[i-1]['lng']
        lat2, lon2 = history[i]['lat'], history[i]['lng']
        
        dist = haversine(lat1, lon1, lat2, lon2)
        brng = bearing(lat1, lon1, lat2, lon2)
        
        processed.append([lat2, lon2, dist, brng])
    
    # Convert to tensor
    record_array = np.array(processed, dtype=np.float32)
    return torch.from_numpy(record_array).unsqueeze(0)


# ==========================================
# PREDICTION FUNCTIONS
# ==========================================
def predict_total_distance(record_tensor):
    """Predict total distance storm will travel using LSTM"""
    if LSTM_MODEL is None:
        # Fallback: estimate based on current trajectory
        record = record_tensor[0].numpy()
        avg_dist = record[:, 2].mean() if len(record) > 1 else 20.0
        fallback = avg_dist * 24  # Assume 24 more steps
        print(f"⚠️ Using fallback distance: {fallback:.2f} km")
        return fallback
    
    # Create storm summary (day-by-day)
    record = record_tensor[0].numpy()
    points_per_day = 9
    num_days = int(np.ceil(len(record) / points_per_day))
    
    summary = []
    for d in range(num_days):
        start = d * points_per_day
        end = min((d + 1) * points_per_day, len(record))
        day_points = record[start:end]
        
        daily_dist = day_points[:, 2].sum()
        avg_speed = daily_dist / 24.0
        motion_type = classify_storm_speed(avg_speed)
        
        summary.append([d + 1, daily_dist, avg_speed, motion_type])
    
    summary_array = np.array(summary, dtype=np.float32)
    summary_tensor = torch.from_numpy(summary_array).unsqueeze(0)
    lengths = torch.tensor([summary_tensor.shape[1]])
    
    with torch.no_grad():
        pred = LSTM_MODEL(summary_tensor, lengths)
    
    # Apply condition for short tracks
    if summary_tensor.shape[1] <= 3:
        pred = pred * 0.9
    
    return pred.item()


def predict_storm_path(record_tensor, total_distance, history):
    """
    Predict future storm path using TCN
    Returns: list of predicted points with wind estimation
    """
    seq = record_tensor.clone()
    gone_distance = seq[0, :, 2].sum().item()
    
    # Extract windspeed if available
    has_wind = 'windSpeed' in history[0] if history else False
    recent_winds = [p.get('windSpeed', 0) for p in history[-3:]] if has_wind else []
    avg_wind = np.mean([w for w in recent_winds if w > 0]) if recent_winds else 0
    
    # Use only last 4 timesteps
    if seq.shape[1] > 4:
        seq = seq[:, -4:, :]
    
    predicted_points = []
    step = 0
    MAX_STEPS = 200  # Safety limit
    
    with torch.no_grad():
        while gone_distance < total_distance and step < MAX_STEPS:
            pred_latlon, pred_aux = TCN_MODEL(seq)
            
            # Extract prediction
            new_lat = float(pred_latlon[0, -1, 0].item())
            new_lon = float(pred_latlon[0, -1, 1].item())
            
            # Last position
            last_lat = float(seq[0, -1, 0].item())
            last_lon = float(seq[0, -1, 1].item())
            
            # Calculate metrics
            step_distance = haversine(last_lat, last_lon, new_lat, new_lon)
            step_bearing = bearing(last_lat, last_lon, new_lat, new_lon)
            
            # Estimate windspeed (decay over time if available, else use moderate default)
            if avg_wind > 0:
                estimated_wind = max(avg_wind * (0.98 ** step), 30)  # Slow decay
            else:
                estimated_wind = 65  # Default: weak typhoon
            
            # Create next point
            next_point = torch.tensor(
                [[new_lat, new_lon, step_distance, step_bearing]],
                dtype=torch.float32,
                device=device
            )
            
            predicted_points.append({
                'lat': round(float(new_lat), 2),
                'lng': round(float(new_lon), 2),
                'timestamp': int(base_timestamp + (step * 3 * 3600 * 1000)),
                'windSpeed': round(float(estimated_wind), 1),
                'pressure': 980.0,
                'category': calculate_category(estimated_wind)
            })
            
            # Sliding window update
            if seq.shape[1] >= 4:
                seq = torch.cat([seq[:, 1:, :], next_point.unsqueeze(1)], dim=1)
            else:
                seq = torch.cat([seq, next_point.unsqueeze(1)], dim=1)
            
            gone_distance += step_distance
            step += 1
    
    return predicted_points, step, gone_distance


# ==========================================
# LAMBDA HANDLER
# ==========================================
def handler(event, context):
    """
    AWS Lambda Handler
    Expected Input:
    {
        "history": [
            {"lat": 15.92, "lng": 133.0, "windSpeed": 65},
            ...
        ],
        "storm_name": "Tropical Storm Maria",
        "storm_id": "2024301N11136"
    }
    """
    try:
        # Load models (cached after first invocation)
        load_models()
        
        # Parse input
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event
        
        history = body.get('history', [])
        storm_name = body.get('storm_name', 'Unknown Storm')
        storm_id = body.get('storm_id', 'unknown')
        
        # Validation
        if len(history) < 3:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'error': 'Need at least 3 historical points',
                    'received': len(history)
                })
            }
        
        print(f"🌀 Processing: {storm_name} ({storm_id})")
        print(f"📍 Input points: {len(history)}")
        
        # Step 1: Preprocess
        record_tensor = preprocess_history(history)
        
        # Step 2: Predict total distance
        total_distance = predict_total_distance(record_tensor)
        print(f"📏 Predicted total distance: {total_distance:.2f} km")
        
        # Step 3: Predict path
        predicted_points, num_steps, actual_distance = predict_storm_path(
            record_tensor, total_distance, history
        )
        
        # Step 4: Calculate lifespan
        hours_per_step = 3
        lifespan = num_steps * hours_per_step
        
        print(f"✅ Generated {num_steps} predictions ({lifespan} hours)")
        
        # Step 5: Format result
        result = {
            'storm_id': storm_id,
            'storm_name': storm_name,
            'prediction_time': datetime.now().isoformat(),
            'totalDistance': round(float(total_distance), 2),
            'actualDistance': round(float(actual_distance), 2),
            'lifespan': int(lifespan),
            'forecastHours': int(lifespan),
            'forecast': predicted_points
        }
        
        # Step 6: Save to S3
        try:
            output_key = f"predictions/{storm_id}_{int(datetime.now().timestamp())}.json"
            s3_client.put_object(
                Bucket=DATA_BUCKET,
                Key=output_key,
                Body=json.dumps(result, ensure_ascii=False),
                ContentType='application/json',
                CacheControl='max-age=1800'  # 30 min cache
            )
            print(f"💾 Saved to S3: {output_key}")
        except Exception as e:
            print(f"⚠️ Could not save to S3: {e}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Cache-Control': 'max-age=1800'
            },
            'body': json.dumps(result)
        }
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': str(e),
                'type': type(e).__name__
            })
        }


# For local testing
if __name__ == "__main__":
    test_event = {
        "history": [
            {"lat": 15.92, "lng": 133.0, "windSpeed": 65},
            {"lat": 16.127, "lng": 132.7, "windSpeed": 70},
            {"lat": 16.23, "lng": 132.3, "windSpeed": 75},
            {"lat": 16.127, "lng": 131.79, "windSpeed": 80},
            {"lat": 16.04, "lng": 131.3, "windSpeed": 85},
            {"lat": 16.02, "lng": 131.0, "windSpeed": 90},
            {"lat": 16.114, "lng": 130.704, "windSpeed": 95},
            {"lat": 16.215, "lng": 130.412, "windSpeed": 100},
            {"lat": 16.32, "lng": 130.106, "windSpeed": 105}
        ],
        "storm_name": "Test Storm",
        "storm_id": "TEST001"
    }
    
    result = handler(test_event, None)
    print("\n" + "="*50)
    print(json.dumps(json.loads(result['body']), indent=2))