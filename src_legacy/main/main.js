const { app, BrowserWindow, ipcMain, systemPreferences, globalShortcut } = require('electron');
require('dotenv').config();
const path = require('path');
const { autoUpdater } = (() => {
  try {
    return require('electron-updater');
  } catch (e) {
    console.log('electron-updater not found, auto-updates disabled');
    return { autoUpdater: null };
  }
})();
const { VoiceService } = require('./voice-service');
const { DesktopAutomation } = require('./desktop-automation');
const { AvatarManager } = require('./avatar-manager');
const { AIEngine } = require('./ai-engine');

let mainWindow;
let voiceService;
let desktopAutomation;
let avatarManager;
let aiEngine;

class KYRAMain {
  constructor() {
    this.isQuitting = false;
  }

  createWindow() {
    // Create the main window - always on top, no frame, picture-in-picture style
    mainWindow = new BrowserWindow({
      width: 500, // Increased size for physics room
      height: 600,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000', // Explicit transparent background
      alwaysOnTop: true,
      skipTaskbar: false,
      resizable: false, // Fixed size for physics simulation consistency
      hasShadow: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
        webSecurity: false
      }
    });

    // Load the app
    mainWindow.loadFile(path.join(__dirname, '../renderer', 'index.html'));

    // Initialize subsystems
    this.initializeSubsystems();

    // Set up IPC handlers
    this.setupIPC();

    // Handle window events
    mainWindow.on('close', (event) => {
      if (!this.isQuitting) {
        event.preventDefault();
        mainWindow.hide();
      }
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    // Ignore mouse events for transparency (click-through) by default
    // We will toggle this from the renderer when hovering the avatar
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
  }

  // ... initializeSubsystems() remains same ...
  initializeSubsystems() {
    try {
      // Initialize AI Engine
      aiEngine = new AIEngine();

      // Initialize Voice Service
      voiceService = new VoiceService();

      // Initialize Avatar Manager
      avatarManager = new AvatarManager();
      avatarManager.on('emotion-changed', (emotion) => {
        if (mainWindow) mainWindow.webContents.send('avatar-emotion', emotion);
      });

      // Initialize Desktop Automation
      desktopAutomation = new DesktopAutomation();

      console.log('KYRA subsystems initialized successfully');
    } catch (error) {
      console.error('Error initializing KYRA subsystems:', error);
    }
  }

  setupIPC() {
    // Mouse event handling for click-through
    ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) {
        win.setIgnoreMouseEvents(ignore, options);
      }
    });

    // Voice Interaction Chain
    ipcMain.handle('audio-buffer', async (event, buffer) => {
      try {
        // 1. Save buffer to temp file
        const tempPath = path.join(app.getPath('temp'), `kyra_input_${Date.now()}.wav`);
        const nodeBuffer = Buffer.from(buffer); // Ensure it's a Node buffer
        require('fs').writeFileSync(tempPath, nodeBuffer);

        // 2. Transcribe
        const text = await voiceService.transcribe(tempPath);
        if (!text) return { success: false, error: 'Transcription failed' };

        // 3. Process with Brain
        const aiResponse = await aiEngine.processMessage(text);
        const replyText = aiResponse.text; // "Hello there."

        // 4. Synthesize Voice
        const audioData = await voiceService.synthesize(replyText);

        // 5. Send Audio Back to Renderer
        if (audioData) {
          // Return audio as base64 string or buffer
          // Easier to return buffer to renderer
          return { success: true, audio: audioData, text: replyText, userText: text };
        }

        return { success: true, text: replyText, userText: text }; // Text only if TTS fails
      } catch (error) {
        console.error('IPC audio-buffer error:', error);
        return { success: false, error: error.message };
      }
    });

    // Avatar control
    ipcMain.handle('set-avatar-emotion', async (event, emotion) => {
      avatarManager.setEmotion(emotion);
      return { success: true };
    });

    // AI chat
    ipcMain.handle('send-message', async (event, message) => {
      return await this.handleMessage(message);
    });

    // Desktop automation
    ipcMain.handle('execute-command', async (event, command) => {
      return await desktopAutomation.executeCommand(command);
    });

    // App control
    ipcMain.handle('minimize-window', () => {
      if (mainWindow) mainWindow.minimize();
    });

    ipcMain.handle('close-app', () => {
      this.isQuitting = true;
      app.quit();
    });

    // System info
    ipcMain.handle('get-system-info', () => {
      return {
        platform: process.platform,
        version: app.getVersion(),
        uptime: process.uptime()
      };
    });

    // Window dragging
    ipcMain.on('window-move', (event, { x, y }) => {
      if (mainWindow) {
        mainWindow.setPosition(x, y);
      }
    });
  }

  // Removed keepWindowOnTop to allow free movement interaction
  keepWindowOnTop() {
    // no-op, relying on alwaysOnTop: true in config
  }

  setupGlobalShortcuts() {
    // Global shortcut to toggle voice recognition
    globalShortcut.register('CommandOrControl+Shift+K', async () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.webContents.send('toggle-voice-request');
      }
    });

    // Global shortcut to show/hide KYRA
    globalShortcut.register('CommandOrControl+Shift+J', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });
  }
}

const kyra = new KYRAMain();

// App event handlers
app.whenReady().then(() => {
  kyra.createWindow();
  kyra.setupGlobalShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      kyra.createWindow();
    }
  });
});

app.on('before-quit', () => {
  kyra.isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Auto-updater
// autoUpdater.checkForUpdatesAndNotify();

// Handle security restrictions
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});