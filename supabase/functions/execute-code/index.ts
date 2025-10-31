import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Language mapping from Monaco editor to Piston API
const languageMap: Record<string, string> = {
  'javascript': 'javascript',
  'typescript': 'typescript',
  'python': 'python',
  'java': 'java',
  'cpp': 'c++',
  'c': 'c',
  'rust': 'rust',
  'go': 'go',
  'sql': 'sql',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, language } = await req.json();
    
    console.log('Code execution requested:', { language, codeLength: code?.length });

    // Validate inputs
    if (!code || !language) {
      return new Response(
        JSON.stringify({ error: 'Code and language are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enforce code size limit (100KB)
    if (code.length > 100000) {
      return new Response(
        JSON.stringify({ error: 'Code too large. Maximum size is 100KB.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map language to Piston API format
    const pistonLanguage = languageMap[language] || language;

    console.log('Mapped language:', pistonLanguage);

    // Call Piston API for code execution
    const pistonResponse = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: pistonLanguage,
        version: '*', // Use latest version
        files: [
          {
            name: `main.${language === 'python' ? 'py' : language === 'java' ? 'java' : 'js'}`,
            content: code,
          },
        ],
      }),
    });

    const result = await pistonResponse.json();
    
    console.log('Piston API response:', result);

    // Format the output
    let output = '';
    
    if (result.run) {
      output += `${"=".repeat(50)}\n`;
      output += `Language: ${language}\n`;
      output += `Version: ${result.language} ${result.version}\n`;
      output += `${"=".repeat(50)}\n\n`;
      
      if (result.run.stdout) {
        output += `OUTPUT:\n${result.run.stdout}\n`;
      }
      
      if (result.run.stderr) {
        output += `\nERROR:\n${result.run.stderr}\n`;
      }
      
      if (result.run.code !== 0) {
        output += `\nExit Code: ${result.run.code}\n`;
      }
      
      output += `\n${"=".repeat(50)}\n`;
      output += `Execution completed in ${result.run.signal ? 'signal ' + result.run.signal : 'success'}\n`;
    } else if (result.message) {
      output = `ERROR: ${result.message}`;
    } else {
      output = 'Unknown error occurred during execution';
    }

    return new Response(
      JSON.stringify({ 
        output,
        success: result.run && result.run.code === 0,
        stderr: result.run?.stderr,
        stdout: result.run?.stdout,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[EXECUTION_ERROR]', error instanceof Error ? error.message : 'Unknown error');
    return new Response(
      JSON.stringify({ 
        error: 'Code execution failed',
        output: `${"=".repeat(50)}\nERROR\n${"=".repeat(50)}\n\nCode execution failed. Please check your code and try again.`
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
