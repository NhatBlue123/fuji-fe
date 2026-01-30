# FUJI Admin Dashboard - Layout Documentation

## 🎯 Overview
Complete admin dashboard for course management with professional dark theme design. The HTML design has been successfully converted into React components.

## 📁 Component Structure

### 1. **Sidebar Component** (`src/components/admin/Sidebar.tsx`)
Professional sidebar navigation with:
- FUJI Admin logo with gradient background
- Navigation items: Dashboard, Users, Courses (active), Analytics, Settings
- Logout option at bottom
- Responsive design (hidden on mobile, visible on md+ screens)
- Active state styling with primary color accent

**Features:**
- Material Design Icons
- Hover effects
- Active state with border and shadow
- Scrollable navigation area

---

### 2. **Header Component** (`src/components/admin/Header.tsx`)
Dynamic header with search and filter functionality:
- Page title and subtitle
- "Add Course" button with glow effect
- Search bar with icon
- Filter chips for JLPT levels (N1-N5)
- Status filter dropdown

**Props:**
- `onAddClick`: Callback when "Add Course" button is clicked

---

### 3. **CourseCard Component** (`src/components/admin/CourseCard.tsx`)
Beautiful card component for displaying courses:
- Thumbnail with hover zoom effect
- Course level and status badges
- Course title, description, and instructor info
- View count
- Edit and Delete action buttons
- Responsive grid layout

**Props:**
- `title`: Course name
- `level`: JLPT level (N1-N5)
- `status`: Public or Draft
- `image`: Course thumbnail URL
- `instructor`: Instructor name
- `views`: View count
- `updatedAt`: Last update info
- `onEdit`: Edit callback
- `onDelete`: Delete callback

---

### 4. **CourseForm Component** (`src/components/admin/CourseForm.tsx`)
Comprehensive form for creating/editing courses:
- Image upload with preview
- Course name input
- Description textarea
- JLPT level selector (N1-N5)
- Price input (VND)
- Status selector (Draft/Public)
- Submit button

**Features:**
- Image file upload with DataURL preview
- Form validation
- Support for edit mode with initial data
- Professional styling with focus states

**Props:**
- `onSubmit`: Form submission handler
- `initialData`: Optional initial data for editing

---

### 5. **CourseModal Component** (`src/components/admin/CourseModal.tsx`)
Modal dialog for creating/editing courses:
- Backdrop blur effect
- Title changes based on create/edit mode
- Close button
- Integrates CourseForm
- Responsive positioning

**Props:**
- `open`: Boolean to show/hide modal
- `onClose`: Callback when closing
- `onSubmit`: Form submission callback
- `initialData`: Optional initial data for editing

---

### 6. **CourseManagement Component** (`src/components/admin/CourseManagement.tsx`)
Main dashboard component combining all elements:
- Full-page layout with Sidebar and Header
- Responsive course grid (1-4 columns based on screen size)
- Course card grid with edit/delete functionality
- Pagination footer
- Search and filter functionality
- Modal integration for add/edit operations

**Features:**
- State management for courses
- Add, edit, and delete operations
- Search filtering
- Mock data included for demonstration
- Confirmation dialogs for deletion

---

## 🎨 Color Scheme (Tailwind Config)

```
Primary: #ee2b5b (Pink/Rose)
Background Light: #f8f6f6
Background Dark: #221115
Surface Dark: #331920
Surface Highlight: #48232c
Text Secondary: #c992a0
```

---

## 📊 Database Schema Example

For backend integration, use this structure:

```typescript
interface Course {
  id: number
  title: string
  description: string
  level: 'N1' | 'N2' | 'N3' | 'N4' | 'N5'
  status: 'Draft' | 'Public'
  image: string (URL or base64)
  price: string
  instructor?: string
  views?: number
  updatedAt?: string
  createdAt?: Date
}
```

---

## 🚀 Usage

### Import in page:
```tsx
import CourseManagement from '@/components/admin/CourseManagement'

export default function DashboardAdminPage() {
  return <CourseManagement />
}
```

### The component is already integrated in:
`src/app/(admin)/dashboard-admin/page.tsx`

---

## 🔌 Integration Points

### API Integration TODO:
1. **Fetch Courses** - Replace mock data with API call
   - Endpoint: `GET /api/courses`
   - Update `MOCK_COURSES` with real data

2. **Create Course** - Implement form submission
   - Endpoint: `POST /api/courses`
   - Handle file upload for images

3. **Update Course** - Implement edit functionality
   - Endpoint: `PUT /api/courses/:id`
   - Support image replacement

4. **Delete Course** - Implement deletion
   - Endpoint: `DELETE /api/courses/:id`

---

## 📱 Responsive Breakpoints

- **Mobile**: 1 column
- **Tablet (sm)**: 2 columns
- **Desktop (lg)**: 3 columns
- **Wide (xl)**: 4 columns

---

## ✨ Features Implemented

✅ Professional dark theme layout  
✅ Sidebar navigation with active states  
✅ Header with search functionality  
✅ Course card grid display  
✅ Image upload with preview  
✅ Create/Edit course form  
✅ Modal dialog system  
✅ Delete with confirmation  
✅ Pagination footer  
✅ Responsive design  
✅ Material Design Icons  
✅ Smooth transitions and hover effects  

---

## 🎓 Course Levels
- N1 (Advanced)
- N2 (Upper Intermediate)
- N3 (Intermediate)
- N4 (Lower Intermediate)
- N5 (Beginner)

---

## 📝 Notes

- The component uses React hooks (useState) for state management
- Tailwind CSS is used for styling with custom color configuration
- Material Symbols icons are used throughout
- Image uploads are converted to base64 DataURL format
- The component is fully functional with mock data included
- Ready for API integration

---

## 🔍 File Locations

```
src/components/admin/
├── Sidebar.tsx              (Navigation)
├── Header.tsx               (Search & Filters)
├── CourseCard.tsx           (Course Card)
├── CourseForm.tsx           (Form)
├── CourseModal.tsx          (Modal Dialog)
└── CourseManagement.tsx     (Main Component)

src/app/(admin)/
└── dashboard-admin/
    └── page.tsx            (Entry Point)
```

---

Generated: January 29, 2026
