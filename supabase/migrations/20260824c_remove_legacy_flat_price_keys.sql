-- Applied 2026-08-24.
--
-- price_whole / price_half / price_quarter predate the per-animal-type price
-- matrix. The admin Settings page never wrote them, so they froze at the
-- original figures while the typed keys moved on — and the weight explainer and
-- size picker were reading the stale ones, quoting customers $8.00/$8.25/$8.50
-- while checkout charged $8.25/$8.50/$9.00.
--
-- Nothing reads them now. Removing them so they cannot drift again and so the
-- Settings page is the only writer of prices.
do $$
declare v_missing int;
begin
  -- Refuse to delete unless every typed key that replaces them exists.
  select count(*) into v_missing
  from (values
    ('price_whole_grass_fed'),('price_half_grass_fed'),('price_quarter_grass_fed'),
    ('price_whole_grain_finished'),('price_half_grain_finished'),('price_quarter_grain_finished'),
    ('price_whole_wagyu'),('price_half_wagyu'),('price_quarter_wagyu')
  ) as required(key)
  where not exists (select 1 from public.config c where c.key = required.key);

  if v_missing > 0 then
    raise exception 'Refusing to delete: % typed price key(s) are missing', v_missing;
  end if;

  delete from public.config where key in ('price_whole','price_half','price_quarter');
end $$;
