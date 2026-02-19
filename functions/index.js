
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const Anthropic = require("@anthropic-ai/sdk");

// It's recommended to set the API key as an environment variable for security
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, 
});

exports.askClaude = onRequest({cors: true}, async (req, res) => {
  logger.info("askClaude function triggered");

  // We are allowing GET requests for simplicity of calling from the client
  // In a production app, you would likely want to use POST and handle authentication
  const prompt = req.query.prompt;

  if (!prompt) {
    logger.error("No prompt provided");
    res.status(400).send("Error: No prompt provided.");
    return;
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    
    res.status(200).send(response.content);

  } catch (error) {
    logger.error("Error calling Anthropic API:", error);
    res.status(500).send("Error processing your request.");
  }
});
