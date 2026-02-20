const EventEmitter = require('events');
const { LLMService } = require('./llm-service');
const { MemoryService } = require('./memory-service');

class AIEngine extends EventEmitter {
  constructor() {
    super();
    this.llmService = new LLMService();
    this.memoryService = new MemoryService();
    this.contextHistory = []; // Simple array to store conversation turns for LLM
  }

  async processMessage(message) {
    // 1. Retrieve Context (Long-term memory)
    const relevantMemories = await this.memoryService.retrieve(message);

    // 2. Send to LLM
    console.log('Processing message with LLM:', message);
    const responseText = await this.llmService.chat(message, this.contextHistory, relevantMemories);

    // 3. Update Short-term Context
    this.contextHistory.push({ role: 'user', content: message });
    this.contextHistory.push({ role: 'assistant', content: responseText });

    // keep history clean
    if (this.contextHistory.length > 20) {
      this.contextHistory = this.contextHistory.slice(-20);
    }

    // 4. Store in Long-term Memory (Async, don't block response)
    this.memoryService.store(message, { type: 'user_input' });
    this.memoryService.store(responseText, { type: 'kyra_response' });

    // 3. Return result format expected by Main
    return {
      text: responseText,
      action: null // We can parse actions from LLM later if needed
    };
  }
}

module.exports = { AIEngine };
