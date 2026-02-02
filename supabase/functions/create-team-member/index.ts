import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateTeamMemberRequest {
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'accountant' | 'supervisor' | 'moderator' | 'support';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the caller is authenticated and is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a client with the user's token to verify their identity
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the caller's JWT and get their claims
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Token invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callerId = claimsData.claims.sub;

    // Create admin client to check roles
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if caller is admin or super_admin
    const { data: callerRole, error: roleError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
      .single();

    if (roleError || !callerRole) {
      return new Response(
        JSON.stringify({ error: 'Impossible de vérifier les permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (callerRole.role !== 'admin' && callerRole.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Seuls les administrateurs peuvent créer des membres d\'équipe' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    const body: CreateTeamMemberRequest = await req.json();
    const { email, password, fullName, role } = body;

    // Validate inputs
    if (!email || !password || !fullName || !role) {
      return new Response(
        JSON.stringify({ error: 'Email, mot de passe, nom complet et rôle sont requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Format email invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Le mot de passe doit contenir au moins 6 caractères' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate role
    const validRoles = ['admin', 'accountant', 'supervisor', 'moderator', 'support'];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Rôle invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only super_admin can create admin users
    if (role === 'admin' && callerRole.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Seul un Super Admin peut créer un Administrateur' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the new user using admin client (service role)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for team members
      user_metadata: { full_name: fullName }
    });

    if (authError) {
      console.error('Auth error:', authError);
      let errorMessage = 'Erreur lors de la création du compte';
      if (authError.message.includes('already registered')) {
        errorMessage = 'Un compte existe déjà avec cet email';
      }
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newUserId = authData.user.id;

    // Insert the role for the new user
    const { error: roleInsertError } = await adminClient
      .from('user_roles')
      .insert({ user_id: newUserId, role });

    if (roleInsertError) {
      console.error('Role insert error:', roleInsertError);
      // Try to clean up the created user
      await adminClient.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de l\'attribution du rôle' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the profile with full name (the trigger creates a profile automatically)
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ full_name: fullName })
      .eq('user_id', newUserId);

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Non-critical error, continue
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Membre d\'équipe créé avec succès',
        user: {
          id: newUserId,
          email: authData.user.email,
          fullName,
          role
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Une erreur inattendue s\'est produite' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
