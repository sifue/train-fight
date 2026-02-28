/**
 * AudioManager - Web Audio API を使ったBGM・SE管理
 * ファイル不要のプロシージャル音源実装
 *
 * シーン間で共有するためシングルトンとして提供
 */

let _sharedInstance: AudioManager | null = null;

/** シーン間で共有するシングルトンインスタンスを取得 */
export function getAudioManager(): AudioManager {
  if (!_sharedInstance) _sharedInstance = new AudioManager();
  return _sharedInstance;
}

export type SeType = 'lightHit' | 'heavyHit' | 'playerDamage' | 'enemyDefeat' | 'enemyKO' | 'gameOver' | 'victory' | 'uiSelect';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private bgmMasterGain?: GainNode;
  private seMasterGain?: GainNode;
  private bgmIntervalId?: ReturnType<typeof setInterval>;
  private bgmBeat = 0;
  private bgmPlaying = false;

  private bgmVolume: number;
  private seVolume: number;

  constructor(bgmVolume = 0.25, seVolume = 0.45) {
    this.bgmVolume = bgmVolume;
    this.seVolume = seVolume;
  }

  /** ユーザー操作後に呼び出す（autoplay ポリシー対応） */
  init(): void {
    if (this.ctx) return;
    try {
      this.ctx = new AudioContext();

      this.bgmMasterGain = this.ctx.createGain();
      this.bgmMasterGain.gain.value = this.bgmVolume;
      this.bgmMasterGain.connect(this.ctx.destination);

      this.seMasterGain = this.ctx.createGain();
      this.seMasterGain.gain.value = this.seVolume;
      this.seMasterGain.connect(this.ctx.destination);
    } catch {
      console.warn('[AudioManager] Web Audio API が使用できません');
    }
  }

  /** BGMを開始する */
  startBGM(): void {
    if (!this.ctx || this.bgmPlaying) return;
    this.bgmPlaying = true;
    this.bgmBeat = 0;
    this._scheduleBGM();
  }

  /** BGMを停止する */
  stopBGM(): void {
    this.bgmPlaying = false;
    if (this.bgmIntervalId !== undefined) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = undefined;
    }
  }

  /** SE を再生する */
  playSE(type: SeType): void {
    if (!this.ctx || !this.seMasterGain) return;
    const gain = this.seMasterGain;
    const t = this.ctx.currentTime;

    switch (type) {
      case 'lightHit':
        // 短い高音パンチ音
        this._tone(gain, 'square', 660, 0.06, 0.6, t);
        this._tone(gain, 'square', 440, 0.05, 0.3, t + 0.04);
        break;

      case 'heavyHit':
        // 重い低音
        this._tone(gain, 'sawtooth', 220, 0.12, 0.7, t);
        this._tone(gain, 'square',  110, 0.18, 0.5, t + 0.05);
        this._noiseHit(gain, 0.10, 0.4, t);
        break;

      case 'playerDamage':
        // ビブラート風ダメージ音
        this._tone(gain, 'square', 180, 0.08, 0.6, t);
        this._tone(gain, 'square', 140, 0.15, 0.5, t + 0.08);
        this._tone(gain, 'square', 100, 0.20, 0.4, t + 0.18);
        break;

      case 'enemyDefeat':
        // 撃破ジングル（3音上昇）
        this._tone(gain, 'square', 523, 0.07, 0.5, t);
        this._tone(gain, 'square', 659, 0.07, 0.5, t + 0.08);
        this._tone(gain, 'square', 784, 0.12, 0.5, t + 0.16);
        break;

      case 'enemyKO':
        // 派手なKO音: 重衝撃ノイズ + 低音サウンド + 勝利ジングル
        this._noiseHit(gain, 0.30, 0.85, t);
        this._tone(gain, 'sawtooth',  80, 0.28, 0.9, t);
        this._tone(gain, 'sawtooth', 160, 0.18, 0.7, t + 0.02);
        this._tone(gain, 'square',   523, 0.10, 0.4, t + 0.18);
        this._tone(gain, 'square',   784, 0.12, 0.4, t + 0.28);
        this._tone(gain, 'square',  1047, 0.18, 0.5, t + 0.38);
        break;

      case 'gameOver':
        // ゲームオーバー下降音
        this._tone(gain, 'square', 392, 0.10, 0.5, t);
        this._tone(gain, 'square', 330, 0.10, 0.5, t + 0.15);
        this._tone(gain, 'square', 262, 0.15, 0.5, t + 0.30);
        this._tone(gain, 'square', 196, 0.30, 0.5, t + 0.50);
        break;

      case 'victory':
        // 勝利ジングル
        [523, 659, 784, 1047].forEach((f, i) => {
          this._tone(gain, 'square', f, 0.10, 0.5, t + i * 0.10);
        });
        this._tone(gain, 'square', 1047, 0.30, 0.6, t + 0.50);
        break;

      case 'uiSelect':
        this._tone(gain, 'square', 880, 0.05, 0.4, t);
        break;
    }
  }

  getBGMVolume(): number { return this.bgmVolume; }
  getSEVolume(): number  { return this.seVolume;  }

  setBGMVolume(v: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, v));
    if (this.bgmMasterGain) this.bgmMasterGain.gain.value = this.bgmVolume;
  }

  setSEVolume(v: number): void {
    this.seVolume = Math.max(0, Math.min(1, v));
    if (this.seMasterGain) this.seMasterGain.gain.value = this.seVolume;
  }

  // ---- BGM スケジューラー（ハードロック調） ----

  private _scheduleBGM(): void {
    const BPM = 168;
    const stepMs  = Math.round((60 / BPM / 4) * 1000); // 16分音符 ≈ 89ms
    const stepSec = stepMs / 1000;

    // ---- ドラムパターン (16ステップ繰り返し) ----
    // キック: 1拍・3拍メイン + シンコペーション
    const KICK  = [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,1,0,0];
    // スネア: 2拍・4拍バックビート
    const SNARE = [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0];
    // ハイハット: 8分音符刻み
    const HIHAT = [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0];

    // ---- ギターリフ (32ステップ = 2小節, Eマイナー) ----
    // E3=165 D3=147 G3=196 A3=220
    const GUITAR: number[] = [
      165, 0, 165, 0,  165, 0, 165, 0,  196, 0, 220, 0,  165, 0, 165, 0,
      165, 0, 165, 0,  147, 0, 147, 0,  147, 0, 165, 0,  196, 0,   0, 0,
    ];
    // ---- ベースライン (32ステップ) ----
    // E2=82 D2=73 G2=98 A2=110
    const BASS: number[] = [
      82, 0, 82, 0,   82, 0, 82, 0,   98, 0, 110, 0,   82, 0,  0, 0,
      82, 0, 82, 0,   73, 0, 73, 0,   73, 0,  82, 0,   98, 0,  0, 0,
    ];

    const tick = (): void => {
      if (!this.ctx || !this.bgmMasterGain || !this.bgmPlaying) return;
      const drumIdx = this.bgmBeat % 16;
      const riffIdx = this.bgmBeat % 32;
      const t = this.ctx.currentTime;

      if (KICK[drumIdx])  this._kick(this.bgmMasterGain, t);
      if (SNARE[drumIdx]) this._snare(this.bgmMasterGain, t);
      if (HIHAT[drumIdx]) this._hihat(this.bgmMasterGain, t);

      if (GUITAR[riffIdx] > 0) {
        this._powerChord(this.bgmMasterGain, GUITAR[riffIdx], stepSec * 2.8, t);
      }
      if (BASS[riffIdx] > 0) {
        this._tone(this.bgmMasterGain, 'sawtooth', BASS[riffIdx], stepSec * 2.2, 0.55, t);
      }
      this.bgmBeat++;
    };

    tick();
    this.bgmIntervalId = setInterval(tick, stepMs);
  }

  // ---- プリミティブ音源ヘルパー ----

  /** サイン/矩形/ノコギリ波のトーンを生成 */
  private _tone(
    dest: AudioNode,
    type: OscillatorType,
    freq: number,
    duration: number,
    amplitude: number,
    startTime: number
  ): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(amplitude, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(g);
    g.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  /** ホワイトノイズバースト（打撃の厚みに） */
  private _noiseHit(dest: AudioNode, duration: number, amplitude: number, startTime: number): void {
    if (!this.ctx) return;
    const bufLen = Math.floor(this.ctx.sampleRate * duration);
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(amplitude, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    src.connect(g);
    g.connect(dest);
    src.start(startTime);
    src.stop(startTime + duration + 0.01);
  }

  // ---- ドラム音源ヘルパー ----

  /** キックドラム: サイン波の急速ピッチダウン */
  private _kick(dest: AudioNode, t: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(44, t + 0.09);
    g.gain.setValueAtTime(1.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
    osc.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + 0.28);
  }

  /** スネアドラム: ホワイトノイズ + 三角波トーン */
  private _snare(dest: AudioNode, t: number): void {
    if (!this.ctx) return;
    // ノイズ成分（バシッ）
    this._noiseHit(dest, 0.14, 0.72, t);
    // 音程成分（ドン）
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(230, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.08);
    g.gain.setValueAtTime(0.50, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  /** ハイハット: 高周波フィルタリングしたノイズバースト */
  private _hihat(dest: AudioNode, t: number): void {
    if (!this.ctx) return;
    const bufLen = Math.floor(this.ctx.sampleRate * 0.04);
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    // 高域のみを通すハイパスフィルター
    const hpf = this.ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 7500;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.20, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    src.connect(hpf);
    hpf.connect(g);
    g.connect(dest);
    src.start(t);
    src.stop(t + 0.045);
  }

  /** パワーコード: root + 完全5度のノコギリ波（ハードロックギター風） */
  private _powerChord(dest: AudioNode, rootFreq: number, duration: number, t: number): void {
    if (!this.ctx) return;
    const fifth = rootFreq * 1.498; // 完全5度
    for (const [freq, detune] of [[rootFreq, -7], [fifth, 7]] as [number, number][]) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      // アタック → サステイン → リリース
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.24, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.connect(g);
      g.connect(dest);
      osc.start(t);
      osc.stop(t + duration + 0.01);
    }
  }
}
