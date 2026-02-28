-- ============================================
-- FULL SETUP: Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Tables
create table if not exists players (
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

create table if not exists sentences (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  mode text not null check (mode in ('words', 'sentences', 'text', 'mixed')),
  difficulty text default 'medium' check (difficulty in ('easy', 'medium', 'hard'))
);

create table if not exists game_rounds (
  id uuid primary key default gen_random_uuid(),
  sentence_id uuid references sentences(id),
  mode text not null,
  started_at timestamptz not null,
  ended_at timestamptz not null
);

create table if not exists round_results (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references game_rounds(id),
  player_id uuid references players(id) on delete cascade,
  wpm integer,
  accuracy numeric(5,4),
  completed boolean default false,
  created_at timestamptz default now(),
  unique(round_id, player_id)
);

-- 2. RLS
alter table players enable row level security;
drop policy if exists "Players are viewable by everyone" on players;
create policy "Players are viewable by everyone" on players for select using (true);
drop policy if exists "Users can update own profile" on players;
create policy "Users can update own profile" on players for update using (auth.uid() = id);
drop policy if exists "Users can insert own player" on players;
create policy "Users can insert own player" on players for insert with check (auth.uid() = id);

alter table round_results enable row level security;
drop policy if exists "Results are viewable by everyone" on round_results;
create policy "Results are viewable by everyone" on round_results for select using (true);
drop policy if exists "Users can insert own results" on round_results;
create policy "Users can insert own results" on round_results for insert with check (auth.uid() = player_id);

alter table sentences enable row level security;
drop policy if exists "Sentences are viewable by everyone" on sentences;
create policy "Sentences are viewable by everyone" on sentences for select using (true);

alter table game_rounds enable row level security;
drop policy if exists "Rounds are viewable by everyone" on game_rounds;
create policy "Rounds are viewable by everyone" on game_rounds for select using (true);
drop policy if exists "Rounds can be inserted by authenticated" on game_rounds;
create policy "Rounds can be inserted by authenticated" on game_rounds for insert with check (auth.role() = 'authenticated');

-- 3. Seed sentences (skip if already exist)
INSERT INTO sentences (text, mode, difficulty) VALUES
('apple banana cherry dog elephant frog guitar house igloo jacket', 'words', 'easy'),
('kite lemon monkey notebook orange pencil queen rabbit snake tiger', 'words', 'easy'),
('umbrella violin window xylophone yellow zebra anchor bridge castle dragon', 'words', 'easy'),
('forest garden hammer island jungle kitchen ladder mountain napkin ocean', 'words', 'easy'),
('palace question river sunset tunnel uniform village whistle crystal diamond', 'words', 'easy'),
('abstract brilliant cascade delicate enormous fragment graceful harmony intricate jubilant', 'words', 'medium'),
('algorithm benchmark complexity deviation efficiency framework governance hierarchy iteration junction', 'words', 'medium'),
('kaleidoscope landscape metamorphosis navigation optimization parameter qualification redundancy simulation threshold', 'words', 'medium'),
('acceleration bibliography constellation deterioration electromagnetic fluorescence gravitational hypothetical infrastructure juxtaposition', 'words', 'medium'),
('cloud server network protocol database function module export import variable', 'words', 'easy'),
('promise callback async await fetch response request header status error', 'words', 'medium'),
('typescript interface component function render state effect context provider reducer', 'words', 'medium'),
('deploy container orchestration pipeline integration delivery monitoring logging tracing metrics', 'words', 'hard'),
('quantum neural synthetic parallel recursive modular abstract polymorphic concurrent distributed', 'words', 'hard'),
('venture capital portfolio acquisition merger stakeholder dividend equity treasury valuation', 'words', 'medium')
ON CONFLICT DO NOTHING;

INSERT INTO sentences (text, mode, difficulty) VALUES
('The quick brown fox jumps over the lazy dog near the riverbank.', 'sentences', 'easy'),
('She sells seashells by the seashore every summer morning.', 'sentences', 'easy'),
('A journey of a thousand miles begins with a single step forward.', 'sentences', 'easy'),
('The early bird catches the worm but the second mouse gets the cheese.', 'sentences', 'easy'),
('Every great developer was once a beginner who never gave up on learning.', 'sentences', 'easy'),
('Programming is not about typing fast, it is about thinking clearly and solving problems efficiently.', 'sentences', 'medium'),
('The best way to predict the future is to create it with your own hands and determination.', 'sentences', 'medium'),
('In the middle of difficulty lies opportunity, and those who seek it shall find great rewards.', 'sentences', 'medium'),
('Good code is its own best documentation, and well-named functions rarely need additional comments.', 'sentences', 'medium'),
('The only way to do great work is to love what you do and never stop improving your craft.', 'sentences', 'medium'),
('Success is not final and failure is not fatal. It is the courage to continue that counts the most.', 'sentences', 'medium'),
('Technology is best when it brings people together and helps them achieve things they could not do alone.', 'sentences', 'medium'),
('Software engineering is the art of balancing complexity with simplicity while delivering value to users consistently.', 'sentences', 'hard'),
('Debugging is twice as hard as writing the code in the first place, so write your code as simply as possible.', 'sentences', 'hard'),
('Real-time systems require careful synchronization between distributed clients to maintain consistency without sacrificing performance.', 'sentences', 'hard'),
('Modern web applications leverage server-side rendering and client-side hydration to deliver optimal user experiences across devices.', 'sentences', 'hard')
ON CONFLICT DO NOTHING;

INSERT INTO sentences (text, mode, difficulty) VALUES
('The art of programming is the art of organizing complexity. Software development is fundamentally about managing the inherent complexity of the systems we build. Every line of code we write adds to this complexity, and every abstraction we create is an attempt to manage it.', 'text', 'medium'),
('TypeScript has revolutionized the way we write JavaScript applications. By adding static type checking to the language, it catches entire categories of bugs at compile time rather than runtime. The type system serves as living documentation, making code more readable and maintainable.', 'text', 'medium'),
('The rise of real-time web applications has transformed how users interact with software. Gone are the days when users had to refresh their browsers to see updated content. Modern applications use WebSockets and other technologies to push updates to clients instantly.', 'text', 'medium'),
('Database design is one of the most critical aspects of application development. A well-designed schema can make queries fast and intuitive, while a poorly designed one can lead to performance bottlenecks and maintenance nightmares.', 'text', 'hard'),
('Authentication and authorization are fundamental concerns in any web application. Authentication verifies who a user is, while authorization determines what they are allowed to do. Modern authentication systems often leverage tokens, sessions, and third-party identity providers.', 'text', 'hard'),
('Testing is an essential practice that gives developers confidence to make changes without breaking existing functionality. Unit tests verify individual functions in isolation, integration tests check how pieces work together, and end-to-end tests validate complete user workflows.', 'text', 'medium')
ON CONFLICT DO NOTHING;
