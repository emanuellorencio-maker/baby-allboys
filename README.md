# Baby All Boys

## Intercambio Mundial 2026

`intercambio.html` tiene dos modos:

- **Modo real**: usa funciones API de Vercel y Supabase. Los perfiles, figuritas, matches y ranking se comparten entre celulares.
- **Modo demo**: si Supabase no esta configurado o las API no estan disponibles, usa `localStorage`. En ese caso aparece el aviso: `Modo demo: los datos no se comparten todavia entre usuarios.`

El frontend nunca recibe `SUPABASE_SERVICE_ROLE_KEY`. La escritura y validacion de PIN pasan por `/api/intercambio/*`.

## Crear Supabase

1. Crear un proyecto en [Supabase](https://supabase.com).
2. Entrar a **SQL Editor**.
3. Ejecutar este SQL:

```sql
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  category text not null,
  team text not null,
  pin_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stickers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  sticker_number int not null check (sticker_number between 1 and 980),
  quantity int not null default 1 check (quantity >= 1),
  status text not null check (status in ('owned', 'duplicate')),
  updated_at timestamptz not null default now(),
  unique (profile_id, sticker_number)
);

create index if not exists profiles_active_idx
  on public.profiles (is_active, category, team);

create unique index if not exists profiles_identity_active_uidx
  on public.profiles (lower(nickname), category, team)
  where is_active = true;

create index if not exists stickers_profile_idx
  on public.stickers (profile_id);

create index if not exists stickers_number_status_idx
  on public.stickers (sticker_number, status);

alter table public.profiles enable row level security;
alter table public.stickers enable row level security;
```

Las funciones API usan `SUPABASE_SERVICE_ROLE_KEY`, por eso no hace falta abrir policies publicas para el cliente.

## Variables de entorno en Vercel

Configurar en Vercel, dentro del proyecto:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (reservada para integraciones futuras del cliente)
- `SUPABASE_SERVICE_ROLE_KEY` (requerida para estas funciones API)

`SUPABASE_SERVICE_ROLE_KEY` solo se usa del lado server/API. No ponerla en `intercambio.js`, HTML ni CSS.

## Endpoints

- `GET /api/intercambio/perfiles`: lista perfiles activos con album.
- `POST /api/intercambio/perfiles`: crea perfil real y guarda PIN hasheado.
- `POST /api/intercambio/login`: valida apodo, categoria, equipo/zona y PIN.
- `GET /api/intercambio/figus?profileId=...`: carga album real.
- `POST /api/intercambio/figus`: guarda figuritas del perfil.
- `GET /api/intercambio/matches?profileId=...`: calcula cambios reales.
- `GET /api/intercambio/ranking?mode=advanced&profileId=...`: ranking real.

## Seguridad

- No pedir apellido completo, direccion, telefono ni email del chico.
- Usar apodo.
- El PIN se guarda como `sha256$salt$hash`, nunca en texto plano.
- Coordinar cambios en el club con un adulto.
- No se usan imagenes oficiales de Panini, FIFA, jugadores ni albumes reales.

## Probar modo demo

Abrir `intercambio.html` con un servidor estatico local, por ejemplo:

```bash
python -m http.server 8000
```

Luego entrar a:

```text
http://localhost:8000/intercambio.html
```

Si aparece el aviso de modo demo, los datos quedan solo en ese navegador.

## Saber si funciona en modo real

En el despliegue de Vercel, con las variables cargadas:

1. Abrir `intercambio.html`.
2. El aviso demo debe ocultarse automaticamente.
3. Crear un perfil desde un celular.
4. Entrar desde otro navegador/celular con el mismo apodo, categoria, equipo/zona y PIN.
5. Confirmar que el album, matches y ranking muestran los mismos datos.

## Admin demo/local

- Entrar a `intercambio.html?admin=1`.
- Clave local demo: `allboys2026`.
