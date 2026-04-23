# L2S - Low-code Data & AI Platform

L2S là nền tảng low-code giúp doanh nghiệp xây dựng workflow dữ liệu, AI và automation bằng giao diện kéo-thả. Thay vì phải ghép nhiều công cụ rời rạc hoặc phụ thuộc hoàn toàn vào SaaS nước ngoài, L2S hướng đến một giải pháp có thể tự triển khai, kiểm soát dữ liệu nội bộ và mở rộng theo nhu cầu thực tế của đội ngũ.

L2SC là lớp cộng đồng của hệ sinh thái L2S: nơi chia sẻ, khám phá và tái sử dụng các workflow được xây dựng sẵn. Người dùng có thể tìm workflow phù hợp, import về L2S của mình, hoặc đóng góp workflow cho cộng đồng.

## Bài toán L2S giải quyết

Nhiều doanh nghiệp vừa và nhỏ có dữ liệu, có nhu cầu tự động hóa, có nhu cầu ứng dụng AI, nhưng thường gặp các rào cản:

- Chi phí SaaS tăng nhanh khi số lượng workflow, user hoặc lượt chạy tăng lên
- Dữ liệu nhạy cảm khó đưa lên cloud bên thứ ba
- Đội ngũ không đủ thời gian để viết pipeline từ đầu cho từng bài toán
- Công cụ automation phổ thông chưa đủ mạnh cho Big Data, ML, ETL và RAG
- Việc chia sẻ workflow giữa các team còn thủ công, khó kiểm soát phiên bản và chất lượng

L2S tập trung vào hướng tiếp cận thực dụng: kéo-thả để tạo pipeline, tự host trên hạ tầng riêng, mở rộng bằng plugin và chia sẻ lại tri thức qua L2SC.

## Giá trị kinh doanh

- **Giảm chi phí vận hành dài hạn**: doanh nghiệp có thể tự host, chủ động tài nguyên và tránh phụ thuộc vào pricing theo lượt chạy.
- **Bảo vệ dữ liệu nội bộ**: workflow chạy trên hạ tầng của chính doanh nghiệp, phù hợp với dữ liệu khách hàng, tài chính, sản xuất hoặc dữ liệu nhạy cảm.
- **Tăng tốc triển khai AI/Data use case**: đội ngũ có thể dựng nhanh pipeline ETL, phân tích dữ liệu, huấn luyện model, RAG hoặc automation nội bộ.
- **Tái sử dụng tri thức**: workflow tốt có thể được publish lên L2SC để team khác import và dùng lại, giảm lặp lại công việc.
- **Phù hợp thị trường Việt Nam**: định hướng giao diện, tài liệu và cộng đồng bằng tiếng Việt, dễ tiếp cận hơn cho sinh viên, startup và doanh nghiệp trong nước.

## L2S phù hợp với ai?

- Doanh nghiệp vừa và nhỏ muốn tự động hóa quy trình dữ liệu mà không muốn phụ thuộc hoàn toàn vào SaaS
- Team Data/AI cần dựng nhanh pipeline ETL, ML, RAG hoặc báo cáo nội bộ
- Startup muốn có nền tảng thử nghiệm workflow nhanh, chi phí thấp
- Trường học, sinh viên và cộng đồng kỹ thuật muốn học và chia sẻ workflow thực tế
- Freelancer/consultant cần đóng gói giải pháp automation cho khách hàng

## L2S có thể làm gì?

- Kéo-thả workflow xử lý dữ liệu, ETL và automation
- Kết nối nhiều nguồn dữ liệu: file, database, API, object storage
- Làm sạch, biến đổi, join, filter, aggregate và xuất dữ liệu
- Xây dựng pipeline AI/ML, dự đoán, đánh giá model và phân tích kết quả
- Tạo workflow RAG, chatbot, agent hoặc xử lý tài liệu
- Chạy workflow theo lịch, theo trigger hoặc theo yêu cầu
- Tự host trên máy cá nhân, server nội bộ hoặc cụm máy trong LAN
- Chia sẻ workflow lên L2SC để cộng đồng có thể khám phá và tái sử dụng

## Vai trò của L2SC

L2SC không thay thế L2S. L2SC là nơi kết nối cộng đồng xung quanh L2S.

- Người dùng L2S có thể publish workflow lên L2SC
- Người khác có thể browse, xem mô tả và import workflow về L2S riêng
- Workflow public có thể được kiểm duyệt trước khi xuất hiện với cộng đồng
- GitHub và video quảng cáo giúp người mới hiểu nhanh sản phẩm và tham gia đóng góp

Repository:

- L2S core: https://github.com/ngohongthong1832004/L2S
- L2SC community: https://github.com/ngohongthong1832004/L2SC

## Truy cập L2SC

L2SC là cổng cộng đồng/marketing của hệ sinh thái L2S. Khi public ra ngoài, frontend và backend của L2SC đang dùng các port sau:

- L2SC Frontend: http://localhost:990
- L2SC Backend API: http://localhost:991
- L2SC API Docs: http://localhost:991/docs

Nếu chạy bằng Docker Compose trong repository L2SC:

```bash
docker compose up -d --build
```

Sau khi chạy xong, mở `http://localhost:990` để xem landing page, video quảng cáo, workflow community và modal thông báo bản trải nghiệm mở từ ngày **05/05/2026**.

## Hướng dẫn chạy L2S

Cách nhanh nhất là dùng Docker. Clone repository L2S rồi chạy script khởi động theo hệ điều hành.

```bash
git clone https://github.com/ngohongthong1832004/L2S.git
cd L2S
```

Trên Linux/macOS:

```bash
./start.sh
```

Trên Windows PowerShell:

```powershell
.\start.ps1
```

Sau khi chạy xong, mở trình duyệt tại:

- L2S UI: http://localhost:5173
- Backend API: http://localhost:8000
- MinIO Console: http://localhost:9001

Tài khoản mặc định thường dùng cho môi trường demo:

- Admin: `admin` / `admin123`
- User: `user` / `user123`

## Chạy L2S theo chế độ cluster

Khi cần chia tải cho nhiều máy trong cùng mạng LAN, có thể chạy L2S theo mô hình coordinator/worker.

Máy chính:

```bash
./start.sh cluster
```

Máy phụ:

```bash
L2S_COORDINATOR_URL=http://<IP-may-chinh>:8000 \
L2S_CLUSTER_TOKEN=<token-tu-may-chinh> \
./start.sh worker
```

Trên Windows, có thể dùng script PowerShell tương ứng:

```powershell
.\start.ps1 cluster
```

## Quy trình sử dụng đề xuất

1. Chạy L2S trên máy cá nhân hoặc server nội bộ.
2. Tạo workflow bằng cách kéo-thả node trong editor.
3. Kiểm thử workflow với dữ liệu thật hoặc dữ liệu mẫu.
4. Lưu workflow để team dùng lại.
5. Khi workflow đủ hữu ích, publish lên L2SC để chia sẻ với cộng đồng.
6. Browse L2SC để tìm workflow có sẵn và import về L2S khi cần.

## Video giới thiệu

Landing page của L2SC có section dành cho video quảng cáo sản phẩm. Khi có video chính thức, có thể gắn link YouTube embed hoặc video host trên GitHub Releases/CDN để người xem hiểu nhanh giá trị của L2S và cách L2SC kết nối cộng đồng.

## Tầm nhìn

L2S hướng đến một nền tảng Data & AI workflow mã nguồn mở, dễ dùng, có thể tự host và phù hợp với nhu cầu doanh nghiệp Việt Nam. L2SC là bước tiếp theo để biến workflow thành tài sản cộng đồng: dùng được, chia sẻ được và phát triển cùng nhau.
