This project uses **Docker Compose** to run a full-stack development environment with:

- **Django backend**
- **React frontend**
    
---

### Prerequisites

- Docker Desktop

---

## Run the Application

Open your terminal, navigate to the root of the project, and run:

```bash
dos2unix apps/backend/start.sh   //use gitbash for thi command

docker-compose up --build
```

This will:
- Build and start the backend at http://localhost:8000
- Build and start the frontend at http://localhost:3000

### Hot Reloading
Both frontend and backend are volume-mounted, so changes to local files are automatically reflected inside the containers.

## Stop the Application

```bash
docker-compose down
or
docker-compose down -v //remove volume mounts
```

## Before merging to dev branch run the following command(run application in prod mode) and make sure everything works in production env as well.

```bash
 docker compose -f docker-compose.prod.yml up --build  
 ```