# 📸 HƯỚNG DẪN CHỤP ẢNH CHO DOCUMENTATION

> **Mục đích**: Chụp ảnh các tính năng chính của ứng dụng Storm Tracker để bổ sung vào tài liệu

---

## 🎯 DANH SÁCH ẢNH CẦN CHỤP

### 1️⃣ **Trang Chủ - Tổng Quan** 
📍 **URL**: `http://localhost:5173/`

**Nội dung cần có trong ảnh**:
- ✅ Bản đồ hiển thị đầy đủ Việt Nam và Biển Đông
- ✅ 3 cơn bão với màu sắc khác nhau (đỏ, xanh dương, xanh lá)
- ✅ Đường đi lịch sử (solid line)
- ✅ Đường dự báo (dashed line)
- ✅ Vùng ảnh hưởng mờ bao quanh đường đi
- ✅ Header với logo và tiêu đề "Dự báo Bão Việt Nam"
- ✅ Footer với thông tin

**Cách chụp**:
1. Mở `http://localhost:5173/`
2. Đợi dữ liệu load xong (3 cơn bão hiển thị)
3. Zoom map để thấy rõ cả 3 cơn bão
4. Chụp toàn màn hình (F11 để fullscreen nếu cần)

**Tên file**: `01-homepage-overview.png`

---

### 2️⃣ **Chi Tiết Một Cơn Bão**
📍 **URL**: `http://localhost:5173/`

**Nội dung cần có trong ảnh**:
- ✅ Zoom vào 1 cơn bão cụ thể
- ✅ Đường đi với các marker rõ ràng
- ✅ Vùng ảnh hưởng (buffer zone) rõ nét
- ✅ Các điểm trên đường đi có kích thước khác nhau
- ✅ Màu sắc gradient theo cường độ

**Cách chụp**:
1. Click vào bản đồ để zoom vào 1 cơn bão
2. Zoom level: 7-8 để thấy rõ chi tiết
3. Đảm bảo thấy rõ:
   - Đường đi màu sắc
   - Vùng mờ xung quanh
   - Các marker có kích thước khác nhau
4. Chụp ảnh

**Tên file**: `02-storm-detail-view.png`

---

### 3️⃣ **Tooltip Hiển Thị Thông Tin**
📍 **URL**: `http://localhost:5173/`

**Nội dung cần có trong ảnh**:
- ✅ Hover chuột vào một marker trên đường đi
- ✅ Tooltip hiển thị đầy đủ:
  - Tên bão
  - Cấp độ (TD, TS, C1-C5)
  - Tốc độ gió (km/h)
  - Áp suất (hPa)
  - Thời gian
- ✅ Tooltip có background đen mờ
- ✅ Marker được highlight

**Cách chụp**:
1. Di chuột hover vào một marker (chấm tròn) trên đường đi bão
2. Đợi tooltip hiển thị (200ms)
3. Chụp ảnh ngay khi tooltip xuất hiện
4. **Lưu ý**: Giữ chuột đứng yên khi chụp

**Tên file**: `03-tooltip-information.png`

---

### 4️⃣ **Sidebar - Danh Sách Bão**
📍 **URL**: `http://localhost:5173/`

**Nội dung cần có trong ảnh**:
- ✅ Click nút "Theo dõi bão" (icon mắt) ở header
- ✅ Sidebar hiển thị bên phải
- ✅ Tab "Bão hiện tại" được chọn
- ✅ Danh sách 3 cơn bão
- ✅ Mỗi bão hiển thị:
  - Tên
  - Cấp độ
  - Tốc độ gió
  - Trạng thái (active/inactive)

**Cách chụp**:
1. Click nút "Theo dõi bão" ở góc trên bên phải
2. Sidebar sẽ slide in từ bên phải
3. Đảm bảo thấy đầy đủ danh sách bão
4. Chụp ảnh

**Tên file**: `04-sidebar-storm-list.png`

---

### 5️⃣ **Chi Tiết Bão Trong Sidebar**
📍 **URL**: `http://localhost:5173/`

**Nội dung cần có trong ảnh**:
- ✅ Sidebar đang mở
- ✅ Click vào một cơn bão trong danh sách
- ✅ Panel chi tiết hiển thị:
  - Tên bão đầy đủ (Việt + English)
  - Thông số hiện tại
  - Lịch sử di chuyển
  - Dự báo
- ✅ Nút "Quay lại danh sách"

**Cách chụp**:
1. Mở sidebar (nút "Theo dõi bão")
2. Click vào một cơn bão trong danh sách
3. Panel chi tiết sẽ hiển thị
4. Chụp ảnh

**Tên file**: `05-sidebar-storm-detail.png`

---

### 6️⃣ **Form Dự Đoán Bão - Nhập 9 Điểm Dữ Liệu**
📍 **URL**: `http://localhost:5173/`

**Nội dung cần có trong ảnh**:
- ✅ Sidebar đang mở
- ✅ Tab "Dự đoán" được chọn
- ✅ Form nhập liệu hiển thị:
  - Hướng dẫn "Nhập ít nhất 9 điểm dữ liệu"
  - Các trường input: datetime, lat, lng, windspeed, pressure
  - Nút "Thêm dòng" để thêm dòng mới
  - Nút "Xóa" cho mỗi dòng
  - Nút "Chạy Dự Đoán" (màu xanh)
- ✅ **Đã nhập đủ 9 dòng dữ liệu** (quan trọng!)
- ✅ Dữ liệu được sắp xếp theo thứ tự thời gian

**Cách chụp**:
1. Mở sidebar
2. Click tab "Dự đoán"
3. Nhập đủ 9 dòng dữ liệu mẫu (xem bên dưới)
4. Scroll để thấy tất cả 9 dòng trong khung hình
5. Chụp ảnh form

**Dữ liệu mẫu 9 điểm để nhập** (copy từng dòng):
```
Dòng 1: 2025-10-01T00:00 | 15.5 | 110.5 | 85  | 995
Dòng 2: 2025-10-01T06:00 | 15.8 | 110.8 | 90  | 992
Dòng 3: 2025-10-01T12:00 | 16.1 | 111.2 | 95  | 990
Dòng 4: 2025-10-01T18:00 | 16.5 | 111.6 | 100 | 988
Dòng 5: 2025-10-02T00:00 | 16.9 | 112.0 | 105 | 985
Dòng 6: 2025-10-02T06:00 | 17.3 | 112.5 | 110 | 983
Dòng 7: 2025-10-02T12:00 | 17.8 | 113.0 | 115 | 980
Dòng 8: 2025-10-02T18:00 | 18.2 | 113.5 | 120 | 978
Dòng 9: 2025-10-03T00:00 | 18.7 | 114.0 | 125 | 975
```

**Lưu ý quan trọng**:
- Mô hình AI yêu cầu **chính xác 9 điểm** để dự đoán
- Dữ liệu phải theo thứ tự thời gian (từ cũ đến mới)
- Khoảng cách giữa các điểm nên đều đặn (6 giờ)
- Tất cả các trường phải được điền đầy đủ

**Tên file**: `06-prediction-form-9-points.png`

---

### 7️⃣ **Kết Quả Dự Đoán AI - Đường Đi Màu Cyan**
📍 **URL**: `http://localhost:5173/`

**Nội dung cần có trong ảnh**:
- ✅ Đường dự đoán màu cyan (xanh lơ) rõ ràng trên bản đồ
- ✅ Đường dự đoán khác biệt với đường bão thực tế
- ✅ Map đã tự động zoom vào vùng dự đoán
- ✅ Toast notification "Dự đoán thành công!" ở góc màn hình
- ✅ Có thể thấy cả 9 điểm input và đường dự đoán

**Cách chụp**:
1. Mở form dự đoán (tab "Dự đoán" trong sidebar)
2. Nhập đủ **9 dòng dữ liệu** (sử dụng dữ liệu mẫu bên dưới)
3. Click nút "Chạy Dự Đoán" (màu xanh)
4. Đợi API xử lý (2-5 giây)
5. Đường cyan sẽ xuất hiện trên map
6. Map tự động zoom vào vùng dự đoán
7. Chụp ảnh ngay khi thấy toast "Dự đoán thành công!"

**Dữ liệu mẫu 9 điểm để test** (copy vào form):
```
Dòng 1: 2025-10-01T00:00 | 15.5 | 110.5 | 85  | 995
Dòng 2: 2025-10-01T06:00 | 15.8 | 110.8 | 90  | 992
Dòng 3: 2025-10-01T12:00 | 16.1 | 111.2 | 95  | 990
Dòng 4: 2025-10-01T18:00 | 16.5 | 111.6 | 100 | 988
Dòng 5: 2025-10-02T00:00 | 16.9 | 112.0 | 105 | 985
Dòng 6: 2025-10-02T06:00 | 17.3 | 112.5 | 110 | 983
Dòng 7: 2025-10-02T12:00 | 17.8 | 113.0 | 115 | 980
Dòng 8: 2025-10-02T18:00 | 18.2 | 113.5 | 120 | 978
Dòng 9: 2025-10-03T00:00 | 18.7 | 114.0 | 125 | 975
```

**Giải thích dữ liệu**:
- **datetime**: Thời gian quan sát (cách nhau 6 giờ)
- **latitude**: Vĩ độ (tăng dần = di chuyển về phía Bắc)
- **longitude**: Kinh độ (tăng dần = di chuyển về phía Đông)
- **windspeed**: Tốc độ gió (km/h) - tăng dần = bão mạnh lên
- **pressure**: Áp suất (hPa) - giảm dần = bão mạnh lên

**Lưu ý**:
- Đường cyan là kết quả dự đoán từ mô hình AI
- Đường này khác với đường forecast (màu của bão)
- Nếu API lỗi, kiểm tra backend có đang chạy không
- Có thể thử dữ liệu khác nếu muốn test nhiều trường hợp

**Tên file**: `07-prediction-result-cyan-path.png`

---

### 8️⃣ **Vùng Ảnh Hưởng - Close Up**
📍 **URL**: `http://localhost:5173/`

**Nội dung cần có trong ảnh**:
- ✅ Zoom rất gần vào đường đi bão
- ✅ Thấy rõ vùng ảnh hưởng (buffer zone):
  - Đường viền chấm chấm trắng
  - Vùng tô màu mờ bên trong
  - Độ rộng thay đổi theo tốc độ gió
- ✅ Đường đi bão ở giữa vùng ảnh hưởng
- ✅ Các marker trên đường đi

**Cách chụp**:
1. Zoom level: 8-9 (rất gần)
2. Focus vào một đoạn đường đi có vùng ảnh hưởng rõ
3. Đảm bảo thấy:
   - Đường viền dashed
   - Màu fill mờ
   - Độ rộng thay đổi
4. Chụp ảnh

**Tên file**: `08-influence-zone-closeup.png`

---

### 9️⃣ **So Sánh 3 Cơn Bão**
📍 **URL**: `http://localhost:5173/`

**Nội dung cần có trong ảnh**:
- ✅ View toàn cảnh thấy cả 3 cơn bão
- ✅ Mỗi bão có màu khác nhau rõ ràng:
  - Bão 1: Đỏ
  - Bão 2: Xanh dương
  - Bão 3: Xanh lá
- ✅ Thấy rõ sự khác biệt về:
  - Màu sắc
  - Kích thước marker
  - Vùng ảnh hưởng
- ✅ Không có sidebar che khuất

**Cách chụp**:
1. Đóng sidebar nếu đang mở
2. Zoom out để thấy cả 3 cơn bão
3. Điều chỉnh view để 3 bão cân đối trong khung hình
4. Chụp ảnh

**Tên file**: `09-three-storms-comparison.png`

---

### 🔟 **Marker Kích Thước Khác Nhau**
📍 **URL**: `http://localhost:5173/`

**Nội dung cần có trong ảnh**:
- ✅ Zoom vào một đoạn đường đi bão
- ✅ Thấy rõ các marker có kích thước khác nhau
- ✅ Marker lớn hơn = gió mạnh hơn
- ✅ Ít nhất 5-6 marker trong khung hình
- ✅ Sự chênh lệch kích thước rõ ràng

**Cách chụp**:
1. Zoom level: 7-8
2. Tìm đoạn đường có marker kích thước thay đổi nhiều
3. Đảm bảo thấy rõ sự khác biệt
4. Chụp ảnh

**Tên file**: `10-marker-size-variation.png`

---

### 1️⃣1️⃣ **Loading State**
📍 **URL**: `http://localhost:5173/`

**Nội dung cần có trong ảnh**:
- ✅ Màn hình loading khi mới vào trang
- ✅ Spinner animation
- ✅ Text "Đang tải dữ liệu bão từ server..."

**Cách chụp**:
1. Refresh trang (F5)
2. Chụp nhanh trong 1-2 giây đầu khi loading
3. **Tip**: Có thể throttle network trong DevTools để loading lâu hơn

**Tên file**: `11-loading-state.png`

---

### 1️⃣2️⃣ **Mobile View - Portrait**
📍 **URL**: `http://localhost:5173/`

**Nội dung cần có trong ảnh**:
- ✅ Responsive design trên mobile (portrait)
- ✅ Header thu gọn
- ✅ Map chiếm toàn màn hình
- ✅ Nút "Theo dõi bão" vẫn hiển thị

**Cách chụp**:
1. Mở DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Chọn iPhone 12 Pro hoặc tương tự
4. Orientation: Portrait
5. Chụp ảnh

**Tên file**: `12-mobile-portrait.png`

---

### 1️⃣3️⃣ **Mobile View - Landscape**
📍 **URL**: `http://localhost:5173/`

**Nội dung cần có trong ảnh**:
- ✅ Responsive design trên mobile (landscape)
- ✅ Layout điều chỉnh cho màn hình ngang
- ✅ Map và controls vừa vặn

**Cách chụp**:
1. DevTools device mode
2. Orientation: Landscape
3. Chụp ảnh

**Tên file**: `13-mobile-landscape.png`

---

### 1️⃣4️⃣ **Dark Mode** (Nếu có)
📍 **URL**: `http://localhost:5173/`

**Nội dung cần có trong ảnh**:
- ✅ Theme tối
- ✅ Bản đồ với dark tiles
- ✅ UI elements màu tối

**Cách chụp**:
1. Click nút toggle theme (nếu có)
2. Hoặc thay đổi trong DevTools
3. Chụp ảnh

**Tên file**: `14-dark-mode.png`

---

## 📝 CHECKLIST CHỤP ẢNH

### Trước khi chụp:
- [ ] Dev server đang chạy (`npm run dev`)
- [ ] API backend đang hoạt động (Ngrok URL: `https://meadow-proexperiment-tobie.ngrok-free.dev`)
- [ ] Test API với: `GET /get-recent-storms` (phải trả về dữ liệu)
- [ ] Test API với: `POST /predict` (phải chấp nhận 9 điểm dữ liệu)
- [ ] Dữ liệu bão đã load thành công (thấy 3 cơn bão trên map)
- [ ] Browser zoom = 100%
- [ ] Không có console errors (F12 để kiểm tra)
- [ ] Đóng các tab/window không cần thiết
- [ ] Chuẩn bị sẵn dữ liệu mẫu 9 điểm để test prediction

### Khi chụp:
- [ ] Resolution: Tối thiểu 1920x1080
- [ ] Format: PNG (không nén)
- [ ] Không có watermark
- [ ] Không có cursor chuột (trừ khi cần thiết)
- [ ] Không có DevTools hiển thị (trừ mobile view)
- [ ] Màu sắc rõ nét, không bị mờ

### Sau khi chụp:
- [ ] Kiểm tra tên file đúng format
- [ ] Kiểm tra nội dung đầy đủ
- [ ] Lưu vào thư mục `docs/images/`
- [ ] Tối ưu kích thước file (nếu cần)

---

## 🛠️ CÔNG CỤ CHỤP ẢNH

### Windows:
- **Snipping Tool**: Win + Shift + S
- **Full screenshot**: PrtScn
- **ShareX**: Tool chuyên nghiệp (free)

### Mac:
- **Full screen**: Cmd + Shift + 3
- **Selection**: Cmd + Shift + 4
- **Window**: Cmd + Shift + 4 + Space

### Browser Extensions:
- **Awesome Screenshot**
- **Nimbus Screenshot**
- **Full Page Screen Capture**

---

## 📂 TỔ CHỨC FILE

Sau khi chụp xong, tổ chức như sau:

```
docs/
├── images/
│   ├── 01-homepage-overview.png
│   ├── 02-storm-detail-view.png
│   ├── 03-tooltip-information.png
│   ├── 04-sidebar-storm-list.png
│   ├── 05-sidebar-storm-detail.png
│   ├── 06-prediction-form-9-points.png      ⭐ CẬP NHẬT
│   ├── 07-prediction-result-cyan-path.png   ⭐ CẬP NHẬT
│   ├── 08-influence-zone-closeup.png
│   ├── 09-three-storms-comparison.png
│   ├── 10-marker-size-variation.png
│   ├── 11-loading-state.png
│   ├── 12-mobile-portrait.png
│   ├── 13-mobile-landscape.png
│   └── 14-dark-mode.png
│
├── _index-vi.md (cập nhật với đường dẫn ảnh)
└── _index.md (English version)
```

---

## 🔄 CẬP NHẬT DOCUMENTATION

Sau khi có ảnh, cập nhật file `docs/_index-vi.md`:

```markdown
### 3.1 Theo Dõi Bão Thời Gian Thực

![Trang chủ - Tổng quan](./images/01-homepage-overview.png)

### 3.2 Trực Quan Hóa Bão

![Chi tiết cơn bão](./images/02-storm-detail-view.png)

### 3.3 Hiển Thị Thông Tin Bão

![Tooltip thông tin](./images/03-tooltip-information.png)

// ... và tiếp tục cho các ảnh khác
```

---

## ✅ HOÀN THÀNH

Sau khi chụp đủ 14 ảnh:
1. ✅ Kiểm tra lại tất cả ảnh
2. ✅ Đặt tên file đúng format
3. ✅ Lưu vào `docs/images/`
4. ✅ Cập nhật `_index-vi.md`
5. ✅ Commit & push lên Git

---

**Chúc bạn chụp ảnh thành công!** 📸✨


---

## 🎓 HƯỚNG DẪN CHI TIẾT: CHỤP ẢNH FORM DỰ ĐOÁN 9 ĐIỂM

### Bước 1: Chuẩn Bị Dữ Liệu

**Tạo file `test-data.txt`** với nội dung sau để dễ copy:

```
2025-10-01T00:00
15.5
110.5
85
995

2025-10-01T06:00
15.8
110.8
90
992

2025-10-01T12:00
16.1
111.2
95
990

2025-10-01T18:00
16.5
111.6
100
988

2025-10-02T00:00
16.9
112.0
105
985

2025-10-02T06:00
17.3
112.5
110
983

2025-10-02T12:00
17.8
113.0
115
980

2025-10-02T18:00
18.2
113.5
120
978

2025-10-03T00:00
18.7
114.0
125
975
```

### Bước 2: Mở Form Dự Đoán

1. Vào `http://localhost:5173/`
2. Click nút "Theo dõi bão" (icon mắt) ở header
3. Sidebar sẽ mở ra bên phải
4. Click tab "Dự đoán" (tab thứ 2)
5. Form sẽ hiển thị với 1 dòng mặc định

### Bước 3: Thêm Đủ 9 Dòng

1. Click nút "Thêm dòng" 8 lần (để có tổng 9 dòng)
2. Hoặc form có thể tự động thêm dòng khi bạn nhập

### Bước 4: Nhập Dữ Liệu

**Cách 1: Nhập thủ công**
- Copy từng giá trị từ file `test-data.txt`
- Paste vào từng ô input tương ứng
- Lặp lại cho cả 9 dòng

**Cách 2: Nhập nhanh** (nếu form hỗ trợ)
- Một số form có thể paste cả block dữ liệu
- Thử paste toàn bộ và xem form tự động điền

### Bước 5: Kiểm Tra Dữ Liệu

Đảm bảo:
- ✅ Có đúng 9 dòng
- ✅ Tất cả các ô đều đã điền
- ✅ Datetime đúng format ISO (YYYY-MM-DDTHH:mm)
- ✅ Latitude trong khoảng 15-19
- ✅ Longitude trong khoảng 110-115
- ✅ Windspeed tăng dần (85 → 125)
- ✅ Pressure giảm dần (995 → 975)

### Bước 6: Chụp Ảnh Form

1. Scroll để thấy tất cả 9 dòng (hoặc ít nhất 7-8 dòng)
2. Đảm bảo thấy:
   - Header "Dự đoán đường đi bão"
   - Hướng dẫn "Nhập ít nhất 9 điểm"
   - Tất cả các dòng dữ liệu
   - Nút "Chạy Dự Đoán" ở cuối
3. Chụp ảnh: `06-prediction-form-9-points.png`

### Bước 7: Chạy Dự Đoán

1. Click nút "Chạy Dự Đoán" (màu xanh)
2. Loading spinner sẽ hiển thị
3. Đợi 2-5 giây
4. Nếu thành công:
   - Toast "Dự đoán thành công!" xuất hiện
   - Đường cyan hiển thị trên map
   - Map tự động zoom vào vùng dự đoán

### Bước 8: Chụp Ảnh Kết Quả

1. Đợi map zoom xong
2. Đảm bảo thấy:
   - Đường cyan rõ ràng
   - Toast notification (nếu còn hiển thị)
   - Cả 9 điểm input và đường dự đoán
3. Chụp ảnh: `07-prediction-result-cyan-path.png`

### Xử Lý Lỗi

**Lỗi: "Cần ít nhất 9 dòng dữ liệu"**
- Kiểm tra lại số dòng
- Đảm bảo không có dòng trống

**Lỗi: "Invalid datetime format"**
- Format phải là: `YYYY-MM-DDTHH:mm`
- Ví dụ: `2025-10-01T00:00`

**Lỗi: "API request failed"**
- Kiểm tra backend có đang chạy không
- Test API với Postman/curl
- Kiểm tra Ngrok URL còn hoạt động không

**Lỗi: "Invalid coordinates"**
- Latitude: -90 đến 90
- Longitude: -180 đến 180

---

## 💡 TIPS & TRICKS

### Tip 1: Tạo Bookmark Dữ Liệu
Lưu dữ liệu mẫu vào bookmark để dễ truy cập:
```javascript
javascript:(function(){
  const data = [
    ["2025-10-01T00:00","15.5","110.5","85","995"],
    ["2025-10-01T06:00","15.8","110.8","90","992"],
    // ... 7 dòng còn lại
  ];
  // Auto-fill form
})();
```

### Tip 2: Sử Dụng DevTools Console
```javascript
// Paste vào console để auto-fill
const rows = document.querySelectorAll('.prediction-row');
const data = [
  ["2025-10-01T00:00","15.5","110.5","85","995"],
  // ... data
];
rows.forEach((row, i) => {
  const inputs = row.querySelectorAll('input');
  inputs[0].value = data[i][0]; // datetime
  inputs[1].value = data[i][1]; // lat
  inputs[2].value = data[i][2]; // lng
  inputs[3].value = data[i][3]; // wind
  inputs[4].value = data[i][4]; // pressure
});
```

### Tip 3: Kiểm Tra API Trước
```bash
# Test GET endpoint
curl -H "ngrok-skip-browser-warning: true" \
  https://meadow-proexperiment-tobie.ngrok-free.dev/get-recent-storms

# Test POST endpoint
curl -X POST \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true" \
  -d '[{"datetime":"2025-10-01T00:00","latitude":"15.5","longitude":"110.5","windspeed":"85","pressure":"995"}]' \
  https://meadow-proexperiment-tobie.ngrok-free.dev/predict
```

### Tip 4: Chụp Ảnh Chất Lượng Cao
- Sử dụng browser zoom 100% (Ctrl+0)
- Tắt bookmark bar (Ctrl+Shift+B)
- Fullscreen mode (F11)
- Sử dụng PNG format (không nén)
- Resolution tối thiểu 1920x1080

---

**Chúc bạn chụp ảnh thành công!** 📸🌪️✨
