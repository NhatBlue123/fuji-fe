# Sera UI Components

Thư mục này chứa các components từ [Sera UI](https://seraui.com).

## 🎯 Cách sử dụng

Sera UI hoạt động theo kiểu **copy-paste components**. Bạn có thể:

### 1. Browse Components
Truy cập [Sera UI Documentation](https://seraui.com/docs) để xem tất cả components có sẵn.

### 2. Copy Component Code
Mỗi component đều có source code đầy đủ. Chỉ cần:
- Vào trang component bạn muốn (ví dụ: https://seraui.com/docs/threed-card)
- Copy code từ documentation
- Paste vào thư mục này

### 3. Customize
Tùy chỉnh Tailwind classes hoặc animation props để phù hợp với brand của bạn.

## 📦 Dependencies đã cài đặt

Dự án đã có đầy đủ dependencies cần thiết:
- ✅ `framer-motion` - Animations
- ✅ `lucide-react` - Icons
- ✅ `tailwindcss` - Styling
- ✅ `clsx` & `tailwind-merge` - Utilities
- ✅ `class-variance-authority` - Variants

## 🎨 Các Components phổ biến

### UI Components
- [3D Card](https://seraui.com/docs/threed-card) - Interactive 3D card với tilt effects
- [Animated Button](https://seraui.com/docs/animated-button)
- [Gradient Card](https://seraui.com/docs/gradient-card)
- [Hero Section](https://seraui.com/docs/hero-section)

### Animation Components
- [Fade In](https://seraui.com/docs/fade-in)
- [Slide In](https://seraui.com/docs/slide-in)
- [Parallax](https://seraui.com/docs/parallax)

## 💡 Ví dụ sử dụng

```tsx
import { ThreeDCard } from '@/components/sera-ui/threed-card'

export default function MyPage() {
  return (
    <ThreeDCard>
      <h2>My Content</h2>
    </ThreeDCard>
  )
}
```

## 🔗 Links hữu ích

- [Sera UI Documentation](https://seraui.com/docs)
- [GitHub Repository](https://github.com/seraui/seraui)
- [All Components](https://seraui.com/docs)
