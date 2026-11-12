import { useCallback, useEffect, useRef, useState } from 'react';

const cleanForSpeech = (text) =>
  String(text || '')
    .replace(/```[\s\S]*?```/g, ' code block ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^\s*[•*-]\s+/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`>#]/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .trim();

export const useSpeechSynthesis = ({ lang = 'en-US', voiceURI = '', rate = 1 } = {}) => {
  const supported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window;

  const [voices, setVoices] = useState([]);
  const [speakingId, setSpeakingId] = useState(null);
  const [error, setError] = useState(null);
  const optionsRef = useRef({ lang, voiceURI, rate });
  optionsRef.current = { lang, voiceURI, rate };

  useEffect(() => {
    if (!supported) return undefined;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, [supported]);

  const speak = useCallback(
    (text, id = 'message') => {
      if (!supported) return false;
      const cleaned = cleanForSpeech(text).slice(0, 6000);
      if (!cleaned) return false;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleaned);
      const current = optionsRef.current;
      utterance.lang = current.lang || 'en-US';
      utterance.rate = Math.min(Math.max(Number(current.rate) || 1, 0.6), 1.6);
      utterance.pitch = 1;

      const available = window.speechSynthesis.getVoices();
      const byUri = current.voiceURI
        ? available.find((voice) => voice.voiceURI === current.voiceURI)
        : null;
      const byLang =
        available.find(
          (voice) => voice.lang?.toLowerCase() === (current.lang || '').toLowerCase()
        ) ||
        available.find((voice) =>
          voice.lang?.toLowerCase().startsWith((current.lang || '').slice(0, 2).toLowerCase())
        );
      const voice = byUri || byLang;
      if (voice) {
        try {
          utterance.voice = voice;
        } catch {
          // Some browsers reject voices that are not native SpeechSynthesisVoice objects.
        }
      }

      utterance.onend = () => {
        setSpeakingId((currentId) => (currentId === id ? null : currentId));
      };
      utterance.onerror = (event) => {
        if (!['interrupted', 'canceled'].includes(event.error)) {
          setError('Speech playback failed.');
        }
        setSpeakingId((currentId) => (currentId === id ? null : currentId));
      };

      setError(null);
      setSpeakingId(id);
      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        setError('Speech playback failed.');
        setSpeakingId(null);
        return false;
      }
      return true;
    },
    [supported]
  );

  return {
    supported,
    voices,
    speakingId,
    speak,
    stop,
    error,
    isSpeaking: Boolean(speakingId),
  };
};
