-- Allow any text value for fixed_costs.category (not just the 3 defaults)
alter table fixed_costs drop constraint if exists fixed_costs_category_check;
