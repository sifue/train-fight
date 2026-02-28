import Phaser from 'phaser';
import { GROUND_Y } from '../constants';
import { Actor } from './Actor';

export type EnemyType = 'normal' | 'rush' | 'heavy';

type EnemySpec = {
  /** 当たり判定の幅 */
  w: number;
  /** 当たり判定の高さ */
  h: number;
  hp: number;
  aggroSpeed: number;
  contactDamage: number;
  hitScoreBase: number;
  koBonus: number;
};

const ENEMY_SPECS: Record<EnemyType, EnemySpec> = {
  normal: {
    w: 28,
    h: 52,
    hp: 18,
    aggroSpeed: 74,
    contactDamage: 1,
    hitScoreBase: 10,
    koBonus: 110
  },
  rush: {
    w: 24,
    h: 48,
    hp: 14,
    aggroSpeed: 112,
    contactDamage: 1,
    hitScoreBase: 14,
    koBonus: 150
  },
  heavy: {
    w: 36,
    h: 60,
    hp: 34,
    aggroSpeed: 46,
    contactDamage: 2,
    hitScoreBase: 22,
    koBonus: 220
  }
};

export class Enemy extends Actor {
  hp: number;
  readonly maxHp: number;
  readonly type: EnemyType;
  /** 当たり判定サイズ（body設定用） */
  readonly bodyW: number;
  readonly bodyH: number;

  constructor(scene: Phaser.Scene, x: number, type: EnemyType) {
    const spec = ENEMY_SPECS[type];
    super(scene, x, GROUND_Y - 2, `char_${type}`);

    this.type = type;
    this.hp = spec.hp;
    this.maxHp = spec.hp;
    this.bodyW = spec.w;
    this.bodyH = spec.h;
  }

  static randomType(rng = Math.random()): EnemyType {
    if (rng < 0.16) return 'heavy';
    if (rng > 0.78) return 'rush';
    return 'normal';
  }

  aggroSpeed(): number {
    return ENEMY_SPECS[this.type].aggroSpeed;
  }

  contactDamage(): number {
    return ENEMY_SPECS[this.type].contactDamage;
  }

  hitScoreBase(): number {
    return ENEMY_SPECS[this.type].hitScoreBase;
  }

  koBonus(): number {
    return ENEMY_SPECS[this.type].koBonus;
  }
}
