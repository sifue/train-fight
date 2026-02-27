const WIDTH = 960;
const HEIGHT = 540;
const WORLD_WIDTH = 7200;
const GROUND_Y = HEIGHT - 68;

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#0f1522',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 1500 }, debug: false }
  },
  scene: { create, update }
};
new Phaser.Game(config);

let player, enemies, cursors, keys;
let attackHitbox, brakeLever;
let hp = 140, stress = 8, score = 0, hiScore = 0, gameOver = false;
let facing = 1;
let combo = 0, comboTimer = 0, attackLock = 0;
let nearBrake = false;
let hpText, stressText, infoText, comboText, scoreText, hiScoreText;

function create() {
  this.physics.world.setBounds(0, 0, WORLD_WIDTH, HEIGHT);
  this.sfx = createSfx(this);
  hiScore = Number(localStorage.getItem('trainFightHiScore') || 0);

  drawTrain(this);

  const ground = this.add.rectangle(WORLD_WIDTH / 2, HEIGHT - 34, WORLD_WIDTH, 68, 0x243248);
  this.physics.add.existing(ground, true);

  player = this.add.rectangle(110, GROUND_Y - 34, 30, 58, 0x48d7ff).setOrigin(0.5, 1);
  this.physics.add.existing(player);
  player.body.setSize(30, 58);
  player.body.setCollideWorldBounds(true);
  player.body.setDragX(1700);
  player.body.setMaxVelocity(350, 1000);
  player.invulnUntil = 0;

  enemies = this.physics.add.group();
  for (let x = 460; x < WORLD_WIDTH - 250; x += Phaser.Math.Between(170, 260)) spawnEnemy(this, x);

  brakeLever = this.add.rectangle(WORLD_WIDTH - 140, GROUND_Y - 8, 20, 90, 0xffd43b).setOrigin(0.5, 1);
  this.physics.add.existing(brakeLever, true);

  attackHitbox = this.add.rectangle(-9999, -9999, 52, 44, 0xff4f4f, 0.25);
  this.physics.add.existing(attackHitbox);
  attackHitbox.body.allowGravity = false;
  attackHitbox.body.enable = false;

  this.physics.add.collider(player, ground);
  this.physics.add.collider(enemies, ground);
  this.physics.add.overlap(attackHitbox, enemies, (_, enemy) => onHitEnemy(this, enemy));
  this.physics.add.overlap(player, enemies, (_, enemy) => onHitPlayer(this, enemy));

  this.cameras.main.setBounds(0, 0, WORLD_WIDTH, HEIGHT);
  this.cameras.main.startFollow(player, true, 0.08, 0.08);

  cursors = this.input.keyboard.createCursorKeys();
  keys = this.input.keyboard.addKeys('Z,X,C,E,SHIFT');

  hpText = this.add.text(16, 14, '', uiStyle()).setScrollFactor(0);
  stressText = this.add.text(16, 40, '', uiStyle()).setScrollFactor(0);
  comboText = this.add.text(16, 66, '', uiStyle('#ffd166')).setScrollFactor(0);
  scoreText = this.add.text(16, 92, '', uiStyle('#7ce0ff')).setScrollFactor(0);
  hiScoreText = this.add.text(16, 118, '', uiStyle('#9dff9d')).setScrollFactor(0);
  infoText = this.add.text(16, 146, '', uiStyle('#d7e3ff')).setScrollFactor(0);

  this.time.addEvent({ delay: 2300, loop: true, callback: () => {
    if (gameOver) return;
    if (enemies.countActive(true) < 24) spawnEnemy(this, this.cameras.main.scrollX + WIDTH + Phaser.Math.Between(160, 340));
    stress = Math.min(100, stress + 1);
    if (stress >= 100) lose(this, '暴走が限界に達した…');
  }});

  this.time.addEvent({ delay: 1300, loop: true, callback: () => !gameOver && this.sfx.alarm() });
}

function update(_, dt) {
  if (gameOver) return;

  const now = this.time.now;
  const speed = (keys.SHIFT.isDown ? 270 : 220);

  if (cursors.left.isDown) { player.body.setVelocityX(-speed); facing = -1; }
  else if (cursors.right.isDown) { player.body.setVelocityX(speed); facing = 1; }

  if (Phaser.Input.Keyboard.JustDown(cursors.up) && player.body.blocked.down) {
    player.body.setVelocityY(-590);
    this.sfx.jump();
  }

  if (Phaser.Input.Keyboard.JustDown(keys.C) && now > attackLock) {
    // dash (phase2)
    attackLock = now + 230;
    player.body.setVelocityX(facing * 460);
    player.body.setVelocityY(-40);
    this.cameras.main.shake(90, 0.0025);
    this.sfx.dash();
  }

  if (Phaser.Input.Keyboard.JustDown(keys.Z)) attack(this, { power: 8, active: 140, width: 52, push: 230 });
  if (Phaser.Input.Keyboard.JustDown(keys.X)) attack(this, { power: 14, active: 190, width: 74, push: 320 });

  for (const e of enemies.getChildren()) {
    if (!e.body) continue;
    const dx = player.x - e.x;
    const dir = Math.sign(dx);
    if (Math.abs(dx) < 440 && now > e.stunnedUntil) {
      const aggro = e.type === 'heavy' ? 46 : e.type === 'rush' ? 112 : 74;
      e.body.setVelocityX(dir * aggro);
    }
  }

  nearBrake = Phaser.Math.Distance.Between(player.x, player.y, brakeLever.x, brakeLever.y) < 78;
  if (nearBrake && Phaser.Input.Keyboard.JustDown(keys.E)) {
    if (stress < 80) win(this);
    else infoText.setText('混乱が酷い！敵を減らしてからブレーキを引け');
  }

  if (comboTimer > 0) comboTimer -= dt;
  else combo = 0;

  if (score > hiScore) {
    hiScore = score;
    localStorage.setItem('trainFightHiScore', String(hiScore));
  }

  hpText.setText(`HP: ${Math.max(0, hp)}`);
  stressText.setText(`暴走ゲージ: ${stress}%`);
  comboText.setText(combo > 1 ? `COMBO x${combo}` : '');
  scoreText.setText(`SCORE: ${score}`);
  hiScoreText.setText(`HI-SCORE: ${hiScore}`);
  infoText.setText(nearBrake ? (stress < 80 ? 'E で非常ブレーキ！' : '車内が混乱していて危険') : '右へ進め。先頭車両で非常ブレーキを引け');

  if (now < player.invulnUntil) {
    player.setFillStyle((Math.floor(now / 60) % 2) ? 0xffffff : 0x48d7ff);
  } else player.setFillStyle(0x48d7ff);
}

function attack(scene, cfg) {
  const now = scene.time.now;
  if (now < attackLock) return;
  attackLock = now + cfg.active + 70;

  attackHitbox.body.enable = true;
  attackHitbox.active = true;
  attackHitbox.power = cfg.power;
  attackHitbox.push = cfg.push;
  attackHitbox.x = player.x + facing * (24 + cfg.width * 0.32);
  attackHitbox.y = player.y - 20;
  attackHitbox.body.setSize(cfg.width, 44);
  player.body.velocity.x = facing * 130;

  scene.sfx.hit(cfg.power > 10 ? 180 : 145);
  hitSpark(scene, attackHitbox.x, attackHitbox.y, cfg.power > 10 ? 12 : 8);

  scene.time.delayedCall(cfg.active, () => {
    attackHitbox.active = false;
    attackHitbox.body.enable = false;
    attackHitbox.x = -9999;
  });
}

function onHitEnemy(scene, enemy) {
  if (!attackHitbox.active || enemy.hp <= 0 || scene.time.now < enemy.stunnedUntil) return;

  enemy.hp -= attackHitbox.power;
  enemy.stunnedUntil = scene.time.now + 280;
  enemy.body.velocity.x = facing * attackHitbox.push;
  enemy.body.velocity.y = -120;
  enemy.setFillStyle(0xffffff);
  scene.time.delayedCall(80, () => enemy.setFillStyle(enemy.baseColor));

  combo += 1;
  comboTimer = 1150;
  const hitBase = enemy.type === 'heavy' ? 22 : enemy.type === 'rush' ? 14 : 10;
  score += hitBase + Math.min(50, combo * 2);
  stress = Math.max(0, stress - (enemy.type === 'heavy' ? 3 : 2));

  if (enemy.hp <= 0) {
    enemy.hp = 0;
    enemy.stunnedUntil = scene.time.now + 999999;
    enemy.body.checkCollision.none = true;
    enemy.body.setVelocityX(facing * (attackHitbox.push + (enemy.type === 'heavy' ? 190 : 280)));
    enemy.body.setVelocityY(enemy.type === 'heavy' ? -300 : -380);
    enemy.setFillStyle(0xfff1b5);
    scene.tweens.add({
      targets: enemy,
      angle: facing * Phaser.Math.Between(35, 75),
      alpha: 0,
      duration: 460,
      onComplete: () => enemy.destroy()
    });

    const koBonus = enemy.type === 'heavy' ? 220 : enemy.type === 'rush' ? 150 : 110;
    score += koBonus + Math.min(120, combo * 4);
    stress = Math.max(0, stress - 5);
    scene.cameras.main.shake(90, 0.0022);
    if (Phaser.Math.Between(0, 2) === 0) scene.sfx.metal();
  }
}

function onHitPlayer(scene, enemy) {
  const now = scene.time.now;
  if (now < player.invulnUntil || now < enemy.stunnedUntil) return;
  const dmg = enemy.type === 'heavy' ? 10 : 6;

  hp -= dmg;
  combo = 0;
  player.invulnUntil = now + 520;
  player.body.velocity.x = -Math.sign(enemy.x - player.x) * 220;
  player.body.velocity.y = -130;
  scene.cameras.main.shake(120, 0.003);
  scene.sfx.damage();

  if (hp <= 0) lose(scene, '群衆に押し潰された…');
}

function spawnEnemy(scene, x) {
  const roll = Math.random();
  let w = 28, h = 52, hp = 18, color = 0xd1d5db, type = 'normal';
  if (roll < 0.16) { // heavy
    w = 36; h = 60; hp = 34; color = 0xb05b5b; type = 'heavy';
  } else if (roll > 0.78) { // rush
    w = 24; h = 48; hp = 14; color = 0x8bb1ff; type = 'rush';
  }

  const e = scene.add.rectangle(x, GROUND_Y - 2, w, h, color).setOrigin(0.5, 1);
  e.baseColor = color;
  e.type = type;
  e.hp = hp;
  e.stunnedUntil = 0;

  scene.physics.add.existing(e);
  e.body.setDragX(900);
  e.body.setMaxVelocity(220, 1000);
  e.body.setCollideWorldBounds(true);
  enemies.add(e);
}

function drawTrain(scene) {
  const g = scene.add.graphics();
  g.fillStyle(0x111a2b); g.fillRect(0, 0, WORLD_WIDTH, HEIGHT);

  // ceiling / route map
  g.fillStyle(0x2f3f5b); g.fillRect(0, 0, WORLD_WIDTH, 32);
  g.fillStyle(0xdce7ff); g.fillRect(24, 8, WORLD_WIDTH - 48, 8);
  for (let x = 40; x < WORLD_WIDTH - 30; x += 120) {
    g.fillStyle(0x6d7ea0); g.fillCircle(x, 12, 3);
  }

  // car partitions + doors + windows + ads
  for (let x = 0; x < WORLD_WIDTH; x += 440) {
    g.fillStyle(0x4f607f); g.fillRect(x + 4, 0, 10, HEIGHT);
    g.fillStyle(0x4f607f); g.fillRect(x + 426, 0, 10, HEIGHT);

    // doors
    g.fillStyle(0x7083a5); g.fillRect(x + 182, 72, 78, 170);
    g.fillStyle(0x3b4c69); g.fillRect(x + 188, 78, 66, 142);
    g.fillStyle(0x98aac7); g.fillRect(x + 219, 140, 4, 90);

    // windows
    g.fillStyle(0x5b6d8f);
    g.fillRect(x + 56, 68, 104, 122);
    g.fillRect(x + 280, 68, 104, 122);
    g.fillStyle(0x27364f);
    g.fillRect(x + 64, 76, 88, 106);
    g.fillRect(x + 288, 76, 88, 106);

    // ad boards
    g.fillStyle(0xd8dde8); g.fillRect(x + 24, 40, 132, 20);
    g.fillStyle(0xffc857); g.fillRect(x + 284, 40, 128, 20);
    g.fillStyle(0x1b2940); g.fillRect(x + 10, 220, 420, 12);
  }

  // side seats
  for (let x = 0; x < WORLD_WIDTH; x += 220) {
    g.fillStyle(0x42608a); g.fillRect(x + 12, HEIGHT - 196, 92, 24);
    g.fillStyle(0x42608a); g.fillRect(x + 118, HEIGHT - 196, 92, 24);
  }

  // floor detail + tactile blocks
  g.fillStyle(0x172338); g.fillRect(0, HEIGHT - 165, WORLD_WIDTH, 95);
  g.fillStyle(0xe6d36c); g.fillRect(0, HEIGHT - 82, WORLD_WIDTH, 8);
  for (let x = 0; x < WORLD_WIDTH; x += 70) {
    g.fillStyle((x / 70) % 2 ? 0x1f3049 : 0x253954);
    g.fillRect(x, HEIGHT - 75, 46, 6);
  }

  // handles
  for (let x = 40; x < WORLD_WIDTH; x += 62) {
    g.lineStyle(2, 0x9eb1d6); g.lineBetween(x, 16, x, 46);
    g.fillStyle(0xe6edf9); g.fillCircle(x, 52, 7);
  }

  // moving outside lights (window parallax feel)
  const lg = scene.add.graphics();
  lg.fillStyle(0x1e2a40);
  for (let i = 0; i < WORLD_WIDTH; i += 90) lg.fillRect(i, 0, 24, 80);
  lg.generateTexture('outside-lights', WORLD_WIDTH, 80);
  lg.destroy();
  const lights = scene.add.tileSprite(WORLD_WIDTH / 2, 130, WORLD_WIDTH, 80, 'outside-lights').setAlpha(0.22);
  scene.tweens.add({ targets: lights, tilePositionX: 800, duration: 5000, repeat: -1 });

  scene.add.text(WORLD_WIDTH - 350, HEIGHT - 165, '先頭車両 / 非常ブレーキ', {
    font: '20px monospace', fill: '#ffd166'
  });
}

function uiStyle(color = '#ffffff') {
  return { font: '20px monospace', fill: color, stroke: '#000', strokeThickness: 3 };
}

function hitSpark(scene, x, y, n = 8) {
  for (let i = 0; i < n; i++) {
    const dot = scene.add.rectangle(x, y, 3, 3, Phaser.Math.Between(0, 1) ? 0xffd166 : 0xff8b4d);
    scene.tweens.add({
      targets: dot,
      x: x + Phaser.Math.Between(-34, 34),
      y: y + Phaser.Math.Between(-18, 18),
      alpha: 0,
      duration: 120,
      onComplete: () => dot.destroy()
    });
  }
}

function createSfx(scene) {
  const ctx = scene.sound.context;
  const beep = (freq, dur = 0.05, gain = 0.07, type = 'square') => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.connect(g); g.connect(ctx.destination);
    const now = ctx.currentTime;
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    o.start(now); o.stop(now + dur);
  };
  return {
    hit(base) { beep(base + Phaser.Math.Between(-10, 12), 0.05, 0.09); },
    damage() { beep(95, 0.08, 0.12, 'sawtooth'); },
    jump() { beep(240, 0.03, 0.04, 'triangle'); },
    dash() { beep(310, 0.035, 0.05); beep(220, 0.03, 0.03); },
    alarm() { beep(600, 0.025, 0.03); setTimeout(() => beep(480, 0.025, 0.03), 70); },
    metal() { beep(720, 0.04, 0.04, 'triangle'); }
  };
}

function win(scene) {
  gameOver = true;
  score += Math.max(0, 1200 - stress * 8) + Math.max(0, hp * 4);
  if (score > hiScore) {
    hiScore = score;
    localStorage.setItem('trainFightHiScore', String(hiScore));
  }
  scene.physics.pause();
  const x = scene.cameras.main.scrollX + WIDTH / 2;
  scene.add.rectangle(x, HEIGHT / 2, 760, 250, 0x000000, 0.72);
  scene.add.text(x - 300, HEIGHT / 2 - 58, 'MISSION COMPLETE\n暴走列車を停止した！', {
    font: '42px monospace', fill: '#8bff9b'
  });
  scene.add.text(x - 300, HEIGHT / 2 + 42, `SCORE: ${score}   HI-SCORE: ${hiScore}`, {
    font: '28px monospace', fill: '#d6f4ff'
  });
}

function lose(scene, msg) {
  gameOver = true;
  if (score > hiScore) {
    hiScore = score;
    localStorage.setItem('trainFightHiScore', String(hiScore));
  }
  scene.physics.pause();
  const x = scene.cameras.main.scrollX + WIDTH / 2;
  scene.add.rectangle(x, HEIGHT / 2, 760, 250, 0x000000, 0.72);
  scene.add.text(x - 270, HEIGHT / 2 - 58, `GAME OVER\n${msg}`, {
    font: '40px monospace', fill: '#ff8f8f'
  });
  scene.add.text(x - 300, HEIGHT / 2 + 42, `SCORE: ${score}   HI-SCORE: ${hiScore}`, {
    font: '28px monospace', fill: '#ffdcdc'
  });
}
