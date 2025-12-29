import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

// Extend Express Request to include user info
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

// Lazy-initialize Supabase client with service role key
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  }

  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdmin;
}

/**
 * Middleware to verify Supabase JWT tokens.
 * Extracts user info from the token and attaches it to the request.
 */
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Missing or invalid authorization header',
      code: 'AUTH_MISSING_TOKEN',
    });
    return;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.warn('Auth verification failed:', error?.message || 'No user found');
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: 'AUTH_INVALID_TOKEN',
      });
      return;
    }

    // Attach user info to request for downstream use
    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);

    if (error instanceof Error && error.message.includes('Missing SUPABASE')) {
      res.status(503).json({
        success: false,
        error: 'Authentication service not configured',
        code: 'AUTH_NOT_CONFIGURED',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_ERROR',
    });
  }
};

/**
 * Optional auth middleware - doesn't block requests without tokens,
 * but still extracts user info if a valid token is present.
 */
export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided, continue without user info
    next();
    return;
  }

  const token = authHeader.substring(7);

  try {
    const supabase = getSupabaseAdmin();
    const { data: { user } } = await supabase.auth.getUser(token);

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
      };
    }
  } catch (error) {
    // Log but don't block - token might be expired but we still allow access
    console.warn('Optional auth check failed:', error);
  }

  next();
};
