import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface NotificationPayload {
  user_id: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}

interface CreateNotificationsRequest {
  notifications: NotificationPayload[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify the request has an authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.log('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client with the service role key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create user client to validate JWT
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.log('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Parse request body
    const body: CreateNotificationsRequest = await req.json();
    const { notifications } = body;

    if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
      return new Response(
        JSON.stringify({ error: 'notifications array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate each notification
    for (const notification of notifications) {
      if (!notification.user_id || !notification.type || !notification.title) {
        return new Response(
          JSON.stringify({ error: 'Each notification must have user_id, type, and title' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create admin client with service role to bypass RLS
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Insert notifications
    const notificationsToInsert = notifications.map(n => ({
      user_id: n.user_id,
      type: n.type,
      title: n.title,
      body: n.body || null,
      data: n.data || null,
      read: false,
    }));

    console.log('Inserting notifications:', notificationsToInsert);

    const { data: insertedNotifications, error: insertError } = await adminClient
      .from('notifications')
      .insert(notificationsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting notifications:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create notifications', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Notifications created successfully:', insertedNotifications?.length);

    return new Response(
      JSON.stringify({
        success: true,
        count: insertedNotifications?.length || 0,
        notifications: insertedNotifications,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
