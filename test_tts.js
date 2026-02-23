const { exec } = require('child_process');
const text = 'Hello, this is Kyra';
const command = \PowerShell -Command "Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Female); $s.Speak('\')"\;
exec(command, (error) => {
    if (error) console.error(error);
    else console.log('success');
});
