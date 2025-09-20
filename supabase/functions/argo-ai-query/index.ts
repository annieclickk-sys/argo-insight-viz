import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ARGO Knowledge Base for RAG
const knowledgeBase = {
  "argo_project": {
    "title": "The ARGO Float Network",
    "content": "The ARGO project is a global array of over 4,000 free-drifting profiling floats that measure temperature, salinity, and other ocean properties. These autonomous instruments dive to 2,000 meters depth every 10 days, collecting vital data as they ascend to the surface."
  },
  "ocean_temperature": {
    "title": "Ocean Temperature Significance", 
    "content": "Ocean temperature is a critical indicator of Earth's climate system. Surface temperatures affect weather patterns, while deep ocean temperatures reveal long-term climate trends. ARGO temperature measurements help track these changes with unprecedented precision."
  },
  "salinity_importance": {
    "title": "Ocean Salinity and Circulation",
    "content": "Ocean salinity affects water density and drives global ocean circulation patterns. Salinity variations indicate freshwater input from rivers, precipitation, and ice melt. ARGO salinity measurements provide crucial data for understanding these complex oceanographic processes."
  }
};

function retrieveRelevantKnowledge(query: string): string {
  const queryLower = query.toLowerCase();
  const relevantSections: any[] = [];
  
  Object.entries(knowledgeBase).forEach(([key, section]) => {
    const searchText = (section.title + ' ' + section.content).toLowerCase();
    
    let score = 0;
    const keywords = ['argo', 'float', 'temperature', 'salinity', 'ocean', 'climate'];
    
    keywords.forEach(keyword => {
      if (queryLower.includes(keyword) && searchText.includes(keyword)) {
        score++;
      }
    });
    
    if (queryLower.includes('temperature') && key === 'ocean_temperature') score += 2;
    if (queryLower.includes('salinity') && key === 'salinity_importance') score += 2;
    
    if (score > 0) {
      relevantSections.push({ ...section, score, key });
    }
  });
  
  return relevantSections
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(section => `**${section.title}**: ${section.content}`)
    .join('\n\n');
}

function parseGeographicQuery(query: string) {
  const queryLower = query.toLowerCase();
  
  // Default to Indian Ocean region
  let region = {
    min_lat: -40,
    max_lat: 30,
    min_lon: 30,
    max_lon: 120
  };
  
  // Geographic region detection
  if (queryLower.includes('arabian sea')) {
    region = { min_lat: 10, max_lat: 25, min_lon: 50, max_lon: 75 };
  } else if (queryLower.includes('bay of bengal')) {
    region = { min_lat: 5, max_lat: 22, min_lon: 80, max_lon: 95 };
  } else if (queryLower.includes('equator')) {
    region = { min_lat: -10, max_lat: 10, min_lon: 50, max_lon: 100 };
  } else if (queryLower.includes('pacific')) {
    region = { min_lat: -40, max_lat: 40, min_lon: 120, max_lon: -70 };
  } else if (queryLower.includes('atlantic')) {
    region = { min_lat: -40, max_lat: 40, min_lon: -70, max_lon: 20 };
  }
  
  // Date range extraction
  const now = new Date();
  let start_date = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000); // 6 months ago
  let end_date = now;
  
  const monthMatch = query.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i);
  if (monthMatch) {
    const month = monthMatch[1].toLowerCase();
    const year = parseInt(monthMatch[2]);
    const monthIndex = ['january','february','march','april','may','june','july','august','september','october','november','december'].indexOf(month);
    start_date = new Date(year, monthIndex, 1);
    end_date = new Date(year, monthIndex + 1, 0);
  }
  
  return {
    ...region,
    start_date: start_date.toISOString().split('T')[0],
    end_date: end_date.toISOString().split('T')[0]
  };
}

function generateArgoData(params: any) {
  const { min_lat, max_lat, min_lon, max_lon, start_date, end_date } = params;
  
  const data = [];
  const startTime = new Date(start_date);
  const endTime = new Date(end_date);
  
  // Generate realistic ARGO float data
  for (let i = 0; i < 12; i++) {
    const lat = (parseFloat(min_lat) + Math.random() * (parseFloat(max_lat) - parseFloat(min_lat))).toFixed(5);
    const lon = (parseFloat(min_lon) + Math.random() * (parseFloat(max_lon) - parseFloat(min_lon))).toFixed(5);
    const randomTime = new Date(startTime.getTime() + Math.random() * (endTime.getTime() - startTime.getTime()));
    
    // Generate realistic temperature and salinity based on location
    let baseTemp = 25; // tropical default
    let baseSalinity = 35.0;
    
    if (parseFloat(lat) > 30 || parseFloat(lat) < -30) {
      baseTemp = 15; // cooler in higher latitudes
    }
    if (parseFloat(lat) < 10 && parseFloat(lat) > -10) {
      baseTemp = 28; // warmer near equator
    }
    
    data.push({
      time: randomTime.toISOString(),
      latitude: lat,
      longitude: lon,
      temperature: (baseTemp + (Math.random() - 0.5) * 4).toFixed(2),
      salinity: (baseSalinity + (Math.random() - 0.5) * 2).toFixed(2),
      platform: `${6900000 + Math.floor(Math.random() * 99999)}`,
      cycle: Math.floor(Math.random() * 200) + 1,
      depth: Math.floor(Math.random() * 2000),
      region: determineOceanRegion(parseFloat(lat), parseFloat(lon))
    });
  }
  
  return data;
}

function determineOceanRegion(lat: number, lon: number): string {
  if (lat >= 10 && lat <= 25 && lon >= 50 && lon <= 75) return 'Arabian Sea';
  if (lat >= 5 && lat <= 22 && lon >= 80 && lon <= 95) return 'Bay of Bengal';
  if (lat >= -10 && lat <= 10 && lon >= 50 && lon <= 100) return 'Equatorial Indian Ocean';
  if (lon >= 120 || lon <= -70) return 'Pacific Ocean';
  if (lon >= -70 && lon <= 20) return 'Atlantic Ocean';
  return 'Indian Ocean';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { query, type, params, data, userQuery } = requestBody;
    
    if (type === 'parse_query') {
      // Parse natural language query into parameters
      const parsedParams = parseGeographicQuery(query);
      const relevantKnowledge = retrieveRelevantKnowledge(query);
      
      return new Response(JSON.stringify({
        success: true,
        params: parsedParams,
        knowledge: relevantKnowledge
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (type === 'get_data') {
      // Generate ARGO data based on parameters
      const argoData = generateArgoData(params);
      
      return new Response(JSON.stringify({
        success: true,
        data: argoData,
        count: argoData.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (type === 'generate_summary') {
      // Generate AI summary using Google Gemini
      const relevantKnowledge = retrieveRelevantKnowledge(userQuery);
      
      const prompt = `Based on the following ARGO ocean data and oceanographic knowledge, provide a comprehensive analysis:

**User Query**: ${userQuery}

**Relevant Knowledge**:
${relevantKnowledge}

**Data Summary**: 
- ${data.length} ARGO float measurements
- Temperature range: ${Math.min(...data.map(d => parseFloat(d.temperature))).toFixed(1)}°C to ${Math.max(...data.map(d => parseFloat(d.temperature))).toFixed(1)}°C
- Salinity range: ${Math.min(...data.map(d => parseFloat(d.salinity))).toFixed(1)} to ${Math.max(...data.map(d => parseFloat(d.salinity))).toFixed(1)} PSU
- Geographic coverage: ${data[0]?.region || 'Multiple regions'}

Please provide a detailed oceanographic analysis including:
1. Key observations about the temperature and salinity patterns
2. Oceanographic significance of these measurements
3. Implications for climate and marine ecosystem research
4. How this relates to broader ocean science understanding

Keep the response detailed but accessible to both scientists and interested general users.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      });

      const aiResult = await response.json();
      const summary = aiResult.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate summary at this time.';

      return new Response(JSON.stringify({
        success: true,
        summary
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown request type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in argo-ai-query function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});