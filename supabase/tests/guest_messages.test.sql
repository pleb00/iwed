begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

select has_table('public', 'guest_messages', 'Guestbook table exists');
select ok((select relrowsecurity from pg_class where oid = 'public.guest_messages'::regclass), 'RLS is enabled');

select ok(has_table_privilege(role, 'public.guest_messages', 'SELECT'), role || ' can read wishes')
from unnest(array['anon', 'authenticated']) as role;
select ok(has_column_privilege(role, 'public.guest_messages', 'name', 'INSERT'), role || ' can insert a name')
from unnest(array['anon', 'authenticated']) as role;
select ok(has_column_privilege(role, 'public.guest_messages', 'message', 'INSERT'), role || ' can insert a wish')
from unnest(array['anon', 'authenticated']) as role;
select ok(not has_column_privilege(role, 'public.guest_messages', 'id', 'INSERT'), role || ' cannot supply an ID')
from unnest(array['anon', 'authenticated']) as role;
select ok(not has_column_privilege(role, 'public.guest_messages', 'created_at', 'INSERT'), role || ' cannot supply a timestamp')
from unnest(array['anon', 'authenticated']) as role;
select ok(not has_table_privilege(role, 'public.guest_messages', 'UPDATE'), role || ' cannot edit wishes')
from unnest(array['anon', 'authenticated']) as role;
select ok(not has_table_privilege(role, 'public.guest_messages', 'DELETE'), role || ' cannot delete wishes')
from unnest(array['anon', 'authenticated']) as role;
select ok(not has_table_privilege(role, 'public.guest_messages', 'TRUNCATE'), role || ' cannot truncate wishes')
from unnest(array['anon', 'authenticated']) as role;

set local role anon;
select lives_ok($$insert into public.guest_messages (name, message) values ('Guestbook test', E'Selamat!\nDoa kami.') returning id, created_at$$, 'Anonymous guests can submit and read generated fields');
select throws_ok($$insert into public.guest_messages (name, message) values ('', 'Hello')$$, '23514', null, 'Empty names are rejected');
select throws_ok($$insert into public.guest_messages (name, message) values ('Guest', E'\t\n ')$$, '23514', null, 'Whitespace-only wishes are rejected');
select throws_ok($$insert into public.guest_messages (name, message) values (repeat('x', 81), 'Hello')$$, '23514', null, 'Long names are rejected');
select throws_ok($$insert into public.guest_messages (name, message) values ('Guest', repeat('x', 1001))$$, '23514', null, 'Long wishes are rejected');
select throws_ok($$insert into public.guest_messages (id, name, message) values (gen_random_uuid(), 'Guest', 'Hello')$$, '42501', null, 'Guests cannot forge IDs');
select throws_ok($$insert into public.guest_messages (name, message, created_at) values ('Guest', 'Hello', now())$$, '42501', null, 'Guests cannot forge dates');
select throws_ok($$update public.guest_messages set message = 'Changed' where false$$, '42501', null, 'Anonymous updates are denied');
select throws_ok($$delete from public.guest_messages where false$$, '42501', null, 'Anonymous deletes are denied');

set local role authenticated;
select lives_ok($$insert into public.guest_messages (name, message) values ('Guestbook test', 'Congratulations!') returning id, created_at$$, 'Authenticated guests can submit wishes');
select throws_ok($$update public.guest_messages set message = 'Changed' where false$$, '42501', null, 'Authenticated updates are denied');
select throws_ok($$delete from public.guest_messages where false$$, '42501', null, 'Authenticated deletes are denied');

reset role;
select * from finish();
rollback;
