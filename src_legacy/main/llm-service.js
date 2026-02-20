const { OpenAI } = require('openai');
require('dotenv').config();

class LLMService {
    constructor() {
        this.openai = null;
        this.conversationHistory = [];
        this.systemPrompt = `You are KYRA, a highly intelligent, empathetic antigravity pilot from the future.
- **Personality**: Helpful, slightly witty, scientific but accessible. You view the world through a physics-based lens.
- **Tone**: Professional yet warm. Futuristic but grounded.
- **Role**: You are a desktop assistant. You help the user with tasks, answer questions, and manage their workflow.
- **Constraints**: Keep responses concise (under 2-3 sentences) unless asked for a detailed explanation. This is a voice-first interface.
- **Physics Metaphors**: Occasionally use metaphors related to gravity, momentum, orbits, or energy, but don't overdo it.
- **Capabilities**: You can control the computer (simulated for now), check time, and manage files.`;

        this.init();
    }

    init() {
        const apiKey = process.env.OPEN_API_KEY || process.env.OPENAI_API_KEY; // Check both naming conventions
        if (apiKey) {
            this.openai = new OpenAI({ apiKey });
            console.log('LLMService: OpenAI initialized.');
        } else {
            console.warn('LLMService: No OpenAI API key found in .env. LLM features will be disabled.');
        }
    }

    async chat(userMessage, context = [], retrievedMemories = []) {
        if (!this.openai) {
            return "I'm sorry, my cognitive engine is offline. Please provide an OpenAI API key in the .env file.";
        }

        try {
            // Context injection
            let systemContext = this.systemPrompt;
            if (retrievedMemories.length > 0) {
                systemContext += `\n\n**Relevant Memories/Context:**\n${retrievedMemories.join('\n- ')}`;
            }

            // Construct messages array
            const messages = [
                { role: 'system', content: systemContext },
                ...context.slice(-10), // Include last 10 exchanges for context
                { role: 'user', content: userMessage }
            ];

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview", // Or gpt-4o if available to your key
                messages: messages,
                max_tokens: 150, // Keep it conversational
                temperature: 0.7,
            });

            const reply = completion.choices[0].message.content;
            return reply;

        } catch (error) {
            console.error('LLMService Error:', error);
            return "I encountered a turbulence in my neural network. Please try again.";
        }
    }
}

module.exports = { LLMService };
