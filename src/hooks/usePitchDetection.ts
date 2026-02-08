import { useCallback, useRef, useState, useEffect } from 'react';

export interface TunerData {
  frequency: number;
  note: string;
  cents: number;
  octave: number;
  clarity: number;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Standard A4 reference frequency
const A4_FREQUENCY = 440;

/**
 * Convert frequency to note data using equal temperament
 */
function frequencyToNote(frequency: number): TunerData {
  if (frequency < 20 || frequency > 5000 || !isFinite(frequency)) {
    return { frequency: 0, note: '-', cents: 0, octave: 0, clarity: 0 };
  }
  
  // Calculate semitones from A4
  const semitonesFromA4 = 12 * Math.log2(frequency / A4_FREQUENCY);
  const roundedSemitones = Math.round(semitonesFromA4);
  const cents = Math.round((semitonesFromA4 - roundedSemitones) * 100);
  
  // A4 is MIDI note 69, so calculate absolute note number
  const midiNote = 69 + roundedSemitones;
  const note = NOTE_NAMES[((midiNote % 12) + 12) % 12];
  const octave = Math.floor(midiNote / 12) - 1;
  
  return { frequency, note, cents, octave, clarity: 1 };
}

/**
 * Autocorrelation-based pitch detection algorithm
 * Based on the proven approach from cwilso/PitchDetect
 */
function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  const SIZE = buffer.length;
  const MAX_SAMPLES = Math.floor(SIZE / 2);
  
  // Calculate RMS to check if there's enough signal
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / SIZE);
  
  // Not enough signal
  if (rms < 0.01) return -1;
  
  // Find a good starting point - trim the buffer
  let r1 = 0;
  let r2 = SIZE - 1;
  const threshold = 0.2;
  
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < threshold) {
      r1 = i;
      break;
    }
  }
  
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < threshold) {
      r2 = SIZE - i;
      break;
    }
  }
  
  const trimmedBuffer = buffer.slice(r1, r2);
  const trimmedSize = trimmedBuffer.length;
  
  if (trimmedSize < 2) return -1;
  
  // Autocorrelation
  const correlations = new Float32Array(MAX_SAMPLES);
  
  for (let lag = 0; lag < MAX_SAMPLES; lag++) {
    let correlation = 0;
    for (let i = 0; i < trimmedSize - lag; i++) {
      correlation += trimmedBuffer[i] * trimmedBuffer[i + lag];
    }
    correlations[lag] = correlation;
  }
  
  // Find the first peak after the initial decline
  let foundPeak = false;
  let peakIndex = -1;
  
  // Skip the first part (lag 0 is always max)
  const minPeriod = Math.floor(sampleRate / 2000); // Max frequency ~2000Hz
  const maxPeriod = Math.floor(sampleRate / 50);   // Min frequency ~50Hz
  
  for (let i = minPeriod; i < Math.min(maxPeriod, MAX_SAMPLES - 1); i++) {
    if (correlations[i] > correlations[i - 1] && correlations[i] > correlations[i + 1]) {
      if (!foundPeak || correlations[i] > correlations[peakIndex]) {
        foundPeak = true;
        peakIndex = i;
        break; // Take the first significant peak
      }
    }
  }
  
  if (peakIndex === -1) return -1;
  
  // Parabolic interpolation for more accurate peak position
  const y1 = correlations[peakIndex - 1];
  const y2 = correlations[peakIndex];
  const y3 = correlations[peakIndex + 1];
  
  const a = (y1 + y3 - 2 * y2) / 2;
  const b = (y3 - y1) / 2;
  
  let shift = 0;
  if (a !== 0) {
    shift = -b / (2 * a);
  }
  
  const refinedPeakIndex = peakIndex + shift;
  
  return sampleRate / refinedPeakIndex;
}

/**
 * YIN algorithm for more robust pitch detection
 * Particularly good for guitar and stringed instruments
 */
function yinPitchDetection(buffer: Float32Array, sampleRate: number): { frequency: number; clarity: number } {
  const SIZE = buffer.length;
  const HALF_SIZE = Math.floor(SIZE / 2);
  
  // Calculate RMS
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / SIZE);
  
  if (rms < 0.01) return { frequency: -1, clarity: 0 };
  
  // Step 1 & 2: Difference function and cumulative mean normalized difference
  const yinBuffer = new Float32Array(HALF_SIZE);
  yinBuffer[0] = 1;
  
  let runningSum = 0;
  
  for (let tau = 1; tau < HALF_SIZE; tau++) {
    let diff = 0;
    for (let i = 0; i < HALF_SIZE; i++) {
      const delta = buffer[i] - buffer[i + tau];
      diff += delta * delta;
    }
    runningSum += diff;
    yinBuffer[tau] = diff * tau / runningSum;
  }
  
  // Step 3: Absolute threshold
  const threshold = 0.1;
  let tau = 2;
  
  // Find first dip below threshold
  while (tau < HALF_SIZE - 1) {
    if (yinBuffer[tau] < threshold) {
      // Find the local minimum
      while (tau + 1 < HALF_SIZE && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau++;
      }
      break;
    }
    tau++;
  }
  
  // If no value found below threshold, find the minimum
  if (tau >= HALF_SIZE - 1) {
    let minVal = Infinity;
    let minTau = 2;
    
    for (let i = 2; i < HALF_SIZE; i++) {
      if (yinBuffer[i] < minVal) {
        minVal = yinBuffer[i];
        minTau = i;
      }
    }
    
    if (minVal > 0.5) return { frequency: -1, clarity: 0 };
    tau = minTau;
  }
  
  // Step 4: Parabolic interpolation
  let betterTau: number;
  
  if (tau < 1 || tau >= HALF_SIZE - 1) {
    betterTau = tau;
  } else {
    const s0 = yinBuffer[tau - 1];
    const s1 = yinBuffer[tau];
    const s2 = yinBuffer[tau + 1];
    
    const denominator = 2 * s1 - s2 - s0;
    if (Math.abs(denominator) < 1e-10) {
      betterTau = tau;
    } else {
      betterTau = tau + (s2 - s0) / (2 * denominator);
    }
  }
  
  const frequency = sampleRate / betterTau;
  const clarity = 1 - yinBuffer[tau];
  
  // Validate frequency range for guitar (E2 ~82Hz to E6 ~1320Hz with some margin)
  if (frequency < 60 || frequency > 1500) {
    return { frequency: -1, clarity: 0 };
  }
  
  return { frequency, clarity };
}

export interface UsePitchDetectionOptions {
  smoothingFactor?: number;
  clarityThreshold?: number;
  algorithm?: 'yin' | 'autocorrelation' | 'hybrid';
}

export function usePitchDetection(options: UsePitchDetectionOptions = {}) {
  const {
    smoothingFactor = 0.8,
    clarityThreshold = 0.7,
    algorithm = 'hybrid',
  } = options;
  
  const [tunerData, setTunerData] = useState<TunerData>({
    frequency: 0,
    note: '-',
    cents: 0,
    octave: 0,
    clarity: 0,
  });
  
  const lastFrequencyRef = useRef<number>(0);
  const historyRef = useRef<number[]>([]);
  const MAX_HISTORY = 5;
  
  const detectPitch = useCallback((buffer: Float32Array, sampleRate: number): TunerData => {
    let frequency = -1;
    let clarity = 0;
    
    if (algorithm === 'yin' || algorithm === 'hybrid') {
      const yinResult = yinPitchDetection(buffer, sampleRate);
      frequency = yinResult.frequency;
      clarity = yinResult.clarity;
    }
    
    // If YIN fails or we're using hybrid/autocorrelation, try autocorrelation
    if ((algorithm === 'autocorrelation' || algorithm === 'hybrid') && frequency <= 0) {
      frequency = autoCorrelate(buffer, sampleRate);
      clarity = frequency > 0 ? 0.8 : 0;
    }
    
    if (frequency <= 0 || clarity < clarityThreshold) {
      return { frequency: 0, note: '-', cents: 0, octave: 0, clarity: 0 };
    }
    
    // Apply smoothing using exponential moving average
    if (lastFrequencyRef.current > 0) {
      const diff = Math.abs(frequency - lastFrequencyRef.current);
      const percentDiff = diff / lastFrequencyRef.current;
      
      // If the change is small, apply smoothing
      if (percentDiff < 0.1) {
        frequency = smoothingFactor * lastFrequencyRef.current + (1 - smoothingFactor) * frequency;
      }
    }
    
    // Update history for median filtering
    historyRef.current.push(frequency);
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
    }
    
    // Use median of recent values for stability
    if (historyRef.current.length >= 3) {
      const sorted = [...historyRef.current].sort((a, b) => a - b);
      const medianIndex = Math.floor(sorted.length / 2);
      frequency = sorted[medianIndex];
    }
    
    lastFrequencyRef.current = frequency;
    
    const noteData = frequencyToNote(frequency);
    noteData.clarity = clarity;
    
    return noteData;
  }, [algorithm, clarityThreshold, smoothingFactor]);
  
  const reset = useCallback(() => {
    lastFrequencyRef.current = 0;
    historyRef.current = [];
    setTunerData({ frequency: 0, note: '-', cents: 0, octave: 0, clarity: 0 });
  }, []);
  
  return {
    tunerData,
    setTunerData,
    detectPitch,
    reset,
  };
}
