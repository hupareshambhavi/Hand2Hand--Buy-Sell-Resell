#!/bin/sh
cd backend

echo "Waiting for database to be ready..."

while ! mysqladmin ping -h "$DB_HOST" --silent; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is up - continuing"

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser if not exists
python manage.py shell -c "from django.contrib.auth.models import User; import os; username=os.environ['DJANGO_SUPERUSER_NAME']; password=os.environ['DJANGO_SUPERUSER_PASSWORD']; User.objects.create_superuser(username, email='', password=password) if not User.objects.filter(username=username).exists() else None"

python manage.py loaddata fixtures/*.json

# Check DEBUG value to determine server type
if [ "$DEBUG" = "False" ] || [ "$DEBUG" = "false" ]; then
  echo "🔧 Starting Gunicorn server for production..."
  exec uvicorn backend.asgi:application --host 0.0.0.0 --port 8000 --workers 3
else
  echo "🚧 Starting Django development server..."
  exec uvicorn backend.asgi:application --host 0.0.0.0 --port 8000 --reload
fi