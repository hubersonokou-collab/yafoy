import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteRequest {
  userId: string;
}

interface PatchRequest {
  userId: string;
  action: 'update_role' | 'update_profile';
  data: {
    role?: string;
    fullName?: string;
    phone?: string;
    location?: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify caller's identity
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Token invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callerId = claimsData.claims.sub;

    // Check if caller is admin or super_admin
    const { data: callerRoles, error: rolesError } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId);

    if (rolesError) {
      return new Response(
        JSON.stringify({ error: 'Erreur de vérification des droits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callerRole = callerRoles?.[0]?.role;
    const isSuperAdmin = callerRole === 'super_admin';
    const isAdmin = callerRole === 'admin';

    if (!isSuperAdmin && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Accès refusé. Seuls les administrateurs peuvent gérer les membres.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for privileged operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Handle GET request - fetch user details including email
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const userId = url.searchParams.get('userId');

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'userId requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch user email from auth
      const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(userId);

      if (userError || !userData.user) {
        console.error('Error fetching user:', userError);
        return new Response(
          JSON.stringify({ error: 'Utilisateur non trouvé' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          email: userData.user.email,
          created_at: userData.user.created_at,
          last_sign_in_at: userData.user.last_sign_in_at,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle POST request - reset password
    if (req.method === 'POST') {
      const body = await req.json();
      
      if (body.action === 'reset_password') {
        const { userId } = body;

        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'userId requis' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Only super_admin can reset passwords
        if (!isSuperAdmin) {
          return new Response(
            JSON.stringify({ error: 'Seul un super admin peut réinitialiser les mots de passe' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Fetch user email
        const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(userId);

        if (userError || !userData.user?.email) {
          return new Response(
            JSON.stringify({ error: 'Utilisateur non trouvé' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Send password reset email
        const { error: resetError } = await adminClient.auth.resetPasswordForEmail(
          userData.user.email,
          { redirectTo: 'https://yafoy.lovable.app/auth' }
        );

        if (resetError) {
          console.error('Error sending reset email:', resetError);
          return new Response(
            JSON.stringify({ error: 'Erreur lors de l\'envoi de l\'email' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Email de réinitialisation envoyé' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Action non reconnue' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle DELETE request
    if (req.method === 'DELETE') {
      const { userId }: DeleteRequest = await req.json();

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'userId requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get target user's role
      const { data: targetRoles } = await adminClient
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const targetRole = targetRoles?.[0]?.role;

      // Security checks
      if (userId === callerId) {
        return new Response(
          JSON.stringify({ error: 'Vous ne pouvez pas vous supprimer vous-même' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (targetRole === 'super_admin') {
        return new Response(
          JSON.stringify({ error: 'Impossible de supprimer un super administrateur' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!isSuperAdmin && (targetRole === 'admin')) {
        return new Response(
          JSON.stringify({ error: 'Seul un super admin peut supprimer un administrateur' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete the user's role first
      const { error: deleteRoleError } = await adminClient
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteRoleError) {
        console.error('Error deleting role:', deleteRoleError);
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la suppression du rôle' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete the user from auth
      const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId);

      if (deleteUserError) {
        console.error('Error deleting user:', deleteUserError);
        // Try to restore the role since user deletion failed
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la suppression de l\'utilisateur' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Membre supprimé avec succès' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle PATCH request
    if (req.method === 'PATCH') {
      const { userId, action, data }: PatchRequest = await req.json();

      if (!userId || !action) {
        return new Response(
          JSON.stringify({ error: 'userId et action requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get target user's role
      const { data: targetRoles } = await adminClient
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const targetRole = targetRoles?.[0]?.role;

      // Security checks
      if (targetRole === 'super_admin' && userId !== callerId) {
        return new Response(
          JSON.stringify({ error: 'Impossible de modifier un super administrateur' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!isSuperAdmin && (targetRole === 'admin' || data.role === 'admin' || data.role === 'super_admin')) {
        return new Response(
          JSON.stringify({ error: 'Seul un super admin peut modifier les droits administrateur' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'update_role') {
        if (!data.role) {
          return new Response(
            JSON.stringify({ error: 'Nouveau rôle requis' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Validate role
        const validRoles = ['admin', 'accountant', 'supervisor', 'moderator', 'support'];
        if (!validRoles.includes(data.role)) {
          return new Response(
            JSON.stringify({ error: 'Rôle invalide' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update the role
        const { error: updateError } = await adminClient
          .from('user_roles')
          .update({ role: data.role })
          .eq('user_id', userId);

        if (updateError) {
          console.error('Error updating role:', updateError);
          return new Response(
            JSON.stringify({ error: 'Erreur lors de la mise à jour du rôle' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Rôle mis à jour avec succès' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'update_profile') {
        const updates: Record<string, string> = {};
        if (data.fullName) updates.full_name = data.fullName;
        if (data.phone) updates.phone = data.phone;
        if (data.location) updates.location = data.location;

        if (Object.keys(updates).length === 0) {
          return new Response(
            JSON.stringify({ error: 'Aucune donnée à mettre à jour' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: updateError } = await adminClient
          .from('profiles')
          .update(updates)
          .eq('user_id', userId);

        if (updateError) {
          console.error('Error updating profile:', updateError);
          return new Response(
            JSON.stringify({ error: 'Erreur lors de la mise à jour du profil' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Profil mis à jour avec succès' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Action non reconnue' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Méthode non supportée' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in manage-team-member:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
