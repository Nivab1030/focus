-- Create tables for habit tracking app

-- Enable RLS (Row Level Security)
alter default privileges revoke execute on functions from public;

-- Create habit_categories table
create table public.habit_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  color text not null,
  created_at timestamp with time zone default now() not null,
  
  constraint habit_categories_user_id_name_key unique (user_id, name)
);

-- Create habits table
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  category_id uuid references public.habit_categories not null,
  title text not null,
  frequency_type text not null check (frequency_type in ('daily', 'custom')),
  frequency_days integer[] null,
  created_at timestamp with time zone default now() not null,
  
  constraint habits_user_id_title_key unique (user_id, title)
);

-- Create habit_completions table
create table public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  habit_id uuid references public.habits not null,
  date date not null,
  completed boolean not null default true,
  created_at timestamp with time zone default now() not null,
  
  constraint habit_completions_habit_id_date_key unique (habit_id, date)
);

-- Enable Row Level Security
alter table public.habit_categories enable row level security;
alter table public.habits enable row level security;
alter table public.habit_completions enable row level security;

-- Create policies for habit_categories
create policy "Users can view their own habit categories"
  on public.habit_categories for select
  using (auth.uid() = user_id);

create policy "Users can insert their own habit categories"
  on public.habit_categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own habit categories"
  on public.habit_categories for update
  using (auth.uid() = user_id);

create policy "Users can delete their own habit categories"
  on public.habit_categories for delete
  using (auth.uid() = user_id);

-- Create policies for habits
create policy "Users can view their own habits"
  on public.habits for select
  using (auth.uid() = user_id);

create policy "Users can insert their own habits"
  on public.habits for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own habits"
  on public.habits for update
  using (auth.uid() = user_id);

create policy "Users can delete their own habits"
  on public.habits for delete
  using (auth.uid() = user_id);

-- Create policies for habit_completions
create policy "Users can view their own habit completions"
  on public.habit_completions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own habit completions"
  on public.habit_completions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own habit completions"
  on public.habit_completions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own habit completions"
  on public.habit_completions for delete
  using (auth.uid() = user_id);

-- Create indexes for better performance
create index habit_categories_user_id_idx on public.habit_categories (user_id);
create index habits_user_id_idx on public.habits (user_id);
create index habits_category_id_idx on public.habits (category_id);
create index habit_completions_user_id_idx on public.habit_completions (user_id);
create index habit_completions_habit_id_idx on public.habit_completions (habit_id);
create index habit_completions_date_idx on public.habit_completions (date);

-- Create a view for analytics
create or replace view public.habit_analytics as
select
  hc.user_id,
  hc.date,
  count(*) as total_habits,
  sum(case when hc.completed then 1 else 0 end) as completed_habits,
  (sum(case when hc.completed then 1 else 0 end)::float / count(*)::float) * 100 as completion_rate,
  h.category_id,
  cat.name as category_name,
  cat.color as category_color
from
  public.habit_completions hc
  join public.habits h on hc.habit_id = h.id
  join public.habit_categories cat on h.category_id = cat.id
group by
  hc.user_id,
  hc.date,
  h.category_id,
  cat.name,
  cat.color;

-- Set up RLS for the view
create policy "Users can view their own analytics"
  on public.habit_analytics for select
  using (auth.uid() = user_id);

-- Create a function to get quarterly summary
create or replace function public.get_quarterly_summary(
  p_user_id uuid,
  p_year integer,
  p_quarter integer
)
returns json
language plpgsql
security definer
as $$
declare
  start_date date;
  end_date date;
  result json;
begin
  -- Calculate quarter date range
  start_date := make_date(p_year, ((p_quarter - 1) * 3) + 1, 1);
  end_date := (make_date(p_year, (p_quarter * 3) + 1, 1) - interval '1 day')::date;
  
  -- Get summary data
  select
    json_build_object(
      'period', concat('Q', p_quarter, ' ', p_year),
      'totalHabits', (select count(distinct habit_id) from habit_completions where user_id = p_user_id and date between start_date and end_date),
      'totalCompletions', (select count(*) from habit_completions where user_id = p_user_id and date between start_date and end_date and completed = true),
      'completionRate', (
        select
          case
            when count(*) > 0 then
              (sum(case when completed then 1 else 0 end)::float / count(*)::float) * 100
            else 0
          end
        from habit_completions
        where user_id = p_user_id and date between start_date and end_date
      ),
      'categoryBreakdown', (
        select
          json_object_agg(
            cat.name,
            json_build_object(
              'total', count(hc.*),
              'completed', sum(case when hc.completed then 1 else 0 end),
              'rate', case
                when count(hc.*) > 0 then
                  (sum(case when hc.completed then 1 else 0 end)::float / count(hc.*)::float) * 100
                else 0
              end
            )
          )
        from
          habit_completions hc
          join habits h on hc.habit_id = h.id
          join habit_categories cat on h.category_id = cat.id
        where
          hc.user_id = p_user_id
          and hc.date between start_date and end_date
        group by
          cat.id
      )
    ) into result;
  
  return result;
end;
$$; 