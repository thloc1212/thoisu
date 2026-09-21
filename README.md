# Điểm Tin Tuần Thứ 3 - Tháng 9/2026 (14/09/2026 — 20/09/2026)
### Interactive Editorial Presentation & Digital Magazine

Website tĩnh được thiết kế theo phong cách **interactive editorial presentation / slide deck** dành cho Bản tin tuần từ 14/09/2026 đến 20/09/2026. Giao diện trang nghiêm, chính thống, hiện đại và giàu tính nghệ thuật thị giác.

---

## 🌟 Tính năng nổi bật

1. **Trải nghiệm Slide Deck & Scrollytelling**:
   - Mỗi tin tức được trình bày như một slide/chương riêng biệt với nhịp thị giác (visual pacing) độc đáo.
   - Bố cục biến chuyển theo từng chủ đề: Khung chính sách phát triển, Slide tưởng niệm liệt sĩ, Infographic 9 đô thị trung ương, Công nghệ AI & nano vật lý, Đổi mới & hoàn thiện sách giáo khoa, Ngoại giao cấp cao Đại hội đồng LHQ & Canada, Tắt sóng 2G sang 4G/5G, Nhịp tim ASIAD 20 Nagoya, Ngoại giao an ninh hạ tầng, và Quỹ đạo vệ tinh radar SAR Trường Chinh-2D.
   - Cuộn trang mượt mà (CSS scroll-snap proximity trên desktop, native touch scroll trên mobile).

2. **Dữ liệu động hoàn toàn từ CSV (`data/news.csv`)**:
   - Trình phân tích CSV chuẩn RFC 4180 xử lý an toàn dấu tiếng Việt, UTF-8 BOM, dấu ngoặc kép và ngắt dòng.
   - Bảo mật: Render an toàn qua `textContent`, kiểm tra protocol URL (`http:`, `https:`).
   - Tuyệt đối không hard-code nội dung tin vào HTML.

3. **Tương tác biên tập (Micro-interactions)**:
   - Thanh tiến độ đọc (Reading Progress Bar) gắn cố định đỉnh trang.
   - Bộ đếm slide trực tiếp (`05 / 10`), chuyển đổi tông màu thanh điều hướng khi qua các slide tối.
   - Bảng xem chi tiết (Detail Slide-over Drawer) hỗ trợ phím ESC, bẫy tiêu điểm (focus trap) và liên kết nguồn chính thống mở tab mới.
   - Mục lục tương tác (Table of Contents) cho phép nhảy nhanh đến từng tin.
   - Điều hướng bàn phím: Phím mũi tên lên/xuống, PageUp/PageDown, Home, End, ESC.
   - Hỗ trợ đầy đủ `@media (prefers-reduced-motion: reduce)`.

4. **Hệ thống Asset & Placeholder thông minh**:
   - Hỗ trợ đa tầng fallback: Ảnh gốc `.webp` ➔ Minh họa vector chuyên đề `.svg` ➔ Placeholder chuẩn.

---

## 📁 Cấu trúc thư mục

```text
.
├── index.html                  # Trang trình diễn chính (HTML5 ngữ nghĩa, chuẩn accessibility)
├── styles.css                  # Bảng kiểu biên tập (Art Direction, Typography, Responsive)
├── app.js                      # Động cơ phân tích CSV, điều hướng slide, quản lý drawer
├── README.md                   # Hướng dẫn chi tiết sử dụng & triển khai
│
├── data/
│   └── news.csv                # Dữ liệu 8 bản tin tuần (STT, Tiêu đề, Nội dung chính, Chi tiết, Link)
│
└── assets/
    ├── fonts/
    │   ├── heading-font.woff2  # Font tiêu đề tùy chỉnh (tự động fallback sang Playfair/Serif)
    │   ├── body-font.woff2     # Font thân bài tùy chỉnh (tự động fallback sang Be Vietnam Pro/Sans)
    │   └── README.txt
    │
    ├── images/
    │   ├── cover.webp          # Ảnh trang bìa (tùy chọn)
    │   ├── news-01.webp        # Ảnh tin 01 (tùy chọn)
    │   ├── news-02.webp        # Ảnh tin 02 ...
    │   └── ...
    │
    └── placeholders/
        ├── logo-placeholder.svg
        ├── cover-placeholder.svg / .webp
        ├── news-placeholder.svg / .webp
        ├── news-01-art.svg     # Minh họa biên tập chuyên đề tin 01
        ├── news-02-art.svg     # Minh họa biên tập chuyên đề tin 02
        └── ...
```

---

## 🚀 Hướng dẫn chạy Local

Website là một **trang web tĩnh 100% (Pure HTML/CSS/Vanilla JS)**. Bạn có thể mở và xem theo các cách sau:

### Cách 1: Sử dụng máy chủ nội bộ bất kỳ (khuyến nghị để tránh hạn chế CORS của fetch khi dùng `file://`)
```bash
# Sử dụng Python 3:
python3 -m http.server 3000

# Hoặc sử dụng Node npx serve:
npx serve .

# Hoặc sử dụng extension Live Server trên VS Code
```
Truy cập trình duyệt tại: `http://localhost:3000`

### Cách 2: Sử dụng Vite (nếu đang ở môi trường phát triển)
```bash
npm run dev
```

---

## ✍️ Hướng dẫn tùy biến nội dung & Asset

### 1. Cập nhật dữ liệu tin tức (`data/news.csv`)
File CSV sử dụng bảng mã UTF-8 với các cột:
```csv
STT,Tiêu đề,Nội dung chính,Nội dung chi tiết,Link
```
- Nếu tiêu đề hoặc nội dung có dấu phẩy hoặc xuống dòng, hãy đặt trong cặp dấu ngoặc kép `""`.
- Khi cập nhật nội dung mới, website sẽ tự động đọc, tính toán số lượng tin và cập nhật bộ đếm cũng như mục lục tương ứng.

### 2. Thêm hoặc thay đổi hình ảnh
Chỉ cần đặt file ảnh vào thư mục `assets/images/` theo đúng quy ước:
- Trang bìa: `assets/images/cover.webp`
- Tin số 1: `assets/images/news-01.webp`
- Tin số 2: `assets/images/news-02.webp`
- ... (định dạng ảnh được hỗ trợ: `.webp`, hoặc có thể đổi đường dẫn sang `.jpg`, `.png`).
*Lưu ý: Nếu chưa có ảnh thực tế, hệ thống sẽ tự động hiển thị tác phẩm minh họa vector nghệ thuật tương ứng từ `assets/placeholders/`.*

### 3. Thay đổi Logo
- Đặt file logo của bạn vào: `assets/images/logo.png`
- Hoặc chỉnh sửa trực tiếp file vector: `assets/placeholders/logo-placeholder.svg`

### 4. Thay đổi Font chữ riêng
- Đặt 2 file font định dạng web vào thư mục `assets/fonts/`:
  - `assets/fonts/heading-font.woff2` (dành cho tiêu đề)
  - `assets/fonts/body-font.woff2` (dành cho nội dung thân bài)
- File `styles.css` đã được khai báo sẵn `@font-face` trỏ tới 2 file này, tự động kích hoạt ngay khi bạn thả file font vào.

---

## 🌐 Triển khai lên Vercel

Dự án đã có `vercel.json`, dùng Node.js 22 và được cấu hình để Vercel chạy `npm ci`, `npm run build`, sau đó phát hành thư mục `dist`. Website là trang tĩnh nên **không cần khai báo biến môi trường**.

1. Đẩy toàn bộ mã nguồn (bao gồm `package-lock.json`) lên GitHub.
2. Truy cập [vercel.com](https://vercel.com), đăng nhập và chọn **Add New → Project**.
3. Import repository vừa đẩy lên. Vercel sẽ nhận diện **Framework Preset: Vite** từ cấu hình có sẵn.
4. Giữ **Root Directory** là `./`; không thêm Environment Variables.
5. Nhấn **Deploy**.

Mỗi lần bạn cập nhật nhánh được Vercel theo dõi, website sẽ tự động build và phát hành lại. Có thể kiểm tra bản production ngay trên máy bằng:

```bash
npm ci
npm run build
npm run preview
```
