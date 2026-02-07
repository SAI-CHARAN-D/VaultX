# VaultX

Hey! This is VaultX. It's a secure vault app I'm working on to keep important stuff safe. It's built with a Python backend and a React Native (Expo) frontend, and it features biometric authentication (like fingerprint/Face ID).

## How to Run It

You'll need two terminals open for this—one for the backend and one for the frontend.

### 1. The Backend

The backend is built with FastAPI and uses MongoDB.

1.  Head into the backend folder:
    ```bash
    cd backend
    ```
2.  Install the dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  **Important:** You need a `.env` file in the `backend` folder with your database details. It should look something like this:
    ```
    MONGO_URL=your_mongodb_connection_string
    DB_NAME=your_database_name
    ```
4.  Start the server:
    ```bash
    uvicorn server:app --reload
    ```
    It should be running on `http://localhost:8000`.

### 2. The Frontend

The frontend is a React Native app using Expo.

1.  Go to the frontend folder:
    ```bash
    cd frontend
    ```
2.  Install the packages:
    ```bash
    npm install
    # or if you use yarn
    yarn
    ```
3.  Start the app:
    ```bash
    npx expo start
    ```
4.  You can then press `a` for Android, `i` for iOS (if on a Mac), or `w` for Web. Since it uses native features like biometrics, it's best tested on a real device or simulator.

## Cool Features
-   **Biometric Auth:** Uses your phone's native security (Expo Local Auth).
-   **Secure Storage:** Keeps data safe.
-   **FastAPI Backend:** Super fast Python backend.

Let me know if you run into any issues getting it started!
