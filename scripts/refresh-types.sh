
#!/bin/bash

# This script generates TypeScript types from the Supabase database schema
PROJECT_ID=$(grep project_id supabase/config.toml | sed 's/project_id = "\(.*\)"/\1/')

if [ -z "$PROJECT_ID" ]; then
  echo "Error: Could not find project_id in supabase/config.toml"
  exit 1
fi

echo "Generating types for Supabase project: $PROJECT_ID"
echo "This requires the Supabase CLI to be installed."

# Generate types
npx supabase gen types typescript --project-id "$PROJECT_ID" > src/integrations/supabase/types.ts

if [ $? -eq 0 ]; then
  echo "Types generated successfully!"
  echo "Types written to src/integrations/supabase/types.ts"
else
  echo "Error generating types"
  exit 1
fi
