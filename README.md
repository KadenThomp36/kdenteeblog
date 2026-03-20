# Modern Blog

A minimal, modern blog platform built with Next.js, featuring beautiful typography, dark mode, and rich text editing.

## Features

- 🎨 Beautiful minimal UI with modern typography
- 🌓 Light and dark mode support
- 📝 Rich text editor with Tiptap
- 🖼️ Image uploads with UploadThing
- 🔐 Authentication with NextAuth.js
- 📱 Fully responsive design (mobile and desktop)
- ⚡ Built with Next.js 15 App Router
- 💾 SQLite database with Prisma ORM
- 🎭 Styled with Tailwind CSS and shadcn/ui

## Tech Stack

- **Framework**: Next.js 15
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: SQLite + Prisma
- **Authentication**: NextAuth.js
- **Rich Text Editor**: Tiptap
- **File Storage**: UploadThing
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Blog
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
The `.env.local` file is already configured with:
- Database URL (SQLite)
- UploadThing credentials
- NextAuth configuration

**Important**: Change the `NEXTAUTH_SECRET` in production:
```bash
NEXTAUTH_SECRET="your-production-secret-key"
```

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating Your First Account

1. Navigate to `/register` to create an account
2. Fill in your name, email, and password
3. Click "Register"
4. Login with your credentials at `/login`

### Creating Blog Posts

1. After logging in, click "My Posts" in the header
2. Click "Create New Post"
3. Fill in the post details:
   - Title (required)
   - Slug (auto-generated from title, but editable)
   - Excerpt (optional summary)
   - Cover Image (optional - upload via UploadThing)
   - Content (rich text editor with formatting options)
4. Choose to save as draft or publish immediately

### Rich Text Editor Features

The Tiptap editor supports:
- **Bold** and *Italic* text
- Headings
- Bullet and numbered lists
- Blockquotes
- Images
- Undo/Redo

### Theme Toggle

Click the sun/moon icon in the header to switch between:
- Light mode
- Dark mode
- System preference

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── admin/             # Admin panel (protected)
│   │   └── posts/         # Post management
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── posts/         # Post CRUD operations
│   │   └── uploadthing/   # File upload handlers
│   ├── posts/             # Public post pages
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── editor.tsx        # Rich text editor
│   ├── header.tsx        # Navigation header
│   └── theme-*.tsx       # Theme components
├── lib/                   # Utility functions
│   ├── db.ts             # Prisma client
│   ├── utils.ts          # Helper functions
│   └── uploadthing.ts    # UploadThing config
├── prisma/               # Database schema and migrations
│   └── schema.prisma     # Database models
└── types/                # TypeScript type definitions
```

## Database Schema

The blog uses the following main models:

- **User**: Author accounts with authentication
- **Post**: Blog posts with title, content, images, and publish status
- **Image**: Uploaded images linked to posts
- **Session/Account**: Authentication session management

## API Routes

- `POST /api/auth/register` - Create new user account
- `POST /api/auth/[...nextauth]` - NextAuth authentication
- `POST /api/posts` - Create new blog post
- `POST /api/uploadthing` - Upload images

## Customization

### Changing the Blog Name

Update the header component in `components/header.tsx`:
```tsx
<span className="inline-block font-bold text-xl">Your Blog Name</span>
```

### Styling

The project uses Tailwind CSS with CSS variables for theming. Modify colors in:
- `app/globals.css` - Theme color variables
- `tailwind.config.ts` - Tailwind configuration

### Typography

The blog uses the Inter font. To change it, update `app/layout.tsx`:
```tsx
import { YourFont } from "next/font/google"
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables:
   - `DATABASE_URL` (use a production database like PostgreSQL)
   - `NEXTAUTH_URL` (your production URL)
   - `NEXTAUTH_SECRET` (generate a secure secret)
   - `UPLOADTHING_TOKEN` and `UPLOADTHING_SECRET`
4. Deploy!

### Important for Production

- Change database from SQLite to PostgreSQL or MySQL
- Generate a secure `NEXTAUTH_SECRET`
- Set up proper authentication providers
- Configure CORS and security headers
- Add rate limiting for API routes

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
