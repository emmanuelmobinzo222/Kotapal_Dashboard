# AI Assistant Setup Guide

## Overview

The AI Assistant feature has been integrated into Kota Smart Product Platform with the following capabilities:

1. **Generate Product Blurbs** - Create engaging product descriptions
2. **Auto-Write Pros and Cons** - Get balanced product analysis
3. **Suggest Product Alternatives** - Find better alternatives
4. **AI FAQ Builder** - Generate SEO-friendly FAQs

## Setup

### 1. Get OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key (you won't be able to see it again)

### 2. Configure Environment Variables

Add the OpenAI API key to your `.env` file:

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 3. Install Dependencies

The AI service uses `axios` which is already included in the project. No additional installation needed.

### 4. Start the Server

```bash
npm start
```

Or if using the startup scripts:

```bash
# Windows
start.bat

# Linux/Mac
./start.sh
```

## Usage

### Access AI Assistant

1. Log in to your Kota account
2. Navigate to "AI Assistant" from the sidebar
3. Use any of the four AI features:

#### Generate Product Blurbs
- Enter product name (required)
- Add product details (optional)
- Select tone: Professional, Casual, Friendly, or Persuasive
- Click "Generate Blurb"
- Copy the generated content

#### Auto-Write Pros and Cons
- Enter product name (required)
- Add product details (optional)
- Click "Generate Pros & Cons"
- Review the AI-generated pros and cons
- Copy to use in your content

#### Suggest Product Alternatives
- Enter current product name (required)
- Optionally specify budget range
- Click "Suggest Alternatives"
- Review 3 recommended alternatives with reasons and price ranges

#### AI FAQ Builder
- Enter product name (required)
- Add product details (optional)
- Select number of FAQs (3-10)
- Click "Generate FAQ"
- Get SEO-optimized Q&A pairs
- Copy individual FAQs or all at once

## API Endpoints

### Generate Product Blurb
```
POST /api/ai/generate-blurb
Authorization: Bearer <token>
Body:
{
  "productName": "string (required)",
  "productDetails": "string (optional)",
  "tone": "professional|casual|friendly|persuasive"
}
```

### Generate Pros and Cons
```
POST /api/ai/generate-pros-cons
Authorization: Bearer <token>
Body:
{
  "productName": "string (required)",
  "productDetails": "string (optional)"
}
```

### Suggest Alternatives
```
POST /api/ai/suggest-alternatives
Authorization: Bearer <token>
Body:
{
  "productName": "string (required)",
  "budget": "string (optional)"
}
```

### Generate FAQ
```
POST /api/ai/generate-faq
Authorization: Bearer <token>
Body:
{
  "productName": "string (required)",
  "productDetails": "string (optional)",
  "count": 5
}
```

## Troubleshooting

### Error: "OpenAI API key not configured"

- Make sure you've added `OPENAI_API_KEY` to your `.env` file
- Restart your server after adding the environment variable

### Error: "Failed to generate content"

- Check your OpenAI API key is valid
- Verify you have credits in your OpenAI account
- Check network connectivity
- Review server logs for detailed error messages

### API Rate Limits

OpenAI has rate limits on their API. If you hit rate limits:
- Wait a few minutes and try again
- Consider upgrading your OpenAI plan
- Implement client-side caching for frequently used content

## Best Practices

1. **Provide Good Context**: The more product details you provide, the better the AI output
2. **Review AI Content**: Always review and edit AI-generated content before publishing
3. **Use Suitable Tones**: Match the tone to your brand and audience
4. **Balance FAQs**: Include various types of questions for better SEO
5. **Iterate**: Try different phrasings if initial results aren't satisfactory

## Cost Considerations

OpenAI charges based on token usage. Here's a rough estimate:
- Product Blurb: ~$0.01-0.02 per generation
- Pros/Cons: ~$0.01-0.02 per generation
- Alternatives: ~$0.01-0.02 per generation
- FAQ (5 questions): ~$0.02-0.04 per generation

Monitor your OpenAI usage dashboard to track costs.

## Features

- ✅ Secure API authentication
- ✅ Error handling and validation
- ✅ Responsive UI design
- ✅ Copy to clipboard functionality
- ✅ Real-time generation
- ✅ Multiple content types
- ✅ SEO-optimized FAQs

## Future Enhancements

- Content history and templates
- Batch generation for multiple products
- Custom AI prompts
- Integration with SmartBlocks
- Export to various formats

