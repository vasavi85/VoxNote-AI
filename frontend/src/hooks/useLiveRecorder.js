import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook to record audio from microphone, convert to 16kHz mono PCM (16-bit LE),
 * and stream live over WebSocket to Gnani Prisma v3.0 streaming endpoint.
 */
export function useLiveRecorder({
  languageCode = 'indic-auto',
  outputMode = 'transcribe',
  onTranscriptReceived,
  onError,
} = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected, error
  const [liveTranscripts, setLiveTranscripts] = useState([]);
  const [detectedLanguage, setDetectedLanguage] = useState(null);

  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const processorRef = useRef(null);
  const websocketRef = useRef(null);
  const timerRef = useRef(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  // Helper to downsample Float32 audio to 16kHz and convert to 16-bit PCM bytes
  const downsampleAndConvertToPCM = (buffer, inputSampleRate, targetSampleRate = 16000) => {
    if (inputSampleRate === targetSampleRate) {
      const pcm16 = new Int16Array(buffer.length);
      for (let i = 0; i < buffer.length; i++) {
        const s = Math.max(-1, Math.min(1, buffer[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      return pcm16.buffer;
    }

    const sampleRateRatio = inputSampleRate / targetSampleRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Int16Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      let accum = 0;
      let count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      const avg = count > 0 ? accum / count : 0;
      const s = Math.max(-1, Math.min(1, avg));
      result[offsetResult] = s < 0 ? s * 0x8000 : s * 0x7fff;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result.buffer;
  };

  const startRecording = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      setLiveTranscripts([]);
      setDetectedLanguage(null);
      setRecordingTime(0);

      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // 2. Establish WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/transcribe/live/ws?language_code=${encodeURIComponent(
        languageCode
      )}&output_mode=${encodeURIComponent(outputMode)}`;

      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';
      websocketRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        setIsRecording(true);
        setIsPaused(false);

        // Start timer
        timerRef.current = setInterval(() => {
          setRecordingTime((t) => t + 1);
        }, 1000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'transcript') {
            const newSegment = {
              text: data.text,
              detected_language: data.detected_language,
              duration_ms: data.duration_ms,
              latency: data.latency,
              timestamp: data.timestamp || new Date().toISOString(),
              segment_id: data.segment_id,
            };

            setLiveTranscripts((prev) => [...prev, newSegment]);
            if (data.detected_language) {
              setDetectedLanguage(data.detected_language);
            }
            if (onTranscriptReceived) {
              onTranscriptReceived(newSegment);
            }
          } else if (data.type === 'error') {
            console.error('Server live STT error:', data.message);
            if (onError) onError(data.message);
          }
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket connection error:', err);
        setConnectionStatus('error');
        if (onError) onError('Failed to connect to live transcription streaming service.');
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      // 3. AudioContext & Audio processing node
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      // ScriptProcessor with bufferSize = 2048 samples
      const processor = audioCtx.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!isRecording && ws.readyState !== WebSocket.OPEN) return;
        if (isPaused) return;

        const inputChannelData = e.inputBuffer.getChannelData(0);

        // Compute volume for visualizer
        let sum = 0;
        for (let i = 0; i < inputChannelData.length; i++) {
          sum += Math.abs(inputChannelData[i]);
        }
        const avgVolume = sum / inputChannelData.length;
        setAudioLevel(Math.min(100, Math.round(avgVolume * 250)));

        // Downsample to 16kHz PCM and stream over WebSocket
        if (ws.readyState === WebSocket.OPEN) {
          const pcmChunk = downsampleAndConvertToPCM(
            inputChannelData,
            audioCtx.sampleRate,
            16000
          );
          ws.send(pcmChunk);
        }
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
    } catch (err) {
      console.error('Mic access error:', err);
      setConnectionStatus('error');
      if (onError) onError(err.message || 'Microphone access denied or unavailable.');
    }
  }, [languageCode, outputMode, onTranscriptReceived, onError, isPaused]);

  const pauseRecording = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeRecording = useCallback(() => {
    setIsPaused(false);
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setIsPaused(false);
    setAudioLevel(0);
    setConnectionStatus('disconnected');

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
  }, []);

  const clearTranscripts = useCallback(() => {
    setLiveTranscripts([]);
    setDetectedLanguage(null);
  }, []);

  const getFullText = useCallback(() => {
    return liveTranscripts.map((t) => t.text).join(' ');
  }, [liveTranscripts]);

  return {
    isRecording,
    isPaused,
    recordingTime,
    audioLevel,
    connectionStatus,
    liveTranscripts,
    detectedLanguage,
    fullText: getFullText(),
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    clearTranscripts,
  };
}
