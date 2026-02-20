import { exec } from 'child_process';

export class SpeechSynthesisService {
    private isSpeaking: boolean = false;

    public speak(text: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!text) return resolve();

            console.log(`[TTS] Speaking: ${text}`);
            this.isSpeaking = true;

            // Using PowerShell for native Windows TTS (SAPI)
            // Selecting a Female voice specifically
            const command = `PowerShell -Command "Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Female); $s.Speak('${text.replace(/'/g, "''")}')"`;

            exec(command, (error) => {
                this.isSpeaking = false;
                if (error) {
                    console.error(`[TTS] Error: ${error}`);
                    return reject(error);
                }
                resolve();
            });
        });
    }

    public getIsSpeaking(): boolean {
        return this.isSpeaking;
    }
}
