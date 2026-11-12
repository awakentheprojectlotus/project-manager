import { useCallback, useEffect, useRef, useState } from 'react';

const getRecognition = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export const useSpeechRecognition = ({ lang = 'en-US', onFinal, onError } = {}) => {
  const supported = Boolean(getRecognition());
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const recognitionRef = useRef(null);
  const finalRef = useRef('');
  const emittedRef = useRef(false);
  const onFinalRef = useRef(onFinal);
  const onErrorRef = useRef(onError);
  const langRef = useRef(lang);
  onFinalRef.current = onFinal;
  onErrorRef.current = onError;
  langRef.current = lang;

  useEffect(() => {
    if (!supported) return undefined;
    const Recognition = getRecognition();
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = langRef.current || 'en-US';

    recognition.onstart = () => {
      setListening(true);
      setInterim('');
    };

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript || '';
        if (result.isFinal) finalText += `${transcript} `;
        else interimText += transcript;
      }
      if (finalText.trim()) {
        finalRef.current = `${finalRef.current} ${finalText}`.trim();
        setFinalTranscript(finalRef.current);
      }
      setInterim(interimText.trim());
    };

    recognition.onerror = (event) => {
      setListening(false);
      setInterim('');
      emittedRef.current = true;
      const code = event.error || 'unknown';
      if (code !== 'aborted') onErrorRef.current?.(code);
    };

    recognition.onend = () => {
      setListening(false);
      setInterim('');
      if (!emittedRef.current && finalRef.current.trim()) {
        emittedRef.current = true;
        onFinalRef.current?.(finalRef.current.trim());
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, [supported]);

  const start = useCallback(() => {
    if (!supported) return false;
    const recognition = recognitionRef.current;
    if (!recognition || listening) return false;

    try {
      window.speechSynthesis?.cancel();
    } catch {
      // ignore
    }

    finalRef.current = '';
    emittedRef.current = false;
    setFinalTranscript('');
    setInterim('');
    recognition.lang = langRef.current || 'en-US';

    try {
      recognition.start();
      setListening(true);
      return true;
    } catch {
      setListening(false);
      return false;
    }
  }, [supported, listening]);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
  }, []);

  const abort = useCallback(() => {
    try {
      recognitionRef.current?.abort();
    } catch {
      // ignore
    }
    emittedRef.current = true;
    finalRef.current = '';
    setInterim('');
    setListening(false);
  }, []);

  return {
    supported,
    listening,
    interim,
    finalTranscript,
    start,
    stop,
    abort,
  };
};
