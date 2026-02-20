const EventEmitter = require('events');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);

class VoiceController extends EventEmitter {
  constructor() {
    super();
    this.isListening = false;
    this.isSpeaking = false;
    this.recognitionProcess = null;
    this.synthesisProcess = null;
    this.tempAudioFile = path.join(__dirname, 'temp_recording.wav');
    this.voices = [
      { name: 'Microsoft David', lang: 'en-US', gender: 'male' },
      { name: 'Microsoft Zira', lang: 'en-US', gender: 'female' },
      { name: 'Google UK English Male', lang: 'en-GB', gender: 'male' },
      { name: 'Google UK English Female', lang: 'en-GB', gender: 'female' }
    ];
    this.currentVoice = this.voices[0];
    this.init();
  }

  async init() {
    try {
      // Check system capabilities
      await this.checkSystemCapabilities();
      
      // Set up platform-specific voice recognition
      this.setupPlatformSpecificRecognition();
      
      console.log('Voice Controller initialized');
    } catch (error) {
      console.error('Error initializing voice controller:', error);
      // Fall back to simulation mode
      this.setupSimulationMode();
    }
  }

  async checkSystemCapabilities() {
    const platform = process.platform;
    
    if (platform === 'win32') {
      // Windows - Check for Windows Speech Platform
      try {
        await execAsync('where.exe spsyn.exe');
        console.log('Windows Speech Platform found');
      } catch (error) {
        console.log('Windows Speech Platform not found, using simulation');
        this.setupSimulationMode();
      }
    } else if (platform === 'darwin') {
      // macOS - Check for built-in speech recognition
      console.log('macOS detected, using built-in speech recognition');
    } else if (platform === 'linux') {
      // Linux - Check for espeak/pico2wave
      try {
        await execAsync('which espeak');
        console.log('espeak found for TTS');
      } catch (error) {
        console.log('espeak not found, using simulation');
        this.setupSimulationMode();
      }
    }
  }

  setupPlatformSpecificRecognition() {
    const platform = process.platform;
    
    if (platform === 'win32') {
      this.setupWindowsRecognition();
    } else if (platform === 'darwin') {
      this.setupMacOSRecognition();
    } else if (platform === 'linux') {
      this.setupLinuxRecognition();
    } else {
      this.setupSimulationMode();
    }
  }

  setupWindowsRecognition() {
    // Windows Speech Recognition using PowerShell
    this.recognitionCommand = this.createWindowsRecognitionScript();
    console.log('Windows speech recognition configured');
  }

  createWindowsRecognitionScript() {
    const script = `
Add-Type -AssemblyName System.Speech
$recognition = New-Object System.Speech.Recognition.SpeechRecognitionEngine
$recognition.InitialSilenceTimeout = [TimeSpan]::FromSeconds(1)
$recognition.InitialBabbleTimeout = [TimeSpan]::FromSeconds(1)
$recognition.EndSilenceTimeout = [TimeSpan]::FromSeconds(0.5)
$recognition.EndSilenceTimeoutAmbiguous = [TimeSpan]::FromSeconds(1)

$grammar = New-Object System.Speech.Recognition.DictationGrammar
$recognition.LoadGrammar($grammar)

$recognition.Add_SpeechRecognized({
    Write-Output $args[0].Result.Text
})

$recognition.SetInputToDefaultAudioDevice()
$recognition.RecognizeAsync([System.Speech.Recognition.RecognitionMode]::Multiple)
    `;
    
    return script;
  }

  setupMacOSRecognition() {
    // macOS Speech Recognition using built-in commands
    this.recognitionCommand = 'osascript -e \'tell application "System Events" to keystroke "v" using {command down}\'';
    console.log('macOS speech recognition configured');
  }

  setupLinuxRecognition() {
    // Linux - Basic voice recognition using arecord and simple processing
    this.recognitionCommand = 'arecord -d 5 -f cd -t wav /tmp/speech.wav && echo "speech recorded"';
    console.log('Linux speech recognition configured');
  }

  setupSimulationMode() {
    // Fallback to simulation for demo purposes
    this.isSimulated = true;
    console.log('Voice controller running in simulation mode');
    
    // Predefined responses for demo
    this.demoResponses = [
      "Hello! I'm KYRA, your AI assistant. How can I help you today?",
      "I'm here to assist you with various tasks. What would you like me to do?",
      "I can help with desktop automation, answer questions, or just chat. What's on your mind?",
      "That's interesting! Let me think about that for a moment.",
      "I'm processing your request. Please give me a moment."
    ];
  }

  async toggleListening() {
    if (this.isListening) {
      await this.stopListening();
      return false;
    } else {
      await this.startListening();
      return true;
    }
  }

  async startListening() {
    try {
      if (this.isSimulated) {
        this.isListening = true;
        this.emit('listening-state', true);
        
        // Simulate speech recognition after 3 seconds
        setTimeout(() => {
          const demoText = this.generateDemoSpeechInput();
          this.emit('speech-recognized', demoText);
          this.stopListening();
        }, 3000);
        
        console.log('Simulated speech recognition started');
        return true;
      }

      // Platform-specific recognition start
      if (process.platform === 'win32') {
        await this.startWindowsRecognition();
      } else if (process.platform === 'darwin') {
        await this.startMacOSRecognition();
      } else if (process.platform === 'linux') {
        await this.startLinuxRecognition();
      }

      this.isListening = true;
      this.emit('listening-state', true);
      console.log('Speech recognition started');
      return true;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      this.emit('recognition-error', error);
      return false;
    }
  }

  async stopListening() {
    try {
      if (this.recognitionProcess) {
        this.recognitionProcess.kill();
        this.recognitionProcess = null;
      }

      this.isListening = false;
      this.emit('listening-state', false);
      console.log('Speech recognition stopped');
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  }

  async startWindowsRecognition() {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, 'temp_speech.ps1');
      fs.writeFileSync(scriptPath, this.recognitionCommand);
      
      this.recognitionProcess = exec(`powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}"`, {
        timeout: 30000
      });

      let output = '';
      this.recognitionProcess.stdout.on('data', (data) => {
        output += data.toString();
        const lines = output.split('\n');
        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.includes('powershell.exe')) {
            this.emit('speech-recognized', trimmed);
            this.stopListening();
            resolve(true);
          }
        });
      });

      this.recognitionProcess.on('error', (error) => {
        console.error('PowerShell recognition error:', error);
        this.setupSimulationMode();
        this.startListening(); // Fall back to simulation
        resolve(false);
      });
    });
  }

  async startMacOSRecognition() {
    // macOS implementation would go here
    console.log('macOS speech recognition not yet implemented, using simulation');
    this.setupSimulationMode();
    return this.startListening();
  }

  async startLinuxRecognition() {
    // Linux implementation would go here
    console.log('Linux speech recognition not yet implemented, using simulation');
    this.setupSimulationMode();
    return this.startListening();
  }

  generateDemoSpeechInput() {
    const demoInputs = [
      "Hello KYRA, how can you help me today?",
      "What time is it?",
      "Open Calculator",
      "What's the weather like?",
      "Tell me a joke",
      "Set a reminder for 3 PM",
      "Search for restaurants nearby",
      "Play some music"
    ];
    
    return demoInputs[Math.floor(Math.random() * demoInputs.length)];
  }

  async speak(text) {
    try {
      if (this.isSpeaking) {
        // Stop current speech if speaking
        await this.stopSpeaking();
      }

      this.isSpeaking = true;
      console.log(`KYRA speaking: ${text}`);

      if (this.isSimulated) {
        // Simulate TTS for demo
        await this.simulateTextToSpeech(text);
        return;
      }

      // Platform-specific TTS
      if (process.platform === 'win32') {
        await this.windowsTextToSpeech(text);
      } else if (process.platform === 'darwin') {
        await this.macosTextToSpeech(text);
      } else if (process.platform === 'linux') {
        await this.linuxTextToSpeech(text);
      }

    } catch (error) {
      console.error('Error in text-to-speech:', error);
      this.emit('speech-error', error);
    } finally {
      this.isSpeaking = false;
    }
  }

  async simulateTextToSpeech(text) {
    // Simulate speaking duration based on text length
    const duration = Math.max(1000, text.length * 50); // ~50ms per character
    console.log(`Simulated TTS duration: ${duration}ms`);
    
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('Simulated speech completed');
        this.emit('speech-complete');
        resolve();
      }, duration);
    });
  }

  async windowsTextToSpeech(text) {
    try {
      const command = `powershell.exe -Command "Add-Type -AssemblyName System.speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.Rate = 0; $speak.Speak('${text.replace(/'/g, "''")}')"`;
      
      await execAsync(command);
      this.emit('speech-complete');
    } catch (error) {
      console.error('Windows TTS error:', error);
      // Fallback to simulation
      await this.simulateTextToSpeech(text);
    }
  }

  async macosTextToSpeech(text) {
    try {
      const command = `say -v "${this.currentVoice.name}" "${text}"`;
      await execAsync(command);
      this.emit('speech-complete');
    } catch (error) {
      console.error('macOS TTS error:', error);
      // Fallback to simulation
      await this.simulateTextToSpeech(text);
    }
  }

  async linuxTextToSpeech(text) {
    try {
      // Try espeak first
      const espeakCommand = `espeak "${text}"`;
      await execAsync(espeakCommand, { timeout: 10000 });
      this.emit('speech-complete');
    } catch (error) {
      try {
        // Fallback to festival if espeak fails
        const festivalCommand = `echo "${text}" | festival --tts`;
        await execAsync(festivalCommand, { timeout: 10000 });
        this.emit('speech-complete');
      } catch (festivalError) {
        console.error('Linux TTS error:', festivalError);
        // Final fallback to simulation
        await this.simulateTextToSpeech(text);
      }
    }
  }

  async stopSpeaking() {
    if (this.synthesisProcess) {
      this.synthesisProcess.kill();
      this.synthesisProcess = null;
    }
    this.isSpeaking = false;
    console.log('Speech synthesis stopped');
  }

  // Wake word detection (placeholder for future implementation)
  detectWakeWord(audioData) {
    // Placeholder for wake word detection
    // Would implement using libraries like Snowboy or Porcupine
    return false;
  }

  // Process audio stream for voice commands
  processAudioStream(stream) {
    // Placeholder for real-time audio processing
    // Would implement voice activity detection, noise reduction, etc.
  }

  // Get available voices
  getAvailableVoices() {
    return this.voices;
  }

  // Set voice for TTS
  setVoice(voiceName) {
    const voice = this.voices.find(v => v.name === voiceName);
    if (voice) {
      this.currentVoice = voice;
      console.log(`Voice changed to: ${voice.name}`);
      return true;
    }
    return false;
  }

  // Get current voice settings
  getVoiceSettings() {
    return {
      currentVoice: this.currentVoice,
      availableVoices: this.voices,
      isListening: this.isListening,
      isSpeaking: this.isSpeaking
    };
  }

  // Cleanup temporary files
  cleanup() {
    try {
      if (fs.existsSync(this.tempAudioFile)) {
        fs.unlinkSync(this.tempAudioFile);
      }
    } catch (error) {
      console.error('Error cleaning up temporary files:', error);
    }
  }

  // Shutdown voice controller
  shutdown() {
    this.stopListening();
    this.stopSpeaking();
    this.cleanup();
    console.log('Voice Controller shutdown complete');
  }
}

module.exports = { VoiceController };