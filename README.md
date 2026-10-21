# VAST · Dashboard theo dõi danh mục tạp chí khoa học

Dashboard công khai theo dõi **12 tạp chí thuộc Viện Hàn lâm Khoa học và Công nghệ Việt Nam (VAST)** được phân thành 2 nhóm:

- **Nhóm `VAST-1` (7 tạp chí đã vào Scopus / Web of Science Core Collection)**: `VJM`, `AMV`, `ANSN`, `VJC`, `VJES`, `VJST`, `CIP`. Sử dụng CiteScore (2015–2025) và CiteScoreTracker (2026) chính thức từ Scopus.
- **Nhóm `VAST-2` (5 tạp chí chưa vào Scopus / Web of Science Core Collection)**: `VJMech`, `JCC`, `AJB`, `VJMST`, `VJBT`. Sử dụng chỉ số CiteScore dự kiến (4 năm tự tính theo cửa sổ trích dẫn).
- **Quy mô xuất bản (2020–2026)**: đếm bài nghiên cứu, tổng quan và thông báo ngắn trong các số đã phát hành từ kho lưu trữ chính thức của cả 12 tạp chí (không đếm bìa, mục lục, xã luận, thông báo, đính chính hay bài Online First chưa vào số).
- **50 giao diện thương hiệu quốc tế**: hỗ trợ chuyển đổi trực tiếp màu sắc, hệ font chữ, cấu trúc bố cục trang (10 Macro Layouts) và hình học biểu đồ (7 kiểu biểu đồ SVG + 5 kiểu bảng đối sánh).

## Quy trình cập nhật và kiểm tra

1. Tạo lại `data/dashboard.json` và bản snapshot:

```sh
node tools/build-dashboard.mjs --write
```

2. Kiểm tra đồng bộ dữ liệu và cú pháp mã nguồn:

```sh
node tools/build-dashboard.mjs
node --check assets/dashboard.js
```

3. Mở thử giao diện qua máy chủ tĩnh cục bộ:

```sh
python -m http.server 8765 --bind 127.0.0.1
```
