export const playRingtone = (): (() => void) => {
  let audioContext: AudioContext | null = null;
  let oscillator: OscillatorNode | null = null;

  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
    oscillator.frequency.setValueAtTime(493.88, audioContext.currentTime + 0.5); // B4 note
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
  } catch (error) {
    console.error('Error initializing ringtone:', error);
  }

  return () => {
    if (oscillator) {
      try {
        oscillator.stop();
        oscillator.disconnect();
      } catch (error) {
        console.warn('Error stopping oscillator:', error);
      }
    }
    if (audioContext && audioContext.state !== 'closed') {
      try {
        audioContext.close();
      } catch (error) {
        console.warn('Error closing AudioContext:', error);
      }
    }
    oscillator = null;
    audioContext = null;
  };
};