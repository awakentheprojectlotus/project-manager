import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { ArrowUp, Eraser, Mic, MicOff, Sparkles, VolumeX } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { useChatStore } from '../../stores/chatStore';
import { useUiStore } from '../../stores/uiStore';
import { AI_SUGGESTIONS } from '../../constants';
import { getAiProviderLabel } from '../../constants/ai';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

const SPEECH_ERRORS = {
  'not-allowed': 'Microphone permission was denied. Allow mic access for this site and try again.',
  'service-not-allowed': 'Microphone access is blocked by the browser.',
  'audio-capture': 'No microphone was found. Check your device and try again.',
  network: 'Speech recognition needs a network connection.',
  'no-speech': 'No speech was detected. Tap the mic and try again.',
  'language-not-supported':
    'This language is not supported for voice input in your browser. Choose another language in Settings.',
  'bad-grammar': 'Voice input could not understand that. Try again.',
};

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-sm">
        <Sparkles className="h-4 w-4" />
      </span>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-edge bg-surface px-3.5 py-3 shadow-sm">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-brand-400"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
        <span className="ml-1 text-[11px] text-muted">Checking your workspace…</span>
      </div>
    </div>
  );
}

export default function ChatWindow() {
  const messages = useChatStore((s) => s.messages);
  const isThinking = useChatStore((s) => s.isThinking);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const clearConversation = useChatStore((s) => s.clearConversation);
  const lastEngine = useChatStore((s) => s.lastEngine);
  const prefs = useUiStore((s) => s.prefs);
  const confirm = useUiStore((s) => s.confirm);
  const pushToast = useUiStore((s) => s.pushToast);

  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const previousCountRef = useRef(messages.length);

  const tts = useSpeechSynthesis({
    lang: prefs.speechLang || 'en-US',
    voiceURI: prefs.ttsVoiceURI || '',
    rate: prefs.ttsRate || 1,
  });

  const send = (text) => {
    const value = (text ?? draft).trim();
    if (!value || isThinking) return;
    if (tts.isSpeaking) tts.stop();
    sendMessage(value);
    setDraft('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleSpeechError = (code) => {
    if (code === 'aborted') return;
    pushToast({
      type: code === 'no-speech' ? 'info' : 'error',
      title: code === 'no-speech' ? 'No speech detected' : 'Voice input issue',
      message: SPEECH_ERRORS[code] || 'Voice input could not start. Try again.',
    });
  };

  const speech = useSpeechRecognition({
    lang: prefs.speechLang || 'en-US',
    onFinal: (transcript) => {
      setDraft(transcript);
      if (prefs.voiceAutoSend !== false) send(transcript);
    },
    onError: handleSpeechError,
  });

  const toggleListening = () => {
    if (isThinking) return;
    if (!speech.supported) {
      pushToast({
        type: 'info',
        title: 'Voice input not supported',
        message: 'Use Chrome or Edge for microphone input, or type your message instead.',
      });
      return;
    }
    if (speech.listening) speech.stop();
    else speech.start();
  };

  const handleSpeak = (message) => {
    if (!tts.supported) {
      pushToast({
        type: 'info',
        title: 'Text-to-speech not supported',
        message: 'This browser does not support spoken replies.',
      });
      return;
    }
    if (tts.speakingId === message.id) tts.stop();
    else tts.speak(message.content, message.id);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages.length, isThinking]);

  // Speak newly arrived assistant replies when auto-read is enabled.
  useEffect(() => {
    if (messages.length > previousCountRef.current) {
      const last = messages[messages.length - 1];
      const createdRecently =
        last?.createdAt && Date.now() - new Date(last.createdAt).getTime() < 20000;
      if (
        last?.role === 'assistant' &&
        createdRecently &&
        prefs.ttsEnabled !== false &&
        tts.supported &&
        !isThinking
      ) {
        tts.speak(last.content, last.id);
      }
    }
    previousCountRef.current = messages.length;
  }, [messages, prefs.ttsEnabled, tts.supported, tts.speak, isThinking, tts]);

  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  };

  const handleClear = async () => {
    const ok = await confirm({
      title: 'Clear this conversation?',
      description: 'Your workspace data is not affected — only the chat history is removed.',
      confirmLabel: 'Clear chat',
      tone: 'warning',
    });
    if (!ok) return;
    tts.stop();
    speech.abort();
    clearConversation();
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-edge bg-surface shadow-card">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-edge px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-sm">
            <Sparkles className="h-[18px] w-[18px]" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface bg-emerald-500" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">Pulse AI Assistant</p>
            <p className="flex items-center gap-1.5 text-[10.5px] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Connected to live workspace data
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastEngine && (
            <span
              className={clsx(
                'hidden rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset sm:block',
                lastEngine === 'gemini'
                  ? 'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-300'
                  : lastEngine === 'opencode'
                    ? 'bg-brand-50 text-brand-700 ring-brand-600/20 dark:bg-brand-500/10 dark:text-brand-300'
                    : 'bg-elevated text-muted ring-edge'
              )}
            >
              {lastEngine !== 'local' ? `${getAiProviderLabel(lastEngine)} connected` : 'Local engine'}
            </span>
          )}
          {tts.isSpeaking && (
            <button
              type="button"
              onClick={tts.stop}
              className="grid h-8 w-8 place-items-center rounded-lg text-brand-600 transition hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/10"
              aria-label="Stop reading replies"
              title="Stop reading"
            >
              <VolumeX className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-elevated hover:text-ink"
            aria-label="Clear conversation"
            title="Clear conversation"
          >
            <Eraser className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="scrollbar-thin min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onSpeak={handleSpeak}
            speaking={tts.speakingId === message.id}
            ttsSupported={tts.supported}
          />
        ))}
        {isThinking && <TypingIndicator />}
      </div>

      <div className="shrink-0 border-t border-edge bg-canvas/30 px-3 pb-3 pt-2.5">
        <div className="no-scrollbar mb-2 flex gap-1.5 overflow-x-auto">
          {AI_SUGGESTIONS.slice(0, 6).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={isThinking}
              onClick={() => send(suggestion)}
              className="shrink-0 rounded-full border border-edge bg-surface px-2.5 py-1 text-[10.5px] font-medium text-muted transition hover:border-brand-200 hover:text-brand-700 disabled:opacity-50 dark:hover:border-brand-500/30 dark:hover:text-brand-300"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {speech.listening && (
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 px-2.5 py-1.5 text-[11px] text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </span>
            <span className="font-medium">Listening</span>
            <span className="min-w-0 flex-1 truncate text-rose-600/80 dark:text-rose-300/80">
              {speech.interim || 'Speak now…'}
            </span>
            <button
              type="button"
              onClick={speech.stop}
              className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20 transition hover:bg-white/60 dark:text-rose-200 dark:ring-rose-400/30"
            >
              Stop
            </button>
          </div>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
          className="flex items-end gap-2 rounded-2xl border border-edge bg-surface p-1.5 shadow-sm transition focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/10"
        >
          <button
            type="button"
            onClick={toggleListening}
            disabled={isThinking}
            className={clsx(
              'grid h-9 w-9 shrink-0 place-items-center rounded-xl transition disabled:opacity-40',
              speech.listening
                ? 'bg-rose-600 text-white shadow-sm hover:bg-rose-700'
                : 'border border-edge bg-surface text-muted hover:bg-canvas hover:text-ink'
            )}
            aria-label={speech.listening ? 'Stop voice input' : 'Start voice input'}
            title={
              !speech.supported
                ? 'Voice input is not supported in this browser'
                : speech.listening
                  ? 'Stop listening'
                  : 'Speak your message'
            }
          >
            {speech.listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              resize();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            placeholder="Ask about progress, or tell me what to update…"
            className="max-h-[132px] min-h-[36px] flex-1 resize-none bg-transparent px-2.5 py-2 text-[13px] text-ink outline-none placeholder:text-muted"
            aria-label="Message Pulse AI"
          />
          <button
            type="submit"
            disabled={!draft.trim() || isThinking}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-600 text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-40"
            aria-label="Send message"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-1.5 px-1 text-center text-[9.5px] text-muted">
          AI actions are validated and applied to your workspace. Destructive changes always ask for confirmation.
        </p>
      </div>
    </div>
  );
}
