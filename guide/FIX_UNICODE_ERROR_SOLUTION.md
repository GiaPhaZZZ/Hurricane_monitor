# Giải quyết lỗi UnicodeDecodeError trong Lambda

## Vấn đề
```
UnicodeDecodeError: 'utf-8' codec can't decode byte 0x80 in position 64: invalid start byte
```

## Nguyên nhân
- Model PyTorch có extension `.pth` (binary file)
- Python runtime cũng sử dụng `.pth` files cho path configuration (text files)
- Khi đặt model `.pth` trực tiếp trong `LAMBDA_TASK_ROOT`, Python cố đọc nó như text → lỗi

## Giải pháp đã áp dụng

### 1. Sửa Dockerfile
Di chuyển model vào thư mục con `models/`:

```dockerfile
# Copy model file to subdirectory to avoid Python .pth file confusion
RUN mkdir -p ${LAMBDA_TASK_ROOT}/models
COPY cropping_storm_7304_2l.pth ${LAMBDA_TASK_ROOT}/models/
```

### 2. Sửa app.py
Update đường dẫn tìm model:

```python
possible_paths = [
    '/var/task/models/cropping_storm_7304_2l.pth',  # Primary location in Lambda
    'models/cropping_storm_7304_2l.pth',
    tcn_path
]
```

## Các bước rebuild và deploy

### Bước 1: Build Docker image
```bash
cd storm_prediction
docker build --provenance=false --platform linux/amd64 -t storm-prediction-model .
```

**Lưu ý**: `--provenance=false` giúp giảm kích thước image để push lên ECR

### Bước 2: Tag image
```bash
docker tag storm-prediction-model:latest 211125445874.dkr.ecr.ap-southeast-1.amazonaws.com/storm-prediction:latest
```

### Bước 3: Login ECR
```bash
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin 211125445874.dkr.ecr.ap-southeast-1.amazonaws.com
```

### Bước 4: Push to ECR
```bash
docker push 211125445874.dkr.ecr.ap-southeast-1.amazonaws.com/storm-prediction:latest
```

### Bước 5: Update Lambda
1. Vào AWS Console → Lambda → storm-prediction
2. Click tab **Image**
3. Click **Deploy new image**
4. Chọn image mới nhất
5. Click **Save**

### Bước 6: Test
```bash
curl -X POST "https://vill3povlzqxdyxm7ubldizobu0kdgbi.lambda-url.ap-southeast-1.on.aws/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "history": [
      {"lat": 14.5, "lng": 121.0},
      {"lat": 14.6, "lng": 121.1},
      {"lat": 14.7, "lng": 121.2},
      {"lat": 14.8, "lng": 121.3},
      {"lat": 14.9, "lng": 121.4},
      {"lat": 15.0, "lng": 121.5},
      {"lat": 15.1, "lng": 121.6},
      {"lat": 15.2, "lng": 121.7},
      {"lat": 15.3, "lng": 121.8}
    ],
    "storm_name": "Test Storm"
  }'
```

## Kiểm tra logs sau khi deploy
```bash
aws logs tail /aws/lambda/storm-prediction --region ap-southeast-1 --follow
```

Bạn sẽ thấy:
- ✅ `✓ Found TCN at /var/task/models/cropping_storm_7304_2l.pth`
- ✅ `✅ TCN loaded successfully`
- ✅ `✅ Generated X predictions`

## Tóm tắt
- **Trước**: Model `.pth` ở root → Python nhầm là config file → UnicodeDecodeError
- **Sau**: Model `.pth` ở `models/` → Python bỏ qua → Lambda hoạt động ✅
