// Chemo Dash runner using Phaser 3 (via CDN in index.html)
const W = 960, H = 540;
const lanes = [W * 0.35, W * 0.50, W * 0.65];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const randi = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

let score = 0;
let coins = 0;
let shield = 1;
let timeLeft = 60;

const scoreEl = document.getElementById("score");
const coinsEl = document.getElementById("coins");
const shieldEl = document.getElementById("shield");
const timeEl = document.getElementById("time");

const overlay = document.getElementById("overlay");
const titleEl = document.getElementById("title");
const textEl = document.getElementById("text");
const playBtn = document.getElementById("playBtn");
const howBtn = document.getElementById("howBtn");

function updateHUD() {
  scoreEl.textContent = String(score);
  coinsEl.textContent = String(coins);
  shieldEl.textContent = String(shield);
  timeEl.textContent = String(Math.max(0, Math.ceil(timeLeft)));
}

function showOverlay(title, text) {
  titleEl.textContent = title;
  textEl.textContent = text;
  overlay.classList.remove("hidden");
}
function hideOverlay() {
  overlay.classList.add("hidden");
}

class MainScene extends Phaser.Scene {
  constructor() { super("main"); }

  create() {
    // Reset run
    score = 0;
    coins = 0;
    shield = 1;
    timeLeft = 60;
    updateHUD();

    this.gameOver = false;

    // Background
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b0f1a);
    this.glow = this.add.circle(W / 2, 90, 520, 0x7b61ff, 0.12);

    // Simple city parallax bars
    this.city = [];
    for (let i = 0; i < 16; i++) {
      const bw = 40;
      const bh = 80 + (i % 6) * 18;
      const bx = i * 70;
      const r = this.add.rectangle(bx, 175, bw, bh, 0xeef2ff, 0.16);
      this.city.push(r);
    }

    // Road
    this.road = this.add.graphics();

    // Player
    this.laneIndex = 1;
    this.playerBaseY = H * 0.78;
    this.player = this.add.rectangle(lanes[this.laneIndex], this.playerBaseY, 44, 70, 0xffffff, 0.95);
    this.player.setStrokeStyle(4, 0x7b61ff, 0.35);

    this.ring = this.add.circle(this.player.x, this.player.y - 20, 46, 0x23f5a3, 0.0);

    this.vy = 0;
    this.onGround = true;
    this.sliding = false;

    // Groups
    this.obstacles = this.add.group();
    this.pickups = this.add.group();

    // Spawning and speed
    this.spawnT = 0;
    this.roadSpeed = 520;
    this.t = 0;

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey("A");
    this.keyD = this.input.keyboard.addKey("D");
    this.keyH = this.input.keyboard.addKey("H");

    // Touch swipe
    this.swipe = { x: 0, y: 0 };
    this.input.on("pointerdown", (p) => { this.swipe.x = p.x; this.swipe.y = p.y; });
    this.input.on("pointerup", (p) => {
      const dx = p.x - this.swipe.x;
      const dy = p.y - this.swipe.y;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 40) this.changeLane(1);
        if (dx < -40) this.changeLane(-1);
      } else {
        if (dy < -40) this.jump();
        if (dy > 40) this.slide();
      }
    });

    // Go text
    const go = this.add.text(W / 2, H / 2, "GO!", {
      fontFamily: "system-ui",
      fontSize: "64px",
      fontStyle: "900",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.tweens.add({
      targets: go,
      alpha: 0,
      scale: 1.25,
      duration: 520,
      ease: "Cubic.easeOut",
      onComplete: () => go.destroy()
    });
  }

  drawRoad() {
    this.road.clear();

    // Road trapezoid
    this.road.fillStyle(0xffffff, 0.06);
    this.road.beginPath();
    this.road.moveTo(W * 0.42, H * 0.18);
    this.road.lineTo(W * 0.58, H * 0.18);
    this.road.lineTo(W * 0.78, H * 0.92);
    this.road.lineTo(W * 0.22, H * 0.92);
    this.road.closePath();
    this.road.fillPath();

    // Lane lines
    this.road.lineStyle(4, 0xffffff, 0.12);
    const laneXTop = [W * 0.47, W * 0.50, W * 0.53];
    const laneXBot = [W * 0.35, W * 0.50, W * 0.65];
    for (let i = 0; i < 3; i++) {
      if (i === 0 || i === 2) {
        this.road.beginPath();
        this.road.moveTo(laneXTop[i], H * 0.18);
        this.road.lineTo(laneXBot[i], H * 0.92);
        this.road.strokePath();
      }
    }

    // Motion streaks
    this.road.fillStyle(0xffffff, 0.06);
    for (let i = 0; i < 18; i++) {
      const z = i / 18;
      const y = Phaser.Math.Linear(H * 0.22, H * 0.92, z);
      const w = Phaser.Math.Linear(20, 140, z);
      const x = W / 2 + Math.sin(this.t * 2 + i) * Phaser.Math.Linear(10, 90, z) - w / 2;
      this.road.fillRect(x, y, w, 3);
    }
  }

  flash() {
    const f = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.12);
    this.tweens.add({ targets: f, alpha: 0, duration: 140, onComplete: () => f.destroy() });
  }

  changeLane(dir) {
    if (this.gameOver) return;
    this.laneIndex = clamp(this.laneIndex + dir, 0, 2);
    this.tweens.add({
      targets: this.player,
      x: lanes[this.laneIndex],
      duration: 120,
      ease: "Cubic.easeOut"
    });
  }

  jump() {
    if (this.gameOver) return;
    if (!this.onGround) return;
    this.vy = -900;
    this.onGround = false;
  }

  slide() {
    if (this.gameOver) return;
    if (!this.onGround) return;
    if (this.sliding) return;

    this.sliding = true;
    this.player.height = 44;
    this.player.y = this.playerBaseY + 14;

    this.time.delayedCall(320, () => {
      this.sliding = false;
      this.player.height = 70;
      this.player.y = this.playerBaseY;
    });
  }

  spawnCoin() {
    const lane = randi(0, 2);
    const x = lanes[lane];
    const y = H * 0.16;

    const c = this.add.circle(x, y, 18, 0xffe678, 0.95);
    c.setStrokeStyle(4, 0x000000, 0.18);
    c.kind = "coin";
    c.lane = lane;
    this.pickups.add(c);
  }

  spawnHelp() {
    const lane = randi(0, 2);
    const x = lanes[lane];
    const y = H * 0.16;

    const h = this.add.circle(x, y, 20, 0x23f5a3, 0.95);
    const t = this.add.text(x, y, "HELP", {
      fontFamily: "system-ui",
      fontSize: "12px",
      fontStyle: "900",
      color: "#0b0f1a"
    }).setOrigin(0.5);

    h.kind = "help";
    h.lane = lane;
    h.label = t;
    this.pickups.add(h);
  }

  spawnObstacle() {
    const types = ["TRAFFIC", "BUS DELAY", "PAPERWORK", "INSURANCE"];
    const type = types[randi(0, types.length - 1)];
    const lane = randi(0, 2);

    const x = lanes[lane];
    const y = H * 0.18;

    const color =
      type === "TRAFFIC" ? 0xff3c3c :
      type === "BUS DELAY" ? 0xffc84a :
      type === "PAPERWORK" ? 0xa078ff :
      0x46d2ff;

    const r = this.add.rectangle(x, y, 92, 56, color, 0.95);
    r.setStrokeStyle(4, 0x000000, 0.22);

    const label = this.add.text(x, y, type, {
      fontFamily: "system-ui",
      fontSize: "14px",
      fontStyle: "900",
      color: "#0b0f1a"
    }).setOrigin(0.5);

    r.type = type;
    r.lane = lane;
    r.label = label;
    this.obstacles.add(r);
  }

  end(win) {
    this.gameOver = true;

    const title = win ? "YOU MADE IT TO CHEMO" : "YOU MISSED THE APPOINTMENT";
    const body = win
      ? "Even with skill, delays still happen.\nSupports make it survivable."
      : "Not because you played badly.\nBecause delays stacked unfairly.";

    const action =
      "\n\nWhat could help:\n• flexible clinic hours\n• reliable transportation\n• paid sick leave / caregiver support";

    this.add.rectangle(W / 2, H / 2, 660, 280, 0x000000, 0.58)
      .setStrokeStyle(2, 0xffffff, 0.18);

    this.add.text(W / 2, H / 2 - 90, title, {
      fontFamily: "system-ui",
      fontSize: "26px",
      fontStyle: "900",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 35, body + action, {
      fontFamily: "system-ui",
      fontSize: "16px",
      color: "#e6eaff",
      align: "center"
    }).setOrigin(0.5);

    const btn = this.add.text(W / 2, H / 2 + 95, "PLAY AGAIN", {
      fontFamily: "system-ui",
      fontSize: "18px",
      fontStyle: "900",
      color: "#0b0f1a",
      backgroundColor: "#eef2ff",
      padding: { x: 14, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on("pointerdown", () => this.scene.restart());
  }

  update(_, delta) {
    if (this.gameOver) return;

    const dt = delta / 1000;
    this.t += dt;

    // Road draw
    this.drawRoad();

    // City parallax
    for (const b of this.city) {
      b.x -= 30 * dt;
      if (b.x < -60) b.x = W + 60;
    }

    // Controls
    const leftPressed = this.cursors.left.isDown || this.keyA.isDown;
    const rightPressed = this.cursors.right.isDown || this.keyD.isDown;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.keyA)) this.changeLane(-1);
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.keyD)) this.changeLane(1);
    if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) this.jump();
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) this.slide();

    if (Phaser.Input.Keyboard.JustDown(this.keyH) && shield > 0) {
      shield -= 1;
      this.flash();
      updateHUD();
    }

    // Gravity
    if (!this.onGround) {
      this.vy += 2400 * dt;
      this.player.y += this.vy * dt;
      if (this.player.y >= this.playerBaseY) {
        this.player.y = this.playerBaseY;
        this.vy = 0;
        this.onGround = true;
      }
    }

    // Shield ring
    this.ring.x = this.player.x;
    this.ring.y = this.player.y - 20;
    this.ring.setAlpha(shield > 0 ? 0.10 : 0.0);

    // Spawn cadence
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      const elapsed = 60 - timeLeft;
      const gap = clamp(0.65 - elapsed * 0.006, 0.32, 0.65);
      this.spawnT = gap;

      const roll = Math.random();
      if (roll < 0.38) {
        this.spawnCoin();
        if (Math.random() < 0.25) this.spawnCoin();
      } else if (roll < 0.46) {
        this.spawnHelp();
      } else {
        this.spawnObstacle();
      }
    }

    // Move objects down the road
    const moveY = (this.roadSpeed + (60 - timeLeft) * 2.8) * dt;

    this.obstacles.getChildren().forEach(o => {
      o.y += moveY;
      o.label.x = o.x;
      o.label.y = o.y;

      // Collision near player
      if (Math.abs(o.y - this.player.y) < 40 && o.lane === this.laneIndex) {
        const needSlide = o.type === "PAPERWORK";
        const needJump = (o.type === "TRAFFIC" || o.type === "INSURANCE");
        const ok =
          (needSlide && this.sliding) ||
          (needJump && !this.onGround) ||
          (!needSlide && !needJump && o.type !== "BUS DELAY"); // bus delay is always bad if same lane

        if (!ok) {
          if (shield > 0) {
            shield -= 1;
            this.flash();
          } else {
            timeLeft -= 6;
            this.flash();
          }
          score = Math.max(0, score - 10);
        } else {
          score += 12;
        }

        updateHUD();
        o.label.destroy();
        o.destroy();
      }

      if (o.y > H + 80) {
        o.label.destroy();
        o.destroy();
      }
    });

    this.pickups.getChildren().forEach(p => {
      p.y += moveY;
      if (p.label) { p.label.x = p.x; p.label.y = p.y; }

      const near = Math.abs(p.y - this.player.y) < 40 && Math.abs(p.x - this.player.x) < 70;
      if (near) {
        if (p.kind === "coin") { coins += 1; score += 8; this.flash(); }
        if (p.kind === "help") { shield += 1; score += 15; this.flash(); }
        updateHUD();
        if (p.label) p.label.destroy();
        p.destroy();
      }

      if (p.y > H + 80) {
        if (p.label) p.label.destroy();
        p.destroy();
      }
    });

    // Timer and win/lose
    timeLeft -= dt;
    updateHUD();

    if (timeLeft <= 0) {
      this.end(false);
      return;
    }

    // Simple win: survive and get decent score
    if (timeLeft <= 0.1 && score >= 220) {
      this.end(true);
    }
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: W,
  height: H,
  backgroundColor: "#0b0f1a",
  scene: [MainScene]
};

let game = null;

playBtn.addEventListener("click", () => {
  hideOverlay();
  if (!game) game = new Phaser.Game(config);
  else game.scene.keys.main.scene.restart();
});

howBtn.addEventListener("click", () => {
  showOverlay(
    "How to play",
    "Goal: make it to chemo by surviving the timer.\n\n" +
    "A/Left and D/Right change lanes.\nSpace jumps.\nDown slides.\n\n" +
    "TRAFFIC + INSURANCE: jump.\nPAPERWORK: slide.\nBUS DELAY: avoid that lane.\n\n" +
    "Coins give score.\nHELP gives shield.\nH uses shield."
  );
});

// Start screen
showOverlay(
  "Chemo Dash",
  "You are trying to reach a chemo appointment on time.\n" +
  "Delays represent real barriers to cancer care.\n\nPress Play."
);
