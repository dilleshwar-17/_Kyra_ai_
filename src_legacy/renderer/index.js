const { ipcRenderer } = require('electron');
const THREE = require('three');
const Matter = require('matter-js');

class KYRA3D {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.initThree();
        this.initPhysics();
        this.createAvatar();
        this.setupInteraction();
        this.setupIPC(); // Re-bind basic IPC for communication
        this.setupVoice();

        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    initThree() {
        this.scene = new THREE.Scene();

        // Transparent background
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(this.width, this.height);
        this.container.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
        this.camera.position.z = 20;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0x4A90E2, 2, 50); // KYRA Blue
        pointLight.position.set(5, 5, 5);
        this.scene.add(pointLight);
    }

    initPhysics() {
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;

        // Zero gravity for floating effect (Antigravity)
        this.world.gravity.y = 0;
        this.world.gravity.x = 0;

        // Wall boundaries to keep avatar on screen (invisible)
        // Adjust bounds based on camera Z depth roughly
        const wallThickness = 100;
        const viewWidth = 20; // Approx width at z=0 for cam z=20
        const viewHeight = 20;

        // We'll trust the avatar to stay near center with attraction forces mostly, 
        // but walls help it not fly away.
        const walls = [
            Matter.Bodies.rectangle(0, -viewHeight / 2 - 5, viewWidth * 2, 10, { isStatic: true }), // Bottom
            Matter.Bodies.rectangle(0, viewHeight / 2 + 5, viewWidth * 2, 10, { isStatic: true }), // Top
            Matter.Bodies.rectangle(-viewWidth / 2 - 5, 0, 10, viewHeight * 2, { isStatic: true }), // Left
            Matter.Bodies.rectangle(viewWidth / 2 + 5, 0, 10, viewHeight * 2, { isStatic: true }) // Right
        ];
        Matter.World.add(this.world, walls);
    }

    createAvatar() {
        // 1. Three.js Visuals
        const geometry = new THREE.SphereGeometry(1.5, 32, 32);

        // Custom Shader Material for "Aura" effect (Basic version for now)
        // Using a standard material with emissivity for glow as MVP
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0x4A90E2,
            emissiveIntensity: 0.5,
            metalness: 0.1,
            roughness: 0.2,
            transparent: true,
            opacity: 0.9
        });

        this.kyraMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.kyraMesh);

        // Particle System (Orbiting Energy)
        this.createParticles();

        // 2. Matter.js Physics Body
        this.kyraBody = Matter.Bodies.circle(0, 0, 1.5, {
            frictionAir: 0.02,
            restitution: 0.8,
            density: 0.01 // Light density for floaty feel
        });

        Matter.World.add(this.world, this.kyraBody);
    }

    createParticles() {
        const particleCount = 50;
        const particlesGeom = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 2.5 + Math.random() * 0.5; // Radius slightly larger than sphere

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
        }

        particlesGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particleMat = new THREE.PointsMaterial({
            color: 0x00ffff,
            size: 0.1,
            transparent: true,
            opacity: 0.6
        });

        this.particles = new THREE.Points(particlesGeom, particleMat);
        this.kyraMesh.add(this.particles); // Parent to mesh so it moves with it
    }

    setupInteraction() {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isHovering = false;
        this.isDragging = false;

        // Mouse Move for Raycasting & Physics influence
        document.addEventListener('mousemove', (event) => {
            event.preventDefault();

            // Normalized coordinates for Raycaster
            this.mouse.x = (event.clientX / this.width) * 2 - 1;
            this.mouse.y = -(event.clientY / this.height) * 2 + 1;

            // Physics "Attraction" to cursor (Antigravity movement)
            // Only attract if close enough to center to avoid hard sticking
            if (!this.isDragging) {
                // Apply a tiny force towards mouse to make her "look" or drift slightly interested
                // Real mouse interaction is complex in 3D, we'll keep it subtle.
                const vector = new THREE.Vector3(this.mouse.x * 10, this.mouse.y * 10, 0); // Unproject rough approx
                // Matter.Body.applyForce(this.kyraBody, this.kyraBody.position, {
                //     x: (vector.x - this.kyraBody.position.x) * 0.00001,
                //     y: (vector.y - this.kyraBody.position.y) * 0.00001
                // });
            }
        });

        // Click logic handled via Raycaster in animate loop mostly, but we trigger events too
        document.addEventListener('mousedown', (e) => {
            if (this.isHovering) {
                this.isDragging = true;
                // e.g. change color or expression
                this.kyraMesh.material.emissive.setHex(0xFFD700);
            }
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
            if (this.isHovering) {
                this.kyraMesh.material.emissive.setHex(0x4A90E2);
            }
        });
    }

    setupIPC() {
        // Listen for emotion changes (from main process / AI)
        ipcRenderer.on('avatar-emotion', (event, emotion) => {
            console.log("Emotion set:", emotion);
            const colorMap = {
                neutral: 0x4A90E2,
                happy: 0xFFD700,
                excited: 0xFF4500,
                thinking: 0x9370DB,
                error: 0xDC143C
            };
            if (colorMap[emotion]) {
                this.kyraMesh.material.emissive.setHex(colorMap[emotion]);
            }
        });

        // Listen for Audio Playback (TTS)
        ipcRenderer.on('play-audio', async (event, { audio, text }) => {
            console.log('Received audio playback request:', text);
            // 'audio' comes as a Node Buffer from main process usually, 
            // but passing buffers over IPC in Electron sometimes serializes to UInt8Array.

            try {
                const blob = new Blob([audio], { type: 'audio/mpeg' });
                const url = URL.createObjectURL(blob);
                const audioEl = new Audio(url);

                // Visual feedback: Talking state (Flash darker blue?)
                this.kyraMesh.material.emissive.setHex(0xFF4500); // Orange pulse

                audioEl.onended = () => {
                    this.kyraMesh.material.emissive.setHex(0x4A90E2); // Back to blue
                    URL.revokeObjectURL(url);
                };

                await audioEl.play();
            } catch (err) {
                console.error('Audio playback failed:', err);
            }
        });
    }

    setupVoice() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;

        document.addEventListener('keydown', async (e) => {
            if (e.code === 'Space' && !this.isRecording) {
                this.isRecording = true;
                console.log('Starting Recording...');

                // Visual cue
                this.kyraMesh.material.emissive.setHex(0xFF00FF); // Purple for listening

                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    this.mediaRecorder = new MediaRecorder(stream);

                    this.mediaRecorder.ondataavailable = (event) => {
                        this.audioChunks.push(event.data);
                    };

                    this.mediaRecorder.onstop = async () => {
                        console.log('Recording stopped. Processing...');
                        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' }); // or 'audio/webm' depending on browser
                        const arrayBuffer = await audioBlob.arrayBuffer();
                        const buffer = new Uint8Array(arrayBuffer); // Send as convenient array

                        this.audioChunks = []; // Reset

                        // Send to Main
                        this.kyraMesh.material.emissive.setHex(0x9370DB); // Thinking
                        const result = await ipcRenderer.invoke('audio-buffer', buffer);

                        if (result.success) {
                            if (result.audio) {
                                // Trigger playback event manually or via IPC response logic
                                // Main process is sending audio data in return, so let's use it.
                                // Or better, let Main send a separate message for consistency
                                // But since we received it here:
                                const blob = new Blob([result.audio], { type: 'audio/mpeg' });
                                const url = URL.createObjectURL(blob);
                                const audioEl = new Audio(url);
                                this.kyraMesh.material.emissive.setHex(0xFF4500); // Talking
                                audioEl.onended = () => {
                                    this.kyraMesh.material.emissive.setHex(0x4A90E2);
                                };
                                audioEl.play();
                            }
                        } else {
                            console.error('Voice processing error:', result.error);
                            this.kyraMesh.material.emissive.setHex(0xDC143C); // Error
                            setTimeout(() => this.kyraMesh.material.emissive.setHex(0x4A90E2), 1000);
                        }
                    };

                    this.mediaRecorder.start();
                } catch (err) {
                    console.error('Microphone error:', err);
                    this.isRecording = false;
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space' && this.isRecording) {
                this.isRecording = false;
                if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
                    this.mediaRecorder.stop();
                    // Stop tracks
                    this.mediaRecorder.stream.getTracks().forEach(t => t.stop());
                }
            }
        });
    }

    onWindowResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
    }

    animate() {
        requestAnimationFrame(this.animate);

        // 1. Update Physics
        Matter.Engine.update(this.engine, 1000 / 60);

        // 2. Sync Visuals
        this.kyraMesh.position.x = this.kyraBody.position.x;
        this.kyraMesh.position.y = this.kyraBody.position.y;

        // Rotate particles
        if (this.particles) {
            this.particles.rotation.y += 0.01;
            this.particles.rotation.z += 0.005;
        }

        // 3. Raycasting for Interaction + Transparency
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.kyraMesh);

        if (intersects.length > 0) {
            if (!this.isHovering) {
                this.isHovering = true;
                document.body.style.cursor = 'pointer';
                // Tell Main process to CAPTURE mouse events
                ipcRenderer.send('set-ignore-mouse-events', false);
            }
        } else {
            if (this.isHovering) {
                this.isHovering = false;
                document.body.style.cursor = 'default';
                // Tell Main process to IGNORE mouse events (allow click-through)
                ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
            }
        }

        // 4. Render
        this.renderer.render(this.scene, this.camera);
    }
}

// Start
document.addEventListener('DOMContentLoaded', () => {
    window.kyra = new KYRA3D();
});