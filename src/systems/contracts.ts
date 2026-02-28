export interface ScoreEvents {
  onEnemyHit(baseScore: number): void;
  onEnemyKo(bonusScore: number): void;
}

export interface ScoreReadModel {
  getCombo(): number;
  getScore(): number;
  getHiScore(): number;
  syncHiScore(): boolean;
}

export interface StressEvents {
  onPlayerDamaged(damage: number): void;
  onEnemyKo(enemyType: 'normal' | 'rush' | 'heavy' | 'boss'): void;
}

export interface StressReadModel {
  getStressPercent(): number;
  isCritical(): boolean;
}
