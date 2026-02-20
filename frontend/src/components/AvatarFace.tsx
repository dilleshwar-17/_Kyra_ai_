import React from 'react';
import { motion } from 'framer-motion';
// @ts-ignore
// import avatarImg from '../assets/avatar.png';
const avatarImg = ""; // Placeholder to avoid errors 


interface AvatarFaceProps {
    state: string;
}

const AvatarFace: React.FC<AvatarFaceProps> = ({ state }) => {
    // Animations for different states
    const variants = {
        idle: { scale: 1, y: 0 },
        speaking: {
            scale: [1, 1.05, 1],
            transition: { repeat: Infinity, duration: 0.3 }
        },
        listening: { scale: 1.05 },
        thinking: {
            rotate: [0, 2, -2, 0],
            transition: { repeat: Infinity, duration: 1.5 }
        }
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            paddingTop: '20px'
        }}>
            <motion.div
                variants={variants}
                animate={state}
                style={{
                    position: 'relative',
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'radial-gradient(circle, rgba(0,255,255,0.4) 0%, rgba(0,30,60,0.8) 100%)',
                    boxShadow: '0 0 40px rgba(0, 255, 255, 0.5), inset 0 0 20px rgba(0, 255, 255, 0.3)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)'
                }}
            >
                {/* 
                   Background Image Layer
                */}
                <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${avatarImg})`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    backgroundSize: 'contain',
                    zIndex: 2
                }} />

                {/* CSS Fallback / Glowing Core */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{
                        position: 'absolute',
                        width: '60%',
                        height: '60%',
                        background: 'radial-gradient(circle, #00ffff 0%, transparent 70%)',
                        filter: 'blur(10px)',
                        zIndex: 1
                    }}
                />



                {/* Placeholder/Instruction text if image fails to load or is transparent */}
                <div style={{
                    position: 'absolute',
                    bottom: '10px', left: '0', width: '100%',
                    textAlign: 'center',
                    color: 'white',
                    fontSize: '10px',
                    opacity: 0.5,
                    pointerEvents: 'none',
                    zIndex: -1
                }}>
                    Ensure avatar.png is in frontend/src/assets
                </div>
            </motion.div>
        </div>
    );
};

export default AvatarFace;
