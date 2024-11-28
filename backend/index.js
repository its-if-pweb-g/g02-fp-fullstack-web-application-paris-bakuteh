const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs'); //Used to hash passwords
const jwt = require('jsonwebtoken'); //For JSON Web Tokens
const passport = require('passport'); //Middleware for authentication
const { Strategy, ExtractJwt } = require('passport-jwt'); //Used for JWT authentication (also to extract JWT from request)
const router = express.Router();

const PORT = process.env.PORT || 5000;
//const MONGO_URL = `mongodb://user-g:g-for-goodluck@db.nafkhanzam.com/pweb-g`;
const MONGO_URL = `mongodb://localhost:27017/pweb-g-final-project`;
const JWT_SECRET = 'superSecret123';

const app = express();

// Middleware to handle JSON requests
app.use(express.json());
app.use(cors());

let db = null;
let users_collection = null;

async function startServer(){
  const client = await MongoClient.connect(MONGO_URL);
  db = client.db();
  users_collection = db.collection('users');
  await app.listen(PORT);
  console.log(`Server is running on http://localhost:${PORT}`);
}

app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  const existingUser = await users_collection.findOne({username});

  if(existingUser){
    return res.status(400).json({ message: 'Username already exists'});
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    username,
    email,
    password: hashedPassword,
    role: 'user',
    created_at: new Date()
  };
  await users_collection.insertOne(user);
  res.status(201).json({ message: 'User registered successfully' });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await users_collection.findOne({username});

  if(!user){
    return res.status(400).json({message: 'Invalid username or password'});
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if(!isMatch){
    return res.status(400).json({message: 'Invalid username or password'});
  }

  const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, {
    expiresIn:'1h',
  });

  res.status(200).json({ 
    message: 'Login Successful', 
    token,
    user: {username: user.username, id: user._id}
  });
});

startServer();
