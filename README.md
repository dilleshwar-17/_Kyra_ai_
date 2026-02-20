# KYRA Desktop AI Assistant

A next-generation desktop AI assistant with avatar-based interactions, emotion recognition, and voice-first control.

## 🌟 Features

### Core Capabilities
- **Avatar Emotion System**: Dynamic facial expressions and emotions that react to user interactions
- **Voice-First Interaction**: Hands-free voice recognition and text-to-speech responses
- **Desktop Automation**: Control applications, windows, and system functions
- **Facial Expression Detection**: Webcam-based emotion recognition (with simulation fallback)
- **Picture-in-Picture Window**: Always-on-top compact interface
- **Global Keyboard Shortcuts**: Quick access from anywhere

### Avatar Emotions
- 😐 **Neutral**: Calm and composed
- 😊 **Happy**: Joyful and content  
- 🤩 **Excited**: Energetic and enthusiastic
- 🤔 **Thinking**: Contemplative and focused
- 😕 **Confused**: Puzzled and uncertain
- 👂 **Listening**: Attentive and focused
- 🗣️ **Speaking**: Engaged in conversation
- 😵 **Error**: Something went wrong
- 😲 **Surprised**: Amazed and taken aback
- 😴 **Sleeping**: Peaceful and restful

### Voice Commands
- "Hello KYRA" - Greet the assistant
- "What time is it?" - Get current time
- "Open Calculator" - Launch applications
- "Set a reminder for 3 PM" - Create reminders
- "Minimize all windows" - Desktop control
- "Help" - Show available commands

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- Windows 10/11 (primary target, with cross-platform support)
- Optional: Webcam for facial expression detection
- Optional: RobotJS dependencies for advanced automation

### Installation

1. **Clone and setup**:
   ```bash
   git clone <repository>
   cd KYRA_JARVIS
   npm install
   ```

2. **Test the system**:
   ```bash
   node test-kyra.js
   ```

3. **Start the application**:
   ```bash
   npm start
   ```

## 📁 Project Structure

```
KYRA_JARVIS/
├── src/
│   ├── main/
│   │   ├── main.js              # Main Electron process
│   │   ├── ai-engine.js         # NLP and reasoning engine
│   │   ├── avatar-manager.js    # Emotion and facial expression system
│   │   ├── voice-controller.js  # Voice recognition and TTS
│   │   └── desktop-automation.js # Desktop control and automation
│   └── renderer/
│       ├── index.html           # Main UI
│       ├── index.js             # Frontend logic
│       └── styles.css           # Styling and animations
├── package.json                 # Dependencies and scripts
└── README.md                   # This file
```

## 🎮 Usage

### Starting KYRA
- Run `npm start` to launch the application
- KYRA appears as a floating window in the bottom-right corner
- The avatar starts in "neutral" state

### Voice Interaction
1. **Click the microphone button** or use **Ctrl+Shift+K**
2. Speak your command when the avatar shows "listening" state
3. KYRA will process and respond with both voice and text

### Global Shortcuts
- **Ctrl+Shift+K**: Toggle voice recognition
- **Ctrl+Shift+J**: Show/hide KYRA window

### Text Interaction
- Type messages in the input field at the bottom
- Press Enter or click the send button
- KYRA responds with both text and voice

### Desktop Commands
KYRA can control your desktop through voice or text:

**Application Control**:
- "Open Notepad" / "Launch Calculator" / "Start Chrome"

**Window Management**:
- "Minimize all windows" / "Maximize current window" / "Close active window"

**System Control**:
- "Lock computer" / "Shutdown system" / "Restart computer"

## 🛠️ Technical Architecture

### Core Systems

#### 1. AI Engine (`ai-engine.js`)
- **Intent Classification**: Understands user commands and questions
- **Response Generation**: Creates contextual, intelligent responses
- **Context Management**: Maintains conversation history and user preferences
- **Learning System**: Improves responses over time

#### 2. Avatar Manager (`avatar-manager.js`)
- **Emotion States**: 10 distinct emotional states with animations
- **Facial Expression Detection**: Real webcam input or simulated emotions
- **Animation System**: Smooth transitions between emotional states
- **Color Schemes**: Dynamic color changes based on current emotion

#### 3. Voice Controller (`voice-controller.js`)
- **Speech Recognition**: Cross-platform voice input
- **Text-to-Speech**: Natural voice responses
- **Wake Word Detection**: Ready for "Hey KYRA" implementation
- **Audio Processing**: Noise reduction and voice activity detection

#### 4. Desktop Automation (`desktop-automation.js`)
- **Application Launching**: Finds and starts applications
- **Window Management**: Minimize, maximize, close, switch windows
- **Keyboard Shortcuts**: Execute complex key combinations
- **System Control**: Shutdown, restart, lock, sleep functions

#### 5. Renderer (`src/renderer/`)
- **Modern UI**: Clean, responsive interface with animations
- **Real-time Updates**: Live emotion changes and conversation flow
- **Cross-platform Styling**: Works on Windows, macOS, and Linux
- **Accessibility**: Keyboard navigation and screen reader support

### Emotion System Details

The avatar uses a sophisticated emotion mapping system:

1. **Facial Expression Analysis**:
   - Brightness detection (happy = brighter, sad = darker)
   - Facial symmetry (confused = less symmetric)
   - Eye and mouth detection

2. **Emotion Mapping**:
   ```
   Detected Expression → Avatar Emotion
   Happy → Happy
   Surprised → Surprised
   Confused → Confused
   Neutral → Neutral
   [etc.]
   ```

3. **Animation States**:
   - **Pulse**: Gentle breathing effect
   - **Bounce**: Energetic jumping
   - **Shake**: Confusion or error states
   - **Talk**: Speaking animation
   - **Sleep**: Resting state

## 🔧 Configuration

### Emotion Sensitivity
Adjust facial expression detection confidence in `avatar-manager.js`:
```javascript
if (confidence > 0.6) { // Change this threshold
    this.setEmotion(mappedEmotion);
}
```

### Voice Settings
Configure voice preferences in `voice-controller.js`:
```javascript
utterance.rate = 0.9;    // Speech rate
utterance.pitch = 1.0;   // Voice pitch
utterance.volume = 0.8;  // Volume level
```

### Window Behavior
Modify window positioning in `main.js`:
```javascript
const margin = 50;       // Distance from screen edges
const x = width - 400 - margin;  // Window width
const y = height - 500 - margin; // Window height
```

## 🚨 Dependencies

### Core Dependencies
- `electron`: Desktop application framework
- `electron-store`: Data persistence
- `express`: Web server (for future web integration)
- `socket.io`: Real-time communication

### Optional Dependencies
- `opencv4nodejs`: Real facial expression detection
- `robotjs`: Advanced desktop automation
- `node-pty`: Terminal emulation

### Graceful Degradation
KYRA is designed to work even without optional dependencies:
- **No OpenCV**: Uses emotion simulation
- **No RobotJS**: Falls back to system commands
- **No node-pty**: Uses basic command execution

## 🐛 Troubleshooting

### Common Issues

**Voice Recognition Not Working**:
- Check microphone permissions
- Verify microphone is not muted
- Try running in simulation mode

**Avatar Not Changing Emotions**:
- Check webcam permissions (if using real detection)
- Verify emotion simulation is running
- Check console for errors

**Desktop Automation Failing**:
- Ensure RobotJS is installed (optional)
- Try basic commands first
- Check system permissions

**Window Not Appearing**:
- Check if antivirus is blocking the app
- Verify Electron is properly installed
- Try running as administrator

### Debug Mode
Enable detailed logging by setting:
```javascript
process.env.DEBUG = 'kyra:*';
```

## 🔮 Future Enhancements

### Planned Features
- **Wake Word Detection**: "Hey KYRA" activation
- **Multi-language Support**: International voice recognition
- **Plugin System**: Extensible command architecture
- **Cloud Integration**: Enhanced AI capabilities
- **Mobile Companion**: Smartphone app integration
- **Gesture Control**: Hand gesture recognition

### Advanced Automation
- **Smart Home Integration**: Control IoT devices
- **Workflow Automation**: Complex task sequences
- **Screen Understanding**: OCR and UI element detection
- **Predictive Actions**: AI-powered suggestions

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

1. **Additional Emotion States**: Expand the emotion catalog
2. **Voice Recognition**: Improve accuracy and add languages  
3. **Desktop Integration**: More applications and platforms
4. **UI/UX**: Enhance the visual design and animations
5. **Performance**: Optimize for lower-end hardware

### Development Setup
```bash
npm run dev          # Start in development mode
npm test             # Run tests
npm run build        # Build for distribution
```

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- OpenCV community for computer vision libraries
- Electron team for the desktop framework
- RobotJS contributors for automation capabilities
- The open-source community for various dependencies

---

**KYRA** - Your intelligent desktop companion, always ready to help! 🚀

For support, questions, or feature requests, please open an issue on the project repository.