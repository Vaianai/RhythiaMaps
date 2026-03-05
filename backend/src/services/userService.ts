import { User, UserRole } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { hashPassword, comparePasswords } from '../utils/helpers';
import { RegisterInput } from '../utils/validators';
import { mockUsers } from '../utils/mockDb';

const usersFilePath = path.join(process.cwd(), 'storage', 'users.json');

const ensureUsersFile = () => {
  const storageDir = path.dirname(usersFilePath);
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, JSON.stringify(mockUsers, null, 2), 'utf-8');
  }
};

const loadUsers = (): any[] => {
  ensureUsersFile();
  try {
    const raw = fs.readFileSync(usersFilePath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...mockUsers];
    return parsed.map((user) => ({
      ...user,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    }));
  } catch {
    return [...mockUsers];
  }
};

const saveUsers = (users: any[]) => {
  ensureUsersFile();
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
};

// Persistent store for users created during development
let users: any[] = loadUsers();
let nextUserId = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;

export const createUser = async (data: RegisterInput): Promise<User> => {
  const normalizedUsername = data.username.trim().toLowerCase();
  const existingUser = users.find((u) => u.username.toLowerCase() === normalizedUsername);

  if (existingUser) {
    throw new Error('Username already exists');
  }

  const passwordHash = await hashPassword(data.password);

  const newUser = {
    id: nextUserId++,
    username: data.username.trim(),
    email: `${normalizedUsername}@local.user`,
    passwordHash,
    role: 'USER' as UserRole,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  users.push(newUser);
  saveUsers(users);
  return newUser as User;
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  const normalizedUsername = username.trim().toLowerCase();
  const user = users.find((u) => u.username.toLowerCase() === normalizedUsername);
  return user || null;
};

export const getUserById = async (id: number): Promise<User | null> => {
  const user = users.find((u) => u.id === id);
  return user || null;
};

export const verifyPassword = async (
  inputPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return comparePasswords(inputPassword, hashedPassword);
};

export const getUserMaps = async (userId: number, limit = 10, offset = 0) => {
  // This will be implemented with mock maps in mapService
  return [];
};

export const updateUserProfile = async (
  userId: number,
  data: { username?: string }
): Promise<User | null> => {
  const user = users.find((u) => u.id === userId);
  if (!user) return null;

  if (data.username) user.username = data.username;
  user.updatedAt = new Date();

  saveUsers(users);
  return user as User;
};
