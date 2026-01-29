import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PaystackInitializeRequest {
  orderId: string;
  email: string;
  amount: number;
  callbackUrl?: string;
}

interface PaystackVerifyRequest {
  reference: string;
}

// Create a transaction record in the database
async function createTransaction(
  supabase: any,
  data: {
    orderId: string;
    providerId: string;
    amount: number;
    reference: string;
    status: string;
    type: string;
    paymentMethod?: string;
    description?: string;
  }
): Promise<{ data: any; error: any }> {
  console.log('Creating transaction record:', data);
  
  const result = await supabase
    .from('transactions')
    .insert({
      order_id: data.orderId,
      provider_id: data.providerId,
      amount: data.amount,
      reference: data.reference,
      status: data.status,
      type: data.type,
      payment_method: data.paymentMethod || null,
      description: data.description || `Paiement commande #${data.orderId.slice(0, 8)}`,
    })
    .select()
    .single();
  
  if (result.error) {
    console.error('Error creating transaction:', result.error);
  } else {
    console.log('Transaction created successfully:', result.data.id);
  }
  
  return result;
}

// Update an existing transaction
async function updateTransaction(
  supabase: any,
  reference: string,
  data: {
    status: string;
    paymentMethod?: string;
    processedAt?: string;
  }
): Promise<{ data: any; error: any }> {
  console.log('Updating transaction:', reference, data);
  
  const updateData: any = { status: data.status };
  if (data.paymentMethod) updateData.payment_method = data.paymentMethod;
  if (data.processedAt) updateData.processed_at = data.processedAt;
  
  const result = await supabase
    .from('transactions')
    .update(updateData)
    .eq('reference', reference)
    .select()
    .single();
  
  if (result.error) {
    console.error('Error updating transaction:', result.error);
  } else {
    console.log('Transaction updated successfully:', result.data?.id);
  }
  
  return result;
}

async function handleWebhook(
  req: Request, 
  supabase: any,
  secretKey: string
): Promise<Response> {
  const payload = await req.text();
  const signature = req.headers.get('x-paystack-signature');

  // Verify webhook signature using HMAC SHA512
  if (signature) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (expectedSignature !== signature) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  console.log('Webhook received with valid signature');

  const event = JSON.parse(payload);
  console.log('Webhook event:', event.event);

  if (event.event === 'charge.success') {
    const transaction = event.data;
    const orderId = transaction.metadata?.order_id;
    const reference = transaction.reference;

    if (orderId) {
      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          deposit_paid: transaction.amount / 100,
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Webhook: Error updating order:', updateError);
      } else {
        console.log('Webhook: Order updated successfully:', orderId);
      }

      // Update transaction record
      await updateTransaction(supabase, reference, {
        status: 'success',
        paymentMethod: transaction.channel || 'card',
        processedAt: new Date().toISOString(),
      });
    }
  } else if (event.event === 'charge.failed') {
    const transaction = event.data;
    const reference = transaction.reference;

    // Update transaction record to failed
    await updateTransaction(supabase, reference, {
      status: 'failed',
      processedAt: new Date().toISOString(),
    });
  }

  return new Response(
    JSON.stringify({ received: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!PAYSTACK_SECRET_KEY) {
      console.error('PAYSTACK_SECRET_KEY is not configured');
      throw new Error('PAYSTACK_SECRET_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    console.log('Paystack function called:', action);

    // Webhook doesn't require user auth - uses signature verification instead
    if (action === 'webhook' && req.method === 'POST') {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      return await handleWebhook(req, supabase, PAYSTACK_SECRET_KEY);
    }

    // All other endpoints require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('JWT verification failed:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === 'initialize' && req.method === 'POST') {
      const { orderId, email, amount, callbackUrl }: PaystackInitializeRequest = await req.json();

      console.log('Initialize payment request:', { orderId, email, amount });

      if (!orderId || !email || !amount) {
        return new Response(
          JSON.stringify({ error: 'orderId, email, and amount are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify the user owns this order and get provider info
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('client_id, provider_id')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        console.error('Order not found:', orderError);
        return new Response(
          JSON.stringify({ error: 'Order not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (order.client_id !== userId) {
        console.error('Unauthorized: user does not own this order');
        return new Response(
          JSON.stringify({ error: 'Unauthorized - not your order' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Convert amount to kobo (Paystack uses lowest currency unit)
      const amountInKobo = Math.round(amount * 100);
      const reference = `order_${orderId}_${Date.now()}`;

      console.log('Calling Paystack API to initialize payment...');

      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: amountInKobo,
          reference,
          currency: 'XOF',
          callback_url: callbackUrl,
          metadata: {
            order_id: orderId,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Paystack initialize error:', data);
        throw new Error(data.message || 'Failed to initialize payment');
      }

      console.log('Payment initialized successfully:', { reference, orderId, userId });

      // Create transaction record with pending status
      await createTransaction(supabase, {
        orderId,
        providerId: order.provider_id,
        amount,
        reference: data.data.reference,
        status: 'pending',
        type: 'payment',
        description: `Paiement commande #${orderId.slice(0, 8)}`,
      });

      return new Response(
        JSON.stringify({
          success: true,
          authorization_url: data.data.authorization_url,
          access_code: data.data.access_code,
          reference: data.data.reference,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify' && req.method === 'POST') {
      const { reference }: PaystackVerifyRequest = await req.json();

      console.log('Verify payment request:', { reference });

      if (!reference) {
        return new Response(
          JSON.stringify({ error: 'reference is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Paystack verify error:', data);
        throw new Error(data.message || 'Failed to verify payment');
      }

      const transaction = data.data;
      const orderId = transaction.metadata?.order_id;

      console.log('Paystack verification response:', { 
        reference, 
        status: transaction.status,
        channel: transaction.channel,
        orderId 
      });

      // Verify user has access to this order
      if (orderId) {
        const { data: order } = await supabase
          .from('orders')
          .select('client_id')
          .eq('id', orderId)
          .single();

        if (order && order.client_id !== userId) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized - not your order' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const paymentSuccess = transaction.status === 'success';

      if (orderId) {
        if (paymentSuccess) {
          // Update order status
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'confirmed',
              deposit_paid: transaction.amount / 100,
            })
            .eq('id', orderId);

          if (updateError) {
            console.error('Error updating order:', updateError);
          } else {
            console.log('Order updated successfully:', orderId);
          }
        }

        // Update transaction record
        await updateTransaction(supabase, reference, {
          status: paymentSuccess ? 'success' : 'failed',
          paymentMethod: transaction.channel || 'card',
          processedAt: transaction.paid_at || new Date().toISOString(),
        });
      }

      return new Response(
        JSON.stringify({
          success: paymentSuccess,
          status: transaction.status,
          amount: transaction.amount / 100,
          currency: transaction.currency,
          reference: transaction.reference,
          paid_at: transaction.paid_at,
          channel: transaction.channel,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use /initialize, /verify, or /webhook' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Paystack function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
