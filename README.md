<div align="center">

# First-Fullstack-Application

*A modern, full-stack form application featuring a powerful admin panel, user authentication, and an integrated AI chatbot powered by Ollama's Llama 3.*

<br>

</div>

<p align="center">
<img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
<img src="https://img.shields.io/badge/Spring-6DB33F?style=for-the-badge&logo=spring&logoColor=white" alt="Spring Boot">
<img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL">
<img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
</p>

<hr>

## Table of Contents

  * [Overview](https://www.google.com/search?q=%23overview)
  * [Features](https://www.google.com/search?q=%23features)
  * [Tech Stack](https://www.google.com/search?q=%23tech-stack)
  * [Getting Started](https://www.google.com/search?q=%23getting-started)
      * [Prerequisites](https://www.google.com/search?q=%23prerequisites)
      * [Installation & Configuration](https://www.google.com/search?q=%23installation--configuration)
  * [Running the Application](https://www.google.com/search?q=%23running-the-application)
  * [Contact](https://www.google.com/search?q=%23contact)
  * [License](https://www.google.com/search?q=%23license)

</hr>

## Overview

This project is a full-stack web application designed for creating, managing, and viewing forms. It features a secure Spring Boot backend, a responsive React frontend built with Vite, and a containerized MySQL database.

The application provides a seamless user experience with distinct functionalities for regular users and administrators. Users can register, log in, and interact with their forms on a personalized homepage. A key feature is the powerful admin panel, which grants administrators full control over the database to manage users, forms, and other data. To enhance user support, an AI-powered chatbot, running on a local Ollama instance with Llama 3, is available to answer questions and guide users through the application.

</hr>

## Features

  * ✅ **Admin Dashboard:** A comprehensive panel for administrators to perform CRUD operations on all database tables.
  * 🧠 **AI-Powered Chatbot:** Integrated with Ollama and Llama 3 to provide intelligent, real-time assistance to users.
  * 🔒 **Secure Authentication:** JWT-based security for user registration, login, and session management, protecting user data and application endpoints.
  * 📄 **Dynamic Form Management:** A dedicated homepage for authenticated users to view and manage their forms.
  * 🐳 **Containerized Database:** Utilizes Docker to run a MySQL database, ensuring a consistent and isolated development environment.
  * 🚀 **Modern Frontend:** A fast, responsive, and developer-friendly UI built with React and Vite, featuring Hot Module Replacement (HMR) for a rapid development workflow.

</hr>

## Tech Stack

Here are the core technologies used in this project. For specific versions, please refer to the `build.gradle` and `package.json` files.

| Area                  | Technology / Tool                                     |
| --------------------- | ----------------------------------------------------- |
| **Backend** | Spring Boot, Java, Gradle, Spring Security (JWT)      |
| **Frontend** | React, Vite, JavaScript, Axios, CSS                   |
| **Database** | MySQL                                                 |
| **AI / LLM** | Ollama, Llama 3                                       |
| **DevOps & Tools** | Docker, npm, ESLint, IntelliJ IDEA, Visual Studio Code |

</hr>

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Ensure you have the following software installed on your system:

  * **Java Development Kit (JDK)** (Version 17 or higher recommended)
  * **Node.js and npm** (Node.js LTS version recommended)
  * **Docker**
  * **Ollama** with the Llama 3 model pulled.
      * [Install Ollama](https://ollama.com/download)
      * Pull the model:
    ```sh
      ❯ ollama pull llama3
    ```
    
### Installation & Configuration

1.  **Clone the repository:**

    ```sh
    ❯ git clone https://github.com/Arda-Arancioglu/First-fullstack-application.git
    ```

2.  **Navigate to the project directory:**

    ```sh
    ❯ cd First-fullstack-application
    ```

3.  **Configure the Backend:**

      * Navigate to the backend directory: `cd backend`
      * Create a `.env` file in this directory. This file will hold your database credentials.
      * Add the following content to your `.env` file, replacing `your_strong_password` with your actual MySQL password.
        ```env
        # .env
        DB_PASSWORD=your_strong_password
        ```

4.  **Install Backend Dependencies:**

      * While in the `backend` directory, let Gradle download the required dependencies.
      * On Windows:
        ```sh
        ❯ gradlew build
        ```
      * On macOS/Linux:
        ```sh
        ❯ ./gradlew build
        ```

5.  **Install Frontend Dependencies:**

      * Navigate to the frontend directory from the root folder: `cd frontend`
      * Install the dependencies using npm:

    **5.1 Scaffold your Vite + React app (if you haven’t already)**  
      
          npm create vite@latest form-app -- --template react
   
    **5.2 Enter the app directory**  
      
          cd form-app
   
    **5.3 Install all dependencies**  
      
          npm install
   
    **5.4 Start the development server**  
      
          npm run dev

</hr>

## Running the Application

To run the application, you must start the services in the correct order.

⚠️ **Important:** Follow these steps sequentially.

1.  **Start the Database:**

      * Make sure Docker is running.
      * Start your MySQL container. Ensure the port and password match the configuration in your Spring Boot `application.properties` and `.env` files.

2.  **Start the AI Model:**

      * Run the Ollama service in your terminal to make the Llama 3 model available for the backend to connect to.
      * (Keep this terminal window open)

    <!-- end list -->

    ```sh
    ❯ ollama run llama3
    ```

3.  **Run the Backend Server:**

      * Open a new terminal window and navigate to the `backend` directory.
      * Run the Spring Boot application using the Gradle wrapper.
      * On Windows:
        ```sh
        ❯ gradlew bootRun
        ```
      * On macOS/Linux:
        ```sh
        ❯ ./gradlew bootRun
        ```
      * The backend will start on `http://localhost:8080` by default.

4.  **Run the Frontend Application:**

      * Open a final terminal window and navigate to the `frontend` directory.
      * Start the Vite development server.
        ```sh
        ❯ npm run dev
        ```
      * The frontend will be available at `http://localhost:5173` (or the next available port). Open this URL in your browser.

</hr>

## Contact

Arda Arancıoğlu - ardaarancioglu@gmail.com

Project Link: [https://github.com/Arda-Arancioglu/First-fullstack-application](https://github.com/Arda-Arancioglu/First-fullstack-application)

</hr>

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.
