export type AttackProfile = {
  power: number;
  active: number;
  recovery: number;
  width: number;
  push: number;
  stunMs: number;
  hitFlashColor: number;
  hitShakeMs: number;
  hitShakeIntensity: number;
  hitStopMs: number;
};

export const LIGHT_ATTACK: AttackProfile = {
  power: 7,
  active: 120,
  recovery: 60,
  width: 50,
  push: 200,
  stunMs: 190,
  hitFlashColor: 0xc8f7ff,
  hitShakeMs: 45,
  hitShakeIntensity: 0.0009,
  hitStopMs: 24
};

export const HEAVY_ATTACK: AttackProfile = {
  power: 16,
  active: 170,
  recovery: 180,
  width: 76,
  push: 360,
  stunMs: 360,
  hitFlashColor: 0xffdf9a,
  hitShakeMs: 95,
  hitShakeIntensity: 0.002,
  hitStopMs: 62
};

export const PLAYER_MAX_HP = 5;
export const PLAYER_INVULN_MS = 800;
export const PLAYER_HIT_TINT_RESET_MS = 170;
export const PLAYER_KNOCKBACK_X = 230;
export const PLAYER_KNOCKBACK_Y = -170;
export const PLAYER_WALK_SPEED = 220;
export const PLAYER_RUN_SPEED = 270;
export const PLAYER_JUMP_VELOCITY = -590;
export const PLAYER_MAX_VELOCITY_X = 350;
export const PLAYER_MAX_VELOCITY_Y = 1000;
export const PLAYER_DRAG_X = 1700;
export const PLAYER_BODY_WIDTH = 30;
export const PLAYER_BODY_HEIGHT = 58;

export const ENEMY_SPAWN_START_X = 460;
export const ENEMY_SPAWN_END_MARGIN = 250;
export const ENEMY_SPAWN_STEP_MIN = 190;
export const ENEMY_SPAWN_STEP_MAX = 270;
export const ENEMY_DRAG_X = 900;
export const ENEMY_MAX_VELOCITY_X = 220;
export const ENEMY_MAX_VELOCITY_Y = 1000;

export const GROUND_OFFSET_Y = 34;
export const GROUND_HEIGHT = 68;
