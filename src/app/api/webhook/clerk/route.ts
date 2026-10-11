// app/api/webhooks/clerk/route.ts
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server';
import { sendMail } from '@/utils/mail/sendMail';
import { after } from 'next/server';

// Simple device info parser without external dependencies
function parseUserAgent(userAgent: string) {
  // Simple browser detection
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let deviceType = 'Desktop';

  // Browser detection
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    const version = userAgent.match(/Chrome\/([0-9.]+)/);
    browser = `Chrome ${version ? version[1].split('.')[0] : ''}`;
  } else if (userAgent.includes('Firefox')) {
    const version = userAgent.match(/Firefox\/([0-9.]+)/);
    browser = `Firefox ${version ? version[1].split('.')[0] : ''}`;
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    const version = userAgent.match(/Version\/([0-9.]+)/);
    browser = `Safari ${version ? version[1].split('.')[0] : ''}`;
  } else if (userAgent.includes('Edg')) {
    const version = userAgent.match(/Edg\/([0-9.]+)/);
    browser = `Edge ${version ? version[1].split('.')[0] : ''}`;
  }

  // OS detection
  if (userAgent.includes('Windows NT')) {
    const version = userAgent.match(/Windows NT ([0-9.]+)/);
    if (version) {
      const ntVersion = version[1];
      if (ntVersion === '10.0') os = 'Windows 10/11';
      else if (ntVersion === '6.3') os = 'Windows 8.1';
      else if (ntVersion === '6.1') os = 'Windows 7';
      else os = 'Windows';
    } else {
      os = 'Windows';
    }
  } else if (userAgent.includes('Mac OS X')) {
    const version = userAgent.match(/Mac OS X ([0-9_]+)/);
    os = version ? `macOS ${version[1].replace(/_/g, '.')}` : 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    const version = userAgent.match(/Android ([0-9.]+)/);
    os = version ? `Android ${version[1]}` : 'Android';
    deviceType = 'Mobile';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    const version = userAgent.match(/OS ([0-9_]+)/);
    os = version ? `iOS ${version[1].replace(/_/g, '.')}` : 'iOS';
    deviceType = userAgent.includes('iPad') ? 'Tablet' : 'Mobile';
  }

  // Device type detection
  if (userAgent.includes('Mobile') && !userAgent.includes('iPad')) {
    deviceType = 'Mobile';
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    deviceType = 'Tablet';
  }

  return { browser, os, deviceType };
}

// Get location from Vercel edge headers (zero-latency)
function getLocationFromHeaders(req: NextRequest, ipAddress: string): string {
  // Try to use Vercel's geolocation headers first (available in production)
  const city = req.headers.get('x-vercel-ip-city');
  const region = req.headers.get('x-vercel-ip-country-region');
  const country = req.headers.get('x-vercel-ip-country');

  if (city && country) {
    const cityDecoded = decodeURIComponent(city);
    return region ? `${cityDecoded}, ${region}, ${country}` : `${cityDecoded}, ${country}`;
  }

  // Fallback if headers are missing
  return ipAddress !== '127.0.0.1' ? `IP: ${ipAddress}` : 'Local Network';
}

export async function POST(req: NextRequest) {
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', {
      status: 400,
    });
  }

  const eventType = evt.type;

  // --- Existing user handlers ---
  if (eventType === 'user.created') {
    try {
      const { id, email_addresses, first_name, last_name } = evt.data;

      const primaryEmail = email_addresses.find(
        (email) => email.id === evt.data.primary_email_address_id
      );

      if (!primaryEmail) {
        console.error('No primary email found for user:', id);
        return new Response('No primary email found', { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from('lc_users')
        .insert({
          clerk_user_id: id,
          email: primaryEmail.email_address,
          name:
            first_name && last_name ? `${first_name} ${last_name}` : first_name || last_name || null,
          is_premium: false,
          current_plan: 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();

      if (error) {
        // console.error('Error creating user in Supabase:', error);
        return new Response('Error creating user in database', { status: 500 });
      }

      // console.log('User created successfully in Supabase:', data);
      return new Response('User created successfully', { status: 200 });
    } catch (error) {
      // console.error('Error processing user.created webhook:', error);
      return new Response('Internal server error', { status: 500 });
    }
  }

  if (eventType === 'user.updated') {
    try {
      const { id, email_addresses, first_name, last_name } = evt.data;

      const primaryEmail = email_addresses.find(
        (email) => email.id === evt.data.primary_email_address_id
      );

      if (!primaryEmail) {
        console.error('No primary email found for user:', id);
        return new Response('No primary email found', { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from('lc_users')
        .update({
          email: primaryEmail.email_address,
          name:
            first_name && last_name ? `${first_name} ${last_name}` : first_name || last_name || null,
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_user_id', id)
        .select();

      if (error) {
        // console.error('Error updating user in Supabase:', error);
        return new Response('Error updating user in database', { status: 500 });
      }

      // console.log('User updated successfully in Supabase:', data);
      return new Response('User updated successfully', { status: 200 });
    } catch (error) {
      // console.error('Error processing user.updated webhook:', error);
      return new Response('Internal server error', { status: 500 });
    }
  }

  if (eventType === 'user.deleted') {
    try {
      const { id } = evt.data;

      const { error } = await supabaseAdmin
        .from('lc_users')
        .delete()
        .eq('clerk_user_id', id);

      if (error) {
        console.error('Error deleting user from Supabase:', error);
        return new Response('Error deleting user from database', { status: 500 });
      }

      // console.log('User deleted successfully from Supabase');
      return new Response('User deleted successfully', { status: 200 });
    } catch (error) {
      console.error('Error processing user.deleted webhook:', error);
      return new Response('Internal server error', { status: 500 });
    }
  }

  // --- Sign-in notification for EVERY session ---
  if (eventType === 'session.created') {
    try {
      const sessionData = evt.data;

      if (!('user_id' in sessionData) || !('last_active_at' in sessionData)) {
        console.error('Missing expected session data fields in session.created event.');
        return new Response('Invalid session data', { status: 400 });
      }

      const { user_id, last_active_at } = sessionData;

      // Extract IP and User Agent from multiple possible sources
      // Prioritize Clerk's provided data, then fall back to request headers
      const ipAddress =
        (sessionData as any).latest_activity?.ip_address ||
        (sessionData as any).request?.ip_address ||
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        req.headers.get('cf-connecting-ip') || // Cloudflare
        '127.0.0.1';

      const userAgent =
        (sessionData as any).latest_activity?.user_agent ||
        (sessionData as any).request?.user_agent ||
        req.headers.get('user-agent') ||
        'Unknown Browser';

      // Parse device information
      const deviceInfo = parseUserAgent(userAgent);

      // Get location using Vercel headers (instant, no external API fetch)
      let location = getLocationFromHeaders(req, ipAddress);

      // Fetch user data from Supabase
      const { data: userData, error: userError } = await supabaseAdmin
        .from('lc_users')
        .select('email, name')
        .eq('clerk_user_id', user_id)
        .single();

      if (userError || !userData) {
        console.error('Error fetching user for session.created:', userError || 'User not found');
        return new Response('Error fetching user data', { status: 500 });
      }

      const { email: customerEmail, name: customerName } = userData;

      // Format sign-in time with timezone
      const signInTime = new Date(last_active_at).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZoneName: 'short',
      });

      // Prepare email data
      const emailData = {
        name: customerName || 'there',
        signInTime,
        location,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        operatingSystem: deviceInfo.os,
        userAgent: userAgent.length > 100 ? userAgent.substring(0, 100) + '...' : userAgent, // Truncate long user agents
        ipAddress: ipAddress !== '127.0.0.1' ? ipAddress : 'Local Network',
        dashboardUrl: process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/leetcode`
          : '#',
        securityUrl: process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/leetcode/profile`
          : '#',
      };

      // Use after() to safely execute email sending in the background
      // This allows the webhook to immediately return a 200 OK to Clerk to prevent timeouts
      after(async () => {
        try {
          await sendMail({
            email: customerEmail,
            subject: '🔒 Security Alert: Account Sign-In Detected - LC Interview Buddy',
            templateName: 'signin_notification.ejs',
            data: emailData,
          });
        } catch (emailError) {
          console.error(`Failed to send sign-in email to ${customerEmail}:`, emailError);
        }
      });

      return new Response('Sign-in notification processed successfully', { status: 200 });
    } catch (error) {
      console.error('Error processing session.created webhook:', error);
      return new Response('Internal server error', { status: 500 });
    }
  }

  return new Response('Webhook received', { status: 200 });
}