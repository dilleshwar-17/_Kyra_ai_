const { ChromaClient } = require("chromadb");
const { OpenAI } = require('openai');
require('dotenv').config();

class MemoryService {
    constructor() {
        this.client = new ChromaClient({ path: "http://localhost:8000" });
        this.collection = null;
        this.openai = null;
        this.enabled = false;

        this.init();
    }

    async init() {
        const apiKey = process.env.OPEN_API_KEY || process.env.OPENAI_API_KEY;
        if (apiKey) {
            this.openai = new OpenAI({ apiKey });
        } else {
            console.warn('MemoryService: No OpenAI API key. Memory features disabled.');
            return;
        }

        try {
            // Heartbeat check (simple way to see if server is up)
            await this.client.heartbeat();

            this.collection = await this.client.getOrCreateCollection({
                name: "kyra_memory",
                metadata: { "hnsw:space": "cosine" }
            });

            this.enabled = true;
            console.log('MemoryService: Connected to ChromaDB. Long-term memory active.');
        } catch (error) {
            console.warn('MemoryService: Could not connect to ChromaDB. Is it running? (chroma run --path ./chroma_db). Memory disabled.');
            this.enabled = false; // Fallback mode
        }
    }

    async getEmbedding(text) {
        if (!this.openai) return null;
        try {
            const response = await this.openai.embeddings.create({
                model: "text-embedding-3-small",
                input: text,
                encoding_format: "float",
            });
            return response.data[0].embedding;
        } catch (error) {
            console.error('MemoryService: Error generating embedding:', error);
            return null;
        }
    }

    async store(text, metadata = {}) {
        if (!this.enabled || !text) return;

        try {
            const embedding = await this.getEmbedding(text);
            if (!embedding) return;

            const id = Date.now().toString(); // Simple ID generation
            await this.collection.add({
                ids: [id],
                embeddings: [embedding],
                metadatas: [{ ...metadata, timestamp: Date.now() }],
                documents: [text]
            });
            console.log(`MemoryService: Stored memory: "${text.substring(0, 50)}..."`);
        } catch (error) {
            console.error('MemoryService: Store failed:', error);
        }
    }

    async retrieve(query, limit = 5) {
        if (!this.enabled || !query) return [];

        try {
            const embedding = await this.getEmbedding(query);
            if (!embedding) return [];

            const results = await this.collection.query({
                queryEmbeddings: [embedding],
                nResults: limit,
            });

            // Flatten results directly to document strings
            if (results && results.documents && results.documents.length > 0) {
                // Chroma returns strictly nested arrays: [[doc1, doc2]]
                return results.documents[0].filter(doc => doc !== null);
            }
            return [];
        } catch (error) {
            console.error('MemoryService: Retrieve failed:', error);
            return [];
        }
    }
}

module.exports = { MemoryService };
