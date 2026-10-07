-- Public source-backed content. Browser visitors cannot modify records.
create table public.ship_happens_settings (
 id text primary key check (id = 'main'),
 content jsonb not null
);
create table public.ship_happens_days (
 day smallint primary key check(day between 1 and 28),
 date date not null unique,
 ship_status text not null check(ship_status in ('pending','verified')),
 reset_status text not null check(reset_status in ('unconfirmed','pending','confirmed')),
 reset_source_url text,
 poll_url text,
 note text not null default '',
 check(date = date '2026-10-05' + (day - 1)),
 check(reset_status <> 'confirmed' or reset_source_url ~ '^https://x[.]com/[A-Za-z0-9_]+/status/[0-9]+$')
);
create table public.ship_happens_releases (
 id text primary key,
 day smallint not null references public.ship_happens_days(day),
 title text not null,
 summary text not null,
 category text not null,
 source_url text not null check(source_url ~ '^https://x[.]com/[A-Za-z0-9_]+/status/[0-9]+$'),
 product_url text,
 unique(day,source_url,title)
);
alter table public.ship_happens_settings enable row level security;
alter table public.ship_happens_days enable row level security;
alter table public.ship_happens_releases enable row level security;
revoke all on public.ship_happens_settings, public.ship_happens_days, public.ship_happens_releases from anon, authenticated;
grant select on public.ship_happens_settings, public.ship_happens_days, public.ship_happens_releases to anon, authenticated;
grant select,insert,update,delete on public.ship_happens_settings, public.ship_happens_days, public.ship_happens_releases to service_role;
create policy "Public challenge settings" on public.ship_happens_settings for select to anon,authenticated using(true);
create policy "Public challenge days" on public.ship_happens_days for select to anon,authenticated using(true);
create policy "Public challenge releases" on public.ship_happens_releases for select to anon,authenticated using(true);
