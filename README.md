# Food Store — Trabajo Práctico Integrador

**Programación IV · Tecnicatura Universitaria en Programación a Distancia · UTN**

Aplicación web fullstack para un negocio de comidas. Los clientes se registran, recorren el catálogo, arman un carrito y confirman pedidos con dirección de entrega y forma de pago (efectivo o transferencia). El administrador gestiona categorías, productos, stock, pedidos y usuarios desde un panel, y consulta un resumen del negocio.

| | |
|---|---|
| **Repositorio público (GitHub)** | <https://github.com/stefanmdev/Food-Store-TPI> |
| **Video de demostración** | <https://youtu.be/iGRtZlcTBiw> |

---

## Stack

| Capa | Tecnologías |
|---|---|
| Backend | Python 3.11–3.13 · FastAPI 0.165 · SQLModel 0.0.50 (SQLAlchemy 2.0) · Pydantic v2 + pydantic-settings · PostgreSQL · python-jose (JWT) · passlib 1.7.4 + bcrypt 4.0.1 |
| Frontend | React 19 · TypeScript 5.9 (`strict`) · Vite 7 · Tailwind CSS 4 · TanStack Query 5 · TanStack Form 1 · TanStack Table 8 · React Router 7 · Zustand 5 · Axios 1 · pnpm |

Todas las versiones están fijadas en `backend/requirements.txt` y `frontend/package.json`.

## Estructura

```text
Trabajo Practico Integrador/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI, CORS con credenciales y routers bajo /api/v1
│   │   ├── core/                # config, database, security, deps, unit_of_work, base_repository, exceptions
│   │   ├── modules/             # auth · usuarios · categorias · productos · pedidos
│   │   │   └── <módulo>/        # models, schemas, repository, unit_of_work, service, router
│   │   └── db/                  # models.py (registro de tablas) y seed.py (idempotente)
│   ├── tests/                   # pytest contra PostgreSQL (41 casos)
│   ├── compose.yaml             # PostgreSQL 17 para desarrollo (opcional)
│   ├── requirements.txt         # dependencias fijadas
│   ├── requirements-dev.txt     # + pytest y httpx para las pruebas
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── shared/              # api (axiosInstance, handleApiError, queryClient), ui, components, layout
│   │   ├── features/            # auth · categorias · productos · usuarios · pedidos (pages, components, hooks, api, types)
│   │   ├── store/               # authStore.ts y cartStore.ts (Zustand + persist)
│   │   ├── routes/              # AppRouter.tsx y ProtectedRoute.tsx
│   │   ├── App.tsx · main.tsx · index.css
│   ├── package.json · pnpm-lock.yaml · pnpm-workspace.yaml · vite.config.ts
│   └── .env.example
├── docs/
│   └── pruebas_api.http         # 65 pruebas manuales de la API (REST Client)
└── README.md
```

## Requisitos

- **Python 3.11 a 3.13** (probado con 3.12.14; las mismas versiones también se probaron con 3.14.6).
- **PostgreSQL 15 o superior**: un servidor local o Docker (se incluye `backend/compose.yaml`).
- **Node.js 20.19 o superior** (probado con 22.23.2) y **pnpm 9 o superior** (probado con 11.0.8).

Los comandos están escritos para **Windows (PowerShell)**. En Linux/macOS, reemplazar `copy` por `cp` y `.venv\Scripts\activate` por `source .venv/bin/activate`.

---

## Instalación y ejecución

### 1. Variables de entorno del backend

```powershell
cd backend
copy .env.example .env
```

Editar `backend/.env` y reemplazar los valores de ejemplo:

| Variable | Descripción | Valor de ejemplo |
|---|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL. **Obligatoria**: el backend no arranca sin ella | `postgresql://USUARIO:CONTRASENA@localhost:5432/foodstore_db` |
| `SECRET_KEY` | Firma del JWT. **Obligatoria**, mínimo 32 caracteres | una cadena aleatoria larga |
| `ALGORITHM` | Algoritmo del JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiración del token y de la cookie | `30` |
| `FRONTEND_ORIGIN` | Origen permitido por CORS (con credenciales) | `http://localhost:5173` |
| `COOKIE_SECURE` | Cookie con atributo `Secure` (solo con HTTPS) | `false` |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` / `POSTGRES_PORT` | Solo para `compose.yaml`; deben coincidir con `DATABASE_URL` | `foodstore` / *(elegir)* / `foodstore_db` / `5432` |

Para generar una `SECRET_KEY`: `python -c "import secrets; print(secrets.token_urlsafe(48))"`.
El código no contiene credenciales: si falta `DATABASE_URL` o `SECRET_KEY`, la aplicación se detiene con un mensaje que indica qué completar.

### 2. Iniciar PostgreSQL

**Opción A — Docker** (desde `backend/`, usa las variables `POSTGRES_*` del `.env`):

```powershell
docker compose up -d
```

**Opción B — PostgreSQL instalado localmente**: crear la base y ajustar `DATABASE_URL` con el usuario y la contraseña locales:

```powershell
createdb -U postgres foodstore_db
```

### 3. Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m app.db.seed
uvicorn app.main:app --reload
```

- API: <http://localhost:8000/api/v1>
- Documentación interactiva: <http://localhost:8000/docs> y <http://localhost:8000/redoc>

`python -m app.db.seed` crea las tablas y carga el usuario **admin**, 4 categorías y 12 productos (11 con stock y uno agotado, para mostrar ese estado). Es **idempotente**: si se ejecuta de nuevo no duplica registros.

### 4. Frontend

En otra terminal:

```powershell
cd frontend
copy .env.example .env
pnpm install
pnpm build
pnpm dev
```

- Aplicación: <http://localhost:5173>
- `frontend/.env` contiene `VITE_API_URL=http://localhost:8000/api/v1`.
- `pnpm build` verifica los tipos (`tsc -b`) y genera `dist/`; `pnpm lint` ejecuta oxlint.

## Credenciales de desarrollo

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin1234!` | admin |

Las crea el seed con los valores que indica la consigna. Son **solo para desarrollo**: se pueden cambiar con `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD` y `SEED_ADMIN_EMAIL` en `.env` antes de ejecutar el seed. Los clientes se crean desde la pantalla de registro (rol `user`).

---

## API REST (`/api/v1`)

La sesión viaja en la cookie HttpOnly `access_token`: el login no devuelve el token en el cuerpo y el frontend nunca lo lee ni lo guarda. Para probar en `/docs`, ejecutar primero `POST /api/v1/auth/token`; el navegador guarda la cookie y la envía en las peticiones siguientes.

| Método | Endpoint | Acceso | Respuesta | Errores propios |
|---|---|---|---|---|
| POST | `/auth/register` | Público | 201 `UserPublic` | 409 username o email existente |
| POST | `/auth/token` | Público | 200 `{"message": "Login exitoso"}` + cookie | 401 credenciales; 400 cuenta desactivada |
| POST | `/auth/logout` | Público | 200 (borra la cookie) | — |
| GET | `/auth/me` | Sesión | 200 `UserPublic` | — |
| GET | `/admin/usuarios` | admin | 200 `list[UserPublic]` | — |
| POST | `/admin/usuarios/{id}/activar` | admin | 200 `UserPublic` | 404 |
| POST | `/admin/usuarios/{id}/desactivar` | admin | 200 `UserPublic` | 404; 400 si se desactiva a sí mismo |
| GET | `/categorias` | Público | 200 `list[CategoriaRead]` (activas) | — |
| GET | `/categorias/{id}` | Público | 200 `CategoriaRead` | 404 |
| POST | `/categorias` | admin | 201 `CategoriaRead` | 409 |
| PUT | `/categorias/{id}` | admin | 200 `CategoriaRead` | 404, 409 |
| DELETE | `/categorias/{id}` | admin | 204 (baja lógica) | 404 |
| GET | `/productos` | Público | 200 `ProductosPaginados` — query `skip`, `limit` (≤100), `search`, `categoria_id`, `disponible` | — |
| GET | `/productos/{id}` | Público | 200 `ProductoRead` | 404 |
| POST | `/productos` | admin | 201 `ProductoRead` | 404 categoría inexistente o dada de baja |
| PUT | `/productos/{id}` | admin | 200 `ProductoRead` (actualización parcial) | 404 |
| PATCH | `/productos/{id}/stock` | admin | 200 `ProductoRead` | 404 |
| DELETE | `/productos/{id}` | admin | 204 (baja lógica) | 404 |
| POST | `/pedidos` | Sesión | 201 `PedidoRead` | 404 producto inexistente/inactivo; 400 stock, no disponible o repetido |
| GET | `/pedidos` | Sesión | 200 `PedidosPaginados` — propios (`user`) o todos (`admin`); query `skip`, `limit`, `estado` | — |
| GET | `/pedidos/resumen` | admin | 200 `ResumenPedidos` | — |
| GET | `/pedidos/{id}` | Dueño o admin | 200 `PedidoRead` | 404; 403 pedido ajeno |
| PATCH | `/pedidos/{id}/estado` | admin | 200 `PedidoRead` | 404; 400 transición inválida |
| PATCH | `/pedidos/{id}/cancelar` | Dueño | 200 `PedidoRead` | 404; 403 ajeno; 400 si no está PENDIENTE |

Códigos comunes: **401** sin sesión válida, **400** «Cuenta de usuario desactivada», **403** rol no permitido y **422** validación del schema.

### Reglas de negocio

- **RN-01** — El pedido se crea en una única transacción. Se valida que haya al menos un ítem, que no se repitan productos y que cada producto exista, esté activo, esté disponible y tenga stock. Además se descuenta el stock y se copian el nombre y el precio en cada línea. Si algo falla, el Unit of Work hace rollback y no se persiste nada. Las filas de producto se bloquean (`SELECT … FOR UPDATE`) para que dos compras simultáneas no vendan el mismo stock.
- **RN-02** — Máquina de estados: `PENDIENTE → EN_PREPARACION | CANCELADO`, `EN_PREPARACION → ENTREGADO | CANCELADO`; `ENTREGADO` y `CANCELADO` son terminales. Una transición inválida responde 400.
- **RN-03** — Al cancelar se restituye el stock de cada línea en la misma transacción que cambia el estado.
- **RN-04** — El cliente solo ve y cancela sus propios pedidos, y solo desde `PENDIENTE`. El admin ve todos y avanza o cancela desde cualquier estado no terminal.
- **RN-05** — Las líneas y el total no cambian después de crear el pedido, y no hay endpoints para editar ni borrar pedidos.
- **RN-06** — `forma_pago` es `EFECTIVO` o `TRANSFERENCIA`, y `direccion_entrega` tiene entre 5 y 200 caracteres (sin contar espacios iniciales y finales).

## Pantallas del frontend

| Ruta | Pantalla | Acceso |
|---|---|---|
| `/login`, `/register` | Login y registro (TanStack Form) | Público |
| `/` | Catálogo paginado en el servidor, con búsqueda, filtro por categoría, skeleton y estado vacío | Público |
| `/carrito` | Carrito persistido (cantidades, subtotales y total) | Público |
| `/checkout` | Confirmar pedido: dirección, forma de pago y notas | Sesión |
| `/mis-pedidos` | Pedidos propios, detalle y cancelación en PENDIENTE | Sesión |
| `/admin/resumen` | Tarjetas con los indicadores | admin |
| `/admin/categorias`, `/admin/productos` | ABM con TanStack Table y TanStack Form; cambio de stock y disponibilidad | admin |
| `/admin/pedidos` | Tabla con filtro por estado y botones según la máquina de estados | admin |
| `/admin/usuarios` | Activar y desactivar usuarios (sin «Desactivar» en la propia fila) | admin |
| `/unauthorized` | Sin permiso | Público |

---

## Pruebas

### Pruebas automatizadas del backend (pytest)

Corren contra PostgreSQL en una base separada `<base>_test`, que se crea sola a partir de `DATABASE_URL`. No modifican la base de desarrollo.

```powershell
cd backend
pip install -r requirements-dev.txt
python -m pytest -q
```

Resultado: **41 pruebas aprobadas**. Cubren autenticación y usuarios, catálogo, RN-01 a RN-06, el rollback completo, una compra concurrente y el resumen.

### Pruebas manuales de la API

`docs/pruebas_api.http` tiene 65 peticiones con el resultado esperado de cada una, para la extensión REST Client de VS Code. Se ejecutan en orden sobre una base recién cargada con el seed.

### Verificación en el navegador

Se realizaron pruebas funcionales de extremo a extremo en el navegador, incluyendo los recorridos de cliente y administrador, autenticación, gestión de pedidos, permisos y restitución de stock. Las pruebas HTTP están disponibles en [`docs/pruebas_api.http`](docs/pruebas_api.http).

## Notas técnicas

- **SQLAlchemy 2.0.x**: SQLAlchemy 2.1 usa por defecto el driver psycopg 3 para `postgresql://`. Se fija la versión 2.0.58 y, además, `database.py` usa explícitamente `psycopg2` (que es `psycopg2-binary`, indicado por la consigna).
- **pnpm 10/11**: `frontend/pnpm-workspace.yaml` autoriza el script de instalación de `esbuild`. Sin ese archivo, pnpm 11 termina `pnpm install` con error.
- **Consola del navegador**: al abrir la aplicación sin sesión, `checkSession` llama a `/auth/me` y la respuesta esperada es **401**. El navegador lo registra como un recurso fallido; no es un error de la aplicación.
- **Ids de pedidos**: un pedido rechazado (por ejemplo, por falta de stock) hace rollback, pero PostgreSQL no revierte su secuencia. Por eso los ids pueden saltear números.
