-- ============================================
-- TypeRacer Clone — Initial Database Schema
-- ============================================

create table players (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  is_anonymous boolean default false,
  created_at timestamptz default now()
);

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.players (id, name, is_anonymous)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Anonymous'),
    coalesce((new.raw_user_meta_data->>'is_anonymous')::boolean, true)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

create table sentences (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  mode text not null check (mode in ('words', 'sentences', 'text', 'mixed')),
  difficulty text default 'medium' check (difficulty in ('easy', 'medium', 'hard'))
);

create table game_rounds (
  id uuid primary key default gen_random_uuid(),
  sentence_id uuid references sentences(id),
  mode text not null,
  started_at timestamptz not null,
  ended_at timestamptz not null
);

create table round_results (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references game_rounds(id),
  player_id uuid references players(id) on delete cascade,
  wpm integer,
  accuracy numeric(5,4),
  completed boolean default false,
  created_at timestamptz default now(),
  unique(round_id, player_id)
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

alter table players enable row level security;
create policy "Players are viewable by everyone" on players for select using (true);
create policy "Users can update own profile" on players for update using (auth.uid() = id);

alter table round_results enable row level security;
create policy "Results are viewable by everyone" on round_results for select using (true);
create policy "Users can insert own results" on round_results for insert with check (auth.uid() = player_id);

alter table sentences enable row level security;
create policy "Sentences are viewable by everyone" on sentences for select using (true);

alter table game_rounds enable row level security;
create policy "Rounds are viewable by everyone" on game_rounds for select using (true);
create policy "Rounds can be inserted by authenticated" on game_rounds for insert with check (auth.role() = 'authenticated');
