#!/bin/bash
apt update && apt upgrade -y
apt install -y ca-certificates curl gnupg lsb-release

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

systemctl enable docker
systemctl start docker
usermod -aG docker ubuntu

echo "${DOCKER_PASSWORD}" | sudo docker login -u ${DOCKER_USERNAME} --password-stdin

cat > /home/ubuntu/docker-compose.yml <<EOF
version: '3.8'
services:
  db:
    image: mysql:8.0
    container_name: mysql
    ports:
      - "3306:3306"
    environment:
      MYSQL_DATABASE: mydb
      MYSQL_USER: user
      MYSQL_PASSWORD: userpass
      MYSQL_ROOT_PASSWORD: rootpass
    volumes:
      - mysql_data:/var/lib/mysql

  backend:
    image: aishwaryaravi456/hand2hand:backend-latest
    container_name: backend
    ports:
      - "8000:8000"
    environment:
      - DJANGO_SUPERUSER_NAME=admin
      - DJANGO_SUPERUSER_PASSWORD=password
      - DEBUG=False
      - DB_HOST=db
      - DB_PORT=3306
      - DB_NAME=mydb
      - DB_USER=user
      - DB_PASSWORD=userpass
      - DEEPL_API_KEY=a461b88f-328e-4e42-8502-91cf38d820e8:fx
      - DJANGO_SETTINGS_MODULE=backend.settings
      - FERNET_KEY=COEQLU_mXjz0QRbrzM80KZfFd1MReu_uFcsoHi0c7Lk=
    depends_on:
      - db

  frontend:
    image: aishwaryaravi456/hand2hand:frontend-latest
    container_name: frontend
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production

  phpmyadmin:
    image: phpmyadmin/phpmyadmin
    container_name: phpmyadmin
    ports:
      - "8080:80"
    environment:
      PMA_HOST: mysql
      PMA_PORT: 3306
    depends_on:
      - db

volumes:
  mysql_data:
EOF

cd /home/ubuntu
sudo docker compose up -d
