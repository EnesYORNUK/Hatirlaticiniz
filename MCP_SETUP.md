# Supabase MCP Setup Instructions

## Quick Setup with Supabase MCP

### 1. Create Supabase Project via CLI/MCP

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Create new project (replace with your project name)
supabase projects create hatirlaticinim-app

# Link to local project
supabase link --project-ref your-project-ref
```

### 2. Apply MCP-Optimized Schema

```bash
# Apply the MCP schema
supabase db reset --db-url your-db-url

# Or apply directly
supabase db push
```

### 3. Configure Environment Variables

After creating the project, update `.env.local`:

```env
# From Supabase MCP output
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-from-mcp

# For local development
# VITE_SUPABASE_URL=http://localhost:54321
# VITE_SUPABASE_ANON_KEY=your-local-anon-key
```

### 4. MCP Commands for Management

```bash
# Generate TypeScript types from MCP
supabase gen types typescript --linked > src/types/supabase-mcp.ts

# Check MCP status
supabase status

# View logs via MCP
supabase logs

# Deploy via MCP
supabase functions deploy
```

### 5. Test MCP Integration

```bash
# Start local Supabase with MCP
supabase start

# Test connection
supabase db ping

# Run your app
npm run dev
```

## MCP Features Enabled

- ✅ **JSONB Settings Storage** - More flexible user settings
- ✅ **Enhanced Indexing** - Better query performance
- ✅ **Array Fields** - Tags, side effects support
- ✅ **MCP Views** - Dashboard aggregation
- ✅ **Optimized RLS** - Simplified policies
- ✅ **Real-time Ready** - MCP subscription support

The current application hooks will work automatically once MCP environment variables are configured!