const EventEmitter = require('events');
let cv = null;

try {
  cv = require('opencv4nodejs');
  console.log('OpenCV loaded successfully');
} catch (error) {
  console.log('OpenCV not available, using simulation mode for facial expression detection');
}

class AvatarManager extends EventEmitter {
  constructor() {
    super();
    this.currentEmotion = 'neutral';
    this.emotionHistory = [];
    this.facialExpressions = {};
    this.emotionStates = {
      neutral: {
        displayName: 'Neutral',
        description: 'Calm and composed',
        animation: 'idle',
        facialFeatures: {
          eyebrows: { position: 'normal', intensity: 0.5 },
          eyes: { openness: 'normal', gaze: 'direct' },
          mouth: { shape: 'neutral', curvature: 0 },
          cheeks: { raised: false, color: '#FDBCB4' }
        },
        colorScheme: {
          primary: '#4A90E2',
          secondary: '#F5F5F5',
          accent: '#7ED321'
        }
      },
      happy: {
        displayName: 'Happy',
        description: 'Joyful and content',
        animation: 'smile',
        facialFeatures: {
          eyebrows: { position: 'raised', intensity: 0.7 },
          eyes: { openness: 'slightly_open', gaze: 'direct', 'slight_squint': true },
          mouth: { shape: 'smile', curvature: 0.8, 'dimples': true },
          cheeks: { raised: true, color: '#FFB6C1' }
        },
        colorScheme: {
          primary: '#FFD700',
          secondary: '#FFF8DC',
          accent: '#FF6B6B'
        }
      },
      excited: {
        displayName: 'Excited',
        description: 'Energetic and enthusiastic',
        animation: 'bounce',
        facialFeatures: {
          eyebrows: { position: 'raised', intensity: 0.9 },
          eyes: { openness: 'wide', gaze: 'direct', 'bright': true },
          mouth: { shape: 'open_smile', curvature: 1.0, 'teeth_visible': true },
          cheeks: { raised: true, color: '#FFB6C1' }
        },
        colorScheme: {
          primary: '#FF4500',
          secondary: '#FFE4E1',
          accent: '#FFD700'
        }
      },
      thinking: {
        displayName: 'Thinking',
        description: 'Contemplative and focused',
        animation: 'idle',
        facialFeatures: {
          eyebrows: { position: 'furrowed', intensity: 0.6 },
          eyes: { openness: 'narrowed', gaze: 'downward' },
          mouth: { shape: 'slight_pucker', curvature: -0.2 },
          cheeks: { raised: false, color: '#FDBCB4' }
        },
        colorScheme: {
          primary: '#9370DB',
          secondary: '#F0F8FF',
          accent: '#87CEEB'
        }
      },
      confused: {
        displayName: 'Confused',
        description: 'Puzzled and uncertain',
        animation: 'shake',
        facialFeatures: {
          eyebrows: { position: 'asymmetric', intensity: 0.8 },
          eyes: { openness: 'wide', gaze: 'unfocused' },
          mouth: { shape: 'worry', curvature: -0.3 },
          cheeks: { raised: false, color: '#FDBCB4' }
        },
        colorScheme: {
          primary: '#DDA0DD',
          secondary: '#F8F8FF',
          accent: '#F0E68C'
        }
      },
      listening: {
        displayName: 'Listening',
        description: 'Attentive and focused',
        animation: 'idle',
        facialFeatures: {
          eyebrows: { position: 'slightly_raised', intensity: 0.4 },
          eyes: { openness: 'normal', gaze: 'direct', 'focused': true },
          mouth: { shape: 'slight_smile', curvature: 0.1 },
          cheeks: { raised: false, color: '#FDBCB4' }
        },
        colorScheme: {
          primary: '#20B2AA',
          secondary: '#F0FFFF',
          accent: '#98FB98'
        }
      },
      speaking: {
        displayName: 'Speaking',
        description: 'Engaged in conversation',
        animation: 'talk',
        facialFeatures: {
          eyebrows: { position: 'normal', intensity: 0.5 },
          eyes: { openness: 'normal', gaze: 'direct', 'animated': true },
          mouth: { shape: 'talking', curvature: 0.3, 'moving': true },
          cheeks: { raised: false, color: '#FDBCB4' }
        },
        colorScheme: {
          primary: '#FF69B4',
          secondary: '#FFF0F5',
          accent: '#DDA0DD'
        }
      },
      error: {
        displayName: 'Error',
        description: 'Something went wrong',
        animation: 'shake',
        facialFeatures: {
          eyebrows: { position: 'furrowed', intensity: 0.9 },
          eyes: { openness: 'wide', gaze: 'confused' },
          mouth: { shape: 'frown', curvature: -0.8 },
          cheeks: { raised: false, color: '#FDBCB4' }
        },
        colorScheme: {
          primary: '#DC143C',
          secondary: '#FFF0F0',
          accent: '#FFA07A'
        }
      },
      surprised: {
        displayName: 'Surprised',
        description: 'Amazed and taken aback',
        animation: 'pulse',
        facialFeatures: {
          eyebrows: { position: 'raised', intensity: 1.0 },
          eyes: { openness: 'very_wide', gaze: 'wide' },
          mouth: { shape: 'open_o', curvature: 0.5 },
          cheeks: { raised: false, color: '#FDBCB4' }
        },
        colorScheme: {
          primary: '#FF1493',
          secondary: '#FFF0F5',
          accent: '#00CED1'
        }
      },
      sleeping: {
        displayName: 'Sleeping',
        description: 'Peaceful and restful',
        animation: 'sleep',
        facialFeatures: {
          eyebrows: { position: 'relaxed', intensity: 0.2 },
          eyes: { openness: 'closed', gaze: 'downward' },
          mouth: { shape: 'relaxed', curvature: 0.1 },
          cheeks: { raised: false, color: '#FDBCB4' }
        },
        colorScheme: {
          primary: '#4682B4',
          secondary: '#E6E6FA',
          accent: '#B0C4DE'
        }
      }
    };

    this.facialExpressionDetector = new FacialExpressionDetector();
    this.animationController = new AnimationController();
    this.init();
  }

  async init() {
    try {
      // Initialize facial expression detection
      await this.facialExpressionDetector.init();
      
      // Set up emotion detection callbacks
      this.facialExpressionDetector.on('expression-detected', (expression) => {
        this.handleFacialExpression(expression);
      });

      // Start monitoring for facial expressions
      this.facialExpressionDetector.startDetection();
      
      console.log('Avatar Manager initialized with emotion system');
    } catch (error) {
      console.error('Error initializing Avatar Manager:', error);
    }
  }

  async handleFacialExpression(expression) {
    try {
      // Map facial expressions to avatar emotions
      const emotionMap = {
        happy: 'happy',
        sad: 'neutral',
        angry: 'error',
        surprised: 'surprised',
        disgusted: 'confused',
        fearful: 'confused',
        neutral: 'neutral',
        confused: 'confused',
        excited: 'excited'
      };

      const mappedEmotion = emotionMap[expression.emotion] || 'neutral';
      const confidence = expression.confidence;

      // Only change emotion if confidence is high enough
      if (confidence > 0.6) {
        this.setEmotion(mappedEmotion);
      }

      this.facialExpressions[Date.now()] = expression;
      
      // Keep only recent expressions (last 100)
      if (this.facialExpressions.length > 100) {
        const keys = Object.keys(this.facialExpressions);
        keys.sort((a, b) => b - a);
        keys.slice(100).forEach(key => delete this.facialExpressions[key]);
      }
    } catch (error) {
      console.error('Error handling facial expression:', error);
    }
  }

  setEmotion(emotion) {
    if (!this.emotionStates[emotion]) {
      console.warn(`Unknown emotion: ${emotion}`);
      return false;
    }

    const previousEmotion = this.currentEmotion;
    this.currentEmotion = emotion;
    
    // Add to history
    this.emotionHistory.push({
      emotion,
      timestamp: Date.now(),
      previous: previousEmotion
    });

    // Keep only recent history (last 50 emotions)
    if (this.emotionHistory.length > 50) {
      this.emotionHistory = this.emotionHistory.slice(-50);
    }

    // Trigger animation for emotion change
    this.animationController.playAnimation(this.emotionStates[emotion].animation);

    // Emit emotion changed event
    this.emit('emotion-changed', {
      emotion,
      state: this.emotionStates[emotion],
      previous: previousEmotion
    });

    console.log(`Avatar emotion changed: ${previousEmotion} → ${emotion}`);
    return true;
  }

  getCurrentEmotion() {
    return {
      emotion: this.currentEmotion,
      state: this.emotionStates[this.currentEmotion],
      history: this.emotionHistory.slice(-10) // Last 10 emotions
    };
  }

  getEmotionState(emotion) {
    return this.emotionStates[emotion] || this.emotionStates.neutral;
  }

  getAvailableEmotions() {
    return Object.keys(this.emotionStates).map(key => ({
      emotion: key,
      displayName: this.emotionStates[key].displayName,
      description: this.emotionStates[key].description
    }));
  }

  // Animation control methods
  async playAnimation(animationName) {
    return await this.animationController.playAnimation(animationName);
  }

  // Transition between emotions smoothly
  async transitionToEmotion(emotion, duration = 1000) {
    if (!this.emotionStates[emotion]) return false;

    const startEmotion = this.currentEmotion;
    const endEmotion = emotion;
    
    this.emit('emotion-transition-start', { from: startEmotion, to: endEmotion, duration });
    
    // Simulate smooth transition (in a real implementation, this would interpolate facial features)
    setTimeout(() => {
      this.setEmotion(endEmotion);
      this.emit('emotion-transition-complete', { from: startEmotion, to: endEmotion });
    }, duration);

    return true;
  }

  // Get facial expression analysis data
  getFacialExpressionData() {
    const recentExpressions = Object.values(this.facialExpressions)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);

    const emotionCounts = {};
    recentExpressions.forEach(expr => {
      emotionCounts[expr.emotion] = (emotionCounts[expr.emotion] || 0) + 1;
    });

    return {
      recent: recentExpressions,
      emotionCounts,
      totalDetected: recentExpressions.length,
      averageConfidence: recentExpressions.reduce((sum, expr) => sum + expr.confidence, 0) / recentExpressions.length || 0
    };
  }

  // Cleanup and shutdown
  shutdown() {
    this.facialExpressionDetector.stopDetection();
    this.animationController.stop();
    console.log('Avatar Manager shutdown complete');
  }
}

// Facial Expression Detection System
class FacialExpressionDetector extends EventEmitter {
  constructor() {
    super();
    this.isDetecting = false;
    this.camera = null;
    this.faceDetector = null;
    this.emotionClassifier = null;
  }

  async init() {
    try {
      if (!cv) {
        throw new Error('OpenCV not available');
      }
      
      // Initialize camera
      this.camera = new cv.VideoCapture(0);
      if (!this.camera.isOpened()) {
        throw new Error('Could not open camera');
      }

      // Load face detection cascade
      this.faceDetector = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);
      
      // Initialize emotion detection (simplified version)
      // In a real implementation, you would use a proper ML model
      this.emotionClassifier = new EmotionClassifier();
      
      console.log('Facial Expression Detector initialized with OpenCV');
    } catch (error) {
      console.error('Error initializing Facial Expression Detector:', error);
      // Continue without camera for demo purposes
      this.simulateDetection();
    }
  }

  startDetection() {
    if (this.isDetecting) return;
    
    this.isDetecting = true;
    console.log('Started facial expression detection');
    
    if (this.camera) {
      this.detectLoop();
    } else {
      // Simulate detection for demo
      this.simulateDetection();
    }
  }

  stopDetection() {
    this.isDetecting = false;
    console.log('Stopped facial expression detection');
  }

  async detectLoop() {
    while (this.isDetecting) {
      try {
        const frame = this.camera.read();
        const faces = await this.detectFaces(frame);
        
        if (faces.length > 0) {
          const expression = await this.analyzeExpression(frame, faces[0]);
          if (expression) {
            this.emit('expression-detected', expression);
          }
        }

        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Error in detection loop:', error);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  async detectFaces(frame) {
    try {
      const gray = frame.bgrToGray();
      const faces = this.faceDetector.detectMultiScale(gray);
      return faces;
    } catch (error) {
      console.error('Error detecting faces:', error);
      return [];
    }
  }

  async analyzeExpression(frame, faceRect) {
    try {
      // Extract face region
      const faceRegion = frame.getRegion(faceRect);
      
      // Analyze facial features
      const features = await this.extractFacialFeatures(faceRegion);
      
      // Classify emotion
      const emotion = this.emotionClassifier.classify(features);
      
      return {
        emotion: emotion.label,
        confidence: emotion.confidence,
        timestamp: Date.now(),
        faceRect: faceRect,
        features: features
      };
    } catch (error) {
      console.error('Error analyzing expression:', error);
      return null;
    }
  }

  async extractFacialFeatures(faceRegion) {
    try {
      const gray = faceRegion.bgrToGray();
      
      // Detect eyes
      const eyeDetector = new cv.CascadeClassifier(cv.HAAR_EYE);
      const eyes = eyeDetector.detectMultiScale(gray);
      
      // Detect mouth
      const mouthDetector = new cv.CascadeClassifier(cv.HAAR_SMILE);
      const mouths = mouthDetector.detectMultiScale(gray);
      
      // Analyze facial symmetry and proportions
      const symmetry = this.calculateSymmetry(gray);
      const brightness = this.calculateAverageBrightness(gray);
      
      return {
        eyeCount: eyes.length,
        mouthCount: mouths.length,
        symmetry: symmetry,
        brightness: brightness,
        width: faceRegion.cols,
        height: faceRegion.rows
      };
    } catch (error) {
      console.error('Error extracting facial features:', error);
      return {};
    }
  }

  calculateSymmetry(grayImage) {
    // Simplified symmetry calculation
    // In reality, this would be much more sophisticated
    try {
      const cols = grayImage.cols;
      const mid = Math.floor(cols / 2);
      const leftHalf = grayImage.getCols(0, mid);
      const rightHalf = grayImage.getCols(mid, cols - mid);
      
      // Calculate correlation between left and right (mirrored)
      const correlation = this.calculateImageCorrelation(leftHalf, rightHalf.flipHorizontal());
      return correlation;
    } catch (error) {
      return 0.5;
    }
  }

  calculateImageCorrelation(img1, img2) {
    // Simplified correlation calculation
    // This would be more sophisticated in a real implementation
    return Math.random() * 0.5 + 0.5; // Placeholder
  }

  calculateAverageBrightness(grayImage) {
    try {
      const data = grayImage.getData();
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        sum += data[i]; // Red channel (same as grayscale)
      }
      return sum / (data.length / 4) / 255; // Normalize to 0-1
    } catch (error) {
      return 0.5;
    }
  }

  simulateDetection() {
    // Simulate facial expression detection for demo purposes
    const emotions = ['neutral', 'happy', 'surprised', 'confused'];
    let lastEmotion = 'neutral';
    
    const simulateExpression = () => {
      if (!this.isDetecting) return;
      
      // Randomly change emotion occasionally
      if (Math.random() < 0.3) {
        const newEmotion = emotions[Math.floor(Math.random() * emotions.length)];
        if (newEmotion !== lastEmotion) {
          lastEmotion = newEmotion;
          this.emit('expression-detected', {
            emotion: newEmotion,
            confidence: Math.random() * 0.4 + 0.6, // 0.6-1.0
            timestamp: Date.now(),
            simulated: true
          });
        }
      }
      
      setTimeout(simulateExpression, 2000 + Math.random() * 3000); // 2-5 seconds
    };
    
    simulateExpression();
  }
}

// Simple Emotion Classifier (placeholder implementation)
class EmotionClassifier {
  constructor() {
    this.emotions = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'disgusted', 'fearful', 'confused'];
  }

  classify(features) {
    // Simplified classification based on facial features
    // In reality, this would use a proper ML model
    
    let emotion = 'neutral';
    let confidence = 0.5;
    
    // Simple rule-based classification
    if (features.brightness > 0.7) {
      emotion = 'happy';
      confidence = 0.8;
    } else if (features.brightness < 0.3) {
      emotion = 'sad';
      confidence = 0.7;
    } else if (features.symmetry < 0.3) {
      emotion = 'confused';
      confidence = 0.6;
    }
    
    return { label: emotion, confidence: confidence };
  }
}

// Animation Controller for Avatar
class AnimationController extends EventEmitter {
  constructor() {
    super();
    this.currentAnimation = null;
    this.animations = {
      idle: { duration: 2000, loop: true },
      smile: { duration: 1000, loop: false },
      bounce: { duration: 1500, loop: true },
      shake: { duration: 800, loop: false },
      talk: { duration: 500, loop: true },
      pulse: { duration: 1200, loop: false },
      sleep: { duration: 3000, loop: true }
    };
  }

  async playAnimation(animationName) {
    const animation = this.animations[animationName];
    if (!animation) {
      console.warn(`Unknown animation: ${animationName}`);
      return false;
    }

    this.currentAnimation = animationName;
    this.emit('animation-start', { name: animationName, duration: animation.duration });

    return new Promise((resolve) => {
      if (animation.loop) {
        // For looping animations, we'll let them run until stopped
        resolve(true);
      } else {
        setTimeout(() => {
          this.emit('animation-complete', { name: animationName });
          resolve(true);
        }, animation.duration);
      }
    });
  }

  stop() {
    this.currentAnimation = null;
  }
}

module.exports = { AvatarManager };
