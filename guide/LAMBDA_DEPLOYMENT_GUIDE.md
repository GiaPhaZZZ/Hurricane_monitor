# Hướng dẫn Deploy PyTorch Model lên AWS Lambda

## ✅ Quy trình của bạn là ĐÚNG!

Nhưng có một số điểm cần lưu ý và cải tiến.

---

## 🔧 Sửa lỗi quan trọng

### ⚠️ Vấn đề: Tên file model không khớp

**Trong Dockerfile**:
```dockerfile
COPY cropping_storm_7304_2l.pth ${LAMBDA_TASK_ROOT}/model.pth
```

**Trong app.py**:
```python
model_path = "cropping_storm_7304_2l.pth"
```

### ✅ Giải pháp: Chọn 1 trong 2 cách

**Cách 1: Sửa app.py (Khuyến nghị)**
```python
model_path = "model.pth"  # Đổi thành tên mới
```

**Cách 2: Sửa Dockerfile**
```dockerfile
COPY cropping_storm_7304_2l.pth ${LAMBDA_TASK_ROOT}/cropping_storm_7304_2l.pth
```

Tôi khuyến nghị **Cách 1** vì tên `model.pth` ngắn gọn và dễ quản lý hơn.

---

## 📋 Checklist đầy đủ

### Bước 1: Chuẩn bị Code

**1.1. Sửa app.py**

```python
import json
import torch
import numpy as np
from typing import List, Dict

# Load model khi Lambda khởi động (reuse across invocations)
MODEL_PATH = "model.pth"
device = torch.device("cpu")  # Lambda không có GPU
model = None

def load_model():
    global model
    if model is None:
        print(f"Loading model from {MODEL_PATH}...")
        model = torch.load(MODEL_PATH, map_location=device)
        model.eval()
        print("Model loaded successfully!")
    return model

def prepare_features(history: List[Dict]) -> torch.Tensor:
    """
    Chuyển đổi history thành tensor cho model
    history: [{"lat": 15.0, "lng": 107.0}, ...]
    """
    # TODO: Implement feature engineering theo model của bạn
    lats = [p["lat"] for p in history]
    lngs = [p["lng"] for p in history]
    
    # Ví dụ: normalize và reshape
    features = np.array([lats + lngs])  # Shape: (1, 18)
    return torch.tensor(features, dtype=torch.float32)

def format_predictions(predictions: torch.Tensor, storm_name: str) -> Dict:
    """
    Format output theo cấu trúc frontend cần
    """
    # TODO: Implement theo output của model
    pred_array = predictions.detach().cpu().numpy()[0]
    
    # Giả sử model predict 10 điểm tiếp theo (lat, lng)
    forecast = []
    base_timestamp = int(time.time() * 1000)
    
    for i in range(0, len(pred_array), 2):
        if i + 1 < len(pred_array):
            forecast.append({
                "lat": float(pred_array[i]),
                "lng": float(pred_array[i + 1]),
                "timestamp": base_timestamp + (i // 2) * 3600000,  # +1 hour each
                "windSpeed": 120.0,  # TODO: Predict từ model
                "pressure": 980.0,   # TODO: Predict từ model
                "category": "Category 3",  # TODO: Classify từ windSpeed
                "confidence": 0.85
            })
    
    return {
        "storm_name": storm_name,
        "forecast": forecast
    }

def handler(event, context):
    """
    Lambda handler function
    """
    try:
        # Parse input
        body = json.loads(event.get('body', '{}'))
        history = body.get('history', [])
        storm_name = body.get('storm_name', 'Unknown Storm')
        
        # Validate input
        if len(history) < 9:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': f'Need at least 9 positions, got {len(history)}'
                })
            }
        
        # Load model
        model = load_model()
        
        # Prepare features
        X = prepare_features(history)
        
        # Predict
        with torch.no_grad():
            predictions = model(X)
        
        # Format output
        result = format_predictions(predictions, storm_name)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result)
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e)
            })
        }
```

**1.2. Sửa Dockerfile**

```dockerfile
FROM public.ecr.aws/lambda/python:3.11

# Copy requirements và install
COPY requirements.txt ${LAMBDA_TASK_ROOT}
RUN pip install --no-cache-dir -r requirements.txt

# Copy model (đổi tên thành model.pth)
COPY cropping_storm_7304_2l.pth ${LAMBDA_TASK_ROOT}/model.pth

# Copy code
COPY app.py ${LAMBDA_TASK_ROOT}

# Set handler
CMD ["app.handler"]
```

**1.3. Kiểm tra requirements.txt**

```txt
torch==2.1.0
numpy==1.24.3
```

**Lưu ý**: Nếu model của bạn cần thêm thư viện (torchvision, pandas, etc.), thêm vào đây.

---

### Bước 2: Build Docker Image

```bash
cd storm_prediction

# Build image
docker build -t storm-prediction-model .

# Test local (optional)
docker run -p 9000:8080 storm-prediction-model

# Test với curl
curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -d '{
    "body": "{\"history\": [{\"lat\": 15.0, \"lng\": 107.0}, {\"lat\": 15.1, \"lng\": 107.1}, {\"lat\": 15.2, \"lng\": 107.2}, {\"lat\": 15.3, \"lng\": 107.3}, {\"lat\": 15.4, \"lng\": 107.4}, {\"lat\": 15.5, \"lng\": 107.5}, {\"lat\": 15.6, \"lng\": 107.6}, {\"lat\": 15.7, \"lng\": 107.7}, {\"lat\": 15.8, \"lng\": 107.8}], \"storm_name\": \"Test Storm\"}"
  }'
```

---

### Bước 3: Upload lên AWS ECR

```bash
# 1. Tạo ECR repository
aws ecr create-repository \
  --repository-name storm-prediction-model \
  --region ap-southeast-1

# 2. Đăng nhập Docker vào ECR
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin \
  <account-id>.dkr.ecr.ap-southeast-1.amazonaws.com

# 3. Tag image
docker tag storm-prediction-model:latest \
  <account-id>.dkr.ecr.ap-southeast-1.amazonaws.com/storm-prediction-model:latest

# 4. Push image
docker push <account-id>.dkr.ecr.ap-southeast-1.amazonaws.com/storm-prediction-model:latest
```

**Lưu ý**: Thay `<account-id>` bằng AWS Account ID của bạn.

---

### Bước 4: Tạo Lambda Function

**4.1. Tạo Lambda từ Console**

1. Vào AWS Lambda Console
2. Click "Create function"
3. Chọn "Container image"
4. Function name: `storm-prediction`
5. Container image URI: Chọn image vừa push lên ECR
6. Architecture: x86_64
7. Click "Create function"

**4.2. Cấu hình Lambda**

```bash
# Hoặc dùng AWS CLI
aws lambda create-function \
  --function-name storm-prediction \
  --package-type Image \
  --code ImageUri=<account-id>.dkr.ecr.ap-southeast-1.amazonaws.com/storm-prediction-model:latest \
  --role arn:aws:iam::<account-id>:role/lambda-execution-role \
  --timeout 60 \
  --memory-size 3008 \
  --region ap-southeast-1
```

**Cấu hình quan trọng**:
- **Memory**: 3008 MB (PyTorch model cần nhiều RAM)
- **Timeout**: 60 seconds (model inference có thể mất 10-30s)
- **Ephemeral storage**: 512 MB (default, tăng nếu cần)

**4.3. Tạo IAM Role**

Lambda cần role với permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage"
      ],
      "Resource": "*"
    }
  ]
}
```

---

### Bước 5: Tạo API Gateway

```bash
# 1. Tạo REST API
aws apigateway create-rest-api \
  --name storm-prediction-api \
  --region ap-southeast-1

# 2. Lấy API ID và Root Resource ID
API_ID=<your-api-id>
ROOT_ID=<your-root-resource-id>

# 3. Tạo resource /predict
aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part predict

# 4. Tạo POST method
RESOURCE_ID=<predict-resource-id>
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method POST \
  --authorization-type NONE

# 5. Integrate với Lambda
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:ap-southeast-1:lambda:path/2015-03-31/functions/arn:aws:lambda:ap-southeast-1:<account-id>:function:storm-prediction/invocations

# 6. Deploy API
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod
```

**API URL**: `https://<api-id>.execute-api.ap-southeast-1.amazonaws.com/prod/predict`

---

### Bước 6: Cập nhật Frontend

**6.1. Cập nhật `.env.production`**

```env
VITE_PREDICTION_API_URL=https://<api-id>.execute-api.ap-southeast-1.amazonaws.com/prod
```

**6.2. Build và deploy frontend**

```bash
cd frontend
npm run build
# Deploy dist/ lên S3/CloudFront
```

---

## 🚀 Tối ưu hóa

### 1. Giảm Cold Start

**Provisioned Concurrency**:
```bash
aws lambda put-provisioned-concurrency-config \
  --function-name storm-prediction \
  --provisioned-concurrent-executions 1 \
  --qualifier $LATEST
```

**Lưu ý**: Tốn tiền hơn nhưng không có cold start.

### 2. Giảm kích thước Image

**Dùng PyTorch CPU-only**:
```txt
# requirements.txt
torch==2.1.0+cpu --extra-index-url https://download.pytorch.org/whl/cpu
numpy==1.24.3
```

**Multi-stage build**:
```dockerfile
# Stage 1: Build
FROM python:3.11-slim as builder
COPY requirements.txt .
RUN pip install --target /packages -r requirements.txt

# Stage 2: Runtime
FROM public.ecr.aws/lambda/python:3.11
COPY --from=builder /packages ${LAMBDA_RUNTIME_DIR}
COPY model.pth ${LAMBDA_TASK_ROOT}/
COPY app.py ${LAMBDA_TASK_ROOT}/
CMD ["app.handler"]
```

### 3. Cache Model trong /tmp

```python
import os

MODEL_PATH = "/tmp/model.pth" if os.path.exists("/tmp/model.pth") else "model.pth"

def load_model():
    global model
    if model is None:
        # Copy to /tmp for faster access
        if not os.path.exists("/tmp/model.pth"):
            import shutil
            shutil.copy("model.pth", "/tmp/model.pth")
        
        model = torch.load("/tmp/model.pth", map_location=device)
        model.eval()
    return model
```

---

## 📊 Monitoring

### CloudWatch Logs

```bash
# Xem logs
aws logs tail /aws/lambda/storm-prediction --follow
```

### CloudWatch Metrics

- **Invocations**: Số lần gọi
- **Duration**: Thời gian chạy
- **Errors**: Số lỗi
- **Throttles**: Số lần bị throttle

### Alerts

```bash
# Tạo alarm cho errors
aws cloudwatch put-metric-alarm \
  --alarm-name storm-prediction-errors \
  --alarm-description "Alert when Lambda has errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=storm-prediction
```

---

## 🐛 Troubleshooting

### Lỗi: "Task timed out after 3.00 seconds"
**Giải pháp**: Tăng timeout lên 60s

### Lỗi: "Runtime exited with error: signal: killed"
**Giải pháp**: Tăng memory lên 3008 MB

### Lỗi: "No module named 'torch'"
**Giải pháp**: Kiểm tra requirements.txt và rebuild image

### Lỗi: Model không load được
**Giải pháp**: Kiểm tra tên file model trong Dockerfile và app.py

---

## 💰 Chi phí ước tính

**Lambda**:
- Free tier: 1M requests/month, 400,000 GB-seconds
- Sau đó: $0.20 per 1M requests + $0.0000166667 per GB-second

**Ví dụ**: 10,000 requests/month, mỗi request 10s, 3GB RAM
- Compute: 10,000 × 10s × 3GB × $0.0000166667 = $5/month
- Requests: 10,000 × $0.20/1M = $0.002/month
- **Total**: ~$5/month

**API Gateway**:
- $3.50 per million requests
- 10,000 requests = $0.035/month

**ECR**:
- $0.10 per GB/month storage
- Image ~2GB = $0.20/month

**Total ước tính**: ~$5.25/month cho 10,000 predictions

---

## ✅ Checklist cuối cùng

- [ ] Sửa tên file model trong app.py hoặc Dockerfile
- [ ] Test Docker image locally
- [ ] Push image lên ECR
- [ ] Tạo Lambda function với memory 3008MB, timeout 60s
- [ ] Tạo API Gateway và integrate với Lambda
- [ ] Test API với Postman/curl
- [ ] Cập nhật VITE_PREDICTION_API_URL trong frontend
- [ ] Build và deploy frontend
- [ ] Test form prediction trên web
- [ ] Setup CloudWatch alerts
- [ ] Monitor logs và performance
