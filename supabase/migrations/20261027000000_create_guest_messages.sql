create table public.guest_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  message text not null,
  created_at timestamptz not null default now(),
  constraint guest_messages_name_length check (
    char_length(name) between 1 and 80 and name ~ '[^[:space:]]'
  ),
  constraint guest_messages_message_length check (
    char_length(message) between 1 and 1000 and message ~ '[^[:space:]]'
  )
);

create index guest_messages_newest_first on public.guest_messages (created_at desc, id desc);

alter table public.guest_messages enable row level security;

-- Remove Supabase's default privileges, including truncate, update and delete.
revoke all on table public.guest_messages from public, anon, authenticated;
grant select on table public.guest_messages to anon, authenticated;
grant insert (name, message) on table public.guest_messages to anon, authenticated;

create policy "Anyone can read wedding wishes"
  on public.guest_messages for select to anon, authenticated
  using (true);

create policy "Guests can submit wedding wishes"
  on public.guest_messages for insert to anon, authenticated
  with check (true);
