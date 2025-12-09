import json
import boto3
import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime, timedelta

# ==========================================
# CONFIGURATION
# ==========================================
s3_client = boto3.client('s3')
BUCKET_DATA = 'storm-frontend-hosting-duc-2025'

# ==========================================
# CRAWL FUNCTIONS
# ==========================================

def get_storm_data(storm_name, storm_href):
    """Fetch detailed storm data from IBTrACS"""
    storm_id_match = re.search(r"v04r01-(\w+)", storm_href)
    if not storm_id_match:
        return None
    
    storm_id = storm_id_match.group(1)
    storm_url = f"https://ncics.org/ibtracs/index.php?name=v04r01-{storm_id}"
    print(f"📡 Fetching {storm_name}...")

    try:
        r = requests.get(storm_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=30)
        soup = BeautifulSoup(r.text, "html.parser")
        tables = soup.find_all("table")
        
        if not tables:
            print(f"⚠️ No tables found for {storm_name}")
            return None
            
        data_table = tables[-1]

        # Extract headers
        headers = [th.get_text(strip=True) for th in data_table.find_all("th")]
        
        # Extract rows
        rows = []
        for tr in data_table.find_all("tr")[2:]:
            cells = [td.get_text(strip=True) for td in tr.find_all("td")]
            if len(cells) == len(headers):
                rows.append(cells)

        if not rows:
            print(f"⚠️ No data rows for {storm_name}")
            return None
        
        # Create DataFrame-like structure
        data = []
        for row in rows:
            row_dict = dict(zip(headers, row))
            data.append(row_dict)
        
        # Process data
        processed_track = []
        current_date = None
        
        for row_dict in data:
            # Handle ISO_TIME
            iso_time_key = next((k for k in row_dict.keys() if k.startswith("ISO_TIME")), None)
            iso_time_val = row_dict.get(iso_time_key, "").strip()
            
            # Parse date/time
            parts = iso_time_val.split()
            if len(parts) == 2:
                date_val, time_val = parts[0], parts[1]
                try:
                    current_date = datetime.strptime(date_val, "%Y-%m-%d")
                except:
                    pass
            else:
                time_val = iso_time_val
                if time_val == "00:00:00" and current_date:
                    current_date += timedelta(days=1)
            
            # Extract numeric values
            def safe_float(val):
                cleaned = re.sub(r"[^-\d\.]", "", str(val))
                try:
                    return float(cleaned)
                except:
                    return 0.0
            
            lat = safe_float(row_dict.get("LAT", 0))
            lon = safe_float(row_dict.get("LON", 0))
            wind = safe_float(row_dict.get("USA WIND", 0))
            pres = safe_float(row_dict.get("USA PRES", 1010))
            
            processed_track.append({
                "DATE": current_date.strftime("%Y-%m-%d") if current_date else "N/A",
                "ISO_TIME": time_val,
                "LAT": lat,
                "LON": lon,
                "USA WIND": wind,
                "USA PRES": pres
            })
        
        return {
            "storm_id": storm_id,
            "storm_name": storm_name,
            "storm_url": storm_url,
            "track": processed_track
        }
        
    except Exception as e:
        print(f"❌ Error fetching {storm_name}: {e}")
        return None


def fetch_recent_storms():
    """Fetch 3 most recent WP storms from IBTrACS"""
    print("🌊 Starting storm data crawl...")
    base_url = "https://ncics.org/ibtracs/"
    
    try:
        resp = requests.get(base_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=30)
        soup = BeautifulSoup(resp.text, "html.parser")
        links = soup.select("a[href*='index.php?name=v04r01-']")
        
        # Get 3 most recent WP storms
        wp_links = [
            (a.text.strip(), a["href"]) 
            for a in links 
            if a.text.strip().startswith("WP")
        ][:3]
        
        print(f"📋 Found {len(wp_links)} recent WP storms")
        
        all_storms = []
        for name, href in wp_links:
            full_href = href if href.startswith('http') else "https://ncics.org/ibtracs/" + href
            data = get_storm_data(name, full_href)
            if data:
                all_storms.append(data)
        
        return all_storms
        
    except Exception as e:
        print(f"❌ Error fetching storm list: {e}")
        return []


def transform_data_for_react(crawled_storms):
    """Transform crawled data to React app format"""
    print("🔄 Transforming data for React...")
    react_storms = []
    
    for storm_raw in crawled_storms:
        track_points = []
        
        for point in storm_raw.get("track", []):
            try:
                # Convert wind to km/h
                wind_kmh = float(point.get("USA WIND", 0)) * 1.852
                
                # Classify category
                if wind_kmh < 62:
                    category = "Áp thấp nhiệt đới"
                elif wind_kmh < 118:
                    category = "Bão"
                elif wind_kmh < 185:
                    category = "Bão rất mạnh"
                else:
                    category = "Siêu bão"

                # Create timestamp
                timestamp = datetime.strptime(
                    f"{point.get('DATE')} {point.get('ISO_TIME')}", 
                    "%Y-%m-%d %H:%M:%S"
                ).timestamp() * 1000
                
                track_points.append({
                    "lat": float(point.get("LAT", 0)),
                    "lng": float(point.get("LON", 0)),
                    "timestamp": int(timestamp),
                    "windSpeed": round(wind_kmh, 1),
                    "pressure": int(point.get("USA PRES", 1010)),
                    "category": category
                })
            except Exception as e:
                print(f"⚠️ Skipping invalid point: {e}")
                continue
        
        if track_points:
            # Sort by timestamp
            track_points.sort(key=lambda p: p["timestamp"])
            
            react_storms.append({
                "id": storm_raw.get("storm_id"),
                "nameVi": storm_raw.get("storm_name", "").split('(')[0].strip(),
                "nameInt": storm_raw.get("storm_id"),
                "status": "active",
                "currentPosition": track_points[-1],
                "historical": track_points[:-1],
                "forecast": []
            })
    
    print(f"✅ Transformed {len(react_storms)} storms")
    return react_storms


# ==========================================
# LAMBDA HANDLER
# ==========================================

def handler(event, context):
    """
    Lambda handler for crawling recent storm data
    Can be triggered by EventBridge (scheduled) or manually
    """
    try:
        print("=" * 50)
        print("🌀 STORM DATA CRAWLER - START")
        print("=" * 50)
        
        # Step 1: Crawl data
        raw_storms = fetch_recent_storms()
        
        if not raw_storms:
            return {
                'statusCode': 404,
                'body': json.dumps({
                    'message': 'No storms found',
                    'timestamp': datetime.now().isoformat()
                })
            }
        
        # Step 2: Transform data
        final_data = transform_data_for_react(raw_storms)
        
        # Step 3: Upload to S3
        filename = "recent_storms.json" 
        print(f"☁️ Uploading {filename} to S3...")
        
        s3_client.put_object(
            Bucket=BUCKET_DATA,
            Key=filename,
            Body=json.dumps(final_data, ensure_ascii=False),
            ContentType='application/json',
            CacheControl='max-age=1800'  # Cache 30 minutes
        )
        
        print("=" * 50)
        print("✅ STORM DATA CRAWLER - SUCCESS")
        print(f"📊 Uploaded {len(final_data)} storms")
        print("=" * 50)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'Storm data updated successfully',
                'storms_count': len(final_data),
                'timestamp': datetime.now().isoformat(),
                'bucket': BUCKET_DATA,
                'filename': filename
            })
        }
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return { 
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'type': type(e).__name__
            })
        }


# For local testing
if __name__ == "__main__":
    test_event = {}
    result = handler(test_event, None)
    print("\n" + "="*50)
    print(json.dumps(json.loads(result['body']), indent=2))