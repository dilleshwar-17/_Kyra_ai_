const { OpenAI } = require('openai');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
require('dotenv').config();

class VoiceService {
    constructor() {
        this.openai = null;
        this.elevenLabsKey = process.env.ELEVENLABS_API_KEY;
        this.voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Default voice (Rachel)

        this.init();
    }

    init() {
        const apiKey = process.env.OPEN_API_KEY || process.env.OPENAI_API_KEY;
        if (apiKey) {
            this.openai = new OpenAI({ apiKey });
        }
    }

    // STT: Speech to Text (Whisper)
    // Expects a buffer or filepath. For MVP we might save buffer to temp file.
    async transcribe(audioPath) {
        if (!this.openai) return null;

        try {
            console.log('VoiceService: Transcribing audio...');
            const transcription = await this.openai.audio.transcriptions.create({
                file: fs.createReadStream(audioPath),
                model: "whisper-1",
            });
            console.log(`VoiceService: Heard "${transcription.text}"`);
            return transcription.text;
        } catch (error) {
            console.error('VoiceService: Transcription failed:', error);
            return null;
        }
    }

    // TTS: Text to Speech (ElevenLabs)
    async synthesize(text) {
        if (!this.elevenLabsKey) {
            console.warn('VoiceService: No ElevenLabs key.');
            return null;
        }

        try {
            console.log('VoiceService: Synthesizing speech...');
            const response = await axios({
                method: 'post',
                url: `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`,
                data: {
                    text: text,
                    model_id: "eleven_monolingual_v1",
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75
                    }
                },
                headers: {
                    'Accept': 'audio/mpeg',
                    'xi-api-key': this.elevenLabsKey,
                    'Content-Type': 'application/json'
                },
                responseType: 'arraybuffer'
            });

            console.log('VoiceService: Speech generated.');
            return response.data; // Returns audio buffer
        } catch (error) {
            console.error('VoiceService: TTS failed:', error.response ? error.response.status : error);
            return null;
        }
    }
}

module.exports = { VoiceService };
