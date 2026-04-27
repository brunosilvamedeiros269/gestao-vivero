'use server';

import { supabase } from '@/lib/supabase';

export async function saveSubscription(subscription: any, role: string) {
  try {
    const { error } = await supabase.from('push_subscriptions').upsert({
      user_role: role,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth
    }, { onConflict: 'endpoint' });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Error saving subscription:', err);
    return { success: false };
  }
}
