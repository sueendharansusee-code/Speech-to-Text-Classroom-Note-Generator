/**
 * SpeechRecognitionController
 * Manages browser Web Speech API recognition lifecycle, events, permission errors, and auto-reconnects.
 */
class SpeechController {
    constructor() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.isSupported = !!SpeechRecognition;
        this.recognition = this.isSupported ? new SpeechRecognition() : null;
        this.isRecording = false;
        this.shouldKeepListening = false;
        this.language = 'en-US';

        // Callbacks
        this.onResultCallback = null;
        this.onErrorCallback = null;
        this.onStatusChangeCallback = null;

        if (this.isSupported) {
            this.setupRecognition();
        }
    }

    setupRecognition() {
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.language;

        this.recognition.onstart = () => {
            this.isRecording = true;
            if (this.onStatusChangeCallback) {
                this.onStatusChangeCallback({ status: 'recording', message: 'Listening to classroom speech...' });
            }
        };

        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            if (this.onResultCallback) {
                this.onResultCallback({
                    finalText: finalTranscript,
                    interimText: interimTranscript
                });
            }
        };

        this.recognition.onerror = (event) => {
            console.warn('Speech Recognition Error:', event.error);
            let errorMessage = 'An error occurred during speech recognition.';

            switch (event.error) {
                case 'not-allowed':
                case 'permission-denied':
                    errorMessage = 'Microphone permission denied! Please click the camera/mic icon in your address bar to allow access.';
                    this.shouldKeepListening = false;
                    break;
                case 'no-speech':
                    errorMessage = 'No speech detected. Microphone is active and listening...';
                    // Do not stop recording state for no-speech, it auto-resumes
                    return;
                case 'audio-capture':
                    errorMessage = 'No microphone hardware was detected on your device.';
                    this.shouldKeepListening = false;
                    break;
                case 'network':
                    errorMessage = 'Network connection error for speech recognition service.';
                    break;
                case 'aborted':
                    errorMessage = 'Speech recognition was stopped.';
                    break;
                default:
                    errorMessage = `Speech error: ${event.error}`;
            }

            if (this.onErrorCallback) {
                this.onErrorCallback({ error: event.error, message: errorMessage });
            }
        };

        this.recognition.onend = () => {
            // Auto-restart if user still wants to record (browsers automatically stop recognition on long silence)
            if (this.shouldKeepListening) {
                try {
                    this.recognition.start();
                } catch (e) {
                    console.log('Restarting recognition...', e);
                }
            } else {
                this.isRecording = false;
                if (this.onStatusChangeCallback) {
                    this.onStatusChangeCallback({ status: 'stopped', message: 'Recording stopped.' });
                }
            }
        };
    }

    setLanguage(langCode) {
        this.language = langCode;
        if (this.recognition) {
            this.recognition.lang = langCode;
        }
    }

    start() {
        if (!this.isSupported) {
            if (this.onErrorCallback) {
                this.onErrorCallback({
                    error: 'unsupported',
                    message: 'Web Speech API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.'
                });
            }
            return false;
        }

        try {
            this.shouldKeepListening = true;
            this.recognition.start();
            return true;
        } catch (e) {
            console.error('Failed to start speech recognition:', e);
            if (this.onErrorCallback) {
                this.onErrorCallback({ error: 'start_failed', message: 'Could not activate microphone. ' + e.message });
            }
            return false;
        }
    }

    stop() {
        if (this.isSupported && this.shouldKeepListening) {
            this.shouldKeepListening = false;
            try {
                this.recognition.stop();
            } catch (e) {
                console.warn('Error stopping recognition:', e);
            }
        }
        this.isRecording = false;
    }
}

// Global instance
window.speechController = new SpeechController();
