import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase configuration is missing');
    }

    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentification requise' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify JWT token is valid
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Token invalide ou expiré' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;

    const { messages, eventContext } = await req.json();

    // Fetch available products from database for recommendations
    const { data: products } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price_per_day,
        location,
        quantity_available,
        category_id,
        provider_id,
        images,
        is_verified,
        categories:category_id(name)
      `)
      .eq('is_active', true)
      .order('is_verified', { ascending: false });

    // Build system prompt with context
    const systemPrompt = `Tu es YAFOY Assistant, un conseiller expert en organisation d'événements au Sénégal et en Afrique de l'Ouest.
Tu aides les organisateurs à planifier leurs cérémonies (mariages, baptêmes, anniversaires, etc.) en recommandant les meilleurs prestataires et équipements.

CONTEXTE DE L'ÉVÉNEMENT:
${eventContext ? `
- Type d'événement: ${eventContext.eventType || 'Non spécifié'}
- Budget: ${eventContext.budgetMin || 0} - ${eventContext.budgetMax || 'Non spécifié'} FCFA
- Nombre d'invités: ${eventContext.guestCount || 'Non spécifié'}
- Date: ${eventContext.eventDate || 'Non spécifiée'}
- Lieu: ${eventContext.eventLocation || 'Non spécifié'}
- Services demandés: ${eventContext.servicesNeeded?.join(', ') || 'Non spécifiés'}
` : 'Aucun contexte fourni encore.'}

PRODUITS ET SERVICES DISPONIBLES:
${products?.map(p => {
  const cat = p.categories as unknown as { name: string } | null;
  const categoryName = cat?.name || 'Sans catégorie';
  return `
- ${p.name} (${categoryName})
  Prix: ${p.price_per_day} FCFA/jour
  Lieu: ${p.location || 'Non spécifié'}
  ${p.is_verified ? '✅ Vérifié' : ''}
  ID: ${p.id}`;
}).join('\n') || 'Aucun produit disponible.'}

INSTRUCTIONS:
1. Pose des questions pour comprendre les besoins (type d'événement, budget, nombre d'invités, date, lieu)
2. Recommande des prestataires et équipements adaptés au budget et au nombre d'invités
3. Suggère des combinaisons optimales de services
4. Donne des conseils pratiques pour l'organisation
5. Quand tu recommandes des produits, inclus leurs IDs dans ta réponse au format JSON comme ceci:
   [RECOMMENDATIONS: {"products": ["id1", "id2"]}]
6. Sois chaleureux, professionnel et culturellement adapté au contexte africain
7. Réponds en français

IMPORTANT: Toujours inclure les recommandations de produits en format JSON à la fin de ta réponse quand tu suggères des produits spécifiques.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requêtes atteinte, veuillez réessayer plus tard.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Crédits IA épuisés, veuillez contacter le support.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'Erreur du service IA' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Event planner AI error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
