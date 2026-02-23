-- Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users primary key,
  username text unique not null,
  wallet_address text,
  created_at timestamptz default now()
);

-- Posts
create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  content text not null check (char_length(content) <= 280),
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table posts enable row level security;

create policy "Profiles viewable by all" on profiles for select using (true);
create policy "Own profile insert" on profiles for insert with check (auth.uid() = id);
create policy "Own profile update" on profiles for update using (auth.uid() = id);

create policy "Posts viewable by all" on posts for select using (true);
create policy "Authenticated users can post" on posts for insert with check (auth.uid() is not null);
create policy "Own post delete" on posts for delete using (auth.uid() = user_id);
