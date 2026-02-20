import { app, BrowserWindow, screen, ipcMain, type BrowserWindowConstructorOptions } from 'electron';
import path from 'path';
import { agentEngine } from '../core/AgentEngine';

let mainWindow: BrowserWindow | null = null;

const createAvatarWindow = () => {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    const windowOptions: BrowserWindowConstructorOptions = {
        width: 300,
        height: 300,
        x: width - 320,
        y: height - 320,
        frame: false, // Frameless for production
        transparent: true, // Transparent window
        alwaysOnTop: true,
        resizable: true,
        hasShadow: false,
        skipTaskbar: true,
        backgroundColor: '#00000000', // Fully transparent
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            backgroundThrottling: false
        }
    };

    mainWindow = new BrowserWindow(windowOptions);

    const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

    if (isDev) {
        mainWindow.center();
        mainWindow.webContents.openDevTools({ mode: 'detach' });
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Initialize Agent Engine
    agentEngine.initialize();

    // Connect Agent State to UI
    agentEngine.getStateManager().onStateChange((state) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('avatar-state-change', state);
        }
    });

    // Handle Input from Renderer or Other Sources
    ipcMain.on('user-input', (_event, text) => {
        agentEngine.handleInput(text);
    });

    // Simulate activity for first run verification
    agentEngine.simulateActivity();
};

app.whenReady().then(createAvatarWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createAvatarWindow();
    }
});
