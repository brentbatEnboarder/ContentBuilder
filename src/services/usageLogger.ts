import { supabase } from '@/lib/supabase';

type EventType = 'user_login' | 'customer_selected' | 'page_created';

/**
 * Logs a usage event to the database for analytics tracking.
 * Fire-and-forget: errors are silently ignored to avoid disrupting the user experience.
 */
export async function logUsageEvent(
  eventType: EventType,
  options?: {
    customerId?: string;
    pageId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('usage_events').insert({
      user_id: user.id,
      event_type: eventType,
      customer_id: options?.customerId || null,
      page_id: options?.pageId || null,
      metadata: options?.metadata || {},
    });
  } catch {
    // Silently ignore logging errors - we don't want to disrupt the user experience
  }
}
