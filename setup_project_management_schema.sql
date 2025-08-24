-- Project Management Database Schema
-- This script creates the necessary tables for the project management system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS project_templates CASCADE;
DROP TABLE IF EXISTS daily_digest_settings CASCADE;
DROP TABLE IF EXISTS task_dependencies CASCADE;
DROP TABLE IF EXISTS task_labels CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS labels CASCADE;
DROP TABLE IF EXISTS saved_filters CASCADE;

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),
    color VARCHAR(7) DEFAULT '#3B82F6', -- hex color
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Labels/Tags table
CREATE TABLE labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280', -- hex color
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    effort INTEGER DEFAULT 1, -- effort points (1-5 scale)
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE, -- for subtasks
    sort_order INTEGER DEFAULT 0, -- for ordering within project/status
    snoozed_until TIMESTAMP WITH TIME ZONE, -- for snooze functionality
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Task Labels junction table
CREATE TABLE task_labels (
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    label_id UUID REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, label_id)
);

-- Task Dependencies table
CREATE TABLE task_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dependent_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    prerequisite_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(dependent_task_id, prerequisite_task_id)
);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Attachments table
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Project Templates table
CREATE TABLE project_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    estimated_duration INTEGER, -- days
    template_data JSONB NOT NULL, -- stores the template structure
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Daily Digest Settings table
CREATE TABLE daily_digest_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT TRUE,
    channels JSONB DEFAULT '["email"]', -- array of channels: email, slack, telegram
    webhook_url TEXT, -- n8n webhook URL
    digest_time TIME DEFAULT '09:00:00', -- when to send digest
    sections JSONB DEFAULT '["due_today", "at_risk", "needs_decision", "blocked", "idle_tasks"]',
    idle_task_threshold INTEGER DEFAULT 7, -- days
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Saved Filters table
CREATE TABLE saved_filters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    filter_config JSONB NOT NULL, -- stores filter criteria
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX idx_tasks_sort_order ON tasks(sort_order);
CREATE INDEX idx_tasks_snoozed_until ON tasks(snoozed_until);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_labels_user_id ON labels(user_id);
CREATE INDEX idx_comments_task_id ON comments(task_id);
CREATE INDEX idx_attachments_task_id ON attachments(task_id);
CREATE INDEX idx_project_templates_user_id ON project_templates(user_id);
CREATE INDEX idx_daily_digest_settings_user_id ON daily_digest_settings(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_digest_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage own projects" ON projects;
DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can manage own labels" ON labels;
DROP POLICY IF EXISTS "Users can manage own comments" ON comments;
DROP POLICY IF EXISTS "Users can manage own attachments" ON attachments;
DROP POLICY IF EXISTS "Users can manage own task labels" ON task_labels;
DROP POLICY IF EXISTS "Users can manage own task dependencies" ON task_dependencies;
DROP POLICY IF EXISTS "Users can manage own project templates" ON project_templates;
DROP POLICY IF EXISTS "Users can manage own daily digest settings" ON daily_digest_settings;
DROP POLICY IF EXISTS "Users can manage own saved filters" ON saved_filters;

-- Create RLS policies
-- Projects: Users can only see their own projects
CREATE POLICY "Users can manage own projects" ON projects
    FOR ALL USING (auth.uid() = user_id);

-- Tasks: Users can only see their own tasks
CREATE POLICY "Users can manage own tasks" ON tasks
    FOR ALL USING (auth.uid() = user_id);

-- Labels: Users can only see their own labels
CREATE POLICY "Users can manage own labels" ON labels
    FOR ALL USING (auth.uid() = user_id);

-- Comments: Users can only see their own comments
CREATE POLICY "Users can manage own comments" ON comments
    FOR ALL USING (auth.uid() = user_id);

-- Attachments: Users can only see their own attachments
CREATE POLICY "Users can manage own attachments" ON attachments
    FOR ALL USING (auth.uid() = user_id);

-- Task Labels: Users can only see their own task labels
CREATE POLICY "Users can manage own task labels" ON task_labels
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_labels.task_id 
            AND tasks.user_id = auth.uid()
        )
    );

-- Task Dependencies: Users can only see their own task dependencies
CREATE POLICY "Users can manage own task dependencies" ON task_dependencies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_dependencies.dependent_task_id 
            AND tasks.user_id = auth.uid()
        )
    );

-- Project Templates: Users can only see their own templates
CREATE POLICY "Users can manage own project templates" ON project_templates
    FOR ALL USING (auth.uid() = user_id);

-- Daily Digest Settings: Users can only see their own settings
CREATE POLICY "Users can manage own daily digest settings" ON daily_digest_settings
    FOR ALL USING (auth.uid() = user_id);

-- Saved Filters: Users can only see their own filters
CREATE POLICY "Users can manage own saved filters" ON saved_filters
    FOR ALL USING (auth.uid() = user_id);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_templates_updated_at BEFORE UPDATE ON project_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_digest_settings_updated_at BEFORE UPDATE ON daily_digest_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default project templates
INSERT INTO project_templates (name, description, category, estimated_duration, template_data, is_default, user_id) VALUES
(
    'Client Onboarding',
    'Standard client onboarding process for voice agent services',
    'Client Services',
    14,
    '{"tasks": [{"title": "Initial client meeting", "description": "Schedule and conduct initial discovery call", "priority": "high", "effort": 2, "estimated_hours": 1}, {"title": "Requirements gathering", "description": "Document client requirements and expectations", "priority": "high", "effort": 4, "estimated_hours": 4}, {"title": "Technical assessment", "description": "Evaluate technical requirements and constraints", "priority": "medium", "effort": 3, "estimated_hours": 3}, {"title": "Proposal preparation", "description": "Create detailed project proposal", "priority": "high", "effort": 6, "estimated_hours": 6}, {"title": "Contract negotiation", "description": "Finalize terms and conditions", "priority": "high", "effort": 2, "estimated_hours": 2}, {"title": "Project kickoff", "description": "Begin project execution", "priority": "medium", "effort": 4, "estimated_hours": 4}]}',
    true,
    (SELECT id FROM auth.users LIMIT 1)
),
(
    'Website Launch',
    'Complete website development and launch process',
    'Web Development',
    21,
    '{"tasks": [{"title": "Design mockups", "description": "Create visual design mockups", "priority": "high", "effort": 5, "estimated_hours": 8}, {"title": "Frontend development", "description": "Build responsive frontend components", "priority": "high", "effort": 8, "estimated_hours": 40}, {"title": "Backend development", "description": "Develop API and database", "priority": "high", "effort": 6, "estimated_hours": 30}, {"title": "Content creation", "description": "Write and optimize content", "priority": "medium", "effort": 4, "estimated_hours": 16}, {"title": "Testing and QA", "description": "Perform comprehensive testing", "priority": "medium", "effort": 3, "estimated_hours": 12}, {"title": "Deployment", "description": "Deploy to production", "priority": "high", "effort": 2, "estimated_hours": 4}]}',
    true,
    (SELECT id FROM auth.users LIMIT 1)
),
(
    'Monthly Reporting',
    'Standard monthly client reporting process',
    'Reporting',
    3,
    '{"tasks": [{"title": "Data collection", "description": "Gather all relevant metrics and data", "priority": "medium", "effort": 2, "estimated_hours": 2}, {"title": "Analysis", "description": "Analyze trends and performance", "priority": "medium", "effort": 3, "estimated_hours": 3}, {"title": "Report creation", "description": "Create comprehensive report", "priority": "high", "effort": 4, "estimated_hours": 4}, {"title": "Client review", "description": "Present findings to client", "priority": "high", "effort": 2, "estimated_hours": 1}]}',
    true,
    (SELECT id FROM auth.users LIMIT 1)
);
