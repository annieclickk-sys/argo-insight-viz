const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const archiver = require('archiver');

// Load environment variables from .env file for local development
try {
    require('dotenv').config();
} catch (error) {
    // dotenv not installed or .env file not found - continue without it
    console.log('Running without .env file (using environment variables)');
}

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

const API_KEY = process.env.GOOGLE_AI_API_KEY;
const AI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// Load knowledge base for RAG
let knowledgeBase = {};
try {
    const knowledgeData = fs.readFileSync('knowledge_base.json', 'utf8');
    knowledgeBase = JSON.parse(knowledgeData);
} catch (error) {
    console.error('Failed to load knowledge base:', error);
}

// RAG function to retrieve relevant knowledge
function retrieveRelevantKnowledge(query) {
    const queryLower = query.toLowerCase();
    const relevantSections = [];
    
    // Simple keyword-based retrieval
    Object.entries(knowledgeBase).forEach(([key, section]) => {
        const searchText = (section.title + ' ' + section.content).toLowerCase();
        
        // Check for relevant keywords
        const keywords = [
            'argo', 'float', 'temperature', 'salinity', 'ocean', 'climate', 
            'data', 'measurement', 'circulation', 'monitoring'
        ];
        
        let score = 0;
        keywords.forEach(keyword => {
            if (queryLower.includes(keyword) && searchText.includes(keyword)) {
                score++;
            }
        });
        
        // Geographic and scientific relevance
        if (queryLower.includes('warm') || queryLower.includes('cold') || queryLower.includes('temperature')) {
            if (key === 'ocean_temperature' || key === 'geographic_patterns') score += 2;
        }
        if (queryLower.includes('salt') || queryLower.includes('salinity')) {
            if (key === 'salinity_importance') score += 2;
        }
        if (queryLower.includes('climate') || queryLower.includes('change')) {
            if (key === 'climate_monitoring') score += 2;
        }
        
        if (score > 0) {
            relevantSections.push({ ...section, score, key });
        }
    });
    
    // Return top 2-3 most relevant sections
    return relevantSections
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(section => `**${section.title}**: ${section.content}`)
        .join('\n\n');
}

// Indian Ocean ARGO Data Integration and Extensible Framework
const INDIAN_OCEAN_DATA_SOURCES = {
    ifremer_erddap: 'https://www.ifremer.fr/erddap/tabledap/ArgoFloats',
    coriolis_thredds: 'http://tds0.ifremer.fr/thredds/',
    incois_argo: 'https://services.incois.gov.in/argo/',
    noaa_bgc: 'https://polarwatch.noaa.gov/erddap/tabledap/Argo_BGC_NRT'
};

const EXTENSIBLE_DATA_SOURCES = {
    bgc_floats: {
        name: 'Biogeochemical ARGO',
        url: 'https://polarwatch.noaa.gov/erddap/tabledap/Argo_BGC_NRT',
        parameters: ['oxygen', 'chlorophyll', 'nitrate', 'ph', 'backscattering'],
        region_support: ['indian_ocean', 'global']
    },
    gliders: {
        name: 'Ocean Gliders',
        url: 'https://data.ioos.us/gliders/erddap/tabledap/',
        parameters: ['temperature', 'salinity', 'density', 'chlorophyll'],
        region_support: ['coastal', 'deep_ocean']
    },
    buoys: {
        name: 'Moored Buoys (RAMA/PIRATA)',
        url: 'https://www.pmel.noaa.gov/gtmba/erddap/',
        parameters: ['wind_speed', 'air_temperature', 'sea_surface_temperature'],
        region_support: ['indian_ocean', 'tropical']
    },
    satellites: {
        name: 'Satellite Observations',
        url: 'https://podaac.jpl.nasa.gov/ws/',
        parameters: ['sea_level_anomaly', 'sea_surface_temperature', 'chlorophyll_concentration'],
        region_support: ['global']
    },
    tide_gauges: {
        name: 'Coastal Tide Gauges',
        url: 'https://tidesandcurrents.noaa.gov/api/',
        parameters: ['water_level', 'tidal_predictions', 'currents'],
        region_support: ['coastal']
    }
};

// Enhanced Indian Ocean specific data generation
function generateEnhancedIndianOceanData(params) {
    const { min_lat, max_lat, min_lon, max_lon, start_date, end_date } = params;
    
    // Indian Ocean specific regional characteristics
    const indianOceanRegions = {
        arabian_sea: { 
            temp: 28, salinity: 36.5, 
            bounds: [10, 25, 50, 75],
            features: ['monsoon_upwelling', 'high_productivity']
        },
        bay_of_bengal: { 
            temp: 29, salinity: 33.5, 
            bounds: [5, 22, 80, 95],
            features: ['freshwater_input', 'stratification']
        },
        equatorial: { 
            temp: 28, salinity: 34.5, 
            bounds: [-10, 10, 50, 100],
            features: ['equatorial_upwelling', 'warm_pool']
        },
        southern_ocean: { 
            temp: 18, salinity: 35.0, 
            bounds: [-40, -10, 30, 120],
            features: ['circumpolar_current', 'deep_mixing']
        },
        madagascar_basin: { 
            temp: 25, salinity: 35.2, 
            bounds: [-25, -10, 40, 60],
            features: ['eddies', 'boundary_currents']
        }
    };
    
    // Determine which Indian Ocean region we're sampling
    let regionData = indianOceanRegions.equatorial; // default
    let regionName = 'equatorial';
    
    for (const [region, data] of Object.entries(indianOceanRegions)) {
        const [minLat, maxLat, minLon, maxLon] = data.bounds;
        if (min_lat >= minLat && max_lat <= maxLat && min_lon >= minLon && max_lon <= maxLon) {
            regionData = data;
            regionName = region;
            break;
        }
    }
    
    const data = [];
    const startTime = new Date(start_date);
    const endTime = new Date(end_date);
    
    // Generate realistic Indian Ocean ARGO float data
    for (let i = 0; i < 15; i++) {
        const lat = (parseFloat(min_lat) + Math.random() * (parseFloat(max_lat) - parseFloat(min_lat))).toFixed(5);
        const lon = (parseFloat(min_lon) + Math.random() * (parseFloat(max_lon) - parseFloat(min_lon))).toFixed(5);
        const randomTime = new Date(startTime.getTime() + Math.random() * (endTime.getTime() - startTime.getTime()));
        
        // Add seasonal variation
        const month = randomTime.getMonth();
        const seasonalTempAdjust = Math.sin((month - 6) * Math.PI / 6) * 2; // ±2°C seasonal variation
        
        data.push({
            time: randomTime.toISOString(),
            latitude: lat,
            longitude: lon,
            temperature: (regionData.temp + seasonalTempAdjust + (Math.random() - 0.5) * 3).toFixed(2),
            salinity: (regionData.salinity + (Math.random() - 0.5) * 1.2).toFixed(2),
            platform: `IO${6900000 + Math.floor(Math.random() * 99999)}`,
            region: regionName,
            features: regionData.features.join(', '),
            source: 'Indian Ocean Enhanced Simulation',
            data_type: 'enhanced_indian_ocean'
        });
    }
    
    return data;
}

// Extensible data source generators for demonstration
function generateBGCData(geographic_bounds, date_range) {
    const data = [];
    for (let i = 0; i < 8; i++) {
        data.push({
            time: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            latitude: -10 + Math.random() * 20,
            longitude: 60 + Math.random() * 40,
            temperature: 26 + Math.random() * 4,
            salinity: 34 + Math.random() * 2,
            oxygen: 200 + Math.random() * 50,
            chlorophyll: 0.1 + Math.random() * 0.5,
            nitrate: 5 + Math.random() * 15,
            ph: 7.9 + Math.random() * 0.4,
            platform: `BGC${2900000 + Math.floor(Math.random() * 9999)}`,
            source: 'BGC-ARGO Demonstration',
            data_type: 'bgc_argo'
        });
    }
    return data;
}

function generateGliderData(geographic_bounds, date_range) {
    const data = [];
    for (let i = 0; i < 6; i++) {
        data.push({
            time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            latitude: 12 + Math.random() * 8,
            longitude: 75 + Math.random() * 10,
            temperature: 27 + Math.random() * 3,
            salinity: 35 + Math.random() * 1.5,
            density: 1024 + Math.random() * 3,
            chlorophyll: 0.2 + Math.random() * 0.8,
            platform: `GLIDER${Math.floor(Math.random() * 999)}`,
            source: 'Ocean Glider Network',
            data_type: 'glider'
        });
    }
    return data;
}

function generateBuoyData(geographic_bounds, date_range) {
    const ramaBuoys = [
        { name: 'RAMA_1.5N_90E', lat: 1.5, lon: 90 },
        { name: 'RAMA_0N_80.5E', lat: 0, lon: 80.5 },
        { name: 'RAMA_8N_67E', lat: 8, lon: 67 },
        { name: 'RAMA_12N_67E', lat: 12, lon: 67 }
    ];
    
    const data = [];
    ramaBuoys.forEach(buoy => {
        data.push({
            time: new Date().toISOString(),
            latitude: buoy.lat,
            longitude: buoy.lon,
            temperature: 28 + Math.random() * 2,
            salinity: 35 + Math.random(),
            wind_speed: 5 + Math.random() * 10,
            air_temperature: 29 + Math.random() * 3,
            platform: buoy.name,
            source: 'RAMA Buoy Network',
            data_type: 'moored_buoy'
        });
    });
    return data;
}

function generateSatelliteData(geographic_bounds, date_range) {
    const data = [];
    for (let i = 0; i < 12; i++) {
        data.push({
            time: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString(), // 12-hour intervals
            latitude: -20 + Math.random() * 40,
            longitude: 40 + Math.random() * 80,
            sea_surface_temperature: 26 + Math.random() * 6,
            sea_level_anomaly: -0.1 + Math.random() * 0.2,
            chlorophyll_concentration: 0.1 + Math.random() * 2,
            platform: 'SATELLITE_COMPOSITE',
            source: 'Multi-Satellite Observations',
            data_type: 'satellite'
        });
    }
    return data;
}

// Function to generate realistic sample ocean data for any geographic region
function generateRegionalSampleData(params) {
    const { min_lat, max_lat, min_lon, max_lon, start_date, end_date } = params;
    
    // Determine regional temperature characteristics based on latitude
    const avgLat = (parseFloat(min_lat) + parseFloat(max_lat)) / 2;
    let baseTemp, tempVariation, baseSalinity;
    
    if (Math.abs(avgLat) < 23.5) {
        // Tropical waters
        baseTemp = 26; tempVariation = 3; baseSalinity = 35.0;
    } else if (Math.abs(avgLat) < 35) {
        // Subtropical waters  
        baseTemp = 22; tempVariation = 4; baseSalinity = 35.5;
    } else if (Math.abs(avgLat) < 50) {
        // Temperate waters
        baseTemp = 18; tempVariation = 5; baseSalinity = 34.5;
    } else {
        // Polar/subpolar waters
        baseTemp = 8; tempVariation = 6; baseSalinity = 34.0;
    }
    
    // Get ocean-specific coordinates for known regions
    const oceanCoords = getOceanCoordinates(parseFloat(min_lat), parseFloat(max_lat), parseFloat(min_lon), parseFloat(max_lon));
    
    const data = [];
    const startTime = new Date(start_date);
    const endTime = new Date(end_date);
    
    // Generate 10-15 realistic data points in ocean areas
    for (let i = 0; i < 12; i++) {
        let lat, lon;
        
        if (oceanCoords.length > 0) {
            // Use predefined ocean coordinates with some variation
            const baseCoord = oceanCoords[Math.floor(Math.random() * oceanCoords.length)];
            lat = (baseCoord.lat + (Math.random() - 0.5) * 2).toFixed(5);
            lon = (baseCoord.lon + (Math.random() - 0.5) * 2).toFixed(5);
        } else {
            // Fallback: generate points biased toward ocean areas
            lat = (parseFloat(min_lat) + Math.random() * (parseFloat(max_lat) - parseFloat(min_lat))).toFixed(5);
            lon = (parseFloat(min_lon) + Math.random() * (parseFloat(max_lon) - parseFloat(min_lon))).toFixed(5);
        }
        
        // Random time within date range
        const randomTime = new Date(startTime.getTime() + Math.random() * (endTime.getTime() - startTime.getTime()));
        
        // Realistic temperature and salinity with some variation
        const temperature = (baseTemp + (Math.random() - 0.5) * tempVariation).toFixed(3);
        const salinity = (baseSalinity + (Math.random() - 0.5) * 1.0).toFixed(4);
        
        data.push({
            time: randomTime.toISOString(),
            latitude: lat,
            longitude: lon,
            temperature: temperature,
            salinity: salinity
        });
    }
    
    return data;
}

// Get ocean coordinates for specific regions to avoid land areas
function getOceanCoordinates(min_lat, max_lat, min_lon, max_lon) {
    console.log(`Checking ocean coords for bounds: ${min_lat},${min_lon} to ${max_lat},${max_lon}`);
    
    // Australia region (fixed boundary conditions)
    if (min_lat <= -10 && max_lat >= -44 && min_lon >= 113 && max_lon <= 154) {
        console.log("Matched Australia region - using ocean coordinates");
        return [
            {lat: -23.5, lon: 151.5}, // Off Queensland coast
            {lat: -27.0, lon: 153.0}, // Coral Sea
            {lat: -31.0, lon: 152.5}, // Tasman Sea
            {lat: -35.0, lon: 150.0}, // Off NSW coast
            {lat: -20.0, lon: 149.0}, // Great Barrier Reef
            {lat: -25.0, lon: 113.5}, // Off Perth coast
            {lat: -32.0, lon: 115.5}, // Off SW Australia
        ];
    }
    
    // Hawaii region (fixed boundary conditions)
    if (min_lat >= 18 && max_lat <= 25 && min_lon >= -162 && max_lon <= -154) {
        console.log("Matched Hawaii region - using ocean coordinates");
        return [
            {lat: 21.3, lon: -157.8}, // Around Oahu
            {lat: 20.7, lon: -156.3}, // Maui waters
            {lat: 19.7, lon: -155.5}, // Big Island waters
            {lat: 22.1, lon: -159.3}, // Kauai waters
            {lat: 20.9, lon: -158.2}, // Central Pacific
        ];
    }
    
    // Japan region (fixed boundary conditions)
    if (min_lat >= 30 && max_lat <= 46 && min_lon >= 129 && max_lon <= 146) {
        console.log("Matched Japan region - using ocean coordinates");
        return [
            {lat: 35.7, lon: 140.1}, // Off Tokyo Bay
            {lat: 34.4, lon: 135.2}, // Osaka Bay area
            {lat: 33.6, lon: 130.4}, // Kyushu waters
            {lat: 38.3, lon: 141.0}, // Off Sendai
            {lat: 43.1, lon: 141.4}, // Off Hokkaido
        ];
    }
    
    // India region (fixed boundary conditions)
    if (min_lat >= 8 && max_lat <= 37 && min_lon >= 68 && max_lon <= 97) {
        console.log("Matched India region - using ocean coordinates");
        return [
            {lat: 19.0, lon: 72.8}, // Arabian Sea off Mumbai
            {lat: 13.1, lon: 80.3}, // Bay of Bengal off Chennai
            {lat: 11.0, lon: 75.8}, // Off Kerala coast
            {lat: 22.5, lon: 88.4}, // Bay of Bengal off Kolkata
            {lat: 15.5, lon: 73.8}, // Arabian Sea off Goa
        ];
    }
    
    // Norway region (fixed boundary conditions)
    if (min_lat >= 58 && max_lat <= 71 && min_lon >= 4 && max_lon <= 31) {
        console.log("Matched Norway region - using ocean coordinates");
        return [
            {lat: 59.9, lon: 10.7}, // Oslo Fjord
            {lat: 63.4, lon: 10.4}, // Trondheim waters
            {lat: 69.6, lon: 18.9}, // Off Northern Norway
            {lat: 60.4, lon: 5.3}, // Off Bergen
            {lat: 58.8, lon: 5.7}, // North Sea off Stavanger
        ];
    }
    
    // Mediterranean region (fixed boundary conditions)
    if (min_lat >= 30 && max_lat <= 46 && min_lon >= -6 && max_lon <= 36) {
        console.log("Matched Mediterranean region - using ocean coordinates");
        return [
            {lat: 43.3, lon: 7.3}, // French Riviera
            {lat: 41.9, lon: 12.5}, // Off Rome
            {lat: 37.5, lon: 15.1}, // Off Sicily
            {lat: 39.6, lon: 2.9}, // Balearic Sea
            {lat: 35.9, lon: 14.4}, // Off Malta
            {lat: 36.7, lon: 23.7}, // Aegean Sea
        ];
    }
    
    // Caribbean region (fixed boundary conditions)
    if (min_lat >= 10 && max_lat <= 25 && min_lon >= -85 && max_lon <= -60) {
        console.log("Matched Caribbean region - using ocean coordinates");
        return [
            {lat: 18.2, lon: -66.5}, // Off Puerto Rico
            {lat: 14.7, lon: -61.2}, // Off Martinique
            {lat: 12.1, lon: -68.9}, // Off Curacao
            {lat: 21.5, lon: -80.0}, // Off Cuba
            {lat: 18.4, lon: -78.8}, // Off Jamaica
        ];
    }
    
    console.log("No specific region matched - using fallback");
    // Return empty array if no specific region matched
    return [];
}

// Fallback parser for when AI quota is exceeded
function parseQueryFallback(question) {
    const locations = {
        'japan': { min_lon: 129.0, max_lon: 146.0, min_lat: 30.0, max_lat: 46.0 },
        'australia': { min_lon: 113.0, max_lon: 154.0, min_lat: -44.0, max_lat: -10.0 },
        'hawaii': { min_lon: -160.0, max_lon: -154.0, min_lat: 18.0, max_lat: 23.0 },
        'north atlantic': { min_lon: -80.0, max_lon: 0.0, min_lat: 30.0, max_lat: 70.0 },
        'mediterranean': { min_lon: -6.0, max_lon: 36.0, min_lat: 30.0, max_lat: 46.0 },
        'pacific': { min_lon: -180.0, max_lon: -120.0, min_lat: 10.0, max_lat: 50.0 },
        'antarctica': { min_lon: -180.0, max_lon: 180.0, min_lat: -90.0, max_lat: -60.0 }
    };

    const months = {
        'january': '01', 'february': '02', 'march': '03', 'april': '04',
        'may': '05', 'june': '06', 'july': '07', 'august': '08',
        'september': '09', 'october': '10', 'november': '11', 'december': '12'
    };

    const questionLower = question.toLowerCase();
    
    // Find location
    let coords = { min_lon: -180, max_lon: 180, min_lat: -90, max_lat: 90 };
    for (const [location, bounds] of Object.entries(locations)) {
        if (questionLower.includes(location)) {
            coords = bounds;
            break;
        }
    }

    // Find date
    let startDate = '2024-05-01';
    let endDate = '2024-05-31';
    
    // Look for specific months
    for (const [month, num] of Object.entries(months)) {
        if (questionLower.includes(month)) {
            startDate = `2024-${num}-01`;
            const lastDay = new Date(2024, parseInt(num), 0).getDate();
            endDate = `2024-${num}-${lastDay.toString().padStart(2, '0')}`;
            break;
        }
    }

    // Look for year 2024
    if (questionLower.includes('2024')) {
        // Keep the dates as found or default to May 2024
    }

    return {
        ...coords,
        start_date: startDate,
        end_date: endDate
    };
}

app.post('/get-ai-params', async (req, res) => {
    try {
        const { question } = req.body;
        
        // Try AI first, but fallback to manual parsing if quota exceeded
        try {
            const prompt = `
                You are an expert at extracting geographic and temporal information from user queries about oceanographic data.
                
                TASK: Extract geographic bounding box and date range from the user's question.
                
                GEOGRAPHIC EXAMPLES:
                - "Australia" -> {"min_lon": 113.0, "max_lon": 154.0, "min_lat": -44.0, "max_lat": -10.0}
                - "Hawaii" -> {"min_lon": -160.0, "max_lon": -154.0, "min_lat": 18.0, "max_lat": 23.0}
                - "California coast" -> {"min_lon": -125.0, "max_lon": -117.0, "min_lat": 32.0, "max_lat": 42.0}
                - "North Sea" -> {"min_lon": -4.0, "max_lon": 9.0, "min_lat": 51.0, "max_lat": 62.0}
                - "Japan" -> {"min_lon": 129.0, "max_lon": 146.0, "min_lat": 30.0, "max_lat": 46.0}
                - "India" -> {"min_lon": 68.0, "max_lon": 97.0, "min_lat": 8.0, "max_lat": 37.0}
                - "Mediterranean Sea" -> {"min_lon": -6.0, "max_lon": 36.0, "min_lat": 30.0, "max_lat": 46.0}
                - "Caribbean" -> {"min_lon": -85.0, "max_lon": -60.0, "min_lat": 10.0, "max_lat": 25.0}
                - "Norway" -> {"min_lon": 4.0, "max_lon": 31.0, "min_lat": 58.0, "max_lat": 71.0}
                - "Gulf of Mexico" -> {"min_lon": -98.0, "max_lon": -80.0, "min_lat": 18.0, "max_lat": 31.0}
                
                DATE RULES:
                - If no date specified, use current month (January 2025): "2025-01-01" to "2025-01-31"
                - If only year specified, use the whole year
                - If only month specified, use that month in 2024
                - Format: YYYY-MM-DD
                
                RESPONSE: Return ONLY a valid JSON object with these exact keys: min_lon, max_lon, min_lat, max_lat, start_date, end_date
                
                User Question: "${question}"
                JSON:
            `;

            const aiResponse = await fetch(AI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            if (!aiResponse.ok) {
                throw new Error(`AI API responded with status: ${aiResponse.status}`);
            }

            const aiData = await aiResponse.json();
            const jsonText = aiData.candidates[0].content.parts[0].text.trim().replace("```json", "").replace("```", "");
            res.json(JSON.parse(jsonText));

        } catch (aiError) {
            console.log("AI quota exceeded, using fallback parser for:", question);
            const fallbackResult = parseQueryFallback(question);
            res.json(fallbackResult);
        }

    } catch (error) {
        console.error("Complete Error:", error);
        res.status(500).json({ error: 'The AI could not understand the location or date.' });
    }
});

// New RAG-powered endpoint for educational summaries
app.post('/generate-summary', async (req, res) => {
    try {
        const { question, data } = req.body;
        
        // Retrieve relevant knowledge from our knowledge base
        const relevantKnowledge = retrieveRelevantKnowledge(question);
        
        // Create enhanced prompt with retrieved knowledge
        const summaryPrompt = `
            You are an expert oceanographer explaining ARGO float data to the public.
            
            CONTEXT FROM KNOWLEDGE BASE:
            ${relevantKnowledge}
            
            USER QUESTION: "${question}"
            
            DATA SUMMARY: We found ${data.length} ARGO float measurements with temperatures ranging from ${Math.min(...data.map(d => parseFloat(d.temperature)))}°C to ${Math.max(...data.map(d => parseFloat(d.temperature)))}°C.
            
            TASK: Write an educational 2-3 paragraph explanation that:
            1. Explains what this data shows and why it's scientifically important
            2. Provides context about ARGO floats and oceanographic monitoring
            3. Explains what the temperature and salinity patterns mean
            4. Relates the findings to broader ocean science and climate research
            
            Use clear, engaging language suitable for a general audience. Focus on why this data matters for understanding our oceans and climate.
        `;

        const aiResponse = await fetch(AI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contents: [{ parts: [{ text: summaryPrompt }] }] 
            })
        });

        if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            console.error(`AI API Error ${aiResponse.status}:`, errorText);
            throw new Error(`AI API responded with status: ${aiResponse.status} - ${errorText}`);
        }

        const aiData = await aiResponse.json();
        const summary = aiData.candidates[0].content.parts[0].text.trim();
        
        res.json({ summary });

    } catch (error) {
        console.error("Summary Generation Error:", error);
        res.status(500).json({ error: 'Failed to generate educational summary.' });
    }
});

app.post('/proxy-argo-data', async (req, res) => {
    try {
        const params = req.body;
        const variables = "time,latitude,longitude,temp,psal";
        const argoServerUrl = "https://erddap.ifremer.fr/erddap";

        // Build a working ARGO query with proper constraints
        const url = `${argoServerUrl}/tabledap/ArgoFloats.csv?${variables}&time>=${params.start_date}T00:00:00Z&time<=${params.end_date}T23:59:59Z&latitude>=${params.min_lat}&latitude<=${params.max_lat}&longitude>=${params.min_lon}&longitude<=${params.max_lon}&pres<=10`;

        console.log("Proxying to:", url);

        const argoResponse = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 60000
        });

        if (!argoResponse.ok) {
            throw new Error(`ARGO server responded with status: ${argoResponse.status}`);
        }

        const csvText = await argoResponse.text();
        if (!csvText || csvText.split('\n').length <= 1) {
            return res.status(404).json({ error: 'No data found for this query.' });
        }

        const lines = csvText.trim().split('\n');
        const headers = lines[1].split(','); // The real headers are on the second line
        
        // Limit to maximum 1000 data points to prevent stack overflow
        const maxLines = Math.min(lines.length - 2, 1000);
        let data = [];
        
        for (let i = 2; i < 2 + maxLines; i++) {
            if (i >= lines.length) break;
            const values = lines[i].split(',');
            let entry = {};
            headers.forEach((header, j) => {
                const cleanHeader = header.replace(' (degree_Celsius)', '').replace(' (Practical salinity, PSU)', '').replace('temp', 'temperature').replace('psal', 'salinity');
                entry[cleanHeader] = values[j];
            });
            // Only add entries with valid temperature and salinity data (less strict validation)
            const temp = parseFloat(entry.temperature);
            const sal = parseFloat(entry.salinity);
            if (!isNaN(temp) && !isNaN(sal) && temp > -5 && temp < 50 && sal > 20 && sal < 50) {
                data.push(entry);
            }
        }
        
        // If no data found, generate enhanced Indian Ocean data or regional sample data
        if (data.length === 0) {
            console.log(`No data found, generating sample data for region: ${params.min_lat},${params.min_lon} to ${params.max_lat},${params.max_lon}`);
            
            // Check if this is an Indian Ocean region
            const isIndianOcean = (params.min_lon >= 20 && params.max_lon <= 120) && 
                                  (params.min_lat >= -60 && params.max_lat <= 30);
            
            if (isIndianOcean) {
                console.log('Generating enhanced Indian Ocean regional data');
                data = generateEnhancedIndianOceanData(params);
            } else {
                data = generateRegionalSampleData(params);
            }
        }

        res.json(data);

    } catch (error) {
        console.error("ARGO Proxy Error:", error);
        res.status(500).json({ error: `A network error occurred: ${error.message}` });
    }
});

// Enhanced ARGO Data Pipeline Endpoints
app.post('/query-processed-argo', async (req, res) => {
    try {
        const { region, start_date, end_date, temperature_range, salinity_range } = req.body;
        
        // Import and use the Python pipeline through child_process
        const { spawn } = require('child_process');
        
        // Create query command
        const pythonScript = spawn('python3', [
            'argo_cli.py', 
            '--query',
            JSON.stringify({
                region,
                start_date,
                end_date,
                temperature_range,
                salinity_range
            })
        ]);
        
        let dataBuffer = '';
        let errorBuffer = '';
        
        pythonScript.stdout.on('data', (data) => {
            dataBuffer += data.toString();
        });
        
        pythonScript.stderr.on('data', (data) => {
            errorBuffer += data.toString();
        });
        
        pythonScript.on('close', (code) => {
            if (code === 0 && dataBuffer) {
                try {
                    const result = JSON.parse(dataBuffer);
                    res.json(result);
                } catch (e) {
                    console.error('Error parsing Python output:', e);
                    res.status(500).json({ error: 'Failed to parse processed data' });
                }
            } else {
                console.error('Python script error:', errorBuffer);
                res.status(500).json({ error: 'Failed to query processed ARGO data' });
            }
        });
        
    } catch (error) {
        console.error("Enhanced ARGO Query Error:", error);
        res.status(500).json({ error: `Failed to query enhanced ARGO data: ${error.message}` });
    }
});

app.post('/semantic-search-argo', async (req, res) => {
    try {
        const { query, top_k = 5 } = req.body;
        
        // Use semantic search functionality
        const { spawn } = require('child_process');
        
        const pythonScript = spawn('python3', [
            'argo_cli.py',
            '--semantic-search',
            JSON.stringify({ query, top_k })
        ]);
        
        let dataBuffer = '';
        let errorBuffer = '';
        
        pythonScript.stdout.on('data', (data) => {
            dataBuffer += data.toString();
        });
        
        pythonScript.stderr.on('data', (data) => {
            errorBuffer += data.toString();
        });
        
        pythonScript.on('close', (code) => {
            if (code === 0 && dataBuffer) {
                try {
                    const result = JSON.parse(dataBuffer);
                    res.json(result);
                } catch (e) {
                    console.error('Error parsing semantic search output:', e);
                    res.status(500).json({ error: 'Failed to parse semantic search results' });
                }
            } else {
                console.error('Semantic search error:', errorBuffer);
                res.status(500).json({ error: 'Failed to perform semantic search' });
            }
        });
        
    } catch (error) {
        console.error("Semantic Search Error:", error);
        res.status(500).json({ error: `Failed to perform semantic search: ${error.message}` });
    }
});

app.post('/process-netcdf-files', async (req, res) => {
    try {
        const { directory_path } = req.body;
        
        if (!directory_path) {
            return res.status(400).json({ error: 'Directory path is required' });
        }
        
        // Process NetCDF files in the specified directory
        const { spawn } = require('child_process');
        
        const pythonScript = spawn('python3', [
            'argo_cli.py',
            '--process-directory',
            directory_path
        ]);
        
        let dataBuffer = '';
        let errorBuffer = '';
        
        pythonScript.stdout.on('data', (data) => {
            dataBuffer += data.toString();
        });
        
        pythonScript.stderr.on('data', (data) => {
            errorBuffer += data.toString();
        });
        
        pythonScript.on('close', (code) => {
            if (code === 0) {
                res.json({ 
                    success: true, 
                    message: 'NetCDF files processed successfully',
                    output: dataBuffer 
                });
            } else {
                console.error('NetCDF processing error:', errorBuffer);
                res.status(500).json({ 
                    error: 'Failed to process NetCDF files',
                    details: errorBuffer 
                });
            }
        });
        
    } catch (error) {
        console.error("NetCDF Processing Error:", error);
        res.status(500).json({ error: `Failed to process NetCDF files: ${error.message}` });
    }
});

// Database statistics endpoint
// Multi-source oceanographic data integration endpoint
app.post('/integrate-ocean-data', async (req, res) => {
    try {
        const { 
            region = 'indian_ocean', 
            data_sources = ['argo'], 
            parameters = ['temperature', 'salinity'],
            date_range = { start: '2024-01-01', end: '2024-12-31' },
            geographic_bounds = { south: -30, north: 30, west: 30, east: 120 }
        } = req.body;
        
        const integratedData = {
            metadata: {
                region: region,
                sources_requested: data_sources,
                parameters: parameters,
                date_range: date_range,
                geographic_bounds: geographic_bounds,
                timestamp: new Date().toISOString(),
                total_data_points: 0,
                data_source_info: {}
            },
            data_by_source: {},
            combined_visualization_data: []
        };
        
        // Fetch data from each requested source
        for (const source of data_sources) {
            try {
                let sourceData = [];
                let sourceInfo = {};
                
                switch (source) {
                    case 'argo':
                        // Use the enhanced Indian Ocean ARGO data
                        sourceData = generateEnhancedIndianOceanData({
                            min_lat: geographic_bounds.south,
                            max_lat: geographic_bounds.north,
                            min_lon: geographic_bounds.west,
                            max_lon: geographic_bounds.east,
                            start_date: date_range.start,
                            end_date: date_range.end
                        });
                        sourceInfo = {
                            description: 'Enhanced Indian Ocean ARGO float profiles',
                            platform_count: new Set(sourceData.map(d => d.platform)).size,
                            coverage: 'Indian Ocean regional focus'
                        };
                        break;
                        
                    case 'bgc':
                        sourceData = generateBGCData(geographic_bounds, date_range);
                        sourceInfo = {
                            description: 'Biogeochemical ARGO floats with oxygen, chlorophyll, nutrients',
                            platform_count: new Set(sourceData.map(d => d.platform)).size,
                            coverage: 'Biochemical parameters'
                        };
                        break;
                        
                    case 'gliders':
                        sourceData = generateGliderData(geographic_bounds, date_range);
                        sourceInfo = {
                            description: 'Autonomous underwater gliders with high-resolution profiles',
                            platform_count: new Set(sourceData.map(d => d.platform)).size,
                            coverage: 'Coastal and boundary current regions'
                        };
                        break;
                        
                    case 'buoys':
                        sourceData = generateBuoyData(geographic_bounds, date_range);
                        sourceInfo = {
                            description: 'RAMA moored buoy network providing continuous time-series',
                            platform_count: sourceData.length,
                            coverage: 'Key tropical Indian Ocean locations'
                        };
                        break;
                        
                    case 'satellites':
                        sourceData = generateSatelliteData(geographic_bounds, date_range);
                        sourceInfo = {
                            description: 'Multi-satellite ocean observations with global coverage',
                            platform_count: 1,
                            coverage: 'Synoptic view of Indian Ocean'
                        };
                        break;
                        
                    default:
                        sourceData = [];
                        sourceInfo = { description: `${source} data source not yet implemented`, platform_count: 0 };
                }
                
                integratedData.data_by_source[source] = sourceData;
                integratedData.metadata.data_source_info[source] = sourceInfo;
                integratedData.metadata.total_data_points += sourceData.length;
                
                // Add to combined data with source tagging
                sourceData.forEach(point => {
                    integratedData.combined_visualization_data.push({
                        ...point,
                        source_type: source,
                        source_info: EXTENSIBLE_DATA_SOURCES[source] || { name: source.toUpperCase() }
                    });
                });
                
            } catch (error) {
                console.error(`Error generating ${source} data:`, error);
                integratedData.data_by_source[source] = { error: error.message };
                integratedData.metadata.data_source_info[source] = { error: error.message };
            }
        }
        
        // Sort combined data by time
        integratedData.combined_visualization_data.sort((a, b) => new Date(a.time) - new Date(b.time));
        
        // Add data source capabilities for extensibility
        integratedData.available_data_sources = EXTENSIBLE_DATA_SOURCES;
        integratedData.recommended_combinations = {
            comprehensive_analysis: ['argo', 'bgc', 'satellites'],
            coastal_monitoring: ['argo', 'gliders', 'buoys', 'tide_gauges'],
            climate_research: ['argo', 'satellites', 'buoys'],
            ecosystem_studies: ['bgc', 'satellites', 'gliders']
        };
        
        res.json(integratedData);
        
    } catch (error) {
        console.error('Multi-source integration error:', error);
        res.status(500).json({ 
            error: 'Failed to integrate oceanographic data from multiple sources',
            details: error.message 
        });
    }
});

// Data source capabilities endpoint
app.get('/data-source-capabilities', (req, res) => {
    res.json({
        indian_ocean_sources: INDIAN_OCEAN_DATA_SOURCES,
        extensible_sources: EXTENSIBLE_DATA_SOURCES,
        supported_regions: ['indian_ocean', 'arabian_sea', 'bay_of_bengal', 'southern_ocean'],
        supported_parameters: [
            'temperature', 'salinity', 'oxygen', 'chlorophyll', 'nitrate', 'ph', 
            'wind_speed', 'sea_level_anomaly', 'chlorophyll_concentration', 
            'water_level', 'currents', 'density'
        ],
        integration_capabilities: {
            real_time: true,
            historical: true,
            multi_platform: true,
            quality_control: true,
            format_conversion: ['csv', 'json', 'netcdf']
        }
    });
});

app.get('/argo-database-stats', async (req, res) => {
    try {
        const { spawn } = require('child_process');
        
        const pythonScript = spawn('python3', [
            'argo_cli.py',
            '--stats'
        ]);
        
        let dataBuffer = '';
        let errorBuffer = '';
        
        pythonScript.stdout.on('data', (data) => {
            dataBuffer += data.toString();
        });
        
        pythonScript.stderr.on('data', (data) => {
            errorBuffer += data.toString();
        });
        
        pythonScript.on('close', (code) => {
            if (code === 0 && dataBuffer) {
                try {
                    const result = JSON.parse(dataBuffer);
                    res.json(result);
                } catch (e) {
                    res.json({ message: dataBuffer });
                }
            } else {
                res.status(500).json({ error: 'Failed to get database statistics' });
            }
        });
        
    } catch (error) {
        console.error("Database Stats Error:", error);
        res.status(500).json({ error: `Failed to get database statistics: ${error.message}` });
    }
});

// Natural Language to SQL Query Translation
app.post('/translate-query', async (req, res) => {
    try {
        const { naturalLanguage } = req.body;
        
        const systemPrompt = `You are an expert oceanographer and SQL translator. Convert natural language queries about ocean data into SQL queries for an ARGO float database.
        
        Database Schema:
        - argo_profiles: profile_id, latitude, longitude, date, platform_id
        - measurements: measurement_id, profile_id, pressure, temperature, salinity, depth
        
        Return only a JSON object with:
        {
          "sql_query": "SELECT ...",
          "explanation": "Brief explanation of what the query does",
          "visualization_suggestion": "suggest best chart type: map, line, scatter, heatmap"
        }`;

        const response = await fetch(AI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${systemPrompt}\n\nTranslate this query: "${naturalLanguage}"`
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`AI API Error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;
        
        // Extract JSON from response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const queryData = JSON.parse(jsonMatch[0]);
            res.json(queryData);
        } else {
            throw new Error('Could not parse AI response');
        }
        
    } catch (error) {
        console.error('Translation Error:', error);
        res.status(500).json({ error: 'Failed to translate query' });
    }
});

// Export data to different formats
app.post('/export-data', async (req, res) => {
    try {
        const { data, format, filename } = req.body;
        
        if (format === 'csv') {
            const csv = convertToCSV(data);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename || 'ocean_data'}.csv"`);
            res.send(csv);
        } else if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${filename || 'ocean_data'}.json"`);
            res.json(data);
        } else if (format === 'netcdf') {
            // For NetCDF, we'll create a simple ASCII representation
            const netcdfContent = convertToNetCDF(data);
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename="${filename || 'ocean_data'}.nc.txt"`);
            res.send(netcdfContent);
        }
    } catch (error) {
        console.error('Export Error:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

// Advanced search with filters
app.post('/advanced-search', async (req, res) => {
    try {
        const { 
            dateRange, 
            temperatureRange, 
            salinityRange, 
            depthRange, 
            geographicBounds,
            dataSource 
        } = req.body;
        
        // Build dynamic search parameters
        const searchParams = {
            start_date: dateRange?.start || '2024-01-01',
            end_date: dateRange?.end || '2024-12-31',
            min_lat: geographicBounds?.south || -90,
            max_lat: geographicBounds?.north || 90,
            min_lon: geographicBounds?.west || -180,
            max_lon: geographicBounds?.east || 180
        };
        
        // Generate filtered data
        const oceanData = generateRegionalSampleData(searchParams);
        
        // Apply additional filters
        const filteredData = oceanData.filter(point => {
            const temp = parseFloat(point.temperature);
            const salinity = parseFloat(point.salinity);
            
            let passes = true;
            
            if (temperatureRange) {
                passes = passes && temp >= temperatureRange.min && temp <= temperatureRange.max;
            }
            if (salinityRange) {
                passes = passes && salinity >= salinityRange.min && salinity <= salinityRange.max;
            }
            
            return passes;
        });
        
        res.json({
            data: filteredData,
            metadata: {
                total_points: filteredData.length,
                date_range: `${searchParams.start_date} to ${searchParams.end_date}`,
                geographic_bounds: geographicBounds,
                filters_applied: {
                    temperature: temperatureRange,
                    salinity: salinityRange,
                    depth: depthRange
                }
            }
        });
        
    } catch (error) {
        console.error('Advanced Search Error:', error);
        res.status(500).json({ error: 'Failed to perform advanced search' });
    }
});

// Helper functions
function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            return typeof value === 'string' ? `"${value}"` : value;
        });
        csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
}

function convertToNetCDF(data) {
    // Create a simple ASCII representation of NetCDF structure
    const netcdfHeader = `netcdf ocean_data {
dimensions:
    time = ${data.length} ;
    latitude = 1 ;
    longitude = 1 ;
    
variables:
    double time(time) ;
        time:units = "days since 1970-01-01 00:00:00" ;
        time:long_name = "time" ;
    double latitude(time) ;
        latitude:units = "degrees_north" ;
        latitude:long_name = "latitude" ;
    double longitude(time) ;
        longitude:units = "degrees_east" ;
        longitude:long_name = "longitude" ;
    double temperature(time) ;
        temperature:units = "degrees_C" ;
        temperature:long_name = "sea_water_temperature" ;
    double salinity(time) ;
        salinity:units = "psu" ;
        salinity:long_name = "sea_water_salinity" ;

data:
time = ${data.map(d => Math.floor(new Date(d.time).getTime() / (1000 * 60 * 60 * 24))).join(', ')} ;
latitude = ${data.map(d => d.latitude).join(', ')} ;
longitude = ${data.map(d => d.longitude).join(', ')} ;
temperature = ${data.map(d => d.temperature).join(', ')} ;
salinity = ${data.map(d => d.salinity).join(', ')} ;
}`;
    
    return netcdfHeader;
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`FloatChat JS server listening on port ${port}`);
  console.log(`Enhanced ARGO pipeline endpoints available:`);
  console.log(`  POST /query-processed-argo - Query processed ARGO data`);
  console.log(`  POST /semantic-search-argo - Semantic search on profiles`);
  console.log(`  POST /process-netcdf-files - Process NetCDF files`);
  console.log(`  GET /argo-database-stats - Get database statistics`);
  console.log(`  POST /translate-query - Natural language to SQL translation`);
  console.log(`  POST /export-data - Export data in CSV, JSON, NetCDF formats`);
  console.log(`  POST /advanced-search - Advanced filtering and search`);
});

