
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

SELECT cron.schedule('inactivate-expired-contracts', '0 0 * * *', 'SELECT public.inactivate_expired_contracts()');
