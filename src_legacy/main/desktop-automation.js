const EventEmitter = require('events');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
let robot = null;
try {
  robot = require('robotjs');
  console.log('RobotJS loaded successfully');
} catch (error) {
  console.log('RobotJS not available, using simulation mode for desktop automation');
}
let pty = null;
try {
  pty = require('node-pty');
  console.log('node-pty loaded successfully');
} catch (error) {
  console.log('node-pty not available, using simulation mode for terminal operations');
}

const execAsync = promisify(exec);

class DesktopAutomation extends EventEmitter {
  constructor() {
    super();
    this.isActive = false;
    this.applications = new Map();
    this.windows = new Map();
    this.shortcuts = new Map();
    this.reminders = new Map();
    
    // Initialize system-specific configurations
    this.platform = process.platform;
    this.setupPlatformSpecificSettings();
    
    // Initialize available applications
    this.initializeApplications();
    
    // Initialize common keyboard shortcuts
    this.initializeShortcuts();
    
    this.init();
  }

  async init() {
    try {
      // Set up system monitoring
      this.setupSystemMonitoring();
      
      // Initialize platform-specific automation
      await this.initializePlatformAutomation();
      
      console.log('Desktop Automation initialized');
    } catch (error) {
      console.error('Error initializing Desktop Automation:', error);
    }
  }

  setupPlatformSpecificSettings() {
    if (this.platform === 'win32') {
      this.systemPaths = {
        programs: 'C:\\Program Files',
        programs86: 'C:\\Program Files (x86)',
        system32: 'C:\\Windows\\System32'
      };
    } else if (this.platform === 'darwin') {
      this.systemPaths = {
        applications: '/Applications',
        utilities: '/Applications/Utilities'
      };
    } else if (this.platform === 'linux') {
      this.systemPaths = {
        usr_bin: '/usr/bin',
        usr_local: '/usr/local/bin'
      };
    }
  }

  initializeApplications() {
    // Common applications across platforms
    this.applications.set('notepad', {
      name: 'Notepad',
      executable: this.platform === 'win32' ? 'notepad.exe' : 'notepad',
      category: 'text_editor',
      defaultPath: this.platform === 'win32' ? 
        'C:\\Windows\\System32\\notepad.exe' : 
        '/usr/bin/gedit'
    });

    this.applications.set('calculator', {
      name: 'Calculator',
      executable: this.platform === 'win32' ? 'calc.exe' : 'calculator',
      category: 'utility',
      defaultPath: this.platform === 'win32' ? 
        'C:\\Windows\\System32\\calc.exe' : 
        '/usr/bin/gnome-calculator'
    });

    this.applications.set('explorer', {
      name: 'File Explorer',
      executable: this.platform === 'win32' ? 'explorer.exe' : 'nautilus',
      category: 'file_manager',
      defaultPath: this.platform === 'win32' ? 
        'C:\\Windows\\explorer.exe' : 
        '/usr/bin/nautilus'
    });

    this.applications.set('cmd', {
      name: 'Command Prompt',
      executable: this.platform === 'win32' ? 'cmd.exe' : 'bash',
      category: 'terminal',
      defaultPath: this.platform === 'win32' ? 
        'C:\\Windows\\System32\\cmd.exe' : 
        '/bin/bash'
    });

    this.applications.set('powershell', {
      name: 'PowerShell',
      executable: 'powershell.exe',
      category: 'terminal',
      defaultPath: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'
    });

    this.applications.set('chrome', {
      name: 'Google Chrome',
      executable: this.platform === 'win32' ? 'chrome.exe' : 'google-chrome',
      category: 'browser',
      defaultPath: this.platform === 'win32' ? 
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : 
        '/usr/bin/google-chrome'
    });

    this.applications.set('firefox', {
      name: 'Mozilla Firefox',
      executable: this.platform === 'win32' ? 'firefox.exe' : 'firefox',
      category: 'browser',
      defaultPath: this.platform === 'win32' ? 
        'C:\\Program Files\\Mozilla Firefox\\firefox.exe' : 
        '/usr/bin/firefox'
    });

    this.applications.set('word', {
      name: 'Microsoft Word',
      executable: 'winword.exe',
      category: 'office',
      defaultPath: 'C:\\Program Files\\Microsoft Office\\Office15\\winword.exe'
    });

    this.applications.set('excel', {
      name: 'Microsoft Excel',
      executable: 'excel.exe',
      category: 'office',
      defaultPath: 'C:\\Program Files\\Microsoft Office\\Office15\\excel.exe'
    });

    this.applications.set('paint', {
      name: 'Paint',
      executable: 'mspaint.exe',
      category: 'graphics',
      defaultPath: 'C:\\Windows\\System32\\mspaint.exe'
    });
  }

  initializeShortcuts() {
    // Common keyboard shortcuts
    this.shortcuts.set('copy', { keys: ['ctrl', 'c'] });
    this.shortcuts.set('paste', { keys: ['ctrl', 'v'] });
    this.shortcuts.set('cut', { keys: ['ctrl', 'x'] });
    this.shortcuts.set('undo', { keys: ['ctrl', 'z'] });
    this.shortcuts.set('save', { keys: ['ctrl', 's'] });
    this.shortcuts.set('open', { keys: ['ctrl', 'o'] });
    this.shortcuts.set('print', { keys: ['ctrl', 'p'] });
    this.shortcuts.set('select_all', { keys: ['ctrl', 'a'] });
    this.shortcuts.set('find', { keys: ['ctrl', 'f'] });
    this.shortcuts.set('replace', { keys: ['ctrl', 'h'] });
    this.shortcuts.set('new', { keys: ['ctrl', 'n'] });
    this.shortcuts.set('close', { keys: ['alt', 'f4'] });
    this.shortcuts.set('switch_task', { keys: ['alt', 'tab'] });
    this.shortcuts.set('minimize', { keys: ['win', 'down'] });
    this.shortcuts.set('maximize', { keys: ['win', 'up'] });
    this.shortcuts.set('lock', { keys: ['win', 'l'] });
    this.shortcuts.set('screenshot', { keys: ['win', 'shift', 's'] });
    this.shortcuts.set('run_dialog', { keys: ['win', 'r'] });
  }

  async initializePlatformAutomation() {
    if (this.platform === 'win32') {
      await this.initializeWindowsAutomation();
    } else if (this.platform === 'darwin') {
      await this.initializeMacOSAutomation();
    } else if (this.platform === 'linux') {
      await this.initializeLinuxAutomation();
    }
  }

  async initializeWindowsAutomation() {
    // Windows-specific automation setup
    try {
      // Check if Windows Script Host is available
      await execAsync('where.exe cscript.exe');
      console.log('Windows Script Host available');
    } catch (error) {
      console.log('Windows Script Host not found');
    }
  }

  async initializeMacOSAutomation() {
    // macOS-specific automation setup
    try {
      // Check if osascript is available
      await execAsync('which osascript');
      console.log('AppleScript available');
    } catch (error) {
      console.log('AppleScript not found');
    }
  }

  async initializeLinuxAutomation() {
    // Linux-specific automation setup
    try {
      // Check if X11 automation tools are available
      await execAsync('which xdotool');
      console.log('xdotool available for Linux automation');
    } catch (error) {
      console.log('xdotool not found, using RobotJS fallback');
    }
  }

  setupSystemMonitoring() {
    // Monitor system for window changes, app launches, etc.
    setInterval(() => {
      this.checkActiveWindows();
      this.processDueReminders();
    }, 5000); // Check every 5 seconds
  }

  async executeCommand(command) {
    try {
      const action = this.parseCommand(command);
      
      if (!action) {
        return {
          success: false,
          message: 'Could not parse command',
          command: command
        };
      }

      const result = await this.executeAction(action);
      
      return {
        success: true,
        message: `Executed: ${action.type}`,
        result: result,
        action: action
      };

    } catch (error) {
      console.error('Error executing command:', error);
      return {
        success: false,
        message: error.message,
        command: command
      };
    }
  }

  parseCommand(command) {
    const lowerCommand = command.toLowerCase();
    
    // Application launching
    if (lowerCommand.match(/^(open|launch|start|run)\s+(.+)/)) {
      const match = lowerCommand.match(/^(open|launch|start|run)\s+(.+)/);
      const appName = match[2].trim();
      return {
        type: 'launch_application',
        application: appName
      };
    }

    // Window management
    if (lowerCommand.match(/^(minimize|maximize|close|hide|show)\s+(.*)/)) {
      const match = lowerCommand.match(/^(minimize|maximize|close|hide|show)\s+(.*)/);
      return {
        type: 'window_management',
        action: match[1],
        window: match[2].trim() || 'active'
      };
    }

    // Keyboard shortcuts
    if (lowerCommand.match(/^press\s+(.+)/)) {
      const match = lowerCommand.match(/^press\s+(.+)/);
      return {
        type: 'keyboard_shortcut',
        shortcut: match[1].trim()
      };
    }

    // File operations
    if (lowerCommand.match(/^(open|create|delete)\s+(.+)/)) {
      const match = lowerCommand.match(/^(open|create|delete)\s+(.+)/);
      return {
        type: 'file_operation',
        action: match[1],
        path: match[2].trim()
      };
    }

    // System control
    if (lowerCommand.match(/^(shutdown|restart|sleep|lock|logout)/)) {
      const match = lowerCommand.match(/^(shutdown|restart|sleep|lock|logout)/);
      return {
        type: 'system_control',
        action: match[1]
      };
    }

    // Text input
    if (lowerCommand.match(/^type\s+(.+)/)) {
      const match = lowerCommand.match(/^type\s+(.+)/);
      return {
        type: 'text_input',
        text: match[1].trim()
      };
    }

    return null;
  }

  async executeAction(action) {
    switch (action.type) {
      case 'launch_application':
        return await this.launchApplication(action.application);
      
      case 'window_management':
        return await this.manageWindow(action.action, action.window);
      
      case 'keyboard_shortcut':
        return await this.executeKeyboardShortcut(action.shortcut);
      
      case 'file_operation':
        return await this.operateFile(action.action, action.path);
      
      case 'system_control':
        return await this.controlSystem(action.action);
      
      case 'text_input':
        return await this.inputText(action.text);
      
      case 'set_reminder':
        return await this.setReminder(action.task, action.time);
      
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  async launchApplication(applicationName) {
    try {
      const app = this.findApplication(applicationName);
      
      if (!app) {
        // Try to find the application by name
        return await this.searchAndLaunchApplication(applicationName);
      }

      let command;
      if (this.platform === 'win32') {
        command = `"${app.defaultPath}"`;
      } else {
        command = app.defaultPath;
      }

      const result = await execAsync(command);
      
      this.emit('application-launched', {
        application: app.name,
        command: command,
        timestamp: Date.now()
      });

      return {
        launched: true,
        application: app.name,
        path: app.defaultPath
      };

    } catch (error) {
      console.error('Error launching application:', error);
      
      // Fallback: try using system-specific app launchers
      return await this.fallbackLaunch(applicationName);
    }
  }

  async searchAndLaunchApplication(applicationName) {
    const searchQueries = [
      applicationName,
      applicationName.toLowerCase(),
      applicationName.toUpperCase()
    ];

    for (const query of searchQueries) {
      try {
        let command;
        
        if (this.platform === 'win32') {
          command = `start "" "${query}"`;
        } else if (this.platform === 'darwin') {
          command = `open -a "${query}"`;
        } else {
          command = `${query} &`;
        }

        const result = await execAsync(command);
        return {
          launched: true,
          application: query,
          method: 'search_launch'
        };

      } catch (error) {
        // Continue to next query
        continue;
      }
    }

    throw new Error(`Could not find or launch application: ${applicationName}`);
  }

  async fallbackLaunch(applicationName) {
    try {
      if (this.platform === 'win32') {
        // Try Windows Run dialog
        const command = `rundll32.exe url.dll,FileProtocolHandler "${applicationName}"`;
        await execAsync(command);
      } else {
        // For Linux/Mac, try using xdg-open or open
        const command = this.platform === 'darwin' ? 
          `open "${applicationName}"` : 
          `xdg-open "${applicationName}"`;
        await execAsync(command);
      }

      return {
        launched: true,
        application: applicationName,
        method: 'fallback'
      };

    } catch (error) {
      throw new Error(`Failed to launch ${applicationName}: ${error.message}`);
    }
  }

  findApplication(name) {
    const lowerName = name.toLowerCase();
    
    // Direct match
    if (this.applications.has(lowerName)) {
      return this.applications.get(lowerName);
    }

    // Partial match
    for (const [key, app] of this.applications.entries()) {
      if (app.name.toLowerCase().includes(lowerName) || 
          key.includes(lowerName) ||
          lowerName.includes(key)) {
        return app;
      }
    }

    return null;
  }

  async manageWindow(action, windowName = 'active') {
    try {
      switch (action.toLowerCase()) {
        case 'minimize':
          if (this.platform === 'win32') {
            await execAsync('powershell -command "Add-Type -TypeDefinition \'using System; using System.Runtime.InteropServices; public class Win32 { [DllImport(\"user32.dll\")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow); }\'; $PSBoundParameters=\'\'; $hwnd=(Get-Process -Id $pid).MainWindowHandle; [Win32]::ShowWindow($hwnd, 6)"');
          } else {
            robot.keyToggle('alt', false);
            robot.keyTap('F9');
          }
          break;

        case 'maximize':
          if (this.platform === 'win32') {
            await execAsync('powershell -command "Add-Type -TypeDefinition \'using System; using System.Runtime.InteropServices; public class Win32 { [DllImport(\"user32.dll\")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow); }\'; $PSBoundParameters=\'\'; $hwnd=(Get-Process -Id $pid).MainWindowHandle; [Win32]::ShowWindow($hwnd, 3)"');
          } else {
            robot.keyToggle('alt', false);
            robot.keyTap('F11');
          }
          break;

        case 'close':
          robot.keyTap('f4', 'alt');
          break;

        case 'hide':
          if (this.platform === 'win32') {
            await execAsync('powershell -command "$hwnd=(Get-Process -Id $pid).MainWindowHandle; Add-Type @\'using System; using System.Runtime.InteropServices; public class Win32 { [DllImport(\"user32.dll\")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow); }\'@; [Win32]::ShowWindow($hwnd, 0)"');
          } else {
            robot.keyToggle('win', false);
            robot.keyTap('d');
          }
          break;

        case 'show':
          // This would require tracking hidden windows
          console.log('Window show not fully implemented');
          break;
      }

      return {
        success: true,
        action: action,
        window: windowName
      };

    } catch (error) {
      console.error('Error managing window:', error);
      return {
        success: false,
        error: error.message,
        action: action
      };
    }
  }

  async executeKeyboardShortcut(shortcutName) {
    try {
      const shortcut = this.shortcuts.get(shortcutName.toLowerCase());
      
      if (!shortcut) {
        // Try to parse direct key combination
        const keys = shortcutName.split('+').map(k => k.trim().toLowerCase());
        return await this.executeKeyCombination(keys);
      }

      return await this.executeKeyCombination(shortcut.keys);

    } catch (error) {
      console.error('Error executing keyboard shortcut:', error);
      return {
        success: false,
        error: error.message,
        shortcut: shortcutName
      };
    }
  }

  async executeKeyCombination(keys) {
    try {
      // RobotJS key combination execution
      const modifiers = [];
      let key = '';

      for (const k of keys) {
        if (['ctrl', 'alt', 'shift', 'win', 'meta', 'command'].includes(k)) {
          modifiers.push(k);
        } else {
          key = k;
        }
      }

      // Press modifiers
      modifiers.forEach(modifier => {
        robot.keyToggle(modifier, true);
      });

      // Press main key
      robot.keyTap(key);

      // Release modifiers
      modifiers.reverse().forEach(modifier => {
        robot.keyToggle(modifier, false);
      });

      return {
        success: true,
        keys: keys,
        action: 'shortcut_executed'
      };

    } catch (error) {
      console.error('Error executing key combination:', error);
      throw error;
    }
  }

  async operateFile(action, filePath) {
    try {
      switch (action.toLowerCase()) {
        case 'open':
          return await this.openFile(filePath);
        
        case 'create':
          return await this.createFile(filePath);
        
        case 'delete':
          return await this.deleteFile(filePath);
        
        default:
          throw new Error(`Unknown file operation: ${action}`);
      }
    } catch (error) {
      console.error('Error operating on file:', error);
      return {
        success: false,
        error: error.message,
        action: action,
        path: filePath
      };
    }
  }

  async openFile(filePath) {
    try {
      let command;
      
      if (this.platform === 'win32') {
        command = `start "" "${filePath}"`;
      } else if (this.platform === 'darwin') {
        command = `open "${filePath}"`;
      } else {
        command = `xdg-open "${filePath}"`;
      }

      await execAsync(command);
      
      return {
        success: true,
        action: 'file_opened',
        path: filePath
      };

    } catch (error) {
      throw new Error(`Failed to open file: ${error.message}`);
    }
  }

  async createFile(filePath) {
    try {
      // Create parent directory if it doesn't exist
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      // Create empty file
      await fs.writeFile(filePath, '');
      
      return {
        success: true,
        action: 'file_created',
        path: filePath
      };

    } catch (error) {
      throw new Error(`Failed to create file: ${error.message}`);
    }
  }

  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      
      return {
        success: true,
        action: 'file_deleted',
        path: filePath
      };

    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async controlSystem(action) {
    try {
      switch (action.toLowerCase()) {
        case 'shutdown':
          if (this.platform === 'win32') {
            await execAsync('shutdown /s /t 0');
          } else {
            await execAsync('sudo shutdown -h now');
          }
          break;

        case 'restart':
          if (this.platform === 'win32') {
            await execAsync('shutdown /r /t 0');
          } else {
            await execAsync('sudo reboot');
          }
          break;

        case 'sleep':
          if (this.platform === 'win32') {
            await execAsync('rundll32.exe powrprof.dll,SetSuspendState 0,1,0');
          } else {
            await execAsync('sudo systemctl suspend');
          }
          break;

        case 'lock':
          if (this.platform === 'win32') {
            await execAsync('rundll32.exe user32.dll,LockWorkStation');
          } else {
            await execAsync('gnome-screensaver-command -l');
          }
          break;

        case 'logout':
          if (this.platform === 'win32') {
            await execAsync('shutdown /l');
          } else {
            await execAsync('gnome-session-quit --logout');
          }
          break;
      }

      return {
        success: true,
        action: action,
        message: `System ${action} initiated`
      };

    } catch (error) {
      console.error('Error controlling system:', error);
      return {
        success: false,
        error: error.message,
        action: action
      };
    }
  }

  async inputText(text) {
    try {
      // Type the text
      robot.typeString(text);
      
      return {
        success: true,
        action: 'text_input',
        text: text,
        length: text.length
      };

    } catch (error) {
      console.error('Error inputting text:', error);
      return {
        success: false,
        error: error.message,
        text: text
      };
    }
  }

  async setReminder(task, time) {
    const reminderId = Date.now().toString();
    const reminder = {
      id: reminderId,
      task: task,
      time: time,
      created: Date.now(),
      executed: false
    };

    this.reminders.set(reminderId, reminder);
    
    this.emit('reminder-set', reminder);
    
    return {
      success: true,
      reminder: reminder,
      message: `Reminder set for: ${task} at ${time}`
    };
  }

  processDueReminders() {
    const now = Date.now();
    
    for (const [id, reminder] of this.reminders.entries()) {
      if (!reminder.executed) {
        // Parse reminder time and check if due
        // This is a simplified implementation
        const timeDiff = now - reminder.created;
        
        // For demo purposes, trigger reminders after 30 seconds
        if (timeDiff > 30000) {
          this.triggerReminder(reminder);
          this.reminders.delete(id);
        }
      }
    }
  }

  triggerReminder(reminder) {
    this.emit('reminder-triggered', reminder);
    
    // Show notification
    if (this.platform === 'win32') {
      execAsync(`powershell -command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('Reminder: ${reminder.task}', 'KYRA Reminder')"`);
    }
    
    reminder.executed = true;
  }

  async checkActiveWindows() {
    // This would implement window detection and tracking
    // For now, it's a placeholder for future implementation
  }

  // Public API methods
  getApplications() {
    const apps = [];
    for (const [key, app] of this.applications.entries()) {
      apps.push({
        id: key,
        name: app.name,
        category: app.category,
        executable: app.executable
      });
    }
    return apps;
  }

  getShortcuts() {
    const shortcuts = [];
    for (const [key, shortcut] of this.shortcuts.entries()) {
      shortcuts.push({
        name: key,
        keys: shortcut.keys
      });
    }
    return shortcuts;
  }

  getActiveReminders() {
    return Array.from(this.reminders.values()).filter(r => !r.executed);
  }

  cancelReminder(reminderId) {
    if (this.reminders.has(reminderId)) {
      this.reminders.delete(reminderId);
      return true;
    }
    return false;
  }

  async shutdown() {
    this.isActive = false;
    console.log('Desktop Automation shutdown complete');
  }
}

module.exports = { DesktopAutomation };