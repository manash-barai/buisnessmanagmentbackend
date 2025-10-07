# Backend Architecture Design

This document outlines the architecture of the business tracker backend application.

## 1. Overview

The backend is built using **Node.js** and the **Express** framework. It follows a layered architectural pattern, separating concerns to make the application organized, scalable, and easy to maintain. The database used is **MongoDB**, with **Mongoose** as the Object Data Mapper (ODM).

## 2. Core Components (Layers)

The application is divided into four main layers:

### a. Routes (`/routes`)

*   **Responsibility:** Defines the API endpoints (URLs) and the HTTP methods (GET, POST, PUT, DELETE) that can be used with them.
*   **Function:** This is the entry point for all incoming requests. Each route file maps a specific URL path to a corresponding controller function. For example, a `GET` request to `/api/products` is routed to the `getProducts` function in the product controller.

### b. Controllers (`/controllers`)

*   **Responsibility:** Handles the request and response cycle.
*   **Function:** Controllers act as the intermediary between the routes and the services. They parse incoming request data (e.g., `req.body`, `req.params`), call the appropriate service layer function to perform the business logic, and then format and send the final JSON response back to the client. They also handle sending appropriate HTTP status codes (e.g., 200, 404, 500).

### c. Services (`/services`)

*   **Responsibility:** Contains the core business logic of the application.
*   **Function:** This layer is where all the main work happens. It interacts with the database (via Models) to fetch or manipulate data. For example, the `createSaleService` would not only create a new sale record but could also contain logic to update the stock level of the sold products. This separation keeps the business logic independent of the HTTP layer (controllers).

### d. Models (`/models`)

*   **Responsibility:** Defines the data structure (schema) and interacts directly with the database.
*   **Function:** Each model file uses Mongoose to define the schema for a collection in MongoDB (e.g., the `Product` model defines the fields for a product). All direct database operations (e.g., `find()`, `findById()`, `save()`) are performed by the models.

## 3. Data Flow (Request Lifecycle)

A typical request flows through the system as follows:

1.  **Client** sends an HTTP request (e.g., `GET /api/suppliers/123`).
2.  **Express** receives the request.
3.  The **Route** (`/routes/route.supplier.js`) matches the URL and method to a controller function (`getSupplierById`).
4.  The **Controller** (`/controllers/controller.supplier.js`) calls the corresponding service function (`getSupplierByIdService`), passing the ID from the request parameters.
5.  The **Service** (`/services/supplierService.js`) calls the **Model** (`/models/Supplier.js`) to find the supplier in the database.
6.  The **Model** executes the query on the MongoDB database.
7.  The data is returned up the chain: **Model -> Service -> Controller**.
8.  The **Controller** formats the data into a JSON object and sends the response back to the **Client**.

## 4. Configuration

*   **`index.js`**: The main entry point of the application. It initializes the Express app, sets up middleware (like `cors` and `express.json`), connects to the database, and registers all the route handlers.
*   **`.env`**: Stores environment variables, such as the database connection string (`MONGODB_URI`) and the server port (`PORT`), keeping sensitive information out of the source code.
*   **`/config/db.js`**: (Although not present, this is where explicit database connection logic would ideally go). Currently, this logic is in `index.js`.