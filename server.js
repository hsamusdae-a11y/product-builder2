
require('dotenv').config();
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const cors = require('cors');

const app = express();
const port = 3000;

// Ensure the API key is loaded from .env
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('Error: ANTHROPIC_API_KEY is not set in the .env file.');
  process.exit(1);
}

const anthropic = new Anthropic({
  apiKey: apiKey,
});

// Enable CORS to allow requests from the frontend
app.use(cors());
app.use(express.json());

// Define the proxy endpoint
app.post('/api/claude', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    console.log('Received prompt. Calling Claude AI...');
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    console.log('Successfully received response from Claude AI.');
    res.json(response);
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    res.status(500).json({ error: 'Failed to get response from Claude AI' });
  }
});

app.listen(port, () => {
  console.log(`Proxy server listening at http://localhost:${port}`);
});

