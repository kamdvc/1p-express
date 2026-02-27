# 1p-express

Proyecto base para:
- CRUD con `Express + MySQL`
- Creación dinámica de instancias por cliente
- Automatización con `Docker + Jenkins + Ansible`

## Arquitectura (opción 2: escalar horizontal por contenedores)

- **Manager** (`APP_MODE=manager`, puerto `3000`)
  - Muestra la página web.
  - Tiene endpoint para crear nueva instancia.
  - Asigna un puerto nuevo automáticamente (`4100+`).
  - Levanta un stack Docker por cliente (`app + mysql`).
- **Tenant App** (`APP_MODE=tenant`)
  - API CRUD `products`.
  - Se conecta a su propio MySQL.
  - Cada instancia tiene base limpia e independiente.

---

## Endpoints importantes

### Manager
- `GET /api/health`
- `GET /api/instances`
- `POST /api/instances` (crea app+db nueva)
- `DELETE /api/instances/:id`

### Tenant (por cada puerto nuevo)
- `GET /api/health`
- `GET /api/products`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

---

## Requisitos locales

- Node.js 20+
- Docker + Docker Compose v2

## Ejecutar local (para pruebas)

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Construir imagen del tenant (la que usan instancias nuevas):
   ```bash
   npm run build:image
   ```
3. Ejecutar manager:
   ```bash
   npm run start
   ```
4. Abrir:
   - `http://localhost:3000`
5. En la web:
   - Crear instancia con nombre cliente.
   - Seleccionar la instancia.
   - Crear/editar/eliminar productos.

### Si Docker solo te funciona en WSL

Configura la variable para que el manager use Docker desde WSL:

```bash
# Bash/WSL (recomendado)
export DOCKER_BIN="docker"
npm run build:image
npm start
```

```powershell
# PowerShell (Windows)
$env:DOCKER_BIN="wsl docker"
npm run build:image:wsl
npm start
```

Si estás dentro de WSL **no uses** `$env:...` porque eso es de PowerShell.
En WSL se usa `export ...`.

Si tu Node corre en Windows pero Docker en WSL, el manager ahora tiene fallback automático a `wsl docker compose`.

o en Linux nativo:

```bash
export DOCKER_BIN="docker"
npm run build:image
npm start
```

Si te sale `"docker" no se reconoce`, estás ejecutando Node/NPM del lado Windows.
Con `DOCKER_BIN="wsl docker"` el endpoint ya puede crear instancias.

---

## Flujo de demo para clase

1. Mostrar que no hay instancias.
2. Clic en **Crear instancia**.
3. Mostrar que aparece con puerto nuevo (ej. `4100`).
4. Usar esa instancia y crear productos.
5. Crear segunda instancia (`4101`) y mostrar que está vacía.
6. Comparar ambas para demostrar bases separadas.

---

## Jenkins

`Jenkinsfile` incluido con etapas:
1. Checkout
2. Preparar entorno Python + Ansible
3. Deploy por Ansible a Laptop 2
4. Smoke test a `/api/health`

Credenciales necesarias en Jenkins:
- `laptop2-ssh-key` (tipo **SSH Username with private key**)
- `laptop2-sudo-password` (tipo **Secret text**)

Variables esperadas por el pipeline:
- `TARGET_HOST=192.168.0.109`
- `TARGET_PORT=2222`
- `TARGET_USER=user`

Levantar Jenkins local con Docker:
```bash
./scripts/run_jenkins.sh
```

Archivo base:
- `jenkins/docker-compose.yml`
- `jenkins/SETUP.md` (pasos UI para credenciales y pipeline)

Si Jenkins corre dentro de contenedor, ese contenedor debe tener acceso a Docker:
- Opción simple: montar `-v /var/run/docker.sock:/var/run/docker.sock`
- Y tener `docker cli` dentro del contenedor Jenkins
- Si no, Jenkins no podrá construir imágenes ni desplegar

## Ansible

Archivos en `ansible/`:
- `inventory.ini` (poner IP/usuario/llave reales)
- `deploy.yml`
- `templates/docker-compose.manager.yml.j2`

Comando manual:
```bash
ansible-playbook -i ansible/inventory.ini ansible/deploy.yml
```

Comando recomendado (con llave y sudo prompt):
```bash
./scripts/deploy.sh
```

Verificación previa:
```bash
./scripts/preflight.sh
```

Si el servidor no tiene daemon Docker activo, puedes forzar instalación de Docker Engine:
```bash
INSTALL_DOCKER=true ./scripts/deploy.sh
```

Nota de rendimiento:
- El playbook ya no copia toda la carpeta local (evita bloqueos por `.venv`/`node_modules`).
- Ahora hace `git pull/clone` directo en el servidor (`/opt/1p-express`), mucho más rápido.

---

## Conexión SSH (tu caso de clase)

Usa tu comando:
```bash
chmod 500 ssh_ansible_cunori
ssh -i ssh_ansible_cunori student@192.168.1.2
```

Luego puedes correr playbook desde Jenkins o manualmente en tu laptop.

---

## Qué te falta terminar en la página web

Ya está funcional para demo, pero para subir nota te recomiendo agregar:
1. Validaciones visuales más claras (mensajes verdes/rojos).
2. Confirmación antes de eliminar instancia.
3. Mostrar estado de salud (`/api/health`) de cada instancia.
4. (Opcional) Autenticación básica para evitar que cualquiera cree instancias.

---

## Nota de seguridad

Las contraseñas están hardcodeadas por simplicidad académica.  
Para producción, mover credenciales a variables seguras/secret manager.

## Duda de MySQL

No necesitas instalar MySQL en tu máquina para este proyecto.  
Cada instancia crea su propio contenedor `mysql:8` con base de datos limpia.
