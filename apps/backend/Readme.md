## How to Run This Django Project

Follow these steps to set up and run the project locally:

1. **Navigate to the Project Directory**

    ```bash
    cd apps
    ```

2. **Activate the Virtual Environment**

    **On Windows:**
    ```bash
    .\env\Scripts\activate
    ```

    **On macOS/Linux:**
    ```bash
    source env/bin/activate
    ```

3. **Apply Migrations**

    ```bash
    cd backend
    ```

    ```bash
    python manage.py migrate
    ```

4. **Run the Development Server**

    ```bash
    python manage.py runserver
    ```
## How to connect to the local DB

## I have added the host detials in the settings.py - Database connection detials make the change if the port is already taken in your pc.

## colima start - install colima or docker desktop
## docker start mysql-container
## docker ps
## docker exec -it mysql-container mysql -u root -p
## docker stop mysql-container
## docker ps
## colima stop