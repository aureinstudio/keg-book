-- Card news image storage bucket
-- 카드뉴스 PNG를 영구 저장 + 공개 URL로 history에서 다시 보기

insert into storage.buckets (id, name, public)
values ('card-news', 'card-news', true)
on conflict (id) do nothing;

-- 공개 읽기 정책 (이미 있으면 무시)
do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'card-news public read'
  ) then
    create policy "card-news public read"
      on storage.objects for select
      using (bucket_id = 'card-news');
  end if;
end $$;
