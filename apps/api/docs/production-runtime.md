# Production runtime processes

The production environment template uses the database queue. Run migrations before
starting the queue worker so the `jobs`, `job_batches`, and `failed_jobs` tables
created by `2026_10_09_000001_restore_queue_tables_for_production` are available.

Run one or more queue workers under a process manager such as Supervisor or
systemd. A worker can be started with:

```sh
php artisan queue:work database --sleep=3 --tries=3 --timeout=80
```

After each deployment, restart long-running workers with `php artisan queue:restart`.
The configured queue `retry_after` is 90 seconds; keep worker timeout below that.

Chat realtime uses Reverb. Keep the Reverb listener on its internal port and run it
under the same process manager:

```sh
php artisan reverb:start --host=0.0.0.0 --port=8080
```

Configure the HTTPS reverse proxy for the same application domain to forward
WebSocket upgrades on `/app` to Reverb port 8080, and forward `/apps` to Reverb
for server-side broadcasts. Do not expose port 8080 directly to the public
internet. Set `REVERB_HOST`, `REVERB_PORT`, and `REVERB_SCHEME` to the public
HTTPS endpoint, and set `REVERB_ALLOWED_ORIGINS` to the deployed hostname only.

Build the web app with the matching `VITE_REVERB_*` values from
`apps/web/.env.production.example`. The public app key is shared with Reverb;
keep `REVERB_APP_SECRET` server-side only.
