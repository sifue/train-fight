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

export type SeType = 'lightHit' | 'heavyHit' | 'playerDamage' | 'enemyDefeat' | 'gameOver' | 'victory' | 'uiSelect';

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

  // ---- BGM スケジューラー ----

  private _scheduleBGM(): void {
    const BPM = 148;
    const beatMs = (60 / BPM) * 1000;
    // 8ビット風アクションBGMパターン（2小節ループ）
    const melody = [
      392, 440, 494, 523,
      494, 523, 587, 523,
      494, 440, 392, 349,
      330, 349, 392, 440
    ];
    const bass = [
      196, 0, 196, 0,
      220, 0, 220, 0,
      196, 0, 196, 0,
      175, 0, 196, 0
    ];

    const tick = (): void => {
      if (!this.ctx || !this.bgmMasterGain || !this.bgmPlaying) return;
      const idx = this.bgmBeat % melody.length;
      const t = this.ctx.currentTime;
      const dur = (beatMs / 1000) * 0.75;

      if (melody[idx] > 0) {
        this._tone(this.bgmMasterGain, 'square', melody[idx], dur, 0.4, t);
      }
      if (bass[idx] > 0) {
        this._tone(this.bgmMasterGain, 'triangle', bass[idx], (beatMs / 1000) * 1.5, 0.35, t);
      }
      this.bgmBeat++;
    };

    tick();
    this.bgmIntervalId = setInterval(tick, beatMs);
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
}
