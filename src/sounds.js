class SoundManager {
    constructor() {
        this.sounds = {};
        this.muted = localStorage.getItem('soundMuted') === 'true';
        this.volume = localStorage.getItem('volume') || 0.5;
        this.loaded = false;
        this.initSounds();
    }

    initSounds() {
        const soundFiles = {
            move: 'sounds/move.mp3',
            merge: 'sounds/merge.mp3',
            gameOver: 'sounds/gameover.mp3',
            newGame: 'sounds/newgame.mp3'
        };

        let loadedCount = 0;
        const totalSounds = Object.keys(soundFiles).length;

        // Initialize each sound
        for (const [name, path] of Object.entries(soundFiles)) {
            const audio = new Audio();
            
            audio.addEventListener('canplaythrough', () => {
                loadedCount++;
                if (loadedCount === totalSounds) {
                    this.loaded = true;
                    console.log('All sounds loaded successfully');
                }
            });

            audio.addEventListener('error', (e) => {
                console.error(`Error loading sound ${name}:`, e);
            });

            audio.src = path;
            audio.volume = this.volume;
            audio.load();
            this.sounds[name] = audio;
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        localStorage.setItem('volume', this.volume);
        
        // Update volume for all sounds
        Object.values(this.sounds).forEach(sound => {
            sound.volume = this.volume;
        });
    }

    getVolume() {
        return this.volume;
    }

    playSound(soundName) {
        if (this.muted || !this.sounds[soundName] || !this.loaded) return;

        try {
            // Create a new instance for overlapping sounds
            const sound = this.sounds[soundName].cloneNode();
            sound.volume = this.volume;
            
            // Play with error handling
            sound.play().catch(error => {
                console.error(`Error playing sound ${soundName}:`, error);
            });
        } catch (error) {
            console.error('Error playing sound:', soundName, error);
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('soundMuted', this.muted);
        return this.muted;
    }

    isMuted() {
        return this.muted;
    }
}

// Create and expose the sound manager instance
window.soundManager = new SoundManager();
