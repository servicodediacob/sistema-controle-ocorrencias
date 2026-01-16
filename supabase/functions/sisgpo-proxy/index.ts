
// @ts-nocheck
// supabase/functions/sisgpo-proxy/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Configure CORS
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Validate Auth (Supabase Auth passes JWT in Authorization header)
        // The Edge Function automatically validates the JWT if "Verify JWT" is on in Supabase Dashboard (default).
        // Access user info via:
        // const authHeader = req.headers.get('Authorization')!

        // 2. Parse Request
        const { path, method = 'GET', body, params } = await req.json()

        // SISGPO Base URL (Should be env var strict)
        // For now hardcoded based on known endpoint or env var
        const SISGPO_BASE_URL = Deno.env.get('SISGPO_BASE_URL') || 'https://sisgpo.bombeiros.go.gov.br';
        const SISGPO_TOKEN = Deno.env.get('SISGPO_TOKEN'); // If simpler auth used, or we proxy the user's cookie?
        // Legacy system used a session cookie or token managed by the server?
        // The legacy `sisgpoController` just forwarded requests?
        // Actually, usually legacy systems proxy requests to avoid CORS.

        // Construct target URL
        // path comes from frontend e.g. "/api/viaturas/..."
        const targetUrl = new URL(path, SISGPO_BASE_URL);

        // Append params if any
        if (params) {
            Object.keys(params).forEach(key => targetUrl.searchParams.append(key, params[key]));
        }

        console.log(`Proxying to: ${targetUrl.toString()}`);

        // 3. Make Request to SISGPO
        const response = await fetch(targetUrl.toString(), {
            method,
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${SISGPO_TOKEN}` // If needed
                // Add cookies if SISGPO relies on them (complex in Edge)
                // For now, assuming public or simple API key access.
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        const data = await response.json();

        // 4. Return Data
        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: response.status,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
