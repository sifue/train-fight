import type { ScoreEvents, ScoreReadModel } from './contracts';

export class ScoreSystem implements ScoreEvents, ScoreReadModel {
  private combo = 0;
  private comboTimerMs = 0;
  private score = 0;
  private hiScore: number;

  constructor(initialHiScore: number) {
    this.hiScore = initialHiScore;
  }

  tick(deltaMs: number): void {
    if (this.comboTimerMs > 0) {
      this.comboTimerMs -= deltaMs;
      return;
    }

    this.combo = 0;
  }

  onEnemyHit(baseScore: number): void {
    this.combo += 1;
    this.comboTimerMs = 1150;
    this.score += baseScore + Math.min(50, this.combo * 2);
  }

  onEnemyKo(bonusScore: number, attackKind?: 'light' | 'heavy'): number {
    // コンボ2以上でキック（heavy）止めを刺した場合にキックフィニッシャーボーナス加算
    const finisherBonus = attackKind === 'heavy' && this.combo >= 2
      ? this.combo * 15
      : 0;
    this.score += bonusScore + Math.min(120, this.combo * 4) + finisherBonus;
    return finisherBonus;
  }

  /** ゴールクリアボーナスなど固定値加算 */
  addBonus(amount: number): void {
    this.score += amount;
    this.syncHiScore();
  }

  syncHiScore(): boolean {
    if (this.score <= this.hiScore) return false;
    this.hiScore = this.score;
    return true;
  }

  getCombo(): number {
    return this.combo;
  }

  getScore(): number {
    return this.score;
  }

  getHiScore(): number {
    return this.hiScore;
  }
}
