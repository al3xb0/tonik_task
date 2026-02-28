create policy "Users can insert own player" on players for insert with check (auth.uid() = id);
