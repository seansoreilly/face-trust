
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
            content: `You are an expert in facial expression analysis for trustworthiness assessment. You MUST analyze every image provided and give varied, realistic scores based on actual facial cues.

IMPORTANT INSTRUCTIONS:
- You MUST provide analysis for every face image submitted
- Scores should vary significantly based on actual facial expressions (10-100 range)
- DO NOT refuse to analyze or say you cannot provide scores
- BE CRITICAL - not everyone should get high scores
- Consider these factors carefully:

1. Eye contact and gaze direction (direct = higher trust, avoidance = lower)
2. Facial symmetry and openness (asymmetry or tension = lower scores)
3. Smile genuineness (Duchenne vs forced smile affects scores significantly)
4. Micro-expressions indicating confidence vs nervousness
5. Overall facial expression and body language

Your response MUST be a valid JSON object with this exact format:
{
  "score": [number between 10-100],
  "honesty": [number between 10-100], 
  "reliability": [number between 10-100],
  "explanation": "[detailed analysis of facial cues and reasoning for scores]"
}

DO NOT wrap your response in markdown code blocks or any other formatting. Return only the JSON object.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this person\'s facial expression for trustworthiness. Provide realistic scores based on actual facial cues - not everyone should score highly. Be critical and analytical.'
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
        temperature: 0.7
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
    
    let aiResponse = data.choices[0].message.content.trim();
    console.log('Raw AI response:', aiResponse);

    // Clean up the response if it's wrapped in markdown code blocks
    if (aiResponse.startsWith('```json')) {
      aiResponse = aiResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      console.log('Cleaned AI response:', aiResponse);
    } else if (aiResponse.startsWith('```')) {
      aiResponse = aiResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      console.log('Cleaned AI response:', aiResponse);
    }

    // Parse the JSON response from AI
    let analysisResult;
    try {
      analysisResult = JSON.parse(aiResponse);
      console.log('Parsed AI response:', analysisResult);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      console.log('Raw AI response that failed to parse:', aiResponse);
      
      // If AI refused to analyze, return more realistic default scores
      if (aiResponse.toLowerCase().includes("unable") || aiResponse.toLowerCase().includes("cannot") || aiResponse.toLowerCase().includes("can't")) {
        analysisResult = {
          score: 45,
          honesty: 42,
          reliability: 48,
          explanation: "Unable to perform detailed facial analysis on this image. This may be due to image quality, angle, or facial obstructions. Default neutral-low scores provided."
        };
      } else {
        // For other parsing errors, use lower default scores
        analysisResult = {
          score: 35,
          honesty: 33,
          reliability: 37,
          explanation: "Analysis error occurred. Default low scores provided due to processing issues."
        };
      }
    }

    // Ensure scores are within valid range and are numbers
    analysisResult.score = Math.max(10, Math.min(100, Number(analysisResult.score) || 35));
    analysisResult.honesty = Math.max(10, Math.min(100, Number(analysisResult.honesty) || 33));
    analysisResult.reliability = Math.max(10, Math.min(100, Number(analysisResult.reliability) || 37));

    // Ensure explanation exists
    if (!analysisResult.explanation || typeof analysisResult.explanation !== 'string') {
      analysisResult.explanation = "Facial expression analysis completed with basic trustworthiness indicators evaluated.";
    }

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
