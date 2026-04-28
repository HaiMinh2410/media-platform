# Media Platform - Unified Social Management & AI Inbox

Hệ thống quản lý mạng xã hội đa kênh (Omni-channel) tích hợp Trí tuệ nhân tạo (AI) để tối ưu hóa việc quản lý tin nhắn và lập kế hoạch nội dung.

## 🏗️ Cấu trúc dự án (Architecture)

Dự án được xây dựng theo mô hình **Clean Architecture** (Kiến trúc sạch), chia tách rõ ràng giữa Logic nghiệp vụ, Giao diện và Hạ tầng kỹ thuật.

### Sơ đồ thư mục chính:

```text
src/
├── app/                # Next.js App Router (UI Routes, Layouts, API Endpoints)
├── application/        # Use Cases & Services (Logic điều hướng, xử lý nghiệp vụ chính)
├── domain/             # Entities & Types (Định nghĩa dữ liệu thuần túy, không phụ thuộc thư viện)
├── infrastructure/     # Implementation Details (Kết nối DB, API bên thứ 3, Queue, AI Clients)
├── components/         # UI Components (Chia theo tính năng: post-composer, inbox, ui...)
├── worker/             # Background Processes (Xử lý hàng đợi BullMQ: gửi bài, ingestion...)
└── lib/                # Shared Utilities (Các hàm tiện ích dùng chung)
```

### Chi tiết công dụng từng Folder:

*   **`src/domain`**: Trái tim của hệ thống. Chứa các interface và type (ví dụ: `Message`, `Post`, `Account`). Khi thay đổi DB hay thư viện AI, code ở đây không thay đổi.
*   **`src/application`**: Chứa các service như `ai-orchestrator.service.ts` hay `webhook-handler.service.ts`. Đây là nơi điều phối dòng dữ liệu giữa domain và hạ tầng.
*   **`src/infrastructure`**:
    *   `repositories/`: Chứa logic truy vấn Database (Prisma).
    *   `meta/`: Client giao tiếp với Meta Graph API (FB, IG).
    *   `ai/`: Cấu hình Groq SDK (Llama 3) để phân tích ngôn ngữ.
    *   `queue/`: Cấu hình BullMQ để xử lý các tác vụ nặng chạy ngầm.
*   **`src/components`**:
    *   `post-composer/`: Bộ soạn thảo bài viết với xem trước (preview) thời gian thực.
    *   `inbox/`: Giao diện nhắn tin tập trung, hỗ trợ AI gợi ý câu trả lời.
*   **`src/worker`**: Đảm bảo hệ thống hoạt động ổn định khi có lượng lớn dữ liệu (ví dụ: hàng nghìn tin nhắn đổ về cùng lúc qua Webhook).
*   **`prisma/`**: Quản lý schema cơ sở dữ liệu và các bản cập nhật (migrations).
*   **`scripts/`**: Các công cụ hỗ trợ như áp dụng chính sách bảo mật RLS lên Supabase.

---

## 🚀 Tính năng cốt lõi (Core Features)

1.  **AI Inbox**: Tự động phân loại tin nhắn (Hỏi giá, Phàn nàn, Tư vấn), đánh giá độ ưu tiên và gợi ý câu trả lời dựa trên ngữ cảnh thương hiệu.
2.  **Unified Post Composer**: Soạn thảo một lần, đăng đa kênh (Facebook, Instagram). Hỗ trợ xem trước giao diện chuẩn của từng nền tảng.
3.  **Real-time Synchronization**: Sử dụng Supabase Realtime để cập nhật tin nhắn và thông báo ngay lập tức mà không cần tải lại trang.
4.  **Smart Analytics**: Theo dõi chỉ số tiếp cận (Reach), tương tác (Engagement) và tăng trưởng người theo dõi trực quan qua biểu đồ.
5.  **Security**: Bảo mật dữ liệu cấp độ hàng (RLS) và mã hóa Token (AES-256-GCM) để bảo vệ quyền truy cập của người dùng.

---

## 📈 Định hướng Upscale (Mở rộng quy mô)

Để đưa dự án lên tầm cao mới, các bước tiếp theo bao gồm:

1.  **Mở rộng nền tảng (Multi-platform)**: Tích hợp TikTok Content API, LinkedIn và X (Twitter) để bao phủ toàn bộ hệ sinh thái mạng xã hội.
2.  **AI RAG (Retrieval-Augmented Generation)**: Kết hợp Supabase Vector để AI có thể "đọc" tài liệu sản phẩm của doanh nghiệp, từ đó trả lời khách hàng chính xác và chuyên sâu hơn.
3.  **Hệ thống Workflow tự động**: Cho phép người dùng tạo quy tắc (ví dụ: "Nếu khách phàn nàn trên Instagram, tự động tạo task trên hệ thống quản lý và gửi mail cho bộ phận CSKH").
4.  **Team Collaboration**: Phân quyền nâng cao (Admin, Editor, Viewer) và quy trình duyệt bài (Approval Workflow) cho các agency hoặc team marketing lớn.
5.  **Mobile App**: Phát triển phiên bản ứng dụng di động (React Native/Flutter) để quản lý inbox và duyệt bài viết mọi lúc mọi nơi.

---

## 🛠️ Cài đặt & Phát triển

Dự án sử dụng **Bun** để tối ưu hiệu suất.

1.  **Cài đặt phụ thuộc:**
    ```bash
    bun install
    ```

2.  **Thiết lập môi trường:**
    Sao chép `.env.example` thành `.env` và điền các tham số:
    *   Supabase (URL, Anon Key, Service Role)
    *   Meta App (App ID, Client Secret)
    *   Groq API Key
    *   Redis/Upstash URL (cho BullMQ)

3.  **Chạy server phát triển:**
    ```bash
    bun dev
    ```

4.  **Chạy Worker (để xử lý Queue):**
    ```bash
    bun run worker:posts
    ```
