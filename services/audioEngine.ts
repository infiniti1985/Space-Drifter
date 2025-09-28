class AudioEngine {
    private audioContext: AudioContext | null = null;
    private musicState = {
        isPlaying: false,
        intervalId: null as any,
        nextNoteTime: 0.0,
        current16thNote: 0,
    };

    private noteFreqs: { [key: string]: number } = {
        'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
        'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
        'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'G4': 392.00,
    };

    private musicData = {
        bpm: 160,
        // Power chords progression (Am, G, F, E)
        chords: [
            ['A3', 'E4'], // A5 power chord
            ['G3', 'D4'], // G5 power chord
            ['F3', 'C4'], // F5 power chord
            ['E3', 'B3'], // E5 power chord
        ],
        bassline: [ // Root notes on eighths
            'A2', 'A2', 'A2', 'A2', 'G2', 'G2', 'G2', 'G2',
            'F2', 'F2', 'F2', 'F2', 'E2', 'E2', 'E2', 'E2',
        ],
        // Fast arpeggio
        arpeggio: [0, 1, null, 1, 0, 1, null, 1, 0, 1, null, 1, 0, 1, null, 1],
    };

    private init() {
        if (!this.audioContext && typeof window !== 'undefined') {
            try {
                // @ts-ignore
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.error("Web Audio API is not supported in this browser");
            }
        }
        return !!this.audioContext;
    }
    
    public unlockAudio() {
        if (!this.init()) return;
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    playSound(type: 'shoot' | 'explosion' | 'hit' | 'collect' | 'jump' | 'missile' | 'mission_complete' | 'confirm' | 'error' | 'click') {
        if (!this.init() || !this.audioContext) return;

        const now = this.audioContext.currentTime;

        switch (type) {
            case 'shoot': {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.exponentialRampToValueAtTime(220, now + 0.1);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                osc.start(now);
                osc.stop(now + 0.1);
                
                const noise = this.audioContext.createBufferSource();
                const bufferSize = this.audioContext.sampleRate * 0.05;
                const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
                noise.buffer = buffer;
                
                const noiseGain = this.audioContext.createGain();
                noiseGain.gain.setValueAtTime(0.1, now);
                noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
                
                noise.connect(noiseGain);
                noiseGain.connect(this.audioContext.destination);
                noise.start(now);
                noise.stop(now + 0.05);
                break;
            }
            case 'explosion': {
                const thump = this.audioContext.createOscillator();
                const thumpGain = this.audioContext.createGain();
                thump.type = 'sine';
                thump.frequency.setValueAtTime(120, now);
                thump.frequency.exponentialRampToValueAtTime(30, now + 0.3);
                thumpGain.gain.setValueAtTime(0.8, now);
                thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                thump.connect(thumpGain);
                thumpGain.connect(this.audioContext.destination);
                thump.start(now);
                thump.stop(now + 0.3);

                for (let i = 0; i < 3; i++) {
                    const noise = this.audioContext.createBufferSource();
                    const duration = 0.5 + Math.random() * 0.5;
                    const bufferSize = this.audioContext.sampleRate * duration;
                    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
                    const data = buffer.getChannelData(0);
                    for (let j = 0; j < bufferSize; j++) { data[j] = Math.random() * 2 - 1; }
                    noise.buffer = buffer;

                    const filter = this.audioContext.createBiquadFilter();
                    filter.type = 'bandpass';
                    filter.frequency.value = 500 + Math.random() * 1500;
                    filter.Q.value = 1;

                    const noiseGain = this.audioContext.createGain();
                    noiseGain.gain.setValueAtTime(0.4, now);
                    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

                    noise.connect(filter);
                    filter.connect(noiseGain);
                    noiseGain.connect(this.audioContext.destination);
                    noise.start(now);
                    noise.stop(now + duration);
                }
                break;
            }
            case 'hit': {
                const carrier = this.audioContext.createOscillator();
                const modulator = this.audioContext.createOscillator();
                const carrierGain = this.audioContext.createGain();
                const modulatorGain = this.audioContext.createGain();

                modulator.type = 'sine';
                modulator.frequency.value = 350;
                modulatorGain.gain.value = 500;

                carrier.type = 'sine';
                carrier.frequency.value = 200;

                carrierGain.gain.setValueAtTime(0.5, now);
                carrierGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
                
                modulator.connect(modulatorGain);
                modulatorGain.connect(carrier.frequency);
                carrier.connect(carrierGain);
                carrierGain.connect(this.audioContext.destination);

                modulator.start(now);
                carrier.start(now);
                modulator.stop(now + 0.2);
                carrier.stop(now + 0.2);
                break;
            }
            case 'collect': {
                const notes = [880.00, 1046.50, 1318.51];
                const gain = this.audioContext.createGain();
                gain.gain.value = 0.3;
                gain.connect(this.audioContext.destination);
                
                notes.forEach((freq, i) => {
                    const osc = this.audioContext.createOscillator();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + i * 0.08);
                    
                    const noteGain = this.audioContext.createGain();
                    noteGain.gain.setValueAtTime(0, now + i * 0.08);
                    noteGain.gain.linearRampToValueAtTime(1, now + i * 0.08 + 0.01);
                    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.2);
                    
                    osc.connect(noteGain);
                    noteGain.connect(gain);
                    osc.start(now + i * 0.08);
                    osc.stop(now + i * 0.08 + 0.2);
                });
                break;
            }
            case 'jump': {
                const noise = this.audioContext.createBufferSource();
                const bufferSize = this.audioContext.sampleRate * 1.5;
                const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
                noise.buffer = buffer;

                const filter = this.audioContext.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(100, now);
                filter.frequency.exponentialRampToValueAtTime(8000, now + 1.2);
                filter.Q.value = 5;

                const gain = this.audioContext.createGain();
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.4, now + 0.1);
                gain.gain.linearRampToValueAtTime(0, now + 1.5);
                
                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.audioContext.destination);
                noise.start(now);
                noise.stop(now + 1.5);

                const osc = this.audioContext.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(2000, now + 1.2);
                osc.connect(gain);
                osc.start(now);
                osc.stop(now + 1.5);
                break;
            }
            case 'missile': {
                const noise = this.audioContext.createBufferSource();
                const bufferSize = this.audioContext.sampleRate * 0.8;
                const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
                noise.buffer = buffer;

                const filter = this.audioContext.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.value = 800;
                filter.Q.value = 10;
                
                const gain = this.audioContext.createGain();
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.8);
                
                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.audioContext.destination);
                noise.start(now);
                noise.stop(now + 0.8);
                break;
            }
            case 'mission_complete': {
                const notes = [523.25, 659.25, 783.99, 1046.50];
                const gain = this.audioContext.createGain();
                gain.connect(this.audioContext.destination);
                
                notes.forEach((freq, i) => {
                    const osc = this.audioContext.createOscillator();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + i * 0.15);
                    const noteGain = this.audioContext.createGain();
                    noteGain.gain.setValueAtTime(0, now + i * 0.15);
                    noteGain.gain.linearRampToValueAtTime(0.4, now + i * 0.15 + 0.02);
                    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.15 + 0.3);
                    osc.connect(noteGain);
                    noteGain.connect(gain);
                    osc.start(now + i * 0.15);
                    osc.stop(now + i * 0.15 + 0.3);
                });
                break;
            }
            case 'confirm':
            case 'click': {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1200, now);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            }
            case 'error': {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                osc.type = 'square';
                osc.frequency.setValueAtTime(155, now);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;
            }
        }
    }

    playMusic() {
        if (!this.init() || this.musicState.isPlaying) return;
        if (this.audioContext?.state === 'suspended') {
             // Wait for user interaction to unlock audio
            return;
        }
        this.musicState.isPlaying = true;
        this.musicState.current16thNote = 0;
        this.musicState.nextNoteTime = this.audioContext.currentTime + 0.1;
        this.musicState.intervalId = setInterval(() => this.musicScheduler(), 50);
    }

    stopMusic() {
        if (!this.musicState.isPlaying) return;
        this.musicState.isPlaying = false;
        if (this.musicState.intervalId) {
            clearInterval(this.musicState.intervalId);
            this.musicState.intervalId = null;
        }
    }

    private musicScheduler() {
        if (!this.musicState.isPlaying || !this.audioContext) return;
        
        const scheduleAheadTime = 0.15;
        
        while (this.musicState.nextNoteTime < this.audioContext.currentTime + scheduleAheadTime) {
            this.scheduleNextBeat(this.musicState.nextNoteTime);
            
            const secondsPer16thNote = 60.0 / this.musicData.bpm / 4.0;
            this.musicState.nextNoteTime += secondsPer16thNote;
        }
    }

    private scheduleNextBeat(time: number) {
        if (!this.audioContext) return;

        const { chords, bassline, arpeggio } = this.musicData;
        const { current16thNote } = this.musicState;
        
        const sequencePosition = current16thNote % (16 * chords.length);
        const barPosition = sequencePosition % 16;
        
        const chordIndex = Math.floor(sequencePosition / 16);
        const currentChord = chords[chordIndex];

        if (barPosition % 8 === 0) { this.playKick(time, 0.6); }
        if (barPosition % 8 === 4) { this.playSnare(time, 0.5); }
        if (barPosition % 4 === 2) { this.playNoise(time, 0.15, 8000, 0.1, 'highpass'); }
        if (barPosition % 2 === 0) {
            const bassNoteName = bassline[Math.floor(barPosition/2) % bassline.length];
            const freq = this.noteFreqs[bassNoteName];
            if (freq) this.playNote(time, freq, 0.15, 'sawtooth', 0.4);
        }
        
        const arpIndex = arpeggio[barPosition];
        if (arpIndex !== null) {
            const arpNoteName = currentChord[arpIndex];
            const freq = this.noteFreqs[arpNoteName];
            if (freq) this.playNote(time, freq, 0.1, 'square', 0.2, 5);
        }

        this.musicState.current16thNote++;
    }

    private playKick(time: number, volume: number) {
        if (!this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(time);
        osc.stop(time + 0.12);
    }

    private playSnare(time: number, volume: number) {
        if (!this.audioContext) return;
        this.playNoise(time, 0.1, 1000, volume, 'highpass');
        const osc = this.audioContext.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, time);
        const oscGain = this.audioContext.createGain();
        oscGain.gain.setValueAtTime(volume * 0.8, time);
        oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
        osc.connect(oscGain);
        oscGain.connect(this.audioContext.destination);
        osc.start(time);
        osc.stop(time + 0.08);
    }

    private playNote(time: number, freq: number, durationSec: number, type: OscillatorType, volume: number, vibratoAmount: number = 0) {
        if (!this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);
        
        if (vibratoAmount > 0) {
            const vibrato = this.audioContext.createOscillator();
            vibrato.frequency.setValueAtTime(6, time);
            const vibratoGain = this.audioContext.createGain();
            vibratoGain.gain.setValueAtTime(vibratoAmount, time);
            vibrato.connect(vibratoGain);
            vibratoGain.connect(osc.frequency);
            vibrato.start(time);
            vibrato.stop(time + durationSec);
        }

        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + durationSec);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(time);
        osc.stop(time + durationSec);
    }
    
    private playNoise(time: number, durationSec: number, freq: number, volume: number, filterType: BiquadFilterType) {
        if (!this.audioContext) return;
        const noise = this.audioContext.createBufferSource();
        const bufferSize = this.audioContext.sampleRate * durationSec;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
        noise.buffer = buffer;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.setValueAtTime(freq, time);
        
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + durationSec);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);
        noise.start(time);
        noise.stop(time + durationSec);
    }
}

export const audioEngine = new AudioEngine();
