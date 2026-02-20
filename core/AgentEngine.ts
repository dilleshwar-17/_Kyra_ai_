import path from 'path';
import { app } from 'electron';
import { AvatarStateManager, AvatarState } from './AvatarStateManager';
import { SpeechSynthesisService } from '../voice/SpeechSynthesisService';
import { WakeWordService } from '../perception/WakeWordService';
import { SpeechRecognitionService } from '../voice/SpeechRecognitionService';
import { llmService } from '../services/LLMService';
import { systemTool } from '../tools/SystemTool';
import { memoryStore } from '../memory/MemoryStore';

export class AgentEngine {
    private stateManager: AvatarStateManager;
    private tts: SpeechSynthesisService;
    private wakeWordService: WakeWordService | null = null;
    private sttService: SpeechRecognitionService | null = null;
    private userName: string;
    private isBusy: boolean = false;

    constructor() {
        this.stateManager = new AvatarStateManager();
        this.tts = new SpeechSynthesisService();
        this.userName = memoryStore.getUserName();
    }

    public async initialize() {
        console.log('[KYRA Engine] Waking up...');
        this.stateManager.setState('sleep');

        // Resolve model path robustly for dev and production
        const modelPath = app.isPackaged
            ? path.join(process.resourcesPath, 'models/vosk-model-small-en-us-0.15')
            : path.join(process.cwd(), 'models/vosk-model-small-en-us-0.15');

        console.log(`[KYRA Engine] Loading STT model from: ${modelPath}`);

        // Setup STT Service
        this.sttService = new SpeechRecognitionService(modelPath);

        // Setup Wake Word (Vosk)
        try {
            this.wakeWordService = new WakeWordService(modelPath);
            this.wakeWordService.start(() => this.handleWakeWord());
        } catch (e) {
            console.error('[KYRA Engine] WakeWord service failed to start:', e);
        }

        // Simulating organic wakeup
        setTimeout(() => {
            this.stateManager.setState('idle');
            console.log('[KYRA Engine] I am awake and watching.');
        }, 2000);
    }

    public getStateManager(): AvatarStateManager {
        return this.stateManager;
    }

    private async handleWakeWord() {
        if (this.isBusy) return;
        this.isBusy = true;

        console.log('[KYRA Engine] Wake Word Detected!');

        // 1. Stop WakeWord to free mic
        this.wakeWordService?.stop();

        // 2. React
        await this.respond("Yes, I'm listening.", "listening");

        // 3. Start STT
        this.sttService?.listen(
            async (text) => {
                console.log(`[KYRA Engine] STT Result: ${text}`);
                this.sttService?.stop();
                await this.handleInput(text);

                // 4. Resume Wake Word
                this.isBusy = false;
                this.wakeWordService?.start(() => this.handleWakeWord());
            },
            (partial) => {
                console.log(`[KYRA Engine] STT Partial: ${partial}`);
                // Could update UI with partials here
            }
        );
    }

    /**
     * KYRA reacts to a user event (LUREA: Understands & Reacts)
     */
    public async handleInput(text: string) {
        console.log(`[KYRA Engine] LUREA Loop: Processing "${text}"`);
        this.stateManager.setState('thinking');

        // 1. Get Situational Response from Personality Engine
        const context: any[] = []; // Currently simple
        const response = await llmService.process(text, context);

        console.log(`[KYRA Engine] Personality: ${response.trait} | Emotion: ${response.emotion}`);

        // 2. Map to Action (if any)
        const input = text.toLowerCase();
        if (input.includes("open chrome") || input.includes("browser")) {
            await systemTool.openApp("chrome");
        } else if (input.includes("lock my pc") || input.includes("lock screen")) {
            await systemTool.lockScreen();
        }

        // 3. Respond with Personality
        await this.respond(response.text, response.emotion as AvatarState);

        // 4. Adapt (Save to history)
        memoryStore.addHistory('user', text);
        memoryStore.addHistory('kyra', response.text);
    }

    /**
     * Personal and emotional response (LUREA: Reacts & Executes)
     */
    public async respond(text: string, emotion: AvatarState = "speaking") {
        this.stateManager.setState(emotion);
        await this.tts.speak(text);
        this.stateManager.setState('idle');
    }

    public simulateActivity() {
        // Organic proactive greeting after initialization
        setTimeout(async () => {
            console.log('[KYRA Engine] Proactive greeting...');
            await this.respond(`I can feel my sensors coming online properly now. It's lovely to meet you formally, ${this.userName}. How are you feeling today?`, "happy");
        }, 8000);
    }
}

export const agentEngine = new AgentEngine();
