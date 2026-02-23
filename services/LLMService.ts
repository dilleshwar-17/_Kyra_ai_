export type PersonalityTrait = 'Professional' | 'Friendly' | 'Empathetic' | 'Witty' | 'Alert';

export interface LLMResponse {
    text: string;
    emotion: string;
    trait: PersonalityTrait;
    action?: string;
    parameters?: any;
}

export class LLMService {
    /**
     * Processes input through the Situational Personality Engine
     */
    public async process(input: string, context: any[]): Promise<LLMResponse> {
        console.log(`[LLMService] Thinking in "${this.determineTrait(input)}" mode...`);

        const lowerInput = input.toLowerCase();

        // Professional Trait (Task-oriented)
        if (lowerInput.includes('open') || lowerInput.includes('launch') || lowerInput.includes('app')) {
            return {
                text: "I'm on it. Opening that app for you now.",
                emotion: "happy",
                trait: "Professional"
            };
        }

        // Empathetic Trait (Emotional cues)
        if (lowerInput.includes('bad') || lowerInput.includes('tired') || lowerInput.includes('sad')) {
            return {
                text: "I'm sorry to hear that. I'm here for you if you need anything at all.",
                emotion: "sad", // Mirroring/Empathetic state
                trait: "Empathetic"
            };
        }

        // Friendly Trait (General chat)
        if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('how are you')) {
            return {
                text: "Hello! It's always a pleasure to see you. I'm feeling great and ready to help.",
                emotion: "happy",
                trait: "Friendly"
            };
        }

        // Witty Trait (Small talk/Fun)
        if (lowerInput.includes('joke') || lowerInput.includes('funny')) {
            return {
                text: "Why did the computer go to the doctor? Because it had a virus! ... I'll stick to my day job.",
                emotion: "happy",
                trait: "Witty"
            };
        }

        // Default: Thoughtful fallback
        return {
            text: "I'm processing that. I'm a young girl who is always learning more about how to assist you best.",
            emotion: "thinking",
            trait: "Friendly"
        };
    }

    private determineTrait(input: string): PersonalityTrait {
        const lowerInput = input.toLowerCase();
        if (lowerInput.includes('open') || lowerInput.includes('app')) return 'Professional';
        if (lowerInput.includes('bad') || lowerInput.includes('sad')) return 'Empathetic';
        if (lowerInput.includes('joke')) return 'Witty';
        return 'Friendly';
    }
}

export const llmService = new LLMService();
