// AI Service for generating product content
const axios = require('axios');

// OpenAI Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Check if OpenAI is configured
function isConfigured() {
  return !!OPENAI_API_KEY;
}

// Call OpenAI API
async function callOpenAI(prompt, systemPrompt = '') {
  if (!isConfigured()) {
    throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.');
  }

  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt || 'You are a helpful product content writer.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    throw new Error('Failed to generate content. Please try again.');
  }
}

// Generate Product Blurb
async function generateProductBlurb(productName, productDetails, tone) {
  const toneDescriptions = {
    professional: 'professional and formal',
    casual: 'casual and friendly',
    friendly: 'warm and approachable',
    persuasive: 'compelling and convincing'
  };

  const prompt = `Write a product blurb for "${productName}". 
${productDetails ? `Product details: ${productDetails}` : ''}
The tone should be ${toneDescriptions[tone] || 'professional'}.
Make it engaging, highlight key features, and encourage purchase. Keep it between 100-150 words.
Format the output as plain text without any markdown.`;

  const systemPrompt = 'You are an expert product copywriter who creates compelling product descriptions.';

  return await callOpenAI(prompt, systemPrompt);
}

// Generate Pros and Cons
async function generateProsCons(productName, productDetails) {
  const prompt = `List 5 pros and 5 cons for "${productName}".
${productDetails ? `Product details: ${productDetails}` : ''}
Return the response in this exact JSON format:
{
  "pros": ["pro 1", "pro 2", "pro 3", "pro 4", "pro 5"],
  "cons": ["con 1", "con 2", "con 3", "con 4", "con 5"]
}
Only return the JSON, nothing else.`;

  const systemPrompt = 'You are a product analyst who provides balanced, honest pros and cons for products.';

  const response = await callOpenAI(prompt, systemPrompt);
  
  // Try to parse JSON response
  try {
    // Remove any markdown code blocks if present
    const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanResponse);
  } catch (error) {
    // Fallback: parse response into pros and cons manually
    const lines = response.split('\n').filter(line => line.trim());
    const pros = lines.filter(line => line.includes('✓') || line.includes('Pro:') || line.match(/^\d+[\.\)]/) && line.length < 80).slice(0, 5);
    const cons = lines.filter(line => line.includes('✗') || line.includes('Con:') || line.match(/^\d+[\.\)]/) && pros.includes(line)).slice(0, 5);
    
    return {
      pros: pros.map(p => p.replace(/^[\d✓✗\.\)\-]+/, '').trim()).filter(p => p),
      cons: cons.map(c => c.replace(/^[\d✓✗\.\)\-]+/, '').trim()).filter(c => c)
    };
  }
}

// Suggest Product Alternatives
async function suggestAlternatives(productName, budget) {
  const prompt = `Suggest 3 better product alternatives to "${productName}".
${budget ? `Budget range: ${budget}` : 'Consider various price points.'}
For each alternative, provide:
1. Product name
2. A brief reason why it's better
3. Approximate price range

Return the response in this exact JSON format:
{
  "alternatives": [
    {"name": "Alternative 1", "reason": "Why it's better", "priceRange": "$X - $Y"},
    {"name": "Alternative 2", "reason": "Why it's better", "priceRange": "$X - $Y"},
    {"name": "Alternative 3", "reason": "Why it's better", "priceRange": "$X - $Y"}
  ]
}
Only return the JSON, nothing else.`;

  const systemPrompt = 'You are a product expert who recommends better alternatives based on quality, price, and features.';

  const response = await callOpenAI(prompt, systemPrompt);
  
  try {
    const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanResponse);
  } catch (error) {
    // Fallback: return empty array
    return { alternatives: [] };
  }
}

// Generate FAQ
async function generateFAQ(productName, productDetails, count) {
  const prompt = `Generate ${count} frequently asked questions (FAQs) about "${productName}" that would be useful for SEO.
${productDetails ? `Product details: ${productDetails}` : ''}
Focus on common customer concerns like features, compatibility, pricing, warranty, performance, etc.
Return the response in this exact JSON format:
{
  "faqs": [
    {"question": "Question 1?", "answer": "Answer 1"},
    {"question": "Question 2?", "answer": "Answer 2"},
    ...
  ]
}
Only return the JSON, nothing else.`;

  const systemPrompt = 'You are an SEO expert who creates relevant FAQs that help both customers and search engines.';

  const response = await callOpenAI(prompt, systemPrompt);
  
  try {
    const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanResponse);
  } catch (error) {
    // Fallback: return empty array
    return { faqs: [] };
  }
}

module.exports = {
  isConfigured,
  generateProductBlurb,
  generateProsCons,
  suggestAlternatives,
  generateFAQ
};

