export interface Intent {
    name: string;
    confidence: number;
    entities: Record<string, string>;
}

export class IntentClassifier {
    private intents = [
        { name: 'open_app', keywords: ['open', 'launch', 'run', 'start'] },
        { name: 'search_web', keywords: ['search', 'google', 'look up', 'find'] },
        { name: 'system_control', keywords: ['volume', 'brightness', 'lock', 'shutdown', 'restart'] },
        { name: 'greeting', keywords: ['hello', 'hi', 'hey', 'greetings'] },
        { name: 'smalltalk', keywords: ['how are you', 'who are you', 'what is your name'] }
    ];

    public classify(text: string): Intent {
        const lowerText = text.toLowerCase();

        for (const intent of this.intents) {
            if (intent.keywords.some(k => lowerText.includes(k))) {
                return {
                    name: intent.name,
                    confidence: 0.8,
                    entities: this.extractEntities(intent.name, lowerText)
                };
            }
        }

        return { name: 'fallback', confidence: 0.5, entities: {} };
    }

    private extractEntities(intentName: string, text: string): Record<string, string> {
        const entities: Record<string, string> = {};

        if (intentName === 'open_app') {
            const parts = text.split(/open|launch|run|start/);
            if (parts.length > 1) {
                entities['app_name'] = parts[1].trim();
            }
        }

        return entities;
    }
}
