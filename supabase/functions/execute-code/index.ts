import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, language } = await req.json();

    if (!code || !language) {
      return new Response(
        JSON.stringify({ error: 'Code and language are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (code.length > 100000) {
      return new Response(
        JSON.stringify({ error: 'Code too large. Maximum size is 100KB.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI Gateway not configured', output: 'ERROR: AI Gateway key not found.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are a code execution engine. Execute the provided ${language} code mentally and return ONLY the exact output that would be produced if the code were run. Follow these rules strictly:
- Return ONLY the program output (stdout), nothing else
- If the code has errors, return the exact error message a compiler/interpreter would produce
- If there is no output, return "(no output)"
- Do NOT add any explanation, commentary, or markdown formatting
- Simulate the execution accurately, respecting the language's behavior`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: code },
        ],
        temperature: 0,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI Gateway error:', errText);
      return new Response(
        JSON.stringify({ 
          error: 'Execution failed',
          output: `${"=".repeat(50)}\nERROR\n${"=".repeat(50)}\n\nCode execution service unavailable. Please try again.`,
          success: false,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    const executionOutput = result.choices?.[0]?.message?.content || '(no output)';

    const formattedOutput = `${"=".repeat(50)}\nLanguage: ${language}\nEngine: AI-Powered Execution\n${"=".repeat(50)}\n\nOUTPUT:\n${executionOutput}\n\n${"=".repeat(50)}\nExecution completed\n`;

    return new Response(
      JSON.stringify({
        output: formattedOutput,
        success: true,
        stdout: executionOutput,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[EXECUTION_ERROR]', error instanceof Error ? error.message : 'Unknown error');
    return new Response(
      JSON.stringify({
        error: 'Code execution failed',
        output: `${"=".repeat(50)}\nERROR\n${"=".repeat(50)}\n\nCode execution failed. Please try again.`,
        success: false,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
