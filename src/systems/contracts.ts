export interface ScoreEvents {
  onEnemyHit(baseScore: number): void;
  /**
   * 敵KO時のスコア加算。
   * @param attackKind 止めを刺した攻撃種別（heavy=強攻撃キック）
   * @returns キックフィニッシュボーナス額（0 = フィニッシュなし）
   */
  onEnemyKo(bonusScore: number, attackKind?: 'light' | 'heavy'): number;
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
