# VAST · Dashboard theo dõi danh mục tạp chí

Dashboard công khai theo dõi **12 tạp chí thuộc Viện Hàn lâm Khoa học và Công nghệ Việt Nam (VAST)**:

- **4 chế độ xem trên một trang**: Tổng quan (`#overview`), Danh mục tạp chí (`#journals`), Xu hướng (`#trends`), Nguồn & cập nhật (`#updates`), cùng hồ sơ từng tạp chí (`#journal/<id>`).
- **Nguồn chính thức giữ nguyên**: `data-scopus.json` giữ nguyên 84 bản ghi của 7 tạp chí (CiteScore 2015–2025 và CiteScoreTracker 2026 cập nhật tại nguồn ngày `05/10/2026`).
- **Sản lượng xuất bản**: đếm bài nghiên cứu, tổng quan và thông báo ngắn trong các số đã phát hành từ kho lưu trữ chính thức (không đếm bìa, mục lục, xã luận, thông báo, đính chính hay bài Online First chưa vào số).
- **Bộ số liệu đã thu thập (`09` và `09a–09h`)**: cung cấp số tài liệu trích dẫn đã xác nhận, lượt trích dẫn đã xác nhận và chỉ số 4 năm tự tính cho 9 tạp chí. Các chỉ số tự tính được tách riêng, không thay thế CiteScore hay Tracker chính thức của Scopus.

## Cấu trúc dữ liệu

- `data-scopus.json`: bản đối chiếu Scopus chính thức (bất biến, kiểm tra bằng SHA-256).
- `evidence/dashboard-*.json`: hồ sơ, chỉ mục, danh sách số đã phát hành và kết quả đối soát từ các bộ thu thập.
- `data/dashboard.json`: bộ dữ liệu chuẩn hóa mà giao diện nạp trực tiếp.
- `data/snapshots/<snapshot-id>.json`: bản lưu theo kỳ cập nhật.
- `tools/build-dashboard.mjs`: công cụ tích hợp và kiểm tra tính toàn vẹn dữ liệu.

## Quy trình cập nhật và kiểm tra

1. Cập nhật tệp bằng chứng tương ứng trong `evidence/` khi có kỳ phát hành mới hoặc bản đối chiếu mới.
2. Tạo lại `data/dashboard.json` và bản snapshot:

```sh
node tools/build-dashboard.mjs --write
```

3. Kiểm tra đồng bộ dữ liệu và cú pháp mã nguồn:

```sh
node tools/build-dashboard.mjs
node --check assets/dashboard.js
```

4. Mở thử giao diện qua máy chủ tĩnh cục bộ:

```sh
python -m http.server 8765 --bind 127.0.0.1
```
