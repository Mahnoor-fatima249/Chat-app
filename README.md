# Real-Time Chat App Backend

A production-ready real-time chat application backend built with Node.js, Socket.io, and MongoDB.

## Features

- **User Authentication** — Register/Login with JWT tokens
- **Real-Time Messaging** — Instant message delivery via Socket.io
- **1-on-1 Chat** — Private conversations between two users
- **Group Chat** — Create groups with multiple participants
- **Online/Offline Status** — See who's online in real-time
- **Typing Indicator** — Know when someone is typing
- **Read Receipts** — Blue tick for read messages
- **Message History** — Scroll through past conversations
- **User Search** — Find users by username or email

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express.js | REST API |
| MongoDB | Database |
| Mongoose | ODM |
| Socket.io | Real-time communication |
| Redis | Caching (optional) |
| JWT | Authentication |
| bcryptjs | Password hashing |

## Project Structure

```
chat-app-backend/
├── config/
│   ├── db.js            # MongoDB connection
│   └── redis.js         # Redis connection
├── models/
│   ├── User.js          # User schema
│   ├── Chat.js          # Chat room schema
│   └── Message.js       # Message schema
├── routes/
│   ├── auth.js          # Auth endpoints
│   └── chat.js          # Chat endpoints
├── sockets/
│   └── chatSocket.js    # Socket.io handlers
├── server.js            # Entry point
└── .env                 # Environment variables
```

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |
| GET | `/api/auth/search?q=` | Search users | Yes |

### Chat
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/chat` | Create 1-on-1 chat | Yes |
| GET | `/api/chat` | Get all chats | Yes |
| POST | `/api/chat/group` | Create group chat | Yes |
| GET | `/api/chat/:id/messages` | Get chat messages | Yes |

## Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- Redis (optional)

### Installation

```bash
git clone https://github.com/Mahnoor-fatima249/Chat-app.git
cd Chat-app
npm install
```

### Environment Variables

Create a `.env` file:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatapp
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
```

### Run Server

```bash
# Development
npm run dev

# Production
npm start
```

## Socket.io Events

### Client → Server
| Event | Data | Description |
|-------|------|-------------|
| `send-message` | `{ chatId, text }` | Send a message |
| `typing` | `{ chatId }` | User is typing |
| `stop-typing` | `{ chatId }` | User stopped typing |
| `join-chat` | `chatId` | Join chat room |
| `mark-read` | `{ chatId, messageId }` | Mark message as read |

### Server → Client
| Event | Data | Description |
|-------|------|-------------|
| `new-message` | `message object` | New message received |
| `user-typing` | `{ userId, username, chatId }` | Someone is typing |
| `user-online` | `{ userId }` | User came online |
| `user-offline` | `{ userId, lastSeen }` | User went offline |
| `message-read` | `{ messageId, readBy }` | Message was read |

## Testing

### Using Postman
1. Register → `POST /api/auth/register`
2. Login → `POST /api/auth/login` → Copy token
3. Use token in headers: `Authorization: Bearer <token>`

### Using Socket.io Client
```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:5000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

socket.on('connect', () => console.log('Connected!'));
socket.on('new-message', (msg) => console.log(msg));

socket.emit('send-message', { chatId: 'ID', text: 'Hello' });
```

## License

MIT
