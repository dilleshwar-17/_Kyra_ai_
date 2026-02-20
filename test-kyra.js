// Test script for KYRA AI Assistant
const path = require('path');

console.log('🧪 Testing KYRA AI Assistant Integration...\n');

// Test 1: Check if all modules can be loaded
console.log('1. Testing module imports...');
try {
    const { AIEngine } = require('./src/main/ai-engine');
    console.log('   ✅ AI Engine loaded successfully');
    
    const { VoiceController } = require('./src/main/voice-controller');
    console.log('   ✅ Voice Controller loaded successfully');
    
    const { DesktopAutomation } = require('./src/main/desktop-automation');
    console.log('   ✅ Desktop Automation loaded successfully');
    
    const { AvatarManager } = require('./src/main/avatar-manager');
    console.log('   ✅ Avatar Manager loaded successfully');
    
} catch (error) {
    console.log('   ❌ Module loading failed:', error.message);
}

// Test 2: Initialize components (without dependencies)
console.log('\n2. Testing component initialization...');
try {
    // Test AI Engine
    const { AIEngine } = require('./src/main/ai-engine');
    const aiEngine = new AIEngine();
    console.log('   ✅ AI Engine initialized');
    
    // Test Desktop Automation
    const { DesktopAutomation } = require('./src/main/desktop-automation');
    const desktopAutomation = new DesktopAutomation();
    console.log('   ✅ Desktop Automation initialized');
    
    // Test Voice Controller
    const { VoiceController } = require('./src/main/voice-controller');
    const voiceController = new VoiceController();
    console.log('   ✅ Voice Controller initialized');
    
    // Test Avatar Manager (simplified)
    const { AvatarManager } = require('./src/main/avatar-manager');
    const avatarManager = new AvatarManager();
    console.log('   ✅ Avatar Manager initialized');
    
} catch (error) {
    console.log('   ❌ Component initialization failed:', error.message);
    console.log('   This might be due to missing system dependencies like opencv4nodejs');
    console.log('   The system will work in simulation mode for demo purposes.');
}

// Test 3: Test basic functionality
console.log('\n3. Testing basic functionality...');
try {
    const { AIEngine } = require('./src/main/ai-engine');
    const aiEngine = new AIEngine();
    
    // Test message processing
    const testResponse = aiEngine.processMessage('Hello KYRA');
    console.log('   ✅ Message processing test:', testResponse.text ? 'PASS' : 'FAIL');
    
    const { DesktopAutomation } = require('./src/main/desktop-automation');
    const desktopAutomation = new DesktopAutomation();
    
    // Test command parsing
    const commandTest = desktopAutomation.parseCommand('open calculator');
    console.log('   ✅ Command parsing test:', commandTest ? 'PASS' : 'FAIL');
    
} catch (error) {
    console.log('   ❌ Functionality test failed:', error.message);
}

// Test 4: Check file structure
console.log('\n4. Testing file structure...');
const fs = require('fs');
const requiredFiles = [
    'src/main/main.js',
    'src/main/ai-engine.js',
    'src/main/voice-controller.js',
    'src/main/desktop-automation.js',
    'src/main/avatar-manager.js',
    'src/renderer/index.html',
    'src/renderer/index.js',
    'src/renderer/styles.css',
    'package.json'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`   ✅ ${file}`);
    } else {
        console.log(`   ❌ ${file} - MISSING`);
        allFilesExist = false;
    }
});

console.log('\n' + '='.repeat(50));
if (allFilesExist) {
    console.log('🎉 KYRA AI Assistant is ready for testing!');
    console.log('\nTo start the application:');
    console.log('  npm start');
    console.log('\nGlobal shortcuts:');
    console.log('  Ctrl+Shift+K - Toggle voice recognition');
    console.log('  Ctrl+Shift+J - Show/hide KYRA');
} else {
    console.log('⚠️  Some files are missing. Please check the file structure.');
}

console.log('\n' + '='.repeat(50));
console.log('Test completed! 🚀');