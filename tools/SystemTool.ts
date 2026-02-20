import { exec } from 'child_process';
import { shell } from 'electron';

export class SystemTool {
    /**
     * Opens an application by name (Windows-centric)
     */
    public async openApp(appName: string): Promise<string> {
        console.log(`[SystemTool] Opening app: ${appName}`);
        return new Promise((resolve, reject) => {
            // Basic start command in CMD/PowerShell
            exec(`start ${appName}`, (error) => {
                if (error) {
                    console.error(`[SystemTool] Failed to open ${appName}: ${error}`);
                    return reject(`I couldn't open ${appName}. Is it installed?`);
                }
                resolve(`Opening ${appName} for you.`);
            });
        });
    }

    /**
     * Opens a URL in the default browser
     */
    public async openUrl(url: string): Promise<string> {
        console.log(`[SystemTool] Opening URL: ${url}`);
        const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
        await shell.openExternal(formattedUrl);
        return `Opening ${url} in your browser.`;
    }

    /**
     * Controls system volume (0-100)
     */
    public async setVolume(level: number): Promise<string> {
        console.log(`[SystemTool] Setting volume to: ${level}`);
        // Requires a CLI tool or PowerShell command
        // Simple PowerShell approach:
        const command = `PowerShell -Command "$obj = New-Object -ComObject WScript.Shell; for($i=0; $i -lt 50; $i++) { $obj.SendKeys([char]174) }; for($i=0; $i -lt ${Math.floor(level / 2)}; $i++) { $obj.SendKeys([char]175) }"`;

        return new Promise((resolve) => {
            exec(command, () => {
                resolve(`Volume set to ${level} percent.`);
            });
        });
    }

    /**
     * Locks the screen
     */
    public async lockScreen(): Promise<string> {
        console.log('[SystemTool] Locking screen...');
        exec('rundll32.exe user32.dll,LockWorkStation');
        return "Screen locked. I'll be here when you return.";
    }
}

export const systemTool = new SystemTool();
