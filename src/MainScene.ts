import Phaser from 'phaser';
import { GROUND_Y, HEIGHT, WIDTH, WORLD_WIDTH } from './constants';
import { Enemy } from './entities/Enemy';
import { Player } from './entities/Player';
import { ScoreSystem } from './systems/ScoreSystem';
import { StressSystem } from './systems/StressSystem';
import { UISystem, UiSnapshot } from './systems/UISystem';
import { CombatSystem } from './systems/CombatSystem';
import { EnemyAiSystem } from './systems/EnemyAiSystem';
import { TrainBackgroundRenderer } from './renderers/TrainBackgroundRenderer';
import { AudioManager } from './systems/AudioManager';
import {
  AttackProfile,
  ENEMY_DRAG_X,
  ENEMY_MAX_VELOCITY_X,
  ENEMY_MAX_VELOCITY_Y,
  ENEMY_SPAWN_END_MARGIN,
  ENEMY_SPAWN_START_X,
  ENEMY_SPAWN_STEP_MAX,
  ENEMY_SPAWN_STEP_MIN,
  GROUND_HEIGHT,
  GROUND_OFFSET_Y,
  HEAVY_ATTACK,
  LIGHT_ATTACK,
  PLAYER_BODY_HEIGHT,
  PLAYER_BODY_WIDTH,
  PLAYER_DRAG_X,
  PLAYER_HIT_TINT_RESET_MS,
  PLAYER_MAX_HP,
  PLAYER_INVULN_MS,
  PLAYER_JUMP_VELOCITY,
  PLAYER_KNOCKBACK_X,
  PLAYER_KNOCKBACK_Y,
  PLAYER_MAX_VELOCITY_X,
  PLAYER_MAX_VELOCITY_Y,
  PLAYER_RUN_SPEED,
  PLAYER_WALK_SPEED
} from './config/gameplay';

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
  private zKey?: Phaser.Input.Keyboard.Key;
  private xKey?: Phaser.Input.Keyboard.Key;
  private rKey?: Phaser.Input.Keyboard.Key;
  private mKey?: Phaser.Input.Keyboard.Key;

  private touchMoveAxis = 0;
  private touchJumpQueued = false;
  private touchLightQueued = false;
  private touchHeavyQueued = false;
  // タッチボタンを保持（リセット時に破棄するため）
  private touchUiObjects: Phaser.GameObjects.GameObject[] = [];

  private facing = 1;
  private readonly audioManager = new AudioManager();
  private scoreSystem = new ScoreSystem(0);
  private stressSystem = new StressSystem();
  private uiSystem = new UISystem(this, 'ontouchstart' in window || navigator.maxTouchPoints > 0);
  private combatSystem?: CombatSystem;
  private enemyAiSystem = new EnemyAiSystem();
  private playerHp = PLAYER_MAX_HP;
  private ended = false;

  constructor() {
    super('MainScene');
  }

  private resetRunState(): void {
    this.ended = false;
    this.playerHp = PLAYER_MAX_HP;
    this.facing = 1;
    this.touchMoveAxis = 0;
    this.touchJumpQueued = false;
    this.touchLightQueued = false;
    this.touchHeavyQueued = false;
    this.touchUiObjects = [];
    this.player = undefined;
    this.enemies = undefined;
    this.combatSystem = undefined;
  }

  create(): void {
    this.resetRunState();
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
      this.audioManager.stopBGM();
      this.scene.restart();
      return;
    }

    this.handleSoundToggle();

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

  private handleSoundToggle(): void {
    if (!this.mKey || !Phaser.Input.Keyboard.JustDown(this.mKey)) return;
    const v = this.audioManager.getBGMVolume();
    this.audioManager.setBGMVolume(v > 0 ? 0 : 0.25);
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
    const ground = this.add.rectangle(
      WORLD_WIDTH / 2,
      HEIGHT - GROUND_OFFSET_Y,
      WORLD_WIDTH,
      GROUND_HEIGHT,
      0x243248
    );
    this.physics.add.existing(ground, true);
    return ground;
  }

  private createPlayer(): Player {
    const player = new Player(this, 110, GROUND_Y - GROUND_OFFSET_Y);
    this.add.existing(player);
    this.physics.add.existing(player);
    this.configurePlayerPhysics(player);
    return player;
  }

  private configurePlayerPhysics(player: Player): void {
    player.body.setSize(PLAYER_BODY_WIDTH, PLAYER_BODY_HEIGHT);
    player.body.setCollideWorldBounds(true);
    player.body.setDragX(PLAYER_DRAG_X);
    player.body.setMaxVelocity(PLAYER_MAX_VELOCITY_X, PLAYER_MAX_VELOCITY_Y);
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
      isEnded: () => this.ended,
      playSE: (type) => this.audioManager.playSE(type)
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

    this.zKey = bindKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.xKey = bindKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.rKey = bindKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.mKey = bindKey(Phaser.Input.Keyboard.KeyCodes.M);

    // 最初のユーザー操作で AudioContext を起動（autoplay ポリシー対応）
    this.input.once('pointerdown', () => {
      this.audioManager.init();
      this.audioManager.startBGM();
    });
    this.input.keyboard?.once('keydown', () => {
      this.audioManager.init();
      this.audioManager.startBGM();
    });

    if (this.isTouchDevice()) {
      // 5本指同時タッチに対応するため追加ポインタを確保
      this.input.addPointer(4);
      this.setupTouchControls();
    }
  }

  private isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  private setupTouchControls(): void {
    const objs = this.touchUiObjects;

    // ---- 半透明背景パネル ----
    // 左側（移動操作エリア）
    const leftPanel = this.add.graphics().setScrollFactor(0).setDepth(28);
    leftPanel.fillStyle(0x0a1a30, 0.35);
    leftPanel.fillRoundedRect(10, HEIGHT - 185, 230, 175, 18);
    objs.push(leftPanel);

    // 右側（攻撃操作エリア）
    const rightPanel = this.add.graphics().setScrollFactor(0).setDepth(28);
    rightPanel.fillStyle(0x1a0a10, 0.35);
    rightPanel.fillRoundedRect(WIDTH - 240, HEIGHT - 130, 230, 120, 18);
    objs.push(rightPanel);

    // ---- ボタン作成ヘルパー ----
    const makeCircleBtn = (
      x: number, y: number, radius: number,
      label: string, fontSize: string,
      fillColor: number, strokeColor: number
    ): Phaser.GameObjects.Arc => {
      const btn = this.add.circle(x, y, radius, fillColor, 0.55)
        .setScrollFactor(0).setDepth(30);
      btn.setStrokeStyle(2.5, strokeColor, 0.9);
      btn.setInteractive();
      const txt = this.add
        .text(x, y, label, { fontFamily: 'monospace', fontSize, color: '#ffffff', stroke: '#000', strokeThickness: 3 })
        .setOrigin(0.5).setScrollFactor(0).setDepth(31);
      objs.push(btn, txt);
      return btn;
    };

    // ---- 左側：移動・ジャンプ (左親指用) ----
    // ジャンプボタン（上部中央）
    const jumpBtn = makeCircleBtn(120, HEIGHT - 150, 40, '↑ JUMP', '14px', 0x2d5fa4, 0x7ab4ff);
    jumpBtn.on('pointerdown', () => { this.touchJumpQueued = true; });

    // 左移動ボタン
    const leftBtn = makeCircleBtn(62, HEIGHT - 65, 44, '◀', '22px', 0x1d3d6a, 0x6aadf0);
    leftBtn.on('pointerdown', () => { this.touchMoveAxis = -1; });
    leftBtn.on('pointerup',   () => { if (this.touchMoveAxis < 0) this.touchMoveAxis = 0; });
    leftBtn.on('pointerout',  () => { if (this.touchMoveAxis < 0) this.touchMoveAxis = 0; });

    // 右移動ボタン
    const rightBtn = makeCircleBtn(178, HEIGHT - 65, 44, '▶', '22px', 0x1d3d6a, 0x6aadf0);
    rightBtn.on('pointerdown', () => { this.touchMoveAxis = 1; });
    rightBtn.on('pointerup',   () => { if (this.touchMoveAxis > 0) this.touchMoveAxis = 0; });
    rightBtn.on('pointerout',  () => { if (this.touchMoveAxis > 0) this.touchMoveAxis = 0; });

    // ---- 右側：弱攻撃・強攻撃 (右親指用) ----
    // 弱攻撃ボタン（左）
    const lightBtn = makeCircleBtn(WIDTH - 170, HEIGHT - 65, 46, '弱', '20px', 0x1a5236, 0x52d68a);
    lightBtn.on('pointerdown', () => { this.touchLightQueued = true; });

    // 強攻撃ボタン（右）
    const heavyBtn = makeCircleBtn(WIDTH - 60, HEIGHT - 65, 46, '強', '20px', 0x6b2a00, 0xf5a742);
    heavyBtn.on('pointerdown', () => { this.touchHeavyQueued = true; });

    // ---- ラベル補足テキスト ----
    const labelStyle = { fontFamily: 'monospace', fontSize: '11px', color: '#9abde0' };
    const lLabel = this.add.text(120, HEIGHT - 10, '移動 / ジャンプ', labelStyle).setOrigin(0.5).setScrollFactor(0).setDepth(31);
    const rLabel = this.add.text(WIDTH - 115, HEIGHT - 10, '攻撃', labelStyle).setOrigin(0.5).setScrollFactor(0).setDepth(31);
    objs.push(lLabel, rLabel);

    // ---- BGMミュートボタン（右上コーナー）----
    const muteCircle = this.add.circle(WIDTH - 28, 28, 22, 0x0a1a30, 0.55).setScrollFactor(0).setDepth(32);
    muteCircle.setStrokeStyle(1.5, 0x6aadf0, 0.8);
    muteCircle.setInteractive();
    const muteTxt = this.add
      .text(WIDTH - 28, 28, '♪', { fontFamily: 'monospace', fontSize: '15px', color: '#7ab4ff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(33);
    muteCircle.on('pointerdown', () => {
      const v = this.audioManager.getBGMVolume();
      if (v > 0) {
        this.audioManager.setBGMVolume(0);
        muteTxt.setText('✗');
      } else {
        this.audioManager.setBGMVolume(0.25);
        muteTxt.setText('♪');
        if (!this.audioManager.getBGMVolume()) this.audioManager.startBGM();
      }
    });
    objs.push(muteCircle, muteTxt);
  }

  private updatePlayerInput(): void {
    const player = this.player;
    const cursors = this.cursors;
    if (!player || !cursors) return;

    this.updateHorizontalMovement(player, cursors, PLAYER_WALK_SPEED);
    this.handleJumpInput(player, cursors);

    this.handleAttackInput(this.zKey, 'light', LIGHT_ATTACK, 'touchLightQueued');
    this.handleAttackInput(this.xKey, 'heavy', HEAVY_ATTACK, 'touchHeavyQueued');
  }

  private updateHorizontalMovement(
    player: Player,
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    speed: number
  ): void {
    const moveAxis = this.touchMoveAxis;
    if (cursors.left.isDown || moveAxis < -0.2) {
      player.body.setVelocityX(-speed);
      this.facing = -1;
      return;
    }

    if (cursors.right.isDown || moveAxis > 0.2) {
      player.body.setVelocityX(speed);
      this.facing = 1;
    }
  }

  private handleJumpInput(player: Player, cursors: Phaser.Types.Input.Keyboard.CursorKeys): void {
    const jumpPressed = Phaser.Input.Keyboard.JustDown(cursors.up) || this.touchJumpQueued;
    this.touchJumpQueued = false;
    if (jumpPressed && player.body.blocked.down) {
      player.body.setVelocityY(PLAYER_JUMP_VELOCITY);
    }
  }

  private handleAttackInput(
    key: Phaser.Input.Keyboard.Key | undefined,
    kind: 'light' | 'heavy',
    profile: AttackProfile,
    touchFlag: 'touchLightQueued' | 'touchHeavyQueued'
  ): void {
    const pressed = Boolean(key && Phaser.Input.Keyboard.JustDown(key)) || this[touchFlag];
    this[touchFlag] = false;
    if (!pressed) return;
    this.combatSystem?.attack(kind, profile);
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

    this.audioManager.playSE('playerDamage');

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

    // ゲーム終了 SE・BGM停止
    this.audioManager.stopBGM();
    this.audioManager.playSE(message.includes('WIN') ? 'victory' : 'gameOver');

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
    this.configureEnemyPhysics(enemy);
    this.enemies.add(enemy);
  }

  private configureEnemyPhysics(enemy: Enemy): void {
    enemy.body.setDragX(ENEMY_DRAG_X);
    enemy.body.setMaxVelocity(ENEMY_MAX_VELOCITY_X, ENEMY_MAX_VELOCITY_Y);
    enemy.body.setCollideWorldBounds(true);
  }
}
