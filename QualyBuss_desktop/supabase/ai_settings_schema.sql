-- Create table for AI Settings if not exists
create table if not exists ai_settings (
  user_id uuid references auth.users not null primary key,
  system_instruction text default 'You are a helpful assistant for QualyBuss.',
  model text default 'gemini-2.5-flash',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table ai_settings enable row level security;

-- Policies for ai_settings (Drop first to avoid duplication errors if re-running)
drop policy if exists "Users can view their own settings" on ai_settings;
create policy "Users can view their own settings"
  on ai_settings for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own settings" on ai_settings;
create policy "Users can insert their own settings"
  on ai_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own settings" on ai_settings;
create policy "Users can update their own settings"
  on ai_settings for update
  using (auth.uid() = user_id);
