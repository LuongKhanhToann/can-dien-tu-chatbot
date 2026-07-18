# Cân Điện Tử Đại Tín — Chatbot tư vấn & báo giá

Chatbot bán hàng kiểu **fanpage Facebook / Messenger** cho doanh nghiệp **nhập khẩu & phân phối cân điện tử giá xuất xưởng**. Khách nhắn tin hoặc **gửi ảnh chiếc cân** để được tư vấn đúng loại và báo giá ngay.

Live demo: xem phần Deployments (Vercel).

## Chức năng
- Chat tư vấn bằng **Google Gemini 2.5 Flash** (function calling): tìm sản phẩm phù hợp, xem chi tiết, tạo báo giá/đơn hàng, chuyển nhân viên khi không chắc.
- **Gửi ảnh**: nhận diện loại cân trong ảnh (Gemini 2.5 Flash vision) → tư vấn mẫu tương đương + báo giá.
- Tab **Sản phẩm** như gian hàng, lọc theo loại cân.
- Giá sỉ tự động khi số lượng lớn; cân ô tô → tạo yêu cầu khảo sát.

## Kiến trúc
- Frontend tĩnh: `index.html`, `styles.css`, `app.js`, `config.js`, `products-data.js`, ảnh SVG trong `assets/products/`.
- Serverless trên **Vercel** (region US):
  - `api/chat.js` → hội thoại. `api/products.js` → danh mục.
  - Logic dùng chung: `api/_lib/scales.js` (danh mục + tool), `api/_lib/vision.js` (nhận diện ảnh), `api/_lib/notify.js` (báo nhân viên).
- Frontend gọi `/api/*` cùng origin (`config.js` `CHAT_ENDPOINT=''`).

## Cấu hình
Đặt biến môi trường trên Vercel:
- `GEMINI_API_KEY` (bắt buộc — Google AI Studio key)
- `ADMIN_WEBHOOK_URL` (tuỳ chọn — Telegram/Slack/Zalo OA nhận thông báo khi bot chuyển nhân viên)

## Chạy / deploy
```bash
npx vercel            # deploy preview
npx vercel --prod     # deploy production
```

> Bản demo — báo giá không thu tiền thật. Thông tin sản phẩm/giá là dữ liệu mẫu, chỉnh trong `api/_lib/scales.js` và `products-data.js`.
