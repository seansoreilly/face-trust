
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Analyze-face function called');
    
    const requestBody = await req.text();
    console.log('Raw request body length:', requestBody.length);
    
    let parsedBody;
    try {
      parsedBody = JSON.parse(requestBody);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { image } = parsedBody;
    
    if (!image) {
      console.error('No image provided in request');
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Image data received, length:', image.length);

    // Get OpenAI API key from Supabase secrets
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Making request to OpenAI API...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert in facial expression analysis for trustworthiness assessment. Analyze the person's facial expression and provide a trust score based on:
            
            1. Eye contact and gaze direction
            2. Facial symmetry and openness
            3. Smile genuineness (Duchenne vs forced smile)
            4. Micro-expressions indicating confidence vs nervousness
            5. Overall facial expression and body language
            
            Provide your response as a JSON object with:
            - score: number (10-100)
            - honesty: number (10-100) 
            - reliability: number (10-100)
            - explanation: string (detailed explanation of the assessment)
            
            Be constructive and focus on expression analysis rather than physical features. Scores should vary realistically based on actual facial cues.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this person\'s facial expression for trustworthiness indicators and provide scores with explanation.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      }),
    })

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json()
    console.log('OpenAI response received');
    
    const aiResponse = data.choices[0].message.content

    // Parse the JSON response from AI
    let analysisResult
    try {
      analysisResult = JSON.parse(aiResponse)
      console.log('Parsed AI response:', analysisResult);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      console.log('Raw AI response:', aiResponse);
      // Fallback if AI doesn't return valid JSON
      analysisResult = {
        score: 75,
        honesty: 73,
        reliability: 77,
        explanation: aiResponse
      }
    }

    // Ensure scores are within valid range and are numbers
    analysisResult.score = Math.max(10, Math.min(100, Number(analysisResult.score) || 75));
    analysisResult.honesty = Math.max(10, Math.min(100, Number(analysisResult.honesty) || 73));
    analysisResult.reliability = Math.max(10, Math.min(100, Number(analysisResult.reliability) || 77));

    console.log('Final analysis result:', analysisResult);

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in analyze-face function:', error)
    return new Response(
      JSON.stringify({ error: 'Analysis failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
