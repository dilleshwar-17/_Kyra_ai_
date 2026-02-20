import path from 'path';
import fs from 'fs';

let Vosk: any = null;
try {
    Vosk = require('vosk');
} catch (e) {
    console.error('[WakeWord] Failed to load Vosk native module:', e);
}

// @ts-ignore
import mic from 'mic';

export class WakeWordService {
    private model: any = null;
    private recognizer: any = null;
    private micInstance: any = null;
    private isListening: boolean = false;
    private wakeWord: string = 'kyra';

    constructor(modelPath: string) {
        if (!Vosk) {
            console.warn('[WakeWord] Vosk not loaded. Service disabled.');
            return;
        }
        if (!fs.existsSync(modelPath)) {
            console.error(`[WakeWord] Model path not found: ${modelPath}`);
            return;
        }
        try {
            this.model = new Vosk.Model(modelPath);
        } catch (e) {
            console.error('[WakeWord] Error initializing Vosk Model:', e);
        }
    }

    public start(onWakeWord: () => void) {
        if (!this.model || !Vosk) {
            console.warn('[WakeWord] Cannot start service: Model or Vosk missing.');
            return;
        }

        try {
            this.recognizer = new Vosk.Recognizer({ model: this.model, sampleRate: 16000 });
            this.recognizer.setWords(true);

            this.micInstance = mic({
                rate: '16000',
                channels: '1',
                debug: false,
                device: 'default'
            });

            const micInputStream = this.micInstance.getAudioStream();

            micInputStream.on('data', (data: Buffer) => {
                if (this.recognizer?.acceptWaveform(data)) {
                    const result = this.recognizer.result();
                    if (result.text && result.text.includes(this.wakeWord)) {
                        console.log(`[WakeWord] Triggered: ${result.text}`);
                        onWakeWord();
                    }
                } else {
                    const partial = this.recognizer?.partialResult();
                    if (partial?.partial && partial.partial.includes(this.wakeWord)) {
                        console.log(`[WakeWord] Partial trigger: ${partial.partial}`);
                        onWakeWord();
                        this.recognizer?.reset();
                    }
                }
            });

            micInputStream.on('error', (err: any) => {
                console.error(`[WakeWord] Mic error: ${err}`);
            });

            this.micInstance.start();
            this.isListening = true;
            console.log('[WakeWord] Service started...');
        } catch (e) {
            console.error('[WakeWord] Failed to start service:', e);
        }
    }

    public stop() {
        if (this.micInstance) {
            try { this.micInstance.stop(); } catch (e) { }
        }
        this.isListening = false;
        console.log('[WakeWord] Service stopped.');
    }
}
