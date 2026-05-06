# ChatDock Component

Floating AI Chat Widget với UI đẹp và mượt mà, tích hợp đầy đủ tính năng của trang `/ai-chat`.

## Features

### ✨ Core Features
- **Floating Button**: Nút tròn floating ở góc dưới bên phải với animation mượt mà
- **Full Chat Functionality**: Tích hợp hoàn toàn `AssistantPanel` với tất cả tính năng
- **Smooth Animations**: Sử dụng Framer Motion cho animations mượt mà
- **Minimize/Maximize**: Thu gọn và mở rộng chat window
- **Open Full Page**: Nút mở trang chat đầy đủ
- **Auto-hide**: Tự động ẩn trên trang `/ai-chat` và `/sensei`
- **Authentication Check**: Redirect đến login nếu chưa đăng nhập
- **Responsive Design**: Tối ưu cho cả desktop và mobile

### 🎨 UI/UX Features
- **Gradient Background**: Header với gradient từ primary đến indigo
- **Pulse Animation**: Hiệu ứng pulse trên floating button
- **Tooltip**: Hiển thị tooltip khi hover vào button
- **Backdrop**: Overlay mờ trên mobile khi mở chat
- **Unread Badge**: Badge hiển thị số tin nhắn chưa đọc (ready for future)
- **Smooth Transitions**: Tất cả transitions đều mượt mà với spring animation

## Usage

ChatDock đã được tích hợp vào `AppShell`, tự động hiển thị trên tất cả các trang (trừ `/ai-chat` và `/sensei`).

### Customization

Để tùy chỉnh vị trí hoặc style:

```tsx
// Thay đổi vị trí floating button
className="fixed bottom-6 right-6 z-50"  // Mặc định
className="fixed bottom-4 left-4 z-50"   // Góc dưới trái

// Thay đổi kích thước chat window
style={{
  width: "450px",      // Chiều rộng
  height: "85vh",      // Chiều cao
}}
```

### Props (Future Enhancement)

Có thể mở rộng với các props:

```tsx
interface ChatDockProps {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  defaultOpen?: boolean;
  onMessageReceived?: (message: Message) => void;
  theme?: "light" | "dark" | "auto";
}
```

## Architecture

```
ChatDock
├── Floating Button (AnimatePresence)
│   ├── Icon
│   ├── Unread Badge
│   ├── Pulse Animation
│   └── Tooltip
│
└── Chat Window (AnimatePresence)
    ├── Header
    │   ├── Avatar
    │   ├── Title & Subtitle
    │   └── Actions (Open Full, Minimize, Close)
    │
    ├── Content (AssistantPanel)
    │   └── Full chat functionality
    │
    └── Minimized State
        └── Placeholder text
```

## Dependencies

- `framer-motion`: Animations
- `lucide-react`: Icons
- `next/navigation`: Routing
- `@/components/ui/button`: Button component
- `@/components/user-component/ai/AssistantPanel`: Chat functionality
- `@/store/hooks`: Authentication state

## Socket Connection

ChatDock sử dụng `AIChatSocketProvider` đã được wrap ở `AppShell`, do đó:
- ✅ Socket connection được chia sẻ với trang `/ai-chat`
- ✅ Không cần khởi tạo socket riêng
- ✅ Conversation history được đồng bộ
- ✅ Real-time messaging hoạt động ngay lập tức

## Performance

- **Lazy Loading**: Component chỉ render khi cần
- **Conditional Rendering**: Không render trên trang `/ai-chat` và `/sensei`
- **Optimized Animations**: Sử dụng GPU-accelerated transforms
- **Memoized Callbacks**: Tránh re-render không cần thiết

## Future Enhancements

### Planned Features
- [ ] Draggable chat window
- [ ] Keyboard shortcuts (Ctrl+K to open)
- [ ] Sound notifications
- [ ] Typing indicators
- [ ] Message preview in minimized state
- [ ] Multiple chat windows (tabs)
- [ ] Chat history quick access
- [ ] Voice input integration
- [ ] File upload support
- [ ] Emoji picker
- [ ] Dark mode toggle in header

### Advanced Features
- [ ] AI suggestions while typing
- [ ] Quick replies
- [ ] Conversation templates
- [ ] Export conversation
- [ ] Share conversation link
- [ ] Collaborative chat (multiple users)

## Troubleshooting

### Chat window không hiển thị
- Kiểm tra `shouldHide` logic
- Verify `AIChatSocketProvider` đã được wrap ở `AppShell`
- Check authentication state

### Animation không mượt
- Ensure Framer Motion được cài đặt đúng
- Check browser performance
- Reduce animation complexity nếu cần

### Socket không kết nối
- Verify `AIChatSocketProvider` ở parent component
- Check network connection
- Review socket configuration

## Testing

```bash
# Test trên các trang khác nhau
- Trang chủ: ChatDock hiển thị ✓
- /ai-chat: ChatDock ẩn ✓
- /sensei: ChatDock ẩn ✓
- /course: ChatDock hiển thị ✓

# Test authentication
- Chưa login: Click button → redirect to login ✓
- Đã login: Click button → mở chat ✓

# Test responsive
- Desktop: Full width 450px ✓
- Mobile: Full width với backdrop ✓
- Tablet: Adaptive width ✓
```

## License

Part of FUJI Learning Platform
