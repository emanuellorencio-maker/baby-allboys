# Push segmentado con Supabase

Variables necesarias en Vercel:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

SQL sugerido:

```sql
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text unique not null,
  subscription jsonb not null,
  zona text,
  equipo text,
  avisos text[],
  user_agent text,
  activo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_seen_at timestamptz,
  error_count int default 0,
  last_error text
);

create table if not exists push_logs (
  id uuid primary key default gen_random_uuid(),
  title text,
  body text,
  url text,
  zona text,
  aviso_tipo text,
  categoria text,
  enviados int default 0,
  fallidos int default 0,
  created_at timestamptz default now()
);
```

Arquitectura futura para WhatsApp, no implementada en esta etapa:

WhatsApp Business Cloud API -> webhook `/api/whatsapp/webhook` -> interpretar comando -> enviar push segmentada.

Comandos futuros posibles:

- `ZONA C 2015 PRIMER TIEMPO`
- `ZONA I 2016 ENTRETIEMPO`
- `MAT1 2014/15 FINALIZADO`
- `MAT4 2013 RESULTADO CARGADO`

Requiere WhatsApp Business Cloud API, webhook publico, token de Meta y validacion de numero autorizado/admin. No conviene sumarlo en esta primera etapa.
