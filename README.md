# VAST · Dashboard 12 tạp chí khoa học

Website tĩnh giới thiệu 12 tạp chí thuộc Viện Hàn lâm Khoa học và Công nghệ Việt Nam (VAST).

- **VAST-1**: 7 tạp chí có dữ liệu Scopus trong bản đối chiếu: VJM, AMV, ANSN, VJC, VJES, VJST, CIP. Trạng thái Web of Science phải xem riêng theo từng bộ chỉ mục, không suy ra từ nhóm này.
- **VAST-2**: VJMech, JCC, AJB, VJMST, VJBT. Chỉ số 4 năm tự tính không phải CiteScore chính thức của Scopus.
- `data-scopus.json`: bản lịch sử được bảo vệ bằng SHA-256, gồm 84 quan sát CiteScore và Tracker. Đúng công thức không đồng nghĩa đã xác minh lại nguồn trực tuyến.
- `evidence/`: hồ sơ, nguồn kho lưu trữ, bằng chứng chỉ mục và đối soát dữ liệu. Khoảng năm và mức độ đầy đủ khác nhau giữa các tạp chí; năm hiện tại là số liệu đến ngày chốt, không phải cả năm.
- `data/dashboard.json` và `data/snapshots/`: dữ liệu sinh từ các đầu vào nêu trên.

## Giao diện

Một hướng thiết kế tham khảo ArtCraft, hỗ trợ sáng/tối và font cục bộ. Hiệu ứng chữ theo vị trí cuộn có trên bốn phần trang chính và các mục trong hồ sơ tạp chí. Chế độ giảm chuyển động dùng chữ đứng yên; màn hình nhỏ ẩn lớp chữ bay. Chuỗi thống kê theo năm, bảng số liệu và tổng số bài/số kỳ xuất bản trên giao diện dùng giai đoạn từ 2015 trở đi; ba biểu đồ trong hồ sơ cùng tuân theo khoảng năm đã chọn. Không hiển thị số đếm “bao nhiêu năm có dữ liệu”. Dữ liệu nguồn trước 2015 được giữ nguyên để đối chiếu, còn mốc lịch sử thành lập/đổi tên không bị giới hạn bởi cửa sổ thống kê.

Bìa tạp chí trong quỹ đạo mở đầu, bảng chỉ số, danh mục và hồ sơ dùng chiều cao tự động theo tỷ lệ ảnh gốc, nền khung trong suốt; không ép chung chiều cao gây dải trắng trên/dưới, không kéo méo hoặc cắt bìa. Quy tắc này áp dụng cả desktop và mobile.

Sáu logo VAST, NXB, Viện Toán học, Springer, IOP và Wiley dùng các file PNG do người dùng cung cấp trong `assets/images/logos/`; ảnh gốc không bị ghi đè. Giao diện sáng giữ nguyên ảnh gốc. Ở giao diện tối: Viện Toán học và Wiley chuyển trắng bằng CSS; IOP chỉ đổi chữ Publishing thành trắng, giữ phần IOP đỏ; Springer đổi chữ và hình ngựa thành trắng, giữ nguyên gạch cam. Hai biến thể `iop-dark.png` và `springer-dark.png` giữ kích thước/kênh alpha gốc và có SHA-256, nguồn cùng mô tả xử lý trong `evidence/dashboard-media.json`. VAST và NXB không đổi màu. Khi thay artwork, cập nhật metadata và biến thể tối tương ứng, sau đó dựng lại dữ liệu dashboard.

Danh mục không có bảng xếp hạng CiteScore riêng. Xem số liệu, biểu đồ và nguồn minh chứng trong hồ sơ từng tạp chí. Tên NXB trên thẻ ngắt thành hai dòng “NXB Khoa học tự nhiên” / “và Công nghệ”; giữ nguyên từng dòng, đối tác đồng xuất bản đặt ở dòng riêng, không giảm cỡ chữ. Kỳ hạn xuất bản đọc từ `frequency.issuesPerYear`; thiếu dữ liệu thì hiện “Chưa có thông tin”. AMV có liên kết bổ sung đến mục lục và các số truy cập mở của Viện Toán học. Liên kết chỉ mục phân biệt nguồn cơ sở dữ liệu và thông tin do tạp chí công bố.

Minh chứng chỉ mục WoS phải liên kết trực tiếp tới `mjl.clarivate.com/search-results` theo ISSN của hồ sơ MJL, không dùng trang VAST, trang tạp chí hay JSON nội bộ làm minh chứng. Đã đọc trực tiếp MJL ngày 22/10/2026: VJM, AMV, ANSN, VJC và VJES thuộc ESCI; AJB có Zoological Record nhưng không thuộc Core Collection. Liên kết AJB đặt bộ lọc `index=Zoological%20Record` để không bị bộ lọc Core Collection mặc định che kết quả. VJC dùng ISSN MJL `0866-7144`; VJES được MJL ghi `0866-7187 / 2615-9783`, không ghi đè các định danh hiện tại của dashboard. VJST, CIP, VJMech, JCC, VJMST và VJBT hiển thị “Chưa được chỉ mục” (`not_listed`): đã chọn đủ 18 bộ chỉ mục trên giao diện MJL, tra cứu ISSN, eISSN và ISSN cũ có trong hồ sơ, đều trả về 0 kết quả. Ghi rõ ngày kiểm tra và các định danh đã tra cứu; liên kết đặt đủ các bộ lọc đã dùng. Tìm theo tên có thể trả về các tạp chí gần tên nhưng khác ISSN, không được nhận nhầm là cùng tạp chí. Số liệu JIF/JCI và xếp hạng theo năm vẫn có nguồn riêng là báo cáo Clarivate JCR do người dùng cung cấp; MJL chỉ được dùng làm minh chứng chỉ mục.

## Lịch sử và lãnh đạo tạp chí

`evidence/dashboard-journal-origins.json` bổ sung lịch sử phát triển và các nhiệm kỳ lãnh đạo cho 12 hồ sơ. Phần của 11 tạp chí do NXB quản lý được trích, diễn giải từ kỷ yếu 20 năm do người dùng cung cấp; số đoạn tham chiếu là vị trí trong `word/document.xml`, không phải số trang. AMV không có chương riêng trong kỷ yếu nên lịch sử và nhiệm kỳ được đối chiếu với trang chính thức của Viện Toán học. Không đưa số liệu trắc lượng hoặc tuyên bố chỉ mục trong kỷ yếu vào các bảng WoS/Scopus đã có nguồn riêng.

Ảnh trong `assets/images/editors/` gồm ảnh nhúng từ kỷ yếu và bốn chân dung AMV do người dùng cung cấp: Ngô Việt Trung, Nguyễn Tự Cường, Đinh Nho Hào, Đoàn Trung Cường. Tệp ảnh giữ toàn khung, không phóng lớn khi chuyển WebP; trên giao diện, tất cả chân dung dùng khung 84 × 112 px (tỉ lệ 3:4), `object-fit: cover`, căn phía trên để ưu tiên khuôn mặt. Manifest ghi SHA-256, kích thước và nguồn; ảnh từ DOCX có đoạn ảnh/chú thích ghép đúng cột, ảnh tải lên dùng nguồn `user-editor-portraits`, không gán đoạn trong sách. Trường hợp thiếu ảnh chỉ hiển thị tên và chức danh; thiếu nhiệm kỳ không tự điền năm. Mốc đầu nhiệm kỳ Nguyễn Văn Đạo chưa thống nhất nên giao diện chỉ ghi thời điểm kết thúc “Đến năm 2006”; ghi chú mâu thuẫn vẫn giữ trong hồ sơ nguồn. Tệp Word và ảnh gốc không bị chỉnh sửa.

Giao diện dành cho độc giả không hiển thị tên file/thư mục, số đoạn Word, số trang PDF, nhật ký truy vấn/đối soát hoặc ghi chú xử lý nguồn. Các thông tin đó chỉ giữ trong `evidence/` và dữ liệu đối chiếu; không chèn vào lịch sử, thẻ Tổng biên tập (nhãn mục “LÃNH ĐẠO TẠP CHÍ”), bảng JCR hoặc danh mục tham khảo. Mục “Chỉ mục khoa học” trên hồ sơ tạp chí chỉ hiển thị các chỉ mục đã có thông tin xác nhận trong danh mục (`status: "listed"`), không đưa vào các dòng “Chưa có trong danh mục” hoặc “Chưa có thông tin xác nhận”. Giao diện vẫn giữ phạm vi/năm thống kê, giới hạn và ý nghĩa chỉ số, phân biệt dữ liệu thiếu với số 0 và liên kết công khai Scopus, Clarivate MJL, DOAJ, ACI, trang tạp chí và kho lưu trữ. Tham khảo bổ sung chỉ dẫn đến nguồn web công khai.

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

Mở `http://127.0.0.1:8765/`. Kiểm tra 12 hồ sơ, bộ lọc, nguồn chỉ mục, kho lưu trữ AMV và chuyển mục bằng menu góc phải. Thử cả sáng/tối, màn hình hẹp và tùy chọn giảm chuyển động. Trên mobile, kiểm tra sáu mục điều hướng của hồ sơ và bấm lại mục đang chọn sau khi cuộn ra chỗ khác: trang phải trở về đúng mục đó. Các lỗi chất lượng dữ liệu cần được ghi nhận cùng nguồn và phạm vi, không chỉ kiểm tra đồng bộ JSON.
