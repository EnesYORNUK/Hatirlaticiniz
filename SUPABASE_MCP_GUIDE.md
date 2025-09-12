# Supabase MCP Integration Guide

## Using Supabase MCP for Database Operations

Since you want to use Supabase MCP (Model Context Protocol), here's how to set up and use it:

### 1. Install Supabase CLI and MCP Tools

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize Supabase in project
supabase init
```

### 2. Create Supabase Project via MCP

```bash
# Create new project
supabase projects create hatirlaticinim

# Get project details
supabase projects list
```

### 3. Configure Local Development

```bash
# Start local Supabase
supabase start

# Check local status
supabase status
```

### 4. Database Setup via MCP

```bash
# Apply database schema
supabase db reset

# Push schema to remote
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > src/types/supabase.ts
```

### 5. Environment Configuration

After creating the project via MCP, update `.env.local`:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key

# For production:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

### 6. MCP Commands for Database Management

```bash
# Apply migrations
supabase migration new create_initial_schema

# Reset database
supabase db reset

# Generate migrations from changes
supabase db diff

# Deploy to production
supabase db push --linked
```

### 7. Real-time Subscriptions Setup

```bash
# Enable realtime for tables
supabase realtime enable

# Configure RLS policies
supabase db apply-rls
```

## Integration with Current Code

The current hooks will work with MCP-configured Supabase automatically once the environment variables are set correctly.