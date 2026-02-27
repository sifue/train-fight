import Phaser from 'phaser';
import { GROUND_Y, HEIGHT, WORLD_WIDTH } from './constants';
import { Enemy } from './entities/Enemy';
import { Player } from './entities/Player';
import { ScoreSystem } from './systems/ScoreSystem';
import { StressSystem } from './systems/StressSystem';
import { UISystem, UiSnapshot } from './systems/UISystem';
import { CombatSystem } from './systems/CombatSystem';
import { EnemyAiSystem } from './systems/EnemyAiSystem';
import { TrainBackgroundRenderer } from './renderers/TrainBackgroundRenderer';

type AttackProfile = { power: number; active: number; width: number; push: number };

const LIGHT_ATTACK: AttackProfile = { power: 8, active: 140, width: 52, push: 230 };
const HEAVY_ATTACK: AttackProfile = { power: 14, active: 190, width: 74, push: 320 };

const PLAYER_INVULN_MS = 800;
const PLAYER_HIT_TINT_RESET_MS = 170;
const PLAYER_KNOCKBACK_X = 230;
const PLAYER_KNOCKBACK_Y = -170;
const PLAYER_WALK_SPEED = 220;
const PLAYER_RUN_SPEED = 270;
const PLAYER_JUMP_VELOCITY = -590;
const PLAYER_MAX_VELOCITY_X = 350;
const PLAYER_MAX_VELOCITY_Y = 1000;
const PLAYER_DRAG_X = 1700;
const ENEMY_SPAWN_START_X = 460;
const ENEMY_SPAWN_END_MARGIN = 250;
const ENEMY_SPAWN_STEP_MIN = 190;
const ENEMY_SPAWN_STEP_MAX = 270;
const ENEMY_DRAG_X = 900;
const ENEMY_MAX_VELOCITY_X = 220;
const ENEMY_MAX_VELOCITY_Y = 1000;

/**
 * Main gameplay scene (TS migration in progress)
 *
 * Current migration scope:
 * - stage background + train interior draw
 * - player move/jump + camera follow
 * - enemy spawn/chase
 * - light/heavy attack hitbox
 * - score / hi-score / info HUD
 */
export class MainScene extends Phaser.Scene {
  private player?: Player;
  private enemies?: Phaser.Physics.Arcade.Group;

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private shiftKey?: Phaser.Input.Keyboard.Key;
  private zKey?: Phaser.Input.Keyboard.Key;
  private xKey?: Phaser.Input.Keyboard.Key;
  private rKey?: Phaser.Input.Keyboard.Key;

  private facing = 1;
  private scoreSystem = new ScoreSystem(0);
  private stressSystem = new StressSystem();
  private uiSystem = new UISystem(this);
  private combatSystem?: CombatSystem;
  private enemyAiSystem = new EnemyAiSystem();
  private playerHp = 5;
  private ended = false;

  constructor() {
    super('MainScene');
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, HEIGHT);
    this.scoreSystem = new ScoreSystem(Number(window.localStorage.getItem('trainFightHiScore') ?? 0));

    new TrainBackgroundRenderer(this).draw();

    const ground = this.createGround();
    const player = this.createPlayer();

    this.enemies = this.physics.add.group();
    this.spawnInitialEnemies();

    this.physics.add.collider(player, ground);
    this.physics.add.collider(this.enemies, ground);
    this.physics.add.overlap(player, this.enemies, (_p, enemy) => this.onPlayerHit(enemy as Enemy));

    this.player = player;
    this.setupCombatSystem();
    this.setupInput();
    this.setupCamera(player);
    this.uiSystem.create();
  }

  update(_time: number, delta: number): void {
    if (!this.player || !this.cursors || !this.enemies) return;

    if (this.shouldRestartRun()) {
      this.scene.restart();
      return;
    }

    const now = this.time.now;

    if (!this.ended) {
      this.updatePlayerInput();
    }

    this.enemyAiSystem.update(now, this.player, this.enemies, this.ended);
    this.tickSystems(delta);

    if (!this.ended && this.enemies.countActive(true) === 0) {
      this.endRun('YOU WIN!');
    }

    this.uiSystem.update(this.buildUiSnapshot());
  }

  private shouldRestartRun(): boolean {
    return Boolean(this.rKey && this.ended && Phaser.Input.Keyboard.JustDown(this.rKey));
  }

  private tickSystems(delta: number): void {
    this.scoreSystem.tick(delta);
    this.stressSystem.tick(delta);

    if (this.scoreSystem.syncHiScore()) {
      this.persistHiScore();
    }
  }

  private persistHiScore(): void {
    window.localStorage.setItem('trainFightHiScore', String(this.scoreSystem.getHiScore()));
  }

  private createGround(): Phaser.GameObjects.Rectangle {
    const ground = this.add.rectangle(WORLD_WIDTH / 2, HEIGHT - 34, WORLD_WIDTH, 68, 0x243248);
    this.physics.add.existing(ground, true);
    return ground;
  }

  private createPlayer(): Player {
    const player = new Player(this, 110, GROUND_Y - 34);
    this.add.existing(player);
    this.physics.add.existing(player);
    player.body.setSize(30, 58);
    player.body.setCollideWorldBounds(true);
    player.body.setDragX(PLAYER_DRAG_X);
    player.body.setMaxVelocity(PLAYER_MAX_VELOCITY_X, PLAYER_MAX_VELOCITY_Y);
    return player;
  }

  private spawnInitialEnemies(): void {
    let x = ENEMY_SPAWN_START_X;
    const limit = WORLD_WIDTH - ENEMY_SPAWN_END_MARGIN;

    while (x < limit) {
      this.spawnEnemy(x);
      x += Phaser.Math.Between(ENEMY_SPAWN_STEP_MIN, ENEMY_SPAWN_STEP_MAX);
    }
  }

  private setupCombatSystem(): void {
    this.combatSystem = new CombatSystem({
      scene: this,
      scoreSystem: this.scoreSystem,
      stressSystem: this.stressSystem,
      getPlayer: () => this.player,
      getEnemies: () => this.enemies,
      getFacing: () => this.facing,
      isEnded: () => this.ended
    });
    this.combatSystem.init();
  }

  private setupCamera(player: Player): void {
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, HEIGHT);
    this.cameras.main.startFollow(player, true, 0.08, 0.08);
  }

  private buildUiSnapshot(): UiSnapshot {
    return {
      combo: this.scoreSystem.getCombo(),
      score: this.scoreSystem.getScore(),
      hiScore: this.scoreSystem.getHiScore(),
      hp: this.playerHp,
      stressPercent: this.stressSystem.getStressPercent(),
      stressCritical: this.stressSystem.isCritical(),
      enemiesLeft: this.enemies?.countActive(true) ?? 0
    };
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard?.createCursorKeys();

    const keyboard = this.input.keyboard;
    if (!keyboard) return;

    const bindKey = (keyCode: number): Phaser.Input.Keyboard.Key => keyboard.addKey(keyCode);

    this.shiftKey = bindKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.zKey = bindKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.xKey = bindKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.rKey = bindKey(Phaser.Input.Keyboard.KeyCodes.R);
  }

  private updatePlayerInput(): void {
    if (!this.player || !this.cursors) return;

    const speed = this.shiftKey?.isDown ? PLAYER_RUN_SPEED : PLAYER_WALK_SPEED;

    this.updateHorizontalMovement(speed);
    this.handleJumpInput();

    this.handleAttackInput(this.zKey, LIGHT_ATTACK);
    this.handleAttackInput(this.xKey, HEAVY_ATTACK);
  }

  private updateHorizontalMovement(speed: number): void {
    if (!this.player || !this.cursors) return;

    if (this.cursors.left.isDown) {
      this.player.body.setVelocityX(-speed);
      this.facing = -1;
      return;
    }

    if (this.cursors.right.isDown) {
      this.player.body.setVelocityX(speed);
      this.facing = 1;
    }
  }

  private handleJumpInput(): void {
    if (!this.player || !this.cursors) return;
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) && this.player.body.blocked.down) {
      this.player.body.setVelocityY(PLAYER_JUMP_VELOCITY);
    }
  }

  private handleAttackInput(key: Phaser.Input.Keyboard.Key | undefined, profile: AttackProfile): void {
    if (!key || !Phaser.Input.Keyboard.JustDown(key)) return;
    this.combatSystem?.attack(profile);
  }

  private onPlayerHit(enemy: Enemy): void {
    if (!this.player || this.ended || enemy.hp <= 0) return;

    const now = this.time.now;
    if (now < this.player.invulnUntil) return;

    const damage = enemy.contactDamage();
    this.playerHp -= damage;
    this.stressSystem.onPlayerDamaged(damage);
    this.player.invulnUntil = now + PLAYER_INVULN_MS;
    this.player.flashDamaged();
    this.applyPlayerKnockback(enemy);
    this.cameras.main.shake(110, 0.003);

    this.time.delayedCall(PLAYER_HIT_TINT_RESET_MS, () => this.player?.active && this.player.resetTint());

    if (this.playerHp <= 0) {
      this.endRun('GAME OVER');
    }
  }

  private applyPlayerKnockback(enemy: Enemy): void {
    if (!this.player) return;

    this.player.body.setVelocityX((this.player.x < enemy.x ? -1 : 1) * PLAYER_KNOCKBACK_X);
    this.player.body.setVelocityY(PLAYER_KNOCKBACK_Y);
  }

  private endRun(message: string): void {
    if (!this.player || this.ended) return;

    this.ended = true;
    this.combatSystem?.disable();
    this.player.body.setVelocity(0, this.player.body.velocity.y);
    this.stopAllEnemies();

    this.uiSystem.showResult(message);
  }

  private stopAllEnemies(): void {
    for (const enemyRaw of this.enemies?.getChildren() ?? []) {
      const enemy = enemyRaw as Enemy;
      enemy.body.setVelocityX(0);
    }
  }

  private spawnEnemy(x: number): void {
    if (!this.enemies) return;

    const enemy = new Enemy(this, x, Enemy.randomType());
    this.add.existing(enemy);
    this.physics.add.existing(enemy);
    enemy.body.setDragX(ENEMY_DRAG_X);
    enemy.body.setMaxVelocity(ENEMY_MAX_VELOCITY_X, ENEMY_MAX_VELOCITY_Y);
    enemy.body.setCollideWorldBounds(true);
    this.enemies.add(enemy);
  }
}
