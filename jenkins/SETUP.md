# Jenkins Setup (Laptop 1)

## 1) Abrir Jenkins
- URL: `http://localhost:8080`
- Obtener password inicial:
  - `docker exec jenkins-1p-express cat /var/jenkins_home/secrets/initialAdminPassword`

## 2) Plugins recomendados
- Pipeline
- Git
- Credentials Binding
- SSH Agent

## 3) Crear credenciales
En `Manage Jenkins -> Credentials -> (global)` crear:

1. **SSH Username with private key**
   - ID: `laptop2-ssh-key`
   - Username: `user`
   - Private Key: contenido de `~/.ssh/id_ed25519`

2. **Secret text**
   - ID: `laptop2-sudo-password`
   - Secret: password sudo del usuario `user` en Laptop 2

## 4) Crear Pipeline
- New Item -> Pipeline -> nombre: `1p-express-deploy`
- Definition: `Pipeline script from SCM`
- SCM: `Git`
- Repository URL: `git@github.com:kamdvc/1p-express.git`
- Branch: `*/main`
- Script Path: `Jenkinsfile`

## 5) Ejecutar
- Click `Build Now`
- Ver stages:
  - Checkout
  - Prepare Tools
  - Deploy with Ansible

## 6) Verificar despliegue
- Abrir `http://192.168.0.109:3000`
- Probar:
  - crear instancia
  - seleccionar instancia
  - CRUD productos
