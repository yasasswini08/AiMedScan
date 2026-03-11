import { useState, useRef, useCallback } from "react";

export function useSpeechRecognition({ onResult }) {
  const [isRecording, setIsRecording] = useState(false);
  const [hint, setHint] = useState("");
  const recognitionRef = useRef(null);

  const supported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const start = useCallback(() => {
    if (!supported) {
      setHint("Speech recognition not supported in this browser.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsRecording(true);
      setHint("🎤 Listening… speak your symptoms now");
    };

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join(" ");
      onResult(transcript);
      setHint(`Heard: "${transcript}"`);
    };

    recognition.onerror = (e) => {
      setHint(`Error: ${e.error}. Please try again.`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setTimeout(() => setHint(""), 3000);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [supported, onResult]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  const toggle = useCallback(() => {
    if (isRecording) stop();
    else start();
  }, [isRecording, start, stop]);

  return { isRecording, hint, toggle, supported };
}
