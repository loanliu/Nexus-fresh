# Nexus - Personal Productivity Tool

A comprehensive web application for organizing, categorizing, and searching AI tools, resources, and client management assets. Nexus centralizes everything from Google Docs to chat histories to API configurations.

## 🚀 Features

### ✅ Implemented
- **Resource Management System** - Upload and manage various file types
- **Dynamic Categorization System** - Categories, subcategories, and tags
- **Authentication System** - Secure user login and registration
- **Dashboard Interface** - Clean, organized management interface
- **Real-time Updates** - Live synchronization with Supabase

### 🚧 Coming Soon
- **Advanced Search Functionality** - Full-text search with advanced operators
- **Automated Subtask Generation** - AI-powered task suggestions
- **API Key Management** - Secure storage with encryption
- **Client Onboarding Checklists** - Dynamic project templates
- **Analytics & Insights** - Usage metrics and productivity tracking

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **UI Components**: Custom components with Lucide React icons
- **State Management**: React hooks with real-time subscriptions
- **File Handling**: React Dropzone for drag-and-drop uploads

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

## 🔧 Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd nexus
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Supabase Database Setup

Run the following SQL in your Supabase SQL editor:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subcategories table
CREATE TABLE subcategories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tags table
CREATE TABLE tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resources table
CREATE TABLE resources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  category_id UUID REFERENCES categories(id),
  subcategory_id UUID REFERENCES subcategories(id),
  tags TEXT[],
  notes TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Users can view all categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Users can insert categories" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update categories" ON categories FOR UPDATE USING (true);
CREATE POLICY "Users can delete categories" ON categories FOR DELETE USING (true);

-- Subcategories policies
CREATE POLICY "Users can view all subcategories" ON subcategories FOR SELECT USING (true);
CREATE POLICY "Users can insert subcategories" ON subcategories FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update subcategories" ON subcategories FOR UPDATE USING (true);
CREATE POLICY "Users can delete subcategories" ON subcategories FOR DELETE USING (true);

-- Tags policies
CREATE POLICY "Users can view all tags" ON tags FOR SELECT USING (true);
CREATE POLICY "Users can insert tags" ON tags FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update tags" ON tags FOR UPDATE USING (true);
CREATE POLICY "Users can delete tags" ON tags FOR DELETE USING (true);

-- Resources policies
CREATE POLICY "Users can view their own resources" ON resources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own resources" ON resources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own resources" ON resources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own resources" ON resources FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for resources
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', false);

-- Storage policies
CREATE POLICY "Users can upload their own resources" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resources' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their own resources" ON storage.objects FOR SELECT USING (bucket_id = 'resources' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own resources" ON storage.objects FOR UPDATE USING (bucket_id = 'resources' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own resources" ON storage.objects FOR DELETE USING (bucket_id = 'resources' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎯 Usage

### Getting Started
1. **Sign Up/Login** - Create an account or sign in to access the dashboard
2. **Categories** - Start by setting up your main categories (AI Tools, SEO, etc.)
3. **Resources** - Upload files and organize them with categories and tags
4. **Organization** - Use subcategories and tags for detailed organization

### Key Features
- **Drag & Drop Uploads** - Simply drag files into the upload area
- **Smart Categorization** - Predefined categories for common use cases
- **Real-time Sync** - Changes appear instantly across all devices
- **Responsive Design** - Works seamlessly on desktop and mobile

## 🔒 Security Features

- Row Level Security (RLS) on all database tables
- User authentication with Supabase Auth
- Secure file storage with user isolation
- API key encryption (coming soon)

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- Netlify
- Railway
- DigitalOcean App Platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the Supabase documentation
- Review the Next.js documentation

## 🔮 Roadmap

- [ ] Advanced search with full-text indexing
- [ ] AI-powered content analysis and auto-categorization
- [ ] Automated subtask generation
- [ ] API key management with encryption
- [ ] Client onboarding checklists
- [ ] Analytics dashboard
- [ ] Mobile app
- [ ] API for third-party integrations
