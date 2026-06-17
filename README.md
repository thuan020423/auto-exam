# FPT Auto Exam

Script tự động thi các bài kiểm tra trên [daotao.fpt.com](https://daotao.fpt.com).

## Cách dùng

### 1 dòng duy nhất — Paste vào Console (F12):

```javascript
fetch('https://YOUR_USERNAME.github.io/fpt-auto-exam/auto-exam.js').then(r=>r.text()).then(eval)
```

> ⚠️ Thay `YOUR_USERNAME` bằng username GitHub của bạn.

### Hoặc nếu bị CSP chặn:

```javascript
fetch('https://YOUR_USERNAME.github.io/fpt-auto-exam/auto-exam.js').then(r=>r.text()).then(c=>{new Function(c)()})
```

## Cấu hình

Mở file `auto-exam.js`, sửa ở đầu file:

```javascript
const RETAKE_PASSED = true;   // true = thi lại bài đã đạt | false = bỏ qua
const MAX_RETRY = 3;          // Số lần thi lại tối đa
```

## Output

```
FPT AUTO EXAM v5

🟢 Time Blocking: Đã đạt — bỏ qua
🟢 Báo cáo tiến độ: PASS (10/10 matched, lần 1)
🔴 Mô hình GROW: FAIL (11/15 matched, lần 1) → thi lại...
🟢 Mô hình GROW: PASS (11/15 matched, lần 2)

Tổng hợp:
(bảng)
Xong!
```

## Setup GitHub Pages

1. Fork hoặc clone repo này
2. Settings → Pages → Source: Deploy from branch → Branch: `main` → Save
3. Đợi ~1 phút, truy cập `https://YOUR_USERNAME.github.io/fpt-auto-exam/auto-exam.js`
4. Paste 1 dòng vào Console trên trang khóa học FPT

## Files

| File | Mô tả |
|------|--------|
| `auto-exam.js` | Script chính — chạy tất cả bài thi |
| `README.md` | Hướng dẫn |
