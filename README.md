# VAST · Dashboard 12 tạp chí khoa học

Website tĩnh giới thiệu 12 tạp chí thuộc Viện Hàn lâm Khoa học và Công nghệ Việt Nam (VAST) tại `https://trungvjm.github.io/vast-journal-dashboard/`.

- **VAST-1**: 7 tạp chí có dữ liệu Scopus trong bản đối chiếu: VJM, AMV, ANSN, VJC, VJES, VJST, CIP. Trạng thái Web of Science phải xem riêng theo từng bộ chỉ mục, không suy ra từ nhóm này.
- **VAST-2**: VJMech, JCC, AJB, VJMST, VJBT. Chỉ số 4 năm tự tính không phải CiteScore chính thức của Scopus.
- `data-scopus.json`: bản lịch sử được bảo vệ bằng SHA-256, gồm 84 quan sát CiteScore và Tracker. Đúng công thức không đồng nghĩa đã xác minh lại nguồn trực tuyến.
- `evidence/`: hồ sơ, nguồn kho lưu trữ, bằng chứng chỉ mục và đối soát dữ liệu. Khoảng năm và mức độ đầy đủ khác nhau giữa các tạp chí; năm hiện tại là số liệu đến ngày chốt, không phải cả năm.
- `data/dashboard.json` và `data/snapshots/`: dữ liệu sinh từ các đầu vào nêu trên.

## Giao diện

Một hướng thiết kế tham khảo ArtCraft, hỗ trợ sáng/tối và font cục bộ. Hiệu ứng chữ theo vị trí cuộn có trên bốn phần trang chính và các mục trong hồ sơ tạp chí. Chế độ giảm chuyển động dùng chữ đứng yên; màn hình nhỏ ẩn lớp chữ bay. Chuỗi thống kê theo năm, bảng số liệu và tổng số bài/số kỳ xuất bản dùng giai đoạn từ 2015 trở đi, riêng VJST từ 2016 do các số năm 2015 chưa tra cứu trực tuyến được. Bộ chọn năm, biểu đồ, tổng xuất bản và so sánh giữa các tạp chí cùng áp dụng mốc này; VJST năm 2015 là thiếu dữ liệu, không phải số 0. Chỉ số Scopus chính thức và tổng trích dẫn tích lũy từ hồ sơ nguồn giữ nguyên. Ba biểu đồ trong hồ sơ cùng tuân theo khoảng năm đã chọn. Không hiển thị số đếm “bao nhiêu năm có dữ liệu”. Dữ liệu nguồn trước mốc thống kê được giữ để đối chiếu; lịch sử thành lập/đổi tên không bị giới hạn bởi cửa sổ thống kê.

Nội dung dành cho độc giả được rút gọn: bỏ hướng dẫn bấm/di chuột, đoạn dẫn lặp tiêu đề, phần nhận xét diễn giải và các danh sách xếp hạng bên cạnh vốn đã có trong bảng phân ngành đầy đủ. Giữ nguyên lịch sử, lãnh đạo, toàn bộ số liệu và liên kết minh chứng. Các nhãn chính thức/Tracker/tự tính, số liệu chưa đủ năm và phạm vi cửa sổ CiteScore vẫn được phân biệt; thông tin khi trỏ vào biểu đồ chỉ xuất hiện sau tương tác, không chiếm chỗ khi chưa có giá trị.

Trang chính gồm bốn phần theo thứ tự: `01 Tổng quan`, `02 Danh mục tạp chí`, `03 Biểu đồ` (gồm hai bảng đối chiếu CiteScore Scopus / WoS JCR 2025 và bốn biểu đồ tương tác), `04 Tài liệu tham khảo` (định dạng trích dẫn học thuật đánh số `[1]`, `[2]`, …). Mở đầu trang dùng ảnh nền riêng cho từng chế độ: giao diện tối dùng ảnh Dải Ngân Hà ESO (`assets/images/milky-way-eso0932a.jpg`, `evidence/hero-galaxy.json`), giao diện sáng dùng ảnh tinh vân Carina Hubble/CTIO (`assets/images/hero-carina-nebula.webp`, `evidence/hero-light.json`) kèm ghi công tương ứng.

Bìa tạp chí giữ đúng tỷ lệ ảnh gốc, nền khung trong suốt, không kéo méo hoặc cắt bìa. Trong danh mục desktop/tablet, bìa cùng cao 148 px và rộng tự động; mobile giữ rộng 88 px và cao tự động. Các thẻ cùng hàng chia sẻ ba hàng con bằng CSS subgrid (đầu thẻ, vùng bìa/logo, nội dung); vùng tên đơn vị dành tối thiểu ba dòng để căn hàng logo. Không ép đồng thời chiều rộng và chiều cao ảnh gây dải trắng trên/dưới.

Sáu logo VAST, NXB, Viện Toán học, Springer, IOP và Wiley dùng các file PNG do người dùng cung cấp trong `assets/images/logos/`; ảnh gốc không bị ghi đè. Giao diện sáng giữ nguyên ảnh gốc. Ở giao diện tối: Viện Toán học và Wiley chuyển trắng bằng CSS; IOP chỉ đổi chữ Publishing thành trắng, giữ phần IOP đỏ; Springer đổi chữ và hình ngựa thành trắng, giữ nguyên gạch cam. Hai biến thể `iop-dark.png` và `springer-dark.png` giữ kích thước/kênh alpha gốc và có SHA-256, nguồn cùng mô tả xử lý trong `evidence/dashboard-media.json`. VAST và NXB không đổi màu. Khi thay artwork, cập nhật metadata và biến thể tối tương ứng, sau đó dựng lại dữ liệu dashboard.

Danh mục không có bảng xếp hạng CiteScore riêng. Xem số liệu, biểu đồ và nguồn minh chứng trong hồ sơ từng tạp chí. Tên NXB trên thẻ ngắt thành hai dòng “NXB Khoa học tự nhiên” / “và Công nghệ”; giữ nguyên từng dòng, đối tác đồng xuất bản đặt ở dòng riêng, không giảm cỡ chữ. Kỳ hạn xuất bản đọc từ `frequency.issuesPerYear`; thiếu dữ liệu thì hiện “Chưa có thông tin”. AMV có liên kết bổ sung đến mục lục và các số truy cập mở của Viện Toán học. Liên kết chỉ mục phân biệt nguồn cơ sở dữ liệu và thông tin do tạp chí công bố.

Nhãn chỉ số tự tính trên thẻ VAST-2 dùng đầy đủ “CiteScore 2025 (tự tính)” và “CiteScore 2026 (tự tính)”. Không lặp lại dòng “Thống kê 2015–2026” trên thẻ danh mục, nút xem biểu đồ hoặc đầu hồ sơ; các năm vẫn hiển thị trên trục biểu đồ, bộ chọn năm và giai đoạn tính chỉ số. VJC, VJES và VJST có liên kết ACI trực tiếp tới hồ sơ chính thức với jid lần lượt là 11299, 10629 và 10626; không thay thông tin tạp chí hiện tại bằng metadata cũ trong hồ sơ ACI.

Thẻ danh mục không hiển thị tổng số bài. Thẻ có JCR giữ ba ô chỉ số (CiteScore, JIF, Tracker); các thẻ còn lại có hai ô, tự chia đều chiều rộng. Tổng số bài và bảng xuất bản vẫn có trong hồ sơ chi tiết.

Tên phụ trên thẻ chỉ hiển thị khi có tên tiếng Việt khác tên chính; AMV và ANSN không lặp lại tên nguyên bản ở dòng nhỏ. Liên kết mở hồ sơ dùng nhãn “Xem chi tiết”, không kèm mũi tên.

Bảng “CiteScore Scopus theo năm” chỉ hiển thị năm có giá trị CiteScore hữu hạn; giá trị 0 vẫn hợp lệ. Các bản ghi thiếu chỉ số vẫn giữ trong dữ liệu nguồn nhưng không tạo dòng N/A trên bảng này. Tiêu đề bảng CiteScore và bảng số liệu xuất bản/trích dẫn không lặp lại khoảng năm; các năm vẫn có ở từng dòng.

CIP chưa có CiteScore thường niên chính thức nên không hiển thị thứ hạng, phân vị hoặc Quartile Scopus, không suy diễn Q từ Tracker. Dữ liệu phân ngành có xếp hạng của CIP được để trống; các hồ sơ khác giữ nguyên. Trình dựng từ chối xếp hạng phân ngành cho tạp chí chỉ có Tracker mà chưa có CiteScore thường niên chính thức. CiteScore Tracker 2026 và các số liệu trích dẫn/tài liệu của CIP vẫn dùng nguồn Scopus riêng, không bị sửa.

Thông tin tính điểm công trình năm 2025 tại Hội đồng Giáo sư nhà nước (Quyết định số `26/QĐ-HĐGSNN` ngày 11/07/2025) được tổng hợp trong `evidence/dashboard-hdgsnn-2025.json` từ bảng Notion đối chiếu với 17 văn bản danh mục hội đồng ngành, liên ngành (65 cặp tạp chí – hội đồng của cả 12 tạp chí VAST). Điểm hiển thị theo từng hội đồng ở bảng tổng quan phần 01 và bảng chi tiết trong hồ sơ từng tạp chí, kèm khung điểm/điều kiện áp dụng (như mức hai khung `1,25–1,5` của VJST tại Hội đồng Hóa học – Công nghệ thực phẩm) và liên kết tới văn bản danh mục.

Minh chứng chỉ mục WoS phải liên kết trực tiếp tới `mjl.clarivate.com/search-results` theo ISSN của hồ sơ MJL, không dùng trang VAST, trang tạp chí hay JSON nội bộ làm minh chứng. Đã đọc trực tiếp MJL ngày 22/10/2026: VJM, AMV, ANSN, VJC và VJES thuộc ESCI; AJB có Zoological Record nhưng không thuộc Core Collection. Liên kết AJB đặt bộ lọc `index=Zoological%20Record` để không bị bộ lọc Core Collection mặc định che kết quả. VJC dùng ISSN MJL `0866-7144`; VJES được MJL ghi `0866-7187 / 2615-9783`, không ghi đè các định danh hiện tại của dashboard. Trạng thái `not_listed` của VJST, CIP, VJMech, JCC, VJMST và VJBT chỉ giữ trong dữ liệu nguồn, không tạo dòng phủ định trên giao diện: đã chọn đủ 18 bộ chỉ mục trên MJL, tra cứu ISSN, eISSN và ISSN cũ có trong hồ sơ, đều trả về 0 kết quả. Ghi rõ ngày kiểm tra và các định danh đã tra cứu; liên kết đặt đủ các bộ lọc đã dùng. Tìm theo tên có thể trả về các tạp chí gần tên nhưng khác ISSN, không được nhận nhầm là cùng tạp chí. Số liệu JIF/JCI và xếp hạng theo năm vẫn có nguồn riêng là báo cáo Clarivate JCR do người dùng cung cấp; MJL chỉ được dùng làm minh chứng chỉ mục.

## Lịch sử và lãnh đạo tạp chí

`evidence/dashboard-journal-origins.json` bổ sung lịch sử phát triển và các nhiệm kỳ lãnh đạo cho 12 hồ sơ. Phần của 11 tạp chí do NXB quản lý được trích, diễn giải từ kỷ yếu 20 năm do người dùng cung cấp; số đoạn tham chiếu là vị trí trong `word/document.xml`, không phải số trang. AMV không có chương riêng trong kỷ yếu nên lịch sử và nhiệm kỳ được đối chiếu với trang chính thức của Viện Toán học. Không đưa số liệu trắc lượng hoặc tuyên bố chỉ mục trong kỷ yếu vào các bảng WoS/Scopus đã có nguồn riêng.

Ảnh trong `assets/images/editors/` gồm ảnh nhúng từ kỷ yếu và bốn chân dung AMV do người dùng cung cấp: Ngô Việt Trung, Nguyễn Tự Cường, Đinh Nho Hào, Đoàn Trung Cường. Tệp ảnh giữ toàn khung, không phóng lớn khi chuyển WebP; trên giao diện, tất cả chân dung dùng khung 84 × 112 px (tỉ lệ 3:4), `object-fit: cover`, căn phía trên để ưu tiên khuôn mặt. Manifest ghi SHA-256, kích thước và nguồn; ảnh từ DOCX có đoạn ảnh/chú thích ghép đúng cột, ảnh tải lên dùng nguồn `user-editor-portraits`, không gán đoạn trong sách. Trường hợp thiếu ảnh chỉ hiển thị tên và chức danh; thiếu nhiệm kỳ không tự điền năm. Mốc đầu nhiệm kỳ Nguyễn Văn Đạo chưa thống nhất nên giao diện chỉ ghi thời điểm kết thúc “Đến năm 2006”; ghi chú mâu thuẫn vẫn giữ trong hồ sơ nguồn. Tệp Word và ảnh gốc không bị chỉnh sửa.

Giao diện dành cho độc giả không hiển thị tên file/thư mục, số đoạn Word, số trang PDF, nhật ký truy vấn/đối soát hoặc ghi chú xử lý nguồn. Các thông tin đó chỉ giữ trong `evidence/` và dữ liệu đối chiếu; không chèn vào lịch sử, thẻ Tổng biên tập (nhãn mục “LÃNH ĐẠO TẠP CHÍ”), bảng JCR hoặc danh mục tham khảo. Mục “Chỉ mục khoa học” trên hồ sơ tạp chí chỉ liệt kê các chỉ mục mà tạp chí đang thuộc về (`status: "listed"`), kèm phạm vi và liên kết tra cứu, không lặp lại cụm “Đã có trong danh mục” hay đưa vào các dòng chưa có thông tin. Giao diện vẫn giữ phạm vi/năm thống kê, giới hạn và ý nghĩa chỉ số, phân biệt dữ liệu thiếu với số 0 và liên kết công khai Scopus, Clarivate MJL, DOAJ, ACI, trang tạp chí và kho lưu trữ. Tham khảo bổ sung chỉ dẫn đến nguồn web công khai.

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
