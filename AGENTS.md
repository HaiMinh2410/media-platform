<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 🤝 Quy chuẩn quản lý & Cập nhật Component dùng chung (/share)

*   **QUY TẮC BẮT BUỘC**: Mỗi khi bạn **tạo mới hoặc tách** bất kỳ một file/component dùng chung nào vào thư mục `/share` (bao gồm `src/shared/ui/` hoặc `src/shared/components/`), bạn **bắt buộc** phải thực hiện đầy đủ hai việc sau:
    1. **Đăng ký re-export component mới** vào Entry Point tương ứng (ví dụ: export thêm vào [src/shared/ui/index.ts](file:///e:/My'sProjects/media-platform/src/shared/ui/index.ts) hoặc [src/shared/components/index.ts](file:///e:/My'sProjects/media-platform/src/shared/components/index.ts)) để các feature khác có thể import dễ dàng qua `@shared/ui` hoặc `@shared/components`.
    2. **Cập nhật ngay tệp hướng dẫn kỹ năng** [component-redesign-workflow/SKILL.md](file:///e:/My'sProjects/media-platform/.agents/skills/component-redesign-workflow/SKILL.md).
*   **Nội dung cần cập nhật**: Bổ sung component mới vào danh sách các component dùng chung tiêu biểu (`## 🤝 REUSING & EXTENDING SHARED COMPONENTS (/share)` -> `### 1. Nguyên tắc "Shared-First"`) kèm theo mô tả ngắn gọn về tính năng, các props chính và hướng dẫn sử dụng nhanh, giúp các Agent khác chủ động biết và tái sử dụng chính xác trong tương lai.

# 🤖 Quy chuẩn đồng bộ thông tin AI Pipeline trong Cài đặt

*   **ĐỒNG BỘ TỰ ĐỘNG**: Các cấu trúc Prompt của hệ thống AI (Summarizer, Classifier, Sentiment Scorer, Objection Handler, Response Generator) trong giao diện chi tiết [src/features/settings/components/ai-pipeline-detail.tsx](file:///e:/My'sProjects/media-platform/src/features/settings/components/ai-pipeline-detail.tsx) đã được đồng bộ tự động thời gian thực từ backend thông qua API Route `/api/ai-agent/pipeline-prompts`. Bạn **không cần** sửa đổi thủ công các prompt này trong file UI nữa khi cập nhật backend.
*   **QUY TẮC BẮT BUỘC**: Bạn chỉ **bắt buộc** phải chỉnh sửa thủ công tệp [ai-pipeline-detail.tsx](file:///e:/My'sProjects/media-platform/src/features/settings/components/ai-pipeline-detail.tsx) khi:
    1. **Thêm mới hoặc loại bỏ** hẳn một bước xử lý trong vòng lặp AI Agent Pipeline (lúc đó cần cập nhật danh sách `steps`, điều chỉnh lại số thứ tự `id` và biểu tượng `icon`).
    2. **Thay đổi điều kiện kích hoạt (conditions), cơ chế dự phòng (fallback), hoặc mô tả chung (description)** của một bước xử lý logic thuần không dùng LLM.
*   **Mục tiêu**: Đảm bảo sơ đồ timeline, phần mô tả cách hoạt động, điều kiện kích hoạt, cơ chế fallback và nội dung Prompt Preview được hiển thị trực quan cho người dùng luôn chính xác và đồng bộ 100% với logic thực tế chạy ở backend.


