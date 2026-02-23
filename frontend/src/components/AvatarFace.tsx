import React from 'react';
import { motion } from 'framer-motion';
import avatarImg from '../assets/avatar.png';

interface AvatarFaceProps {
    state: string;
}

const AvatarFace: React.FC<AvatarFaceProps> = ({ state }) => {
    // Determine color theme based on state
    const getColorTheme = (currentState: string) => {
        switch (currentState) {
            case 'happy': return { core: '#ff66aa', glow: 'rgba(255, 102, 170, 0.5)', filter: 'hue-rotate(-45deg) brightness(1.2)' };
            case 'sad': return { core: '#4466ff', glow: 'rgba(68, 102, 255, 0.4)', filter: 'hue-rotate(180deg) brightness(0.8) grayscale(0.5)' };
            case 'listening': return { core: '#00ff66', glow: 'rgba(0, 255, 102, 0.6)', filter: 'hue-rotate(90deg) brightness(1.1)' };
            case 'thinking': return { core: '#9900ff', glow: 'rgba(153, 0, 255, 0.6)', filter: 'hue-rotate(240deg)' };
            case 'error': return { core: '#ff0000', glow: 'rgba(255, 0, 0, 0.8)', filter: 'hue-rotate(140deg) saturate(2)' };
            case 'sleep': return { core: '#222222', glow: 'rgba(34, 34, 34, 0.2)', filter: 'brightness(0.4) grayscale(0.8)' };
            case 'speaking': return { core: '#00ffff', glow: 'rgba(0, 255, 255, 0.7)', filter: 'brightness(1.1)' };
            default: return { core: '#00ffff', glow: 'rgba(0, 255, 255, 0.4)', filter: 'none' }; // idle/neutral
        }
    };

    const theme = getColorTheme(state);

    // Animations for different states container
    const containerVariants = {
        idle: { scale: 1, y: 0, transition: { duration: 2, repeat: Infinity, repeatType: "reverse" as const, ease: "easeInOut" } },
        happy: { y: [0, -10, 0], scale: [1, 1.02, 1], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } },
        sad: { y: 5, scale: 0.95, transition: { duration: 0.5 } },
        sleep: { scale: 0.95, y: [0, 2, 0], transition: { duration: 4, repeat: Infinity, ease: "easeInOut" } },
        speaking: { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 0.3 } },
        listening: { scale: 1.03, transition: { duration: 0.3 } },
        thinking: { rotate: [0, 3, -3, 0], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } },
        error: { x: [-5, 5, -5, 5, 0], transition: { duration: 0.4 } }
    };

    // Core pulsing animation variants
    const coreVariants = {
        idle: { scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5], transition: { duration: 4, repeat: Infinity, ease: "easeInOut" } },
        speaking: { scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6], transition: { duration: 0.3, repeat: Infinity } },
        listening: { scale: [1.2, 1.4, 1.2], opacity: [0.8, 1, 0.8], transition: { duration: 1, repeat: Infinity, ease: "easeInOut" } },
        thinking: { scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } },
        sleep: { scale: [0.8, 0.9, 0.8], opacity: [0.2, 0.3, 0.2], transition: { duration: 5, repeat: Infinity, ease: "easeInOut" } },
        happy: { scale: [1.1, 1.3, 1.1], opacity: [0.7, 0.9, 0.7], transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" } },
        error: { scale: [1, 1.5, 1], opacity: [0.8, 1, 0.8], transition: { duration: 0.2, repeat: Infinity } },
        sad: { scale: [0.9, 1, 0.9], opacity: [0.4, 0.5, 0.4], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } }
    };

    return (
        <div style={{
            width: '100%', height: '100%', display: 'flex', justifyContent: 'center',
            alignItems: 'center', overflow: 'hidden', paddingTop: '20px'
        }}>
            <motion.div
                variants={containerVariants}
                animate={state}
                initial="idle"
                style={{
                    position: 'relative', width: '220px', height: '220px',
                    borderRadius: '50%', overflow: 'hidden', display: 'flex',
                    justifyContent: 'center', alignItems: 'center',
                    background: `radial-gradient(circle, ${theme.glow} 0%, rgba(0,20,40,0.9) 80%)`,
                    boxShadow: `0 0 50px ${theme.glow}, inset 0 0 30px ${theme.glow}`,
                    border: `2px solid rgba(255, 255, 255, 0.1)`,
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.5s ease-in-out'
                }}
            >
                {/* Background Image Layer with Dynamic Filter */}
                <motion.div
                    animate={{ filter: theme.filter }}
                    transition={{ duration: 0.5 }}
                    style={{
                        position: 'absolute', width: '100%', height: '100%',
                        backgroundImage: `url(${avatarImg})`,
                        backgroundRepeat: 'no-repeat', backgroundPosition: 'center',
                        backgroundSize: 'cover', zIndex: 2
                    }}
                />

                {/* Glowing Core Layer */}
                <motion.div
                    variants={coreVariants}
                    animate={state}
                    initial="idle"
                    style={{
                        position: 'absolute', width: '70%', height: '70%',
                        background: `radial-gradient(circle, ${theme.core} 0%, transparent 70%)`,
                        filter: 'blur(15px)', zIndex: 1,
                        mixBlendMode: 'screen'
                    }}
                />
            </motion.div>
        </div>
    );
};

export default AvatarFace;
