/**
 * AudioWorklet Processor for low-latency audio capture
 *
 * Runs in a dedicated audio thread (not main thread).
 * Accumulates 128-sample frames into larger chunks before posting
 * to reduce message overhead while maintaining low latency.
 *
 * Output: PCM16 (Int16Array) at native sample rate, mono channel.
 * Buffer target: ~2048 samples (~128ms at 16kHz)
 */
class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = new Float32Array(2048);
    this._bufferIndex = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0]; // mono channel

    for (let i = 0; i < channelData.length; i++) {
      this._buffer[this._bufferIndex++] = channelData[i];

      if (this._bufferIndex >= this._buffer.length) {
        // Convert float32 [-1, 1] to PCM16 Int16
        const pcm16 = new Int16Array(this._buffer.length);
        for (let j = 0; j < this._buffer.length; j++) {
          const s = Math.max(-1, Math.min(1, this._buffer[j]));
          pcm16[j] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
        this._buffer = new Float32Array(2048);
        this._bufferIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor("audio-capture-processor", AudioCaptureProcessor);
