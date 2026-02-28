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
import { CharacterTextureFactory } from './renderers/CharacterTextureFactory';
import { getAudioManager } from './systems/AudioManager';
import { SaveManager } from './core/SaveManager';
import { isTouchOnlyDevice } from './utils/deviceUtils';
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
  private nKey?: Phaser.Input.Keyboard.Key;

  private touchMoveAxis = 0;
  private touchJumpQueued = false;
  private touchLightQueued = false;
  private touchHeavyQueued = false;
  // タッチボタンを保持（リセット時に破棄するため）
  private touchUiObjects: Phaser.GameObjects.GameObject[] = [];

  private facing = 1;
  private goalReached = false;
  private goalNearAlertFired = false;
  private startTime = 0;
  private readonly audioManager = getAudioManager();
  private scoreSystem = new ScoreSystem(0);
  private stressSystem = new StressSystem();
  private uiSystem = new UISystem(this, isTouchOnlyDevice());
  private combatSystem?: CombatSystem;
  private enemyAiSystem = new EnemyAiSystem();
  private hpBarGfx?: Phaser.GameObjects.Graphics;
  private playerHp = PLAYER_MAX_HP;
  private ended = false;

  constructor() {
    super('MainScene');
  }

  private resetRunState(): void {
    this.ended = false;
    this.goalReached = false;
    this.goalNearAlertFired = false;
    this.startTime = 0;
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
    this.scoreSystem = new ScoreSystem(SaveManager.getHiScore());

    // キャラクターテクスチャを先に生成
    new CharacterTextureFactory(this).createAll();

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
    this.setupGoalZone(player);
    this.setupInput();
    this.setupCamera(player);
    this.hpBarGfx = this.add.graphics().setDepth(15);
    this.uiSystem.create();
    this.startTime = this.time.now;
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
    this.drawEnemyHpBars();

    this.uiSystem.update(this.buildUiSnapshot());
  }

  private shouldRestartRun(): boolean {
    return Boolean(this.rKey && this.ended && Phaser.Input.Keyboard.JustDown(this.rKey));
  }

  /** M/N キーで BGM/SE 音量を 0%→50%→100% とサイクル */
  private handleSoundToggle(): void {
    if (this.mKey && Phaser.Input.Keyboard.JustDown(this.mKey)) {
      const v = this.audioManager.getBGMVolume();
      const next = v <= 0 ? 0.25 : v <= 0.25 ? 0.5 : v <= 0.5 ? 1.0 : 0;
      this.audioManager.setBGMVolume(next);
    }
    if (this.nKey && Phaser.Input.Keyboard.JustDown(this.nKey)) {
      const v = this.audioManager.getSEVolume();
      const next = v <= 0 ? 0.25 : v <= 0.25 ? 0.5 : v <= 0.5 ? 1.0 : 0;
      this.audioManager.setSEVolume(next);
    }
  }

  private tickSystems(delta: number): void {
    this.scoreSystem.tick(delta);
    this.stressSystem.tick(delta);

    if (this.scoreSystem.syncHiScore()) {
      this.persistHiScore();
    }

    // ストレス最大でゲームオーバー（ストレス過負荷）
    if (!this.ended && this.stressSystem.getStressPercent() >= 100) {
      this.cameras.main.flash(300, 255, 80, 80);
      this.endRun('STRESS OVER');
    }

    // ゴール接近演出（一度だけ）
    const GOAL_X = WORLD_WIDTH - 220;
    if (!this.ended && !this.goalNearAlertFired && this.player && this.player.x >= GOAL_X - 500) {
      this.goalNearAlertFired = true;
      this.audioManager.playSE('uiSelect');
      this.cameras.main.flash(120, 255, 220, 80);
      this.cameras.main.shake(200, 0.004);
      const alertTxt = this.add.text(WIDTH / 2, HEIGHT / 2 - 60, '⚡ ゴールまであと少し！', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffd166',
        stroke: '#000',
        strokeThickness: 4
      }).setOrigin(0.5).setScrollFactor(0).setDepth(25);
      this.tweens.add({
        targets: alertTxt,
        y: alertTxt.y - 30,
        alpha: 0,
        duration: 1800,
        ease: 'Power2',
        onComplete: () => alertTxt.destroy()
      });
    }
  }

  private persistHiScore(): void {
    SaveManager.saveHiScore(this.scoreSystem.getHiScore());
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
    // 中ボスの出現X座標（ワールドの約半分）
    const BOSS_X = Math.floor(WORLD_WIDTH / 2);
    let bossSpawned = false;

    while (x < limit) {
      // 中ボスゾーン到達時に一度だけスポーン
      if (!bossSpawned && x >= BOSS_X - 200) {
        this.spawnBoss(BOSS_X);
        bossSpawned = true;
        x = BOSS_X + 350; // ボス周辺は敵を配置しない
        continue;
      }
      this.spawnEnemy(x);

      // 進行度に応じてスポーン間隔を狭める（序盤は広め→終盤は2倍密度）
      const progress = Math.min(1, (x - ENEMY_SPAWN_START_X) / (limit - ENEMY_SPAWN_START_X));
      // factor: 1.2（序盤）→ 0.55（終盤）でリニア変化
      const factor = 1.2 - progress * 0.65;
      const stepMin = Math.max(60, Math.floor(ENEMY_SPAWN_STEP_MIN * factor));
      const stepMax = Math.max(80, Math.floor(ENEMY_SPAWN_STEP_MAX * factor));
      x += Phaser.Math.Between(stepMin, stepMax);
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

  private setupGoalZone(player: Player): void {
    // ゴールゾーン: 世界の末端（先頭車両エリア）
    const GOAL_X = WORLD_WIDTH - 220;
    const GOAL_WIDTH = 220;
    const goal = this.add.rectangle(
      GOAL_X + GOAL_WIDTH / 2,
      HEIGHT / 2,
      GOAL_WIDTH,
      HEIGHT,
      0xffd166,
      0.05
    );
    this.physics.add.existing(goal, true);

    // ゴールアイコン演出
    this.add.text(GOAL_X + 10, HEIGHT / 2 - 20, '🚨', {
      fontSize: '32px'
    });

    // プレイヤーがゴールゾーンに触れたらクリア
    this.physics.add.overlap(player, goal, () => {
      if (!this.ended && !this.goalReached) {
        this.goalReached = true;
        // ボーナス: 残敵数に応じてスコア加算
        const left = this.enemies?.countActive(true) ?? 0;
        const clearBonus = 500 + left * 20;
        this.scoreSystem.addBonus(clearBonus);
        this.endRun('YOU WIN!');
      }
    });
  }

  private buildUiSnapshot(): UiSnapshot {
    // ゴールまでの距離（ピクセル→m換算: 1m = 10px）
    const GOAL_X = WORLD_WIDTH - 220;
    const distToGoal = this.player
      ? Math.max(0, Math.ceil((GOAL_X - this.player.x) / 10))
      : 0;
    return {
      combo: this.scoreSystem.getCombo(),
      score: this.scoreSystem.getScore(),
      hiScore: this.scoreSystem.getHiScore(),
      hp: this.playerHp,
      stressPercent: this.stressSystem.getStressPercent(),
      stressCritical: this.stressSystem.isCritical(),
      enemiesLeft: this.enemies?.countActive(true) ?? 0,
      distToGoal,
      bgmVolume: this.audioManager.getBGMVolume(),
      seVolume: this.audioManager.getSEVolume(),
      playerX: this.player?.x ?? 0
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
    this.nKey = bindKey(Phaser.Input.Keyboard.KeyCodes.N);

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
    return isTouchOnlyDevice();
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
    jumpBtn.on('pointerdown', () => { if (!this.ended) this.touchJumpQueued = true; });

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
    lightBtn.on('pointerdown', () => { if (!this.ended) this.touchLightQueued = true; });

    // 強攻撃ボタン（右）
    const heavyBtn = makeCircleBtn(WIDTH - 60, HEIGHT - 65, 46, '強', '20px', 0x6b2a00, 0xf5a742);
    heavyBtn.on('pointerdown', () => { if (!this.ended) this.touchHeavyQueued = true; });

    // ---- ラベル補足テキスト ----
    const labelStyle = { fontFamily: 'monospace', fontSize: '11px', color: '#9abde0' };
    const lLabel = this.add.text(120, HEIGHT - 10, '移動 / ジャンプ', labelStyle).setOrigin(0.5).setScrollFactor(0).setDepth(31);
    const rLabel = this.add.text(WIDTH - 115, HEIGHT - 10, '攻撃', labelStyle).setOrigin(0.5).setScrollFactor(0).setDepth(31);
    objs.push(lLabel, rLabel);

    // ---- サウンドボタン（右上コーナー）----
    const makeVolBtn = (cx: number, label: string, getLvl: () => number, setLvl: (v: number) => void): void => {
      const btn = this.add.circle(cx, 28, 22, 0x0a1a30, 0.55).setScrollFactor(0).setDepth(32);
      btn.setStrokeStyle(1.5, 0x6aadf0, 0.8);
      btn.setInteractive();
      const txt = this.add
        .text(cx, 28, label, { fontFamily: 'monospace', fontSize: '12px', color: '#7ab4ff' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(33);

      const updateLabel = (): void => {
        const v = getLvl();
        const vol = v <= 0 ? '✗' : v <= 0.25 ? '▁' : v <= 0.5 ? '▄' : '█';
        txt.setText(`${label.charAt(0)}${vol}`);
      };
      updateLabel();

      btn.on('pointerdown', () => {
        const v = getLvl();
        const next = v <= 0 ? 0.25 : v <= 0.25 ? 0.5 : v <= 0.5 ? 1.0 : 0;
        setLvl(next);
        updateLabel();
      });
      objs.push(btn, txt);
    };

    makeVolBtn(WIDTH - 58, 'M♪', () => this.audioManager.getBGMVolume(),
      v => this.audioManager.setBGMVolume(v));
    makeVolBtn(WIDTH - 22, 'N🔊', () => this.audioManager.getSEVolume(),
      v => this.audioManager.setSEVolume(v));
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
    // 攻撃アニメーション中はモーション上書きしない（移動速度のみ適用）
    const currentAnim = player.anims.currentAnim?.key ?? '';
    const isAttackAnim = currentAnim === 'player_punch' || currentAnim === 'player_kick';

    const moveAxis = this.touchMoveAxis;
    if (cursors.left.isDown || moveAxis < -0.2) {
      player.body.setVelocityX(-speed);
      this.facing = -1;
      player.setFlipX(true);
      if (!isAttackAnim) player.playAnim('player_walk');
      return;
    }

    if (cursors.right.isDown || moveAxis > 0.2) {
      player.body.setVelocityX(speed);
      this.facing = 1;
      player.setFlipX(false);
      if (!isAttackAnim) player.playAnim('player_walk');
      return;
    }

    // 停止中はアイドルアニメーション
    if (!isAttackAnim) player.playAnim('player_idle');
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

    // 攻撃アニメーションを再生し、完了後アイドルに戻す
    const player = this.player;
    if (player) {
      const animKey = kind === 'light' ? 'player_punch' : 'player_kick';
      player.play(animKey);
      player.once(`animationcomplete-${animKey}`, () => {
        player.playAnim('player_idle');
      });
    }
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
    const isWin = message.includes('WIN');
    this.audioManager.playSE(isWin ? 'victory' : 'gameOver');

    // Hi-Score を確定保存
    if (this.scoreSystem.syncHiScore()) this.persistHiScore();

    // クリアタイム計測・タイムボーナス加算（勝利時のみ）
    const elapsedSec = Math.floor((this.time.now - this.startTime) / 1000);
    if (isWin) {
      // 基準200秒: 早いほど高ボーナス（最大4000pt、200秒超は0）
      const timeBonus = Math.max(0, Math.floor(4000 - elapsedSec * 20));
      if (timeBonus > 0) this.scoreSystem.addBonus(timeBonus);
    }

    // ResultScene へ遷移（演出後）
    const delay = isWin ? 1800 : 1200;
    this.time.delayedCall(delay, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
    });
    this.time.delayedCall(delay + 400, () => {
      const resultKind = isWin ? 'win' : message === 'STRESS OVER' ? 'stress' : 'lose';
      this.scene.start('ResultScene', {
        result: resultKind,
        score: this.scoreSystem.getScore(),
        hiScore: this.scoreSystem.getHiScore(),
        clearTime: isWin ? elapsedSec : undefined
      });
    });

    // 暫定テキスト（遷移まで表示）
    const displayMsg = isWin ? 'YOU WIN!' : message === 'STRESS OVER' ? 'STRESS OVER!' : 'GAME OVER';
    this.uiSystem.showResult(displayMsg);
  }

  private stopAllEnemies(): void {
    for (const enemyRaw of this.enemies?.getChildren() ?? []) {
      const enemy = enemyRaw as Enemy;
      enemy.body.setVelocityX(0);
    }
  }

  private drawEnemyHpBars(): void {
    if (!this.hpBarGfx) return;
    this.hpBarGfx.clear();
    for (const raw of this.enemies?.getChildren() ?? []) {
      const e = raw as Enemy;
      if (!e.active || e.hp <= 0 || !e.visible) continue;

      const barW = e.width + 8;
      const bx = e.x - barW / 2;
      const by = e.y - e.height - 10;
      const pct = Math.max(0, e.hp / e.maxHp);
      const barColor = pct > 0.55 ? 0x44dd44 : pct > 0.28 ? 0xffaa00 : 0xff3333;

      // バー背景
      this.hpBarGfx.fillStyle(0x222222, 0.75);
      this.hpBarGfx.fillRect(bx, by, barW, 5);
      // HP バー
      this.hpBarGfx.fillStyle(barColor, 0.95);
      this.hpBarGfx.fillRect(bx, by, barW * pct, 5);
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

  private spawnBoss(x: number): void {
    if (!this.enemies) return;

    const boss = new Enemy(this, x, 'boss');
    this.add.existing(boss);
    this.physics.add.existing(boss);
    this.configureEnemyPhysics(boss);
    this.enemies.add(boss);

    // ボス頭上にサイン演出
    const sign = this.add.text(x, GROUND_Y - 120, '⚡ 強敵 ⚡', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ff4444',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(16).setScrollFactor(1);

    this.tweens.add({
      targets: sign,
      y: sign.y - 12,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // ボス撃破時のイベントをカスタムで仕掛ける（ボスHPウォッチ）
    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        if (boss.hp <= 0 || !boss.active) {
          sign.destroy();
          if (!this.ended) {
            // ボス撃破ボーナス演出
            this.cameras.main.flash(250, 255, 220, 80);
            this.scoreSystem.addBonus(500);
          }
        }
      }
    });
  }

  private configureEnemyPhysics(enemy: Enemy): void {
    enemy.body.setSize(enemy.bodyW, enemy.bodyH);
    enemy.body.setDragX(ENEMY_DRAG_X);
    enemy.body.setMaxVelocity(ENEMY_MAX_VELOCITY_X, ENEMY_MAX_VELOCITY_Y);
    enemy.body.setCollideWorldBounds(true);
  }
}
