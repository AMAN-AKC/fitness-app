# Fitness App

This repository contains the Angular frontend in this folder and the Spring Boot backend in `c:\Users\amanc\Desktop\fitness-project\group17-backend\fitness-management-system`.

## Prerequisites

- Node.js and npm
- Java 21
- MySQL running locally or on your configured host

The database is started manually once outside the app. The backend uses JPA to read and write data after the database is available.

## Run the backend

Open a terminal in the backend project folder and start Spring Boot:

```powershell
Set-Location "c:\Users\amanc\Desktop\fitness-project\group17-backend\fitness-management-system"
.\mvnw.cmd spring-boot:run
```

If you only want to verify the backend build and tests:

```powershell
Set-Location "c:\Users\amanc\Desktop\fitness-project\group17-backend\fitness-management-system"
.\mvnw.cmd test
```

## Run the frontend

Open a terminal in the Angular project folder and install dependencies if needed:

```powershell
Set-Location "c:\Users\amanc\Desktop\fitness-project\group17-frontend\fitness-app"
npm install
```

Start the dev server:

```powershell
npm start
```

or:

```powershell
npx ng serve --open
```

The frontend runs at `http://localhost:4200/` and calls the backend at `http://localhost:8080/api/v1`.

## Test the frontend

```powershell
Set-Location "c:\Users\amanc\Desktop\fitness-project\group17-frontend\fitness-app"
npm test
```

To verify the production build:

```powershell
npm run build
```

## Recommended startup order

1. Start MySQL manually.
2. Start the backend:

```powershell
Set-Location "c:\Users\amanc\Desktop\fitness-project\group17-backend\fitness-management-system"
.\mvnw.cmd spring-boot:run
```

3. Start the frontend:

```powershell
Set-Location "c:\Users\amanc\Desktop\fitness-project\group17-frontend\fitness-app"
npm start
```

4. Log in from the frontend and test the dashboards.
