# VAST · Dashboard 12 tạp chí khoa học

Website tĩnh giới thiệu 12 tạp chí thuộc Viện Hàn lâm Khoa học và Công nghệ Việt Nam (VAST) tại `https://trungvjm.github.io/vast-journals-dashboard/`.

- **VAST-1**: 7 tạp chí có dữ liệu Scopus trong bản đối chiếu: VJM, AMV, ANSN, VJC, VJES, VJST, CIP. Trạng thái Web of Science phải xem riêng theo từng bộ chỉ mục, không suy ra từ nhóm này.
- **VAST-2**: VJMech, JCC, AJB, VJMST, VJBT. Chỉ số 4 năm tự tính không phải CiteScore chính thức của Scopus.
- `data-scopus.json`: bản lịch sử được bảo vệ bằng SHA-256, gồm 84 quan sát CiteScore và Tracker. Đúng công thức không đồng nghĩa đã xác minh lại nguồn trực tuyến.
- `evidence/`: hồ sơ, nguồn kho lưu trữ, bằng chứng chỉ mục và đối soát dữ liệu. Khoảng năm và mức độ đầy đủ khác nhau giữa các tạp chí; năm hiện tại là số liệu đến ngày chốt, không phải cả năm.
- `data/dashboard.json` và `data/snapshots/`: dữ liệu sinh từ các đầu vào nêu trên.

## Giao diện

Một hướng thiết kế tham khảo ArtCraft, hỗ trợ sáng/tối và font cục bộ. Hiệu ứng chữ theo vị trí cuộn có trên bốn phần trang chính và các mục trong hồ sơ tạp chí. Chế độ giảm chuyển động dùng chữ đứng yên; màn hình nhỏ ẩn lớp chữ bay. Chuỗi thống kê theo năm, bảng số liệu và tổng số bài/số kỳ xuất bản dùng giai đoạn từ 2015 trở đi, riêng VJST từ 2016 do các số năm 2015 chưa tra cứu trực tuyến được. Bộ chọn năm, biểu đồ, tổng xuất bản và so sánh giữa các tạp chí cùng áp dụng mốc này; VJST năm 2015 là thiếu dữ liệu, không phải số 0. Chỉ số Scopus chính thức và tổng trích dẫn tích lũy từ hồ sơ nguồn giữ nguyên. Ba biểu đồ trong hồ sơ cùng tuân theo khoảng năm đã chọn. Không hiển thị số đếm “bao nhiêu năm có dữ liệu”. Dữ liệu nguồn trước mốc thống kê được giữ để đối chiếu; lịch sử thành lập/đổi tên không bị giới hạn bởi cửa sổ thống kê.

Nội dung dành cho độc giả được rút gọn: bỏ hướng dẫn bấm/di chuột, đoạn dẫn lặp tiêu đề, phần nhận xét diễn giải và các danh sách xếp hạng bên cạnh vốn đã có trong bảng phân ngành đầy đủ. Giữ nguyên lịch sử, lãnh đạo, toàn bộ số liệu và liên kết minh chứng. Các nhãn chính thức/Tracker/tự tính, số liệu chưa đủ năm và phạm vi cửa sổ CiteScore vẫn được phân biệt; thông tin khi trỏ vào biểu đồ chỉ xuất hiện sau tương tác, không chiếm chỗ khi chưa có giá trị.

Trang chính gồm bốn phần theo thứ tự: `01 Tổng quan`, `02 Danh mục tạp chí`, `03 Biểu đồ` (gồm hai bảng đối chiếu CiteScore Scopus / WoS JCR 2025 và bốn biểu đồ tương tác), `04 Tài liệu tham khảo` (định dạng trích dẫn học thuật đánh số `[1]`, `[2]`, …). Khung mở đầu không dùng ảnh nền ở cả hai giao diện sáng/tối; giữ quỹ đạo và 12 bìa tạp chí. Tổng quan dùng hai tên nhóm “Nhóm tạp chí quốc tế” (VAST-1) và “Nhóm tạp chí quốc gia” (VAST-2), mỗi tên tạp chí đầy đủ kèm mã viết tắt nằm trên một hàng riêng; tên dài được xuống dòng tự nhiên trên mobile.

Hồ sơ từng tạp chí đặt **Thông tin chung** ngay dưới khung mở đầu và trước lịch sử, lãnh đạo. Sau phần lãnh đạo là biểu đồ, bảng số liệu theo năm, CiteScore và thứ hạng Scopus, WoS/JCR (nếu có), chỉ mục khoa học và điểm HĐGSNN. Các bảng trình bày tuần tự theo một cột rộng thay cho hai cột thông tin xen kẽ; bộ chuyển nhanh trên mobile và thanh điều hướng cuộn có liên kết riêng đến điểm HĐGSNN. Không thay đổi số liệu, lịch sử, lãnh đạo hoặc nguồn minh chứng.

Tất cả bảng CiteScore, JCR, thống kê theo năm, thứ hạng và điểm HĐGSNN chỉ dùng đường ngang phân cách hàng; không có vạch dọc, viền bên của bảng/khung cuộn hoặc bóng dọc ở cột cố định trên mobile. Giữ nguyên cuộn ngang, cuộn dọc, tiêu đề và số liệu.

Mỗi mục biểu đồ 01–04 chỉ có một đồ thị chính chiếm toàn chiều rộng nội dung; không còn cột đối chiếu phụ. SVG giữ tỷ lệ theo `viewBox` và tự tính chiều cao để phần đồ thị thực sự phủ hết chiều rộng, không để trống hai bên. Giữ bộ lọc, chú giải bật/tắt chuỗi và tooltip; tùy chọn “Năm nổi bật” đánh dấu cột năm trên biểu đồ 04. Chú thích biểu đồ 04 chỉ giữ giới hạn dữ liệu năm 2026, không giải thích lại “—”/“N/A”. Nguồn ảnh chân dung vẫn được lưu trong metadata nhưng không đưa vào danh sách tài liệu tham khảo học thuật.

Bìa tạp chí giữ đúng tỷ lệ ảnh gốc, nền khung trong suốt, không kéo méo hoặc cắt bìa. Trong danh mục desktop/tablet, bìa cùng cao 148 px và rộng tự động; mobile giữ rộng 88 px và cao tự động. Các thẻ cùng hàng chia sẻ ba hàng con bằng CSS subgrid (đầu thẻ, vùng bìa/logo, nội dung); vùng tên đơn vị dành tối thiểu ba dòng để căn hàng logo. Không ép đồng thời chiều rộng và chiều cao ảnh gây dải trắng trên/dưới.

Sáu logo VAST, NXB, Viện Toán học, Springer, IOP và Wiley dùng các file PNG do người dùng cung cấp trong `assets/images/logos/`; ảnh gốc không bị ghi đè. Giao diện sáng giữ nguyên ảnh gốc. Ở giao diện tối: Viện Toán học và Wiley chuyển trắng bằng CSS; IOP chỉ đổi chữ Publishing thành trắng, giữ phần IOP đỏ; Springer đổi chữ và hình ngựa thành trắng, giữ nguyên gạch cam. Hai biến thể `iop-dark.png` và `springer-dark.png` giữ kích thước/kênh alpha gốc và có SHA-256, nguồn cùng mô tả xử lý trong `evidence/dashboard-media.json`. VAST và NXB không đổi màu. Khi thay artwork, cập nhật metadata và biến thể tối tương ứng, sau đó dựng lại dữ liệu dashboard.

Danh mục không có bảng xếp hạng CiteScore riêng. Xem số liệu, biểu đồ và nguồn minh chứng trong hồ sơ từng tạp chí. Tên NXB trên thẻ ngắt thành hai dòng “NXB Khoa học tự nhiên” / “và Công nghệ”; giữ nguyên từng dòng, đối tác đồng xuất bản đặt ở dòng riêng, không giảm cỡ chữ. Kỳ hạn xuất bản đọc từ `frequency.issuesPerYear`; thiếu dữ liệu thì hiện “Chưa có thông tin”. AMV có liên kết bổ sung đến mục lục và các số truy cập mở của Viện Toán học. Liên kết chỉ mục phân biệt nguồn cơ sở dữ liệu và thông tin do tạp chí công bố.

Nhãn chỉ số tự tính trên thẻ VAST-2 dùng đầy đủ “CiteScore 2025 (tự tính)” và “CiteScore 2026 (tự tính)”. Không lặp lại dòng “Thống kê 2015–2026” trên thẻ danh mục, nút xem biểu đồ hoặc đầu hồ sơ; các năm vẫn hiển thị trên trục biểu đồ, bộ chọn năm và giai đoạn tính chỉ số. VJC, VJES và VJST có liên kết ACI trực tiếp tới hồ sơ chính thức với jid lần lượt là 11299, 10629 và 10626; không thay thông tin tạp chí hiện tại bằng metadata cũ trong hồ sơ ACI.

Thẻ danh mục không hiển thị tổng số bài. Thẻ có JCR giữ ba ô chỉ số (CiteScore, JIF, Tracker); các thẻ còn lại có hai ô, tự chia đều chiều rộng. Tổng số bài và bảng xuất bản vẫn có trong hồ sơ chi tiết.

Bộ lọc **Web of Science Core Collection (5)** trong Danh mục 02 chỉ trả về các tạp chí được xác nhận thuộc Core Collection. AJB thuộc Zoological Record nên không nằm trong kết quả này; AJB vẫn có trong danh mục chung, nhóm VAST-2 và kết quả tìm tên, đồng thời giữ thông tin Zoological Record trong hồ sơ.

Tên phụ trên thẻ chỉ hiển thị khi có tên tiếng Việt khác tên chính; AMV và ANSN không lặp lại tên nguyên bản ở dòng nhỏ. Liên kết mở hồ sơ dùng nhãn “Xem chi tiết”, không kèm mũi tên.

Bảng “CiteScore Scopus theo năm” chỉ hiển thị năm có giá trị CiteScore hữu hạn; giá trị 0 vẫn hợp lệ. Các bản ghi thiếu chỉ số vẫn giữ trong dữ liệu nguồn nhưng không tạo dòng N/A trên bảng này. Tiêu đề bảng CiteScore và bảng số liệu xuất bản/trích dẫn không lặp lại khoảng năm; các năm vẫn có ở từng dòng.

CIP chưa có CiteScore thường niên chính thức nên không hiển thị thứ hạng, phân vị hoặc Quartile Scopus, không suy diễn Q từ Tracker. Dữ liệu phân ngành có xếp hạng của CIP được để trống; các hồ sơ khác giữ nguyên. Trình dựng từ chối xếp hạng phân ngành cho tạp chí chỉ có Tracker mà chưa có CiteScore thường niên chính thức. CiteScore Tracker 2026 và các số liệu trích dẫn/tài liệu của CIP vẫn dùng nguồn Scopus riêng, không bị sửa.

Thông tin tính điểm công trình năm 2025 tại Hội đồng Giáo sư nhà nước (Quyết định số `26/QĐ-HĐGSNN` ngày 11/07/2025) trong `evidence/dashboard-hdgsnn-2025.json` chỉ sử dụng các văn bản danh mục hội đồng ngành, liên ngành. Mỗi dòng giữ trang, số thứ tự, trích dẫn và liên kết tới văn bản; bản PDF có mã SHA-256 để đối chiếu. Không áp điểm của ấn phẩm khác ISSN hoặc khung điểm đã hết hạn thành điểm năm 2025: không quy đổi “Advances in Natural Sciences” (1859-221X) thành ANSN (2043-6254/2043-6262), không dùng khung VJC chỉ áp dụng 2017–2018 cho năm 2025. Các điều kiện theo lĩnh vực như mức `1,25–1,5` của VJST vẫn được giữ riêng. Điểm chỉ hiển thị trong hồ sơ từng tạp chí, không có bảng điểm ở Tổng quan.

Minh chứng chỉ mục WoS phải liên kết trực tiếp tới `mjl.clarivate.com/search-results` theo ISSN của hồ sơ MJL, không dùng trang VAST, trang tạp chí hay JSON nội bộ làm minh chứng. Đã đọc trực tiếp MJL ngày 22/10/2026: VJM, AMV, ANSN, VJC và VJES thuộc ESCI; AJB có Zoological Record nhưng không thuộc Core Collection. Liên kết AJB đặt bộ lọc `index=Zoological%20Record` để không bị bộ lọc Core Collection mặc định che kết quả. VJC dùng ISSN MJL `0866-7144`; VJES được MJL ghi `0866-7187 / 2615-9783`, không ghi đè các định danh hiện tại của dashboard. Trạng thái `not_listed` của VJST, CIP, VJMech, JCC, VJMST và VJBT chỉ giữ trong dữ liệu nguồn, không tạo dòng phủ định trên giao diện: đã chọn đủ 18 bộ chỉ mục trên MJL, tra cứu ISSN, eISSN và ISSN cũ có trong hồ sơ, đều trả về 0 kết quả. Ghi rõ ngày kiểm tra và các định danh đã tra cứu; liên kết đặt đủ các bộ lọc đã dùng. Tìm theo tên có thể trả về các tạp chí gần tên nhưng khác ISSN, không được nhận nhầm là cùng tạp chí. Số liệu JIF/JCI và xếp hạng theo năm vẫn có nguồn riêng là báo cáo Clarivate JCR do người dùng cung cấp; MJL chỉ được dùng làm minh chứng chỉ mục.

## Lịch sử và lãnh đạo tạp chí

`evidence/dashboard-journal-origins.json` bổ sung lịch sử phát triển và các nhiệm kỳ lãnh đạo cho 12 hồ sơ. Phần của 11 tạp chí do NXB quản lý được trích, diễn giải từ kỷ yếu 20 năm do người dùng cung cấp; số đoạn tham chiếu là vị trí trong `word/document.xml`, không phải số trang. AMV không có chương riêng trong kỷ yếu nên lịch sử và nhiệm kỳ được đối chiếu với trang chính thức của Viện Toán học. Không đưa số liệu trắc lượng hoặc tuyên bố chỉ mục trong kỷ yếu vào các bảng WoS/Scopus đã có nguồn riêng.

Ảnh trong `assets/images/editors/` gồm ảnh nhúng từ kỷ yếu, bốn chân dung AMV do người dùng cung cấp (Ngô Việt Trung, Nguyễn Tự Cường, Đinh Nho Hào, Đoàn Trung Cường), và ảnh PGS.TSKH. Phạm Thượng Cát từ bài “Nhớ mãi trong tôi, Người gây dựng VCCA” của Trà Giang trên Tạp chí Tự động hóa ngày nay (08/04/2022). Ảnh Phạm Thượng Cát chụp tại phòng làm việc năm 2007, cắt chân dung 3:4 từ ảnh 600 × 666 px tại khung `[150,145,420,505]`; lưu nguồn, tác giả và mã SHA-256, không chỉnh sửa khuôn mặt. Các ảnh cũ giữ toàn khung và không phóng lớn khi chuyển WebP. Trên giao diện, tất cả chân dung dùng khung 84 × 112 px (3:4), `object-fit: cover`, căn trên để ưu tiên khuôn mặt. Ảnh từ DOCX giữ đoạn ảnh/chú thích đúng cột; ảnh tải lên dùng nguồn `user-editor-portraits`, không gán đoạn trong sách. Trường hợp thiếu ảnh chỉ hiển thị tên, chức danh; thiếu nhiệm kỳ không tự điền năm. Mốc đầu nhiệm kỳ Nguyễn Văn Đạo chưa thống nhất nên chỉ ghi “Đến năm 2006”; ghi chú mâu thuẫn giữ trong hồ sơ nguồn. Tệp Word và ảnh gốc không bị chỉnh sửa.

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
