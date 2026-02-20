import { exec } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import * as os from 'os';

const execAsync = promisify(exec);

export class VoiceController extends EventEmitter {
    private isSpeaking: boolean = false;
    private platform: string;

    constructor() {
        super();
        this.platform = os.platform();
        this.init();
    }

    private init() {
        console.log('[VoiceController] Initialized');
    }

    public async speak(text: string) {
        if (this.isSpeaking) {
            console.log('[VoiceController] Already speaking, queueing or ignoring for now.');
            // Ideally queue, but for simplicity let's just proceed
        }

        this.isSpeaking = true;
        this.emit('start'); // Emit start event for avatar animation
        console.log('[VoiceController] Speaking:', text);

        try {
            if (this.platform === 'win32') {
                await this.speakWindows(text);
            } else if (this.platform === 'darwin') {
                await this.speakMac(text);
            } else {
                console.log('[VoiceController] TTS not supported on this platform yet (simulated).');
                await new Promise(resolve => setTimeout(resolve, text.length * 50));
            }
        } catch (error) {
            console.error('[VoiceController] Speak error:', error);
        } finally {
            this.isSpeaking = false;
            this.emit('end'); // Emit end event for avatar animation
        }
    }

    private async speakWindows(text: string) {
        // Miss Minutes style: Female, slightly higher pitch/rate if possible
        const rate = 1;

        // Escape single quotes for PowerShell
        const safeText = text.replace(/'/g, "''");

        // PowerShell command to use System.Speech.Synthesis
        // Selects a female voice (likely Zira on Windows)
        const command = `powershell -Command "Add-Type -AssemblyName System.speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.SelectVoiceByHints('Female'); $speak.Rate = ${rate}; $speak.Speak('${safeText}')"`;

        await execAsync(command);
    }

    private async speakMac(text: string) {
        const voice = 'Samantha';
        const safeText = text.replace(/"/g, '\\"');
        await execAsync(`say -v ${voice} "${safeText}"`);
    }
}

export const voiceController = new VoiceController();
