import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaystackInitializeRequest {
  orderId: string;
  email: string;
  amount: number; // Amount in FCFA (will be converted to kobo)
  callbackUrl?: string;
}

interface PaystackVerifyRequest {
  reference: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    if (action === 'initialize' && req.method === 'POST') {
      // Initialize payment
      const { orderId, email, amount, callbackUrl }: PaystackInitializeRequest = await req.json();

      if (!orderId || !email || !amount) {
        return new Response(
          JSON.stringify({ error: 'orderId, email, and amount are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Convert amount to kobo (Paystack uses lowest currency unit)
      // For FCFA, we use the amount directly as Paystack handles XOF
      const amountInKobo = Math.round(amount * 100);

      const reference = `order_${orderId}_${Date.now()}`;

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
          currency: 'XOF', // West African CFA franc
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

      console.log('Payment initialized:', { reference, orderId });

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
      // Verify payment
      const { reference }: PaystackVerifyRequest = await req.json();

      if (!reference) {
        return new Response(
          JSON.stringify({ error: 'reference is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
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
      console.log('Payment verification:', { reference, status: transaction.status });

      if (transaction.status === 'success') {
        // Update order status in database
        const orderId = transaction.metadata?.order_id;
        
        if (orderId) {
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'confirmed',
              deposit_paid: transaction.amount / 100, // Convert back from kobo
            })
            .eq('id', orderId);

          if (updateError) {
            console.error('Error updating order:', updateError);
          } else {
            console.log('Order updated successfully:', orderId);
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: transaction.status === 'success',
          status: transaction.status,
          amount: transaction.amount / 100,
          currency: transaction.currency,
          reference: transaction.reference,
          paid_at: transaction.paid_at,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'webhook' && req.method === 'POST') {
      // Handle Paystack webhook
      const payload = await req.text();
      const signature = req.headers.get('x-paystack-signature');

      // Verify webhook signature (optional but recommended)
      console.log('Webhook received:', { signature: signature?.substring(0, 20) });

      const event = JSON.parse(payload);
      console.log('Webhook event:', event.event);

      if (event.event === 'charge.success') {
        const transaction = event.data;
        const orderId = transaction.metadata?.order_id;

        if (orderId) {
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
        }
      }

      return new Response(
        JSON.stringify({ received: true }),
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
