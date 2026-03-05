const express = require('express');
const rateLimit = require('express-rate-limit');
const { chatStream } = require('../services/claude');

const router = express.Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'You\'re sending messages too quickly. Please wait a moment and try again.'
  }
});

router.post('/chat', chatLimiter, async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required and must be a non-empty string.' });
    }

    if (message.length > 2000) {
      return res.status(400).json({ error: 'Message must be under 2000 characters.' });
    }

    const conversationHistory = Array.isArray(history) ? history : [];

    /* SSE headers */
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    await chatStream(message.trim(), conversationHistory, res);
  } catch (error) {
    console.error('Chat endpoint error:', error.message || error);
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'We\'re having trouble connecting to our assistant. Please call Move Logistics at (210) 942-0357 for immediate help.'
      });
    }
    res.end();
  }
});

module.exports = router;
