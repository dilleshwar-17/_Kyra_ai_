import fs from 'fs';
import path from 'path';
import { app } from 'electron';

export interface MemoryData {
    userName: string;
    preferences: Record<string, any>;
    history: Array<{ role: string, text: string, timestamp: number }>;
}

export class MemoryStore {
    private filePath: string;
    private data: MemoryData;

    constructor() {
        const userDataPath = app ? app.getPath('userData') : './';
        this.filePath = path.join(userDataPath, 'kyra_memory.json');
        this.data = this.load();
    }

    private load(): MemoryData {
        if (fs.existsSync(this.filePath)) {
            try {
                return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
            } catch (e) {
                console.error('[Memory] Failed to parse memory file:', e);
            }
        }
        return {
            userName: 'User',
            preferences: {},
            history: []
        };
    }

    public save() {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
        } catch (e) {
            console.error('[Memory] Failed to save memory:', e);
        }
    }

    public getUserName(): string {
        return this.data.userName;
    }

    public setUserName(name: string) {
        this.data.userName = name;
        this.save();
    }

    public addHistory(role: string, text: string) {
        this.data.history.push({ role, text, timestamp: Date.now() });
        if (this.data.history.length > 100) this.data.history.shift(); // Max 100 items
        this.save();
    }

    public getHistory() {
        return this.data.history;
    }
}

export const memoryStore = new MemoryStore();
