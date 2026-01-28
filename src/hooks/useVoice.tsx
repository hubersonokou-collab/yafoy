import { useState, useCallback, useEffect, useRef } from 'react';

interface UseVoiceOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

interface UseVoiceReturn {
  // Speech Recognition
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  
  // Text-to-Speech
  isSpeaking: boolean;
  speak: (text: string, options?: SpeechSynthesisOptions) => void;
  stopSpeaking: () => void;
  
  // Feature detection
  isSupported: boolean;
  isTTSSupported: boolean;
}

interface SpeechSynthesisOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice;
  lang?: string;
}

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionInterface extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInterface;
}

// Extend Window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export function useVoice(options: UseVoiceOptions = {}): UseVoiceReturn {
  const {
    language = 'fr-FR',
    continuous = false,
    interimResults = true,
    onResult,
    onError,
    onEnd,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognitionInterface | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Feature detection
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  
  const isTTSSupported = typeof window !== 'undefined' && 
    'speechSynthesis' in window;

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);
      
      if (onResult) {
        onResult(currentTranscript, !!finalTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      if (onError) {
        const errorMessages: Record<string, string> = {
          'not-allowed': 'Accès au microphone refusé',
          'no-speech': 'Aucune parole détectée',
          'network': 'Erreur réseau',
          'aborted': 'Reconnaissance annulée',
          'audio-capture': 'Pas de microphone détecté',
          'service-not-allowed': 'Service non autorisé',
        };
        onError(errorMessages[event.error] || `Erreur: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (onEnd) {
        onEnd();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language, continuous, interimResults, onResult, onError, onEnd, isSupported]);

  // Initialize speech synthesis
  useEffect(() => {
    if (!isTTSSupported) return;
    synthRef.current = window.speechSynthesis;
  }, [isTTSSupported]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    
    setTranscript('');
    setIsListening(true);
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    
    recognitionRef.current.stop();
    setIsListening(false);
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  const speak = useCallback((text: string, speechOptions: SpeechSynthesisOptions = {}) => {
    if (!synthRef.current || !text.trim()) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechOptions.lang || language;
    utterance.rate = speechOptions.rate ?? 1;
    utterance.pitch = speechOptions.pitch ?? 1;
    utterance.volume = speechOptions.volume ?? 1;

    if (speechOptions.voice) {
      utterance.voice = speechOptions.voice;
    } else {
      // Try to find a French voice
      const voices = synthRef.current.getVoices();
      const frenchVoice = voices.find(v => v.lang.startsWith('fr'));
      if (frenchVoice) {
        utterance.voice = frenchVoice;
      }
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  }, [language]);

  const stopSpeaking = useCallback(() => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSpeaking,
    speak,
    stopSpeaking,
    isSupported,
    isTTSSupported,
  };
}

// Custom hook for getting available voices
export function useVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  return voices;
}
