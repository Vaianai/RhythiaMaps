import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth';
import { userService, mapService } from '../services';
import { RegisterSchema, LoginSchema } from '../utils/validators';

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validatedData = RegisterSchema.parse(req.body);
    const user = await userService.createUser(validatedData);

    const accessToken = generateAccessToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    res.status(201).json({
      message: 'User created successfully',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validatedData = LoginSchema.parse(req.body);
    const user = await userService.getUserByUsername(validatedData.username);

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isPasswordValid = await userService.verifyPassword(
      validatedData.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const accessToken = generateAccessToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const payload = verifyRefreshToken(token);

    if (!payload) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const user = await userService.getUserById(payload.id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const accessToken = generateAccessToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    res.status(200).json({
      accessToken,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await userService.getUserById(req.user.id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserMaps = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const { maps, total } = await mapService.getMaps({
      limit,
      offset,
      sort: 'latest',
    });

    res.status(200).json({
      maps,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
