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
let hp = 100, stress = 15, gameOver = false;
let facing = 1;
let combo = 0, comboTimer = 0, attackLock = 0;
let nearBrake = false;
let hpText, stressText, infoText, comboText;

function create() {
  this.physics.world.setBounds(0, 0, WORLD_WIDTH, HEIGHT);
  this.sfx = createSfx(this);

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
  for (let x = 440; x < WORLD_WIDTH - 250; x += Phaser.Math.Between(120, 200)) spawnEnemy(this, x);

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
  infoText = this.add.text(16, 92, '', uiStyle('#d7e3ff')).setScrollFactor(0);

  this.time.addEvent({ delay: 1800, loop: true, callback: () => {
    if (gameOver) return;
    if (enemies.countActive(true) < 32) spawnEnemy(this, this.cameras.main.scrollX + WIDTH + Phaser.Math.Between(120, 320));
    stress = Math.min(100, stress + 1);
    if (stress >= 100) lose(this, '暴走が限界に達した…');
  }});

  this.time.addEvent({ delay: 1000, loop: true, callback: () => !gameOver && this.sfx.alarm() });
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
      const aggro = e.type === 'heavy' ? 58 : e.type === 'rush' ? 130 : 90;
      e.body.setVelocityX(dir * aggro);
    }
  }

  nearBrake = Phaser.Math.Distance.Between(player.x, player.y, brakeLever.x, brakeLever.y) < 78;
  if (nearBrake && Phaser.Input.Keyboard.JustDown(keys.E)) {
    if (stress < 65) win(this);
    else infoText.setText('混乱が酷い！敵を減らしてからブレーキを引け');
  }

  if (comboTimer > 0) comboTimer -= dt;
  else combo = 0;

  hpText.setText(`HP: ${Math.max(0, hp)}`);
  stressText.setText(`暴走ゲージ: ${stress}%`);
  comboText.setText(combo > 1 ? `COMBO x${combo}` : '');
  infoText.setText(nearBrake ? (stress < 65 ? 'E で非常ブレーキ！' : '車内が混乱していて危険') : '右へ進め。先頭車両で非常ブレーキを引け');

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
  if (!attackHitbox.active || scene.time.now < enemy.stunnedUntil) return;

  enemy.hp -= attackHitbox.power;
  enemy.stunnedUntil = scene.time.now + 280;
  enemy.body.velocity.x = facing * attackHitbox.push;
  enemy.body.velocity.y = -120;
  enemy.setFillStyle(0xffffff);
  scene.time.delayedCall(80, () => enemy.setFillStyle(enemy.baseColor));

  combo += 1;
  comboTimer = 1150;
  stress = Math.max(0, stress - (enemy.type === 'heavy' ? 3 : 2));

  if (enemy.hp <= 0) {
    enemy.destroy();
    stress = Math.max(0, stress - 4);
    if (Phaser.Math.Between(0, 3) === 0) scene.sfx.metal();
  }
}

function onHitPlayer(scene, enemy) {
  const now = scene.time.now;
  if (now < player.invulnUntil || now < enemy.stunnedUntil) return;
  const dmg = enemy.type === 'heavy' ? 12 : 8;

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
  g.fillStyle(0x151f31); g.fillRect(0, 0, WORLD_WIDTH, HEIGHT);

  // car partitions
  for (let x = 0; x < WORLD_WIDTH; x += 440) {
    g.fillStyle(0x465874); g.fillRect(x + 5, 0, 8, HEIGHT);
    g.fillStyle(0x465874); g.fillRect(x + 430, 0, 8, HEIGHT);

    g.fillStyle(0x5a6986);
    g.fillRect(x + 70, 70, 130, 120);
    g.fillRect(x + 240, 70, 130, 120);
    g.fillStyle(0x2f3e55);
    g.fillRect(x + 80, 80, 110, 100);
    g.fillRect(x + 250, 80, 110, 100);

    g.fillStyle(0x1b2940);
    g.fillRect(x + 10, 220, 420, 12);
  }

  // floor details
  g.fillStyle(0x1a2638); g.fillRect(0, HEIGHT - 160, WORLD_WIDTH, 90);
  for (let x = 0; x < WORLD_WIDTH; x += 70) {
    g.fillStyle((x / 70) % 2 ? 0x202f45 : 0x263851);
    g.fillRect(x, HEIGHT - 76, 46, 6);
  }

  // handles
  for (let x = 40; x < WORLD_WIDTH; x += 70) {
    g.lineStyle(2, 0x92a4c6); g.lineBetween(x, 18, x, 44);
    g.fillStyle(0xc8d4eb); g.fillCircle(x, 50, 7);
  }

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
  scene.physics.pause();
  const x = scene.cameras.main.scrollX + WIDTH / 2;
  scene.add.rectangle(x, HEIGHT / 2, 680, 210, 0x000000, 0.72);
  scene.add.text(x - 275, HEIGHT / 2 - 26, 'MISSION COMPLETE\n暴走列車を停止した！', {
    font: '42px monospace', fill: '#8bff9b'
  });
}

function lose(scene, msg) {
  gameOver = true;
  scene.physics.pause();
  const x = scene.cameras.main.scrollX + WIDTH / 2;
  scene.add.rectangle(x, HEIGHT / 2, 680, 210, 0x000000, 0.72);
  scene.add.text(x - 250, HEIGHT / 2 - 26, `GAME OVER\n${msg}`, {
    font: '40px monospace', fill: '#ff8f8f'
  });
}
