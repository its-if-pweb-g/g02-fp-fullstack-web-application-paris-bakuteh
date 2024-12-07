import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs'; //Used to hash passwords
import jwt from 'jsonwebtoken'; //For JSON Web Tokens
import http from 'http';
import setupWebSocket from './websocket';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL!;
const DATABASE_NAME = process.env.DATABASE_NAME!;
const JWT_SECRET = process.env.JWT_SECRET!;
const TOKEN_EXPIRATION = '1h';

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
};

let db: Db;
let userCollection: Collection;

MongoClient.connect(MONGO_URL)
    .then((client) => {
        db = client.db(DATABASE_NAME);
        userCollection = db.collection('users');
        console.log(`Connected to MongoDB database: ${DATABASE_NAME}`);
    })
    .catch((error) => {
        console.error("Failed to connect to MongoDB:", error);
        process.exit(1);
    });

// Middleware to handle JSON requests
app.use(express.json());
app.use(cors());

// Create an HTTP server
const server = http.createServer(app);
setupWebSocket(server);

// Set up a Custom Request for authentication
interface CustomRequest extends Request {
  user?: {
      id: string;
      username: string;
      role: string;
  };
}

// ---------------------------- Utility functions ----------------------------------------------------------------------

const authenticateToken = (req: CustomRequest, res: Response, next: NextFunction) => {
  const Header = req.headers['authorization'];
  const token = Header && Header.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as CustomRequest['user'];
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Forbidden: Invalid token.' });
  }
};

const authenticateAdmin = (req: CustomRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required.' });
  }
  next();
};

// ----------------------- Functions to handle server requests -----------------------------------------------------------------

app.post('/api/register', asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const existingUser = await userCollection.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ message: 'Username already exists' });
  }

  const existingUserEmail = await userCollection.findOne({ email });
  if (existingUserEmail) {
    return res.status(400).json({ message: 'Email already used' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    username,
    email,
    password: hashedPassword,
    role: 'user',
    created_at: new Date()
  };

  await userCollection.insertOne(user);
  res.status(201).json({ message: 'Successful: User registered successfully.' });
}));

app.post('/api/login', asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
      return res.status(400).json({ error: 'Bad Request: Username and password are required.' });
  }

  const user = await userCollection.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Unauthorized: Invalid username or password.' });
  }

  const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRATION,
  });

  res.status(200).json({ 
    message: 'Login Successful', 
    token,
    user: {id: user._id, username: user.username}
  });
}));

app.get('/api/admin', authenticateToken, authenticateAdmin, (req: CustomRequest, res: Response) => {
  res.status(200).json({ message: `Permission granted. Welcome, ${req.user?.username}.` });
});

app.get('/api/users', authenticateToken, asyncHandler(async (req: CustomRequest, res: Response) => {
  const users = await userCollection
    .find({ username: { $ne: req.user?.username } })
    .project({ username: 1, _id: 0 })
    .toArray();
  res.status(200).json(users);
}));

app.get('/api/singleUser/:userId', async (req, res) => {
  try{
    const { userId } = req.params;
    if(!userId || typeof userId !== 'string'){
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Validate userId is a valid ObjectId
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid User ID format' });
    }

    const user = await userCollection.findOne({ _id: new ObjectId(userId) });

    if(!user){
      return res.status(404).json({ error: 'User not found' });
    }

    //exclude password
    const { password, ...userData } = user;

    res.status(200).json(userData);
  }
  catch (err){
    console.error(err);
    res.status(500).json({ error: 'Internal server error '});
  }
});

// Error Handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`MongoDB URL: ${MONGO_URL}`);
});
