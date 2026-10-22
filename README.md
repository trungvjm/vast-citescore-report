# VAST · Dashboard 12 tạp chí khoa học

Website tĩnh giới thiệu 12 tạp chí thuộc Viện Hàn lâm Khoa học và Công nghệ Việt Nam (VAST).

- **VAST-1**: 7 tạp chí có dữ liệu Scopus trong bản đối chiếu: VJM, AMV, ANSN, VJC, VJES, VJST, CIP. Trạng thái Web of Science phải xem riêng theo từng bộ chỉ mục, không suy ra từ nhóm này.
- **VAST-2**: VJMech, JCC, AJB, VJMST, VJBT. Chỉ số 4 năm tự tính không phải CiteScore chính thức của Scopus.
- `data-scopus.json`: bản lịch sử được bảo vệ bằng SHA-256, gồm 84 quan sát CiteScore và Tracker. Đúng công thức không đồng nghĩa đã xác minh lại nguồn trực tuyến.
- `evidence/`: hồ sơ, nguồn kho lưu trữ, bằng chứng chỉ mục và đối soát dữ liệu. Khoảng năm và mức độ đầy đủ khác nhau giữa các tạp chí; năm hiện tại là số liệu đến ngày chốt, không phải cả năm.
- `data/dashboard.json` và `data/snapshots/`: dữ liệu sinh từ các đầu vào nêu trên.

## Giao diện

Một hướng thiết kế tham khảo ArtCraft, hỗ trợ sáng/tối và font cục bộ. Hiệu ứng chữ theo vị trí cuộn có trên bốn phần trang chính và các mục trong hồ sơ tạp chí. Chế độ giảm chuyển động dùng chữ đứng yên; màn hình nhỏ ẩn lớp chữ bay. Các biểu đồ thống kê và bộ chọn năm chỉ hiển thị từ năm 2015 trở đi; ba biểu đồ trong hồ sơ cùng tuân theo khoảng năm đã chọn. Bảng dữ liệu lịch sử và số liệu tổng toàn kỳ vẫn giữ các năm trước 2015, không xóa dữ liệu nguồn.

Bìa tạp chí trong quỹ đạo mở đầu, bảng chỉ số, danh mục và hồ sơ dùng chiều cao tự động theo tỷ lệ ảnh gốc, nền khung trong suốt; không ép chung chiều cao gây dải trắng trên/dưới, không kéo méo hoặc cắt bìa. Quy tắc này áp dụng cả desktop và mobile.

Sáu logo VAST, NXB, Viện Toán học, Springer, IOP và Wiley dùng các file PNG do người dùng cung cấp trong `assets/images/logos/`. Chỉ logo Viện Toán học chuyển thành màu trắng ở giao diện tối bằng CSS; giao diện sáng dùng màu ảnh gốc. Các logo còn lại giữ nguyên màu ở cả hai giao diện. Khi thay artwork, cập nhật đường dẫn, kích thước và SHA-256 trong `evidence/dashboard-media.json`, sau đó dựng lại dữ liệu dashboard.

Danh mục không có bảng xếp hạng CiteScore riêng. Xem số liệu, biểu đồ và nguồn minh chứng trong hồ sơ từng tạp chí. Tên đơn vị xuất bản trên thẻ tạp chí dùng `text-wrap: balance` để cân dòng, tránh chữ cuối đứng lẻ mà không giảm cỡ chữ. Kỳ hạn xuất bản đọc từ `frequency.issuesPerYear`; thiếu dữ liệu thì hiện “Chưa có thông tin”. AMV có liên kết bổ sung đến mục lục và các số truy cập mở của Viện Toán học. Liên kết chỉ mục phân biệt nguồn cơ sở dữ liệu và thông tin do tạp chí công bố.

Minh chứng chỉ mục WoS phải liên kết trực tiếp tới `mjl.clarivate.com/search-results` theo ISSN của hồ sơ MJL, không dùng trang VAST, trang tạp chí hay JSON nội bộ làm minh chứng. Đã đọc trực tiếp MJL ngày 22/10/2026: VJM, AMV, ANSN, VJC và VJES thuộc ESCI; AJB có Zoological Record nhưng không thuộc Core Collection. Liên kết AJB đặt bộ lọc `index=Zoological%20Record` để không bị bộ lọc Core Collection mặc định che kết quả. VJC dùng ISSN MJL `0866-7144`; VJES được MJL ghi `0866-7187 / 2615-9783`, không ghi đè các định danh hiện tại của dashboard. VJST, CIP, VJMech, JCC, VJMST và VJBT hiển thị “Chưa được chỉ mục” (`not_listed`): đã chọn đủ 18 bộ chỉ mục trên giao diện MJL, tra cứu ISSN, eISSN và ISSN cũ có trong hồ sơ, đều trả về 0 kết quả. Ghi rõ ngày kiểm tra và các định danh đã tra cứu; liên kết đặt đủ các bộ lọc đã dùng. Tìm theo tên có thể trả về các tạp chí gần tên nhưng khác ISSN, không được nhận nhầm là cùng tạp chí. Số liệu JIF/JCI và xếp hạng theo năm vẫn có nguồn riêng là báo cáo Clarivate JCR do người dùng cung cấp; MJL chỉ được dùng làm minh chứng chỉ mục.

## Tạo lại dữ liệu

```sh
node tools/build-dashboard.mjs --write
node tools/build-dashboard.mjs
node --check assets/dashboard.js
```

**Điều kiện:** trình dựng hiện còn đọc các bộ sưu tập cục bộ bên ngoài repo tại đường dẫn `2026/09…` ghi trong `evidence/dashboard-local-*.json`, tính từ thư mục `Others`. Vì vậy bản clone riêng lẻ chưa đủ để dựng lại dữ liệu; không được thay dữ liệu thiếu bằng số 0 hoặc số ước tính.

## Chạy thử

```sh
python -m http.server 8765 --bind 127.0.0.1
```

Mở `http://127.0.0.1:8765/`. Kiểm tra 12 hồ sơ, bộ lọc, nguồn chỉ mục, kho lưu trữ AMV và chuyển mục bằng menu góc phải. Thử cả sáng/tối, màn hình hẹp và tùy chọn giảm chuyển động. Các lỗi chất lượng dữ liệu cần được ghi nhận cùng nguồn và phạm vi, không chỉ kiểm tra đồng bộ JSON.
