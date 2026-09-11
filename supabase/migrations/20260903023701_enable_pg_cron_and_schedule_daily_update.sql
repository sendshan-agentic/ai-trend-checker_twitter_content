-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Schedule daily trends update at 6:00 AM UTC
-- Calls the edge function which fetches fresh data from Tavily
SELECT cron.schedule(
  'daily-trends-update',
  '0 6 * * *',
  $$
    SELECT content
    FROM extensions.http_post(
      'https://jbkbgbjihzyqalsrwrgf.supabase.co/functions/v1/daily-trends-update',
      '{}'::jsonb,
      'application/json',
      ARRAY[
        ('Authorization', 'Bearer ' || current_setting('app.service_role_key', true))::text[]
      ]
    );
  $$
);
