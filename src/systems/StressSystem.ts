import type { EnemyType } from '../entities/Enemy';
import type { StressEvents, StressReadModel } from './contracts';

export class StressSystem implements StressEvents, StressReadModel {
  private stress = 0;
  private readonly maxStress: number;
  private readonly decayPerSecond: number;

  constructor(maxStress = 100, decayPerSecond = 7) {
    this.maxStress = maxStress;
    this.decayPerSecond = decayPerSecond;
  }

  tick(deltaMs: number): void {
    if (this.stress <= 0) return;
    this.stress = Math.max(0, this.stress - (this.decayPerSecond * deltaMs) / 1000);
  }

  onPlayerDamaged(damage: number): void {
    this.stress = Math.min(this.maxStress, this.stress + 8 + damage * 18);
  }

  onEnemyKo(enemyType: EnemyType): void {
    const relief = enemyType === 'boss' ? 20 : enemyType === 'heavy' ? 10 : enemyType === 'rush' ? 7 : 5;
    this.stress = Math.max(0, this.stress - relief);
  }

  getStressPercent(): number {
    return Math.round((this.stress / this.maxStress) * 100);
  }

  isCritical(): boolean {
    return this.getStressPercent() >= 85;
  }
}
