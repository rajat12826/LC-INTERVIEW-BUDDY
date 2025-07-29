// app/api/webhooks/clerk/route.ts
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for server-side operations
)

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created') {
    try {
      const { id, email_addresses, first_name, last_name } = evt.data

      // Get primary email address
      const primaryEmail = email_addresses.find(
        (email) => email.id === evt.data.primary_email_address_id
      )

      if (!primaryEmail) {
        console.error('No primary email found for user:', id)
        return new Response('No primary email found', { status: 400 })
      }

      // Create user in Supabase
      const { data, error } = await supabase
        .from('lc_users')
        .insert({
          clerk_user_id: id,
          email: primaryEmail.email_address,
          name: first_name && last_name ? `${first_name} ${last_name}` : first_name || last_name || null,
          is_premium: false,
          current_plan: 'free', // Default plan
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()

      if (error) {
        console.error('Error creating user in Supabase:', error)
        return new Response('Error creating user in database', { status: 500 })
      }

      console.log('User created successfully in Supabase:', data)
      return new Response('User created successfully', { status: 200 })
    } catch (error) {
      console.error('Error processing user.created webhook:', error)
      return new Response('Internal server error', { status: 500 })
    }
  }

  if (eventType === 'user.updated') {
    try {
      const { id, email_addresses, first_name, last_name } = evt.data

      // Get primary email address
      const primaryEmail = email_addresses.find(
        (email) => email.id === evt.data.primary_email_address_id
      )

      if (!primaryEmail) {
        console.error('No primary email found for user:', id)
        return new Response('No primary email found', { status: 400 })
      }

      // Update user in Supabase
      const { data, error } = await supabase
        .from('lc_users')
        .update({
          email: primaryEmail.email_address,
          name: first_name && last_name ? `${first_name} ${last_name}` : first_name || last_name || null,
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_user_id', id)
        .select()

      if (error) {
        console.error('Error updating user in Supabase:', error)
        return new Response('Error updating user in database', { status: 500 })
      }

      console.log('User updated successfully in Supabase:', data)
      return new Response('User updated successfully', { status: 200 })
    } catch (error) {
      console.error('Error processing user.updated webhook:', error)
      return new Response('Internal server error', { status: 500 })
    }
  }

  if (eventType === 'user.deleted') {
    try {
      const { id } = evt.data

      // Delete user from Supabase (or mark as deleted)
      const { error } = await supabase
        .from('lc_users')
        .delete()
        .eq('clerk_user_id', id)

      if (error) {
        console.error('Error deleting user from Supabase:', error)
        return new Response('Error deleting user from database', { status: 500 })
      }

      console.log('User deleted successfully from Supabase')
      return new Response('User deleted successfully', { status: 200 })
    } catch (error) {
      console.error('Error processing user.deleted webhook:', error)
      return new Response('Internal server error', { status: 500 })
    }
  }

  return new Response('Webhook received', { status: 200 })
}