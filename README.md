# WhatsApp Web Clone

A high-fidelity, real-time full-stack WhatsApp Web clone built with React, Node.js, Socket.IO, and MongoDB. This project features instant messaging, group chats, media sharing, voice messages, and robust user security (blocking/reporting).

## 🚀 Features

- **Real-Time Messaging**: Instant text delivery via Socket.IO.
- **Group Chats**: Create groups, add/remove members, and admin controls.
- **Media Sharing**: Send images, videos, and documents with previews.
- **Voice Messages**: Record and play back audio messages with a custom player.
- **User Security**: Block/unblock users and report suspicious activity.
- **Message Status**: Sent, delivered, and seen indicators.
- **Rich UI**: Typing indicators, online/offline status, dynamic date separators, and WhatsApp-themed modals.
- **Responsive Design**: Clean, modern interface mirroring the authentic WhatsApp experience.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Lucide React (Icons), Date-fns.
- **Backend**: Node.js, Express, Socket.IO.
- **Database**: MongoDB (Mongoose).
- **Authentication**: JWT with HttpOnly Cookies.
- **Media Storage**: Local storage (Multer).

---

## ⚙️ Prerequisites

- **Node.js** (v16+)
- **npm** or **yarn**
- **MongoDB Atlas** account or local MongoDB instance

---

## 📥 Installation & Setup

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd Whatsapp_Clone
```

### 2. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```
4. Start the backend server:
   ```bash
   node server.js
   ```

### 3. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. (Optional) Create a `.env` file if you want to change the API URL:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

---

## 🗄️ Database Setup

1. **MongoDB Atlas**:
   - Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
   - Create a database and a user with read/write permissions.
   - Copy the connection string and replace `your_mongodb_connection_string` in `backend/.env`.

2. **Collections**:
   - The app uses three main collections: `users`, `messages`, and `groups`. These will be automatically created on the first run.

---

## 🚦 Usage

1. Open your browser to `http://localhost:5173`.
2. Register a new account.
3. Open another browser (or incognito) and register a second account.
4. Start chatting in real-time!
5. Use the **Communities** icon to create groups or the **New Chat** icon to find users.
6. Click on a contact/group name to view the **Info Sidebar** for more actions like Blocking or Deleting chats.

---

## 📄 License
MIT