# Chat App Backend - API Testing Guide

## Start Server
```bash
cd chat-app-backend
npm run dev
```

## Step-by-Step Testing

### Step 1: Register User
**POST** `http://localhost:5000/api/auth/register`

Body (JSON):
```json
{
  "username": "rahul",
  "email": "rahul@test.com",
  "password": "123456"
}
```

Response (copy token from here):
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "username": "rahul",
    "email": "rahul@test.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Step 2: Login
**POST** `http://localhost:5000/api/auth/login`

Body (JSON):
```json
{
  "email": "rahul@test.com",
  "password": "123456"
}
```

---

### Step 3: Get Current User
**GET** `http://localhost:5000/api/auth/me`

Header:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

### Step 4: Search Users
**GET** `http://localhost:5000/api/auth/search?q=rah`

Header:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

### Step 5: Create Chat
**POST** `http://localhost:5000/api/chat`

Header:
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

Body:
```json
{
  "userId": "OTHER_USER_ID"
}
```

---

### Step 6: Get All Chats
**GET** `http://localhost:5000/api/chat`

Header:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

### Step 7: Get Messages
**GET** `http://localhost:5000/api/chat/CHAT_ID/messages`

Header:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

### Step 8: Create Group Chat
**POST** `http://localhost:5000/api/chat/group`

Body:
```json
{
  "name": "Dev Team",
  "users": ["USER_ID_1", "USER_ID_2"]
}
```

---

## Socket.io Testing

Connect:
```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:5000', {
  auth: { token: 'YOUR_TOKEN_HERE' }
});

socket.on('connect', () => {
  console.log('Connected!');
});

socket.on('new-message', (msg) => {
  console.log('New message:', msg);
});

// Send message
socket.emit('send-message', {
  chatId: 'CHAT_ID',
  text: 'Hello!'
}, (response) => {
  console.log(response);
});

// Typing indicator
socket.emit('typing', { chatId: 'CHAT_ID' });
```

---

## Testing Tools
1. **Postman** - Import `Postman_Collection.json`
2. **Thunder Client** (VS Code extension)
3. **curl** (command line)
