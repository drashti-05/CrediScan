CrediScan is a web application designed to manage and track financial transactions, focusing on user authentication, a credit-based document scanning system, and smart analytics. Users can upload documents for similarity analysis, monitor their scanning credits, and access detailed analytics.

Features
User Management & Authentication:

User registration and login with basic username/password authentication.
Role-based access control with Regular Users and Admins.
Profile section displaying user credits, past scans, and credit requests.
Credit System:

Each user receives 20 free scans per day, automatically resetting at midnight.
Users can request additional credits upon exceeding their daily limit.
Admins have the authority to approve or deny credit requests.
Each document scan deducts 1 credit from the user's balance.
Document Scanning & Matching:

Users can upload plain text files for scanning.
The system compares uploaded documents against stored ones using basic text similarity algorithms.
Returns similar documents based on the analysis.
Smart Analytics Dashboard:

Tracks the number of scans per user per day.
Identifies the most commonly scanned document topics.
Displays top users by scans and credit usage.
Generates credit usage statistics for admins.

# CrediScan Installation Guide

Follow these steps to set up and run the CrediScan application on your local machine.

## Prerequisites

- **Node.js**: Ensure you have Node.js installed. You can download it from [https://nodejs.org/](https://nodejs.org/).
- **npm**: npm is included with Node.js. Verify its installation by running `npm -v` in your terminal.
- **MongoDB**: Install MongoDB and ensure it's running. Refer to the [official MongoDB installation guide](https://docs.mongodb.com/manual/installation/) for instructions.

## Installation Steps

1. **Clone the Repository**:

   Open your terminal and run:

   ```bash
   git clone https://github.com/drashti-05/CrediScan.git
   
2. Navigate to the Project Directory:
    ```bash
   cd CrediScan
    
3.Backend Setup:
    Navigate to the backend directory:
      ```bash
     cd backend
    
  Install the required dependencies:
     
     ```bash
     npm install
4. Set up environment variables:

    Create a .env file in the backend directory.
    
    Add the following variables:
     DB_CONNECTION_STRING: Connection string for the SQLite database.
     JWT_SECRET: Secret key for JWT authentication.
     PORT: Port number for the backend server.
   
6. Start the backend server:
   ```bash
     npm start
7. Frontend Setup:

    Open a new terminal window.
      ```bash
          cd ../frontend
  Navigate to the frontend directory:
      ```bash
      npm install


