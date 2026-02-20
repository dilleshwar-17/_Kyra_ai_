export type AvatarState = 'sleep' | 'idle' | 'listening' | 'thinking' | 'speaking' | 'happy' | 'sad' | 'confused';

export interface AgentState {
    avatarState: AvatarState;
    spokenText: string;
    emotion: string;
    isListening: boolean;
}

export class AvatarStateManager {
    private currentState: AvatarState = 'idle';
    private stateChangeCallback: ((state: AvatarState) => void) | null = null;

    setState(state: AvatarState) {
        if (this.currentState !== state) {
            this.currentState = state;
            console.log(`[AvatarStateManager] State changed to: ${state}`);
            if (this.stateChangeCallback) {
                this.stateChangeCallback(state);
            }
        }
    }

    getState(): AvatarState {
        return this.currentState;
    }

    onStateChange(callback: (state: AvatarState) => void) {
        this.stateChangeCallback = callback;
    }
}
