import fs from 'fs';

let Vosk: any = null;
try {
    Vosk = require('vosk');
} catch (e) {
    console.error('[STT] Failed to load Vosk native module:', e);
}

// @ts-ignore
import mic from 'mic';

export class SpeechRecognitionService {
    private model: any = null;
    private micInstance: any = null;
    private isListening: boolean = false;

    constructor(modelPath: string) {
        if (!Vosk) return;
        if (!fs.existsSync(modelPath)) {
            console.warn(`[STT] Model not found at ${modelPath}. STT will be disabled.`);
            return;
        }
        try {
            this.model = new Vosk.Model(modelPath);
        } catch (e) {
            console.error('[STT] Error initializing Vosk Model:', e);
        }
    }

    public listen(onResult: (text: string) => void, onPartial?: (text: string) => void) {
        if (!this.model || !Vosk) {
            console.warn('[STT] Cannot start service: Model or Vosk missing.');
            return;
        }

        try {
            const recognizer = new Vosk.Recognizer({ model: this.model, sampleRate: 16000 });

            this.micInstance = mic({
                rate: '16000',
                channels: '1',
                debug: false,
                device: 'default'
            });

            const micInputStream = this.micInstance.getAudioStream();

            micInputStream.on('data', (data: Buffer) => {
                if (recognizer.acceptWaveform(data)) {
                    const result = recognizer.result();
                    if (result.text) {
                        onResult(result.text);
                    }
                } else if (onPartial) {
                    const partial = recognizer.partialResult();
                    if (partial.partial) {
                        onPartial(partial.partial);
                    }
                }
            });

            this.micInstance.start();
            this.isListening = true;
            console.log('[STT] Listening...');
        } catch (e) {
            console.error('[STT] Failed to start listening:', e);
        }
    }

    public stop() {
        if (this.micInstance) {
            try { this.micInstance.stop(); } catch (e) { }
        }
        this.isListening = false;
        console.log('[STT] Stopped.');
    }
}
