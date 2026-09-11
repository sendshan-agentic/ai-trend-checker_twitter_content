-- Enable pg_net for HTTP requests from cron
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Unschedule any existing version
SELECT cron.unschedule('daily-trends-update');

-- Schedule daily trends update at 6:00 AM UTC
-- The edge function has verify_jwt=false so no auth header needed
SELECT cron.schedule(
  'daily-trends-update',
  '0 6 * * *',
  $$
    SELECT net.http_post(
      url := 'https://jbkbgbjihzyqalsrwrgf.supabase.co/functions/v1/daily-trends-update',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{}'::jsonb
    );
  $$
);
