import React, { useState, useEffect } from 'react';
const { ipcRenderer } = window.require('electron');

import AvatarFace from './components/AvatarFace';

function App() {
    const [avatarState, setAvatarState] = useState('idle')

    useEffect(() => {
        ipcRenderer.on('avatar-state-change', (_event: any, state: string) => {
            console.log('Frontend received state:', state);
            setAvatarState(state);
        });

        return () => {
            ipcRenderer.removeAllListeners('avatar-state-change');
        }
    }, []);

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'transparent',
            WebkitAppRegion: 'drag' // Allow dragging
        } as React.CSSProperties}>
            <AvatarFace state={avatarState} />

            {/* State Label for Debugging */}
            <div style={{
                position: 'absolute',
                bottom: 10,
                color: 'white',
                fontSize: '12px',
                textShadow: '0 0 5px black',
                opacity: 0.7,
                pointerEvents: 'none'
            }}>
                {avatarState.toUpperCase()}
            </div>
        </div>
    )
}

export default App
