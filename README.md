# SK — Django + React Starter Kit

Production-ready boilerplate with **Django 6.x**, **React 19.x**, **JWT Authentication**, and **RBAC** (Role-Based Access Control).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 6.x, Django REST Framework, SimpleJWT |
| Frontend | React 19.x, Vite, Tailwind CSS 4.x |
| Auth | JWT (access + refresh with rotation & blacklist) |
| RBAC | Custom Role/Permission models with middleware |

## Quick Start

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements/dev.txt

# Copy environment variables
copy .env.example .env       # Windows
# cp .env.example .env       # Mac/Linux

# Run migrations and seed RBAC
python manage.py migrate
python manage.py seed_rbac
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (proxies API to Django)
npm run dev
```

Open **http://localhost:5173** in your browser.

## Project Structure

```
sk/
├── backend/
│   ├── config/
│   │   ├── settings/         # base.py, dev.py, prod.py
│   │   ├── urls.py
│   │   ├── wsgi.py / asgi.py
│   ├── apps/
│   │   ├── accounts/         # Custom user, JWT auth endpoints
│   │   └── rbac/             # Roles, permissions, middleware
│   └── requirements/         # base.txt, dev.txt, prod.txt
├── frontend/
│   ├── src/
│   │   ├── api/              # Axios + interceptors
│   │   ├── components/       # Navbar, LoadingSpinner
│   │   ├── contexts/         # AuthContext
│   │   ├── hooks/            # useAuth, usePermission
│   │   ├── pages/            # Login, Register, Dashboard, Profile, Admin
│   │   ├── routes/           # ProtectedRoute, PublicRoute, RoleRoute
│   │   └── utils/            # Token service
│   └── package.json
└── README.md
```

## API Endpoints

### Auth (`/api/auth/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register/` | Register new user |
| POST | `/login/` | Login (returns JWT + roles) |
| POST | `/logout/` | Blacklist refresh token |
| GET/PATCH | `/profile/` | Get/update user profile |
| POST | `/change-password/` | Change password |
| POST | `/token/refresh/` | Refresh access token |

### RBAC (`/api/rbac/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/roles/` | List/create roles (admin) |
| GET/PUT/DELETE | `/roles/{id}/` | Role detail (admin) |
| POST | `/roles/{id}/add-permissions/` | Add permissions to role |
| POST | `/roles/{id}/remove-permissions/` | Remove permissions |
| GET | `/permissions/` | List all permissions (admin) |
| POST | `/assign-role/` | Assign role to user (admin) |
| POST | `/revoke-role/` | Revoke role from user (admin) |
| GET | `/my-permissions/` | Current user's roles & perms |
| GET | `/users/` | List users with roles (admin) |

## Built-in Roles

| Role | Default | Permissions |
|------|---------|-------------|
| **admin** | No | All permissions |
| **manager** | No | Content CRUD, user view, dashboard, analytics |
| **member** | Yes | Content view/create, dashboard |

## Frontend RBAC

```jsx
// In any component
import usePermission from './hooks/usePermission';

function MyComponent() {
  const { hasRole, hasPermission, isAdmin } = usePermission();

  return (
    <div>
      {hasRole('admin', 'manager') && <AdminPanel />}
      {hasPermission('content.create') && <CreateButton />}
    </div>
  );
}

// Route-level gating
<RoleRoute roles={['admin']}><AdminPage /></RoleRoute>
```

## Environment Variables

See `.env.example` for all available settings including JWT token lifetimes, CORS origins, and database configuration.

## License

MIT
