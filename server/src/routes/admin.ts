import { Router, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Admin emails whitelist (must match frontend useAdmin.ts)
const ADMIN_EMAILS = ['brent@enboarder.com'];

// Usage event type for Supabase queries
interface UsageEvent {
  id: string;
  user_id: string;
  event_type: string;
  customer_id: string | null;
  page_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Lazy-initialize Supabase admin client
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return supabaseAdmin;
}

// Admin check middleware
const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const userEmail = req.user?.email?.toLowerCase();

  if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
};

// GET /api/admin/usage - Get usage analytics
router.get('/usage', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();

    // Fetch recent events
    const { data: recentEventsData, error: eventsError } = await supabase
      .from('usage_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (eventsError) throw eventsError;
    const recentEvents = recentEventsData as UsageEvent[] | null;

    // Aggregate stats
    const { data: loginCount } = await supabase
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'user_login');

    const { data: customerCount } = await supabase
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'customer_selected');

    const { data: pageCount } = await supabase
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'page_created');

    // Get unique users
    const { data: uniqueUsersData } = await supabase
      .from('usage_events')
      .select('user_id')
      .limit(1000);

    const uniqueUsers = uniqueUsersData as { user_id: string }[] | null;
    const uniqueUserCount = new Set(uniqueUsers?.map(u => u.user_id)).size;

    // Get events by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentActivityData } = await supabase
      .from('usage_events')
      .select('event_type, created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    const recentActivity = recentActivityData as { event_type: string; created_at: string }[] | null;

    // Group by day
    const activityByDay: Record<string, { logins: number; customers: number; pages: number }> = {};
    recentActivity?.forEach(event => {
      const day = new Date(event.created_at).toISOString().split('T')[0];
      if (!activityByDay[day]) {
        activityByDay[day] = { logins: 0, customers: 0, pages: 0 };
      }
      if (event.event_type === 'user_login') activityByDay[day].logins++;
      if (event.event_type === 'customer_selected') activityByDay[day].customers++;
      if (event.event_type === 'page_created') activityByDay[day].pages++;
    });

    res.json({
      success: true,
      data: {
        totals: {
          logins: loginCount,
          customerSelections: customerCount,
          pagesCreated: pageCount,
          uniqueUsers: uniqueUserCount,
        },
        activityByDay,
        recentEvents: recentEvents?.map(e => ({
          id: e.id,
          eventType: e.event_type,
          userId: e.user_id,
          customerId: e.customer_id,
          pageId: e.page_id,
          metadata: e.metadata,
          createdAt: e.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('Admin usage error:', error);
    res.status(500).json({ error: 'Failed to fetch usage data' });
  }
});

export default router;
