(() => {
  "use strict";

  const STORAGE_KEYS = {
    highScores: "babyRunnerHighScores",
    bestScore: "babyRunnerBestScore",
    settings: "babyRunnerSettings"
  };

  const LANES = [-1, 0, 1];
  const POWER_UPS = {
    turbo: { label: "Botines", duration: 6, score: 50 },
    gloves: { label: "Guantes", duration: 6, score: 50 },
    shield: { label: "Escudo", duration: 5, score: 50 },
    star: { label: "Estrella", duration: 8, score: 50 }
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  class AssetLoader {
    constructor() {
      this.manifest = null;
      this.images = new Map();
    }

    async load() {
      try {
        const res = await fetch("/juego/assets/asset-manifest.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`manifest ${res.status}`);
        this.manifest = await res.json();
        const paths = this.collectPaths(this.manifest);
        await Promise.all(paths.map((path) => this.loadImage(path)));
      } catch (error) {
        console.warn("Baby Runner: assets con fallback Canvas", error);
      }
    }

    collectPaths(node, result = []) {
      if (!node) return result;
      if (typeof node === "string" && node) result.push(node);
      else if (Array.isArray(node)) node.forEach((item) => this.collectPaths(item, result));
      else if (typeof node === "object") Object.values(node).forEach((item) => this.collectPaths(item, result));
      return [...new Set(result)];
    }

    loadImage(path) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          this.images.set(path, img);
          resolve();
        };
        img.onerror = () => {
          console.warn(`Baby Runner: no se pudo cargar ${path}`);
          resolve();
        };
        img.src = path;
      });
    }

    image(path) {
      return this.images.get(path) || null;
    }

    manifestPath(...keys) {
      let node = this.manifest;
      for (const key of keys) node = node?.[key];
      return typeof node === "string" ? node : "";
    }

    runFrame(index) {
      const run = this.manifest?.player?.run || [];
      return this.image(run[index % Math.max(run.length, 1)]);
    }
  }

  class StorageManager {
    constructor(warningEl) {
      this.warningEl = warningEl;
      this.available = this.test();
    }

    test() {
      try {
        localStorage.setItem("__baby_runner_test", "1");
        localStorage.removeItem("__baby_runner_test");
        return true;
      } catch (error) {
        this.showWarning();
        return false;
      }
    }

    showWarning() {
      if (!this.warningEl) return;
      this.warningEl.classList.add("visible");
      window.setTimeout(() => this.warningEl.classList.remove("visible"), 3200);
    }

    getBestScore() {
      if (!this.available) return 0;
      return Number(localStorage.getItem(STORAGE_KEYS.bestScore) || 0);
    }

    getScores() {
      if (!this.available) return [];
      try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.highScores) || "[]");
        return Array.isArray(data) ? data : [];
      } catch (error) {
        return [];
      }
    }

    isHighScore(score) {
      const scores = this.getScores();
      return scores.length < 10 || score > Number(scores[scores.length - 1]?.score || 0);
    }

    saveScore(name, score, balls) {
      if (!this.available) return [];
      const cleanName = String(name || "JUGADOR")
        .replace(/[<>/\\'"`]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 12)
        .toUpperCase() || "JUGADOR";
      const row = {
        name: cleanName,
        score: Math.max(0, Math.round(score)),
        balls: Math.max(0, Math.round(balls)),
        date: todayISO(),
        ts: Date.now()
      };
      const scores = [...this.getScores(), row]
        .sort((a, b) => Number(b.score) - Number(a.score) || Number(b.ts || 0) - Number(a.ts || 0))
        .slice(0, 10);
      localStorage.setItem(STORAGE_KEYS.highScores, JSON.stringify(scores));
      const best = Math.max(this.getBestScore(), row.score);
      localStorage.setItem(STORAGE_KEYS.bestScore, String(best));
      return scores;
    }
  }

  class UIManager {
    constructor(storage) {
      this.storage = storage;
      this.screens = {
        start: document.getElementById("screen-start"),
        pause: document.getElementById("screen-pause"),
        gameOver: document.getElementById("screen-gameover"),
        record: document.getElementById("screen-record"),
        ranking: document.getElementById("screen-ranking")
      };
      this.hud = document.getElementById("hud");
      this.score = document.getElementById("hud-score");
      this.balls = document.getElementById("hud-balls");
      this.best = document.getElementById("hud-best");
      this.powerName = document.getElementById("hud-power-name");
      this.powerTime = document.getElementById("hud-power-time");
      this.rankingList = document.getElementById("ranking-list");
    }

    show(name) {
      Object.entries(this.screens).forEach(([key, el]) => el?.classList.toggle("active", key === name));
      this.hud?.classList.toggle("hidden", name === "start" || name === "ranking" || name === "record");
      if (name === "ranking") this.renderRanking();
    }

    hideAll() {
      Object.values(this.screens).forEach((el) => el?.classList.remove("active"));
      this.hud?.classList.remove("hidden");
    }

    update(game) {
      this.score.textContent = String(Math.round(game.score.value)).padStart(6, "0");
      this.balls.textContent = String(game.score.balls);
      this.best.textContent = String(this.storage.getBestScore());
      const active = game.power.active;
      this.powerName.textContent = active ? POWER_UPS[active].label : "-";
      this.powerTime.textContent = active ? `${game.power.remaining.toFixed(1)}s` : "";
    }

    renderGameOver(score, previousBest, balls) {
      document.getElementById("final-score").textContent = String(Math.round(score));
      document.getElementById("previous-best").textContent = String(previousBest);
      document.getElementById("final-balls").textContent = String(balls);
    }

    renderRecord(score) {
      document.getElementById("record-score").textContent = String(Math.round(score));
      const input = document.getElementById("record-name");
      input.value = "";
      window.setTimeout(() => input.focus(), 120);
    }

    renderRanking() {
      const scores = this.storage.getScores();
      this.rankingList.replaceChildren();
      if (!scores.length) {
        const li = document.createElement("li");
        li.textContent = "Todavia no hay records guardados.";
        this.rankingList.append(li);
        return;
      }
      scores.forEach((row) => {
        const li = document.createElement("li");
        const wrap = document.createElement("div");
        const left = document.createElement("div");
        const right = document.createElement("strong");
        const meta = document.createElement("small");
        wrap.className = "ranking-row";
        left.textContent = row.name || "JUGADOR";
        meta.textContent = `${row.balls || 0} pelotas - ${row.date || ""}`;
        right.textContent = String(row.score || 0);
        left.append(meta);
        wrap.append(left, right);
        li.append(wrap);
        this.rankingList.append(li);
      });
    }
  }

  class InputManager {
    constructor(canvas, game) {
      this.canvas = canvas;
      this.game = game;
      this.touchStart = null;
      this.bind();
    }

    bind() {
      this.canvas.addEventListener("touchstart", (event) => {
        const t = event.changedTouches[0];
        this.touchStart = { x: t.clientX, y: t.clientY, time: performance.now() };
      }, { passive: false });

      this.canvas.addEventListener("touchmove", (event) => event.preventDefault(), { passive: false });

      this.canvas.addEventListener("touchend", (event) => {
        event.preventDefault();
        if (!this.touchStart) return;
        const t = event.changedTouches[0];
        const dx = t.clientX - this.touchStart.x;
        const dy = t.clientY - this.touchStart.y;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        if (Math.max(absX, absY) < 24) {
          if (this.game.state === "ready") this.game.start();
          return;
        }
        if (absX > absY) this.game.action(dx > 0 ? "right" : "left");
        else this.game.action(dy > 0 ? "slide" : "jump");
      }, { passive: false });

      window.addEventListener("keydown", (event) => {
        const key = event.key.toLowerCase();
        if (["arrowleft", "arrowright", "arrowup", "arrowdown", " ", "a", "d", "w", "s"].includes(key)) {
          event.preventDefault();
        }
        if (key === "arrowleft" || key === "a") this.game.action("left");
        if (key === "arrowright" || key === "d") this.game.action("right");
        if (key === "arrowup" || key === "w" || key === " ") this.game.action("jump");
        if (key === "arrowdown" || key === "s") this.game.action("slide");
        if (key === "escape") this.game.togglePause();
      });
    }
  }

  class Player {
    constructor() {
      this.lane = 0;
      this.targetLane = 0;
      this.visualLane = 0;
      this.y = 0;
      this.vy = 0;
      this.slideTimer = 0;
      this.hitTimer = 0;
      this.runTime = 0;
      this.state = "ready";
    }

    reset() {
      this.lane = 0;
      this.targetLane = 0;
      this.visualLane = 0;
      this.y = 0;
      this.vy = 0;
      this.slideTimer = 0;
      this.hitTimer = 0;
      this.runTime = 0;
      this.state = "ready";
    }

    move(dir) {
      this.targetLane = clamp(this.targetLane + dir, -1, 1);
      this.lane = this.targetLane;
    }

    jump(highJump) {
      if (this.y > 1 || this.slideTimer > 0) return;
      this.vy = highJump ? 1120 : 840;
      this.state = "jumping";
    }

    slide() {
      if (this.y > 1) return;
      this.slideTimer = .72;
      this.state = "sliding";
    }

    hit() {
      this.hitTimer = .5;
      this.state = "hit";
    }

    update(dt, running) {
      this.runTime += dt;
      this.visualLane += (this.targetLane - this.visualLane) * Math.min(1, dt * 16);
      if (this.y > 0 || this.vy > 0) {
        this.y += this.vy * dt;
        this.vy -= 2200 * dt;
        if (this.y <= 0) {
          this.y = 0;
          this.vy = 0;
        }
      }
      if (this.slideTimer > 0) this.slideTimer = Math.max(0, this.slideTimer - dt);
      if (this.hitTimer > 0) this.hitTimer = Math.max(0, this.hitTimer - dt);
      if (!running) return;
      if (this.hitTimer > 0) this.state = "hit";
      else if (this.y > 0) this.state = "jumping";
      else if (this.slideTimer > 0) this.state = "sliding";
      else this.state = "running";
    }

    get isJumping() {
      return this.y > 90;
    }

    get isSliding() {
      return this.slideTimer > .18;
    }
  }

  class ScoreSystem {
    constructor() {
      this.reset();
    }

    reset() {
      this.value = 0;
      this.balls = 0;
      this.distance = 0;
      this.streak = 0;
      this.nearMissTimer = 0;
    }

    update(dt, speed, multiplier) {
      this.distance += speed * dt;
      this.value += (speed * .018 * dt) * multiplier * (1 + Math.min(this.streak, 18) * .015);
      this.nearMissTimer = Math.max(0, this.nearMissTimer - dt);
    }

    collectBall(multiplier) {
      this.balls += 1;
      this.value += 10 * multiplier;
      this.streak += 1;
    }

    collectSpecial(multiplier) {
      this.value += 50 * multiplier;
      this.streak += 2;
    }

    nearMiss(multiplier) {
      if (this.nearMissTimer > 0) return;
      this.value += 20 * multiplier;
      this.streak += 1;
      this.nearMissTimer = .35;
    }

    breakStreak() {
      this.streak = 0;
    }
  }

  class PowerUpSystem {
    constructor() {
      this.active = null;
      this.remaining = 0;
    }

    reset() {
      this.active = null;
      this.remaining = 0;
    }

    activate(type) {
      if (!POWER_UPS[type]) return;
      this.active = type;
      this.remaining = POWER_UPS[type].duration;
    }

    update(dt) {
      if (!this.active) return;
      this.remaining -= dt;
      if (this.remaining <= 0) this.reset();
    }

    get speedMultiplier() {
      return this.active === "turbo" ? 1.6 : 1;
    }

    get scoreMultiplier() {
      return this.active === "star" ? 2 : 1;
    }

    get highJump() {
      return this.active === "gloves";
    }

    get shielded() {
      return this.active === "shield";
    }
  }

  class LaneManager {
    constructor(game) {
      this.game = game;
    }

    x(lane, z) {
      const w = this.game.width;
      const horizon = w * .13;
      const laneWidth = horizon + z * (w * .18);
      return w * .5 + lane * laneWidth;
    }

    y(z) {
      const h = this.game.height;
      return h * .26 + z * (h * .55);
    }

    scale(z) {
      return .28 + z * .92;
    }
  }

  class ObstacleManager {
    constructor(game) {
      this.game = game;
      this.items = [];
      this.spawnTimer = 0;
    }

    reset() {
      this.items = [];
      this.spawnTimer = 1.1;
    }

    update(dt) {
      const game = this.game;
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnRow();
        this.spawnTimer = clamp(1.15 - game.difficulty * .08, .46, 1.15);
      }
      this.items.forEach((item) => {
        item.z -= game.worldSpeed * dt / 980;
      });
      this.items = this.items.filter((item) => item.z > -.18 && !item.dead);
    }

    spawnRow() {
      const obstacleCount = Math.random() < .28 + this.game.difficulty * .025 ? 2 : 1;
      const blocked = [];
      const freeLane = randomItem(LANES);
      while (blocked.length < obstacleCount) {
        const lane = randomItem(LANES);
        if (lane !== freeLane && !blocked.includes(lane)) blocked.push(lane);
      }
      blocked.forEach((lane) => this.items.push(this.makeObstacle(lane)));
    }

    makeObstacle(lane) {
      const pool = [
        { type: "cone", action: "dodge", w: 72, h: 82 },
        { type: "rival", action: Math.random() < .55 ? "jump" : "dodge", w: 78, h: 110 },
        { type: "goalkeeper", action: "dodge", w: 118, h: 132 },
        { type: "mud", action: "jump", w: 112, h: 42 },
        { type: "barrier", action: "slide", w: 118, h: 82 }
      ];
      return {
        kind: "obstacle",
        ...randomItem(pool),
        lane,
        z: 1.12,
        checked: false,
        near: false
      };
    }
  }

  class ItemManager {
    constructor(game) {
      this.game = game;
      this.items = [];
      this.spawnTimer = 0;
    }

    reset() {
      this.items = [];
      this.spawnTimer = .55;
    }

    update(dt) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawn();
        this.spawnTimer = clamp(.62 - this.game.difficulty * .018, .34, .62);
      }
      this.items.forEach((item) => {
        item.z -= this.game.worldSpeed * dt / 980;
        item.spin += dt * 4;
      });
      this.items = this.items.filter((item) => item.z > -.15 && !item.dead);
    }

    spawn() {
      const specialChance = .12 + Math.min(.08, this.game.difficulty * .01);
      const type = Math.random() < specialChance ? randomItem(["turbo", "gloves", "shield", "star"]) : "ball";
      this.items.push({
        kind: "item",
        type,
        lane: randomItem(LANES),
        z: 1.06 + Math.random() * .18,
        spin: Math.random() * 6,
        w: type === "ball" ? 48 : 58,
        h: type === "ball" ? 48 : 58
      });
    }
  }

  class CollisionSystem {
    constructor(game) {
      this.game = game;
    }

    update() {
      const player = this.game.player;
      const scoreMultiplier = this.game.power.scoreMultiplier;

      for (const item of this.game.items.items) {
        if (item.dead || Math.abs(item.z) > .07 || item.lane !== player.lane) continue;
        item.dead = true;
        if (item.type === "ball") {
          this.game.score.collectBall(scoreMultiplier);
          this.game.flash = .14;
        } else {
          this.game.score.collectSpecial(scoreMultiplier);
          this.game.power.activate(item.type);
          this.game.flash = .22;
          navigator.vibrate?.(25);
        }
      }

      for (const obstacle of this.game.obstacles.items) {
        if (obstacle.dead) continue;
        if (!obstacle.near && obstacle.z < .18 && obstacle.z > .05 && obstacle.lane !== player.lane) {
          obstacle.near = true;
          this.game.score.nearMiss(scoreMultiplier);
        }
        if (obstacle.checked || Math.abs(obstacle.z) > .055 || obstacle.lane !== player.lane) continue;
        obstacle.checked = true;
        if (this.canAvoid(obstacle, player)) {
          this.game.score.nearMiss(scoreMultiplier);
          continue;
        }
        if (this.game.power.shielded) {
          obstacle.dead = true;
          this.game.power.reset();
          this.game.player.hit();
          this.game.score.breakStreak();
          this.game.flash = .28;
          navigator.vibrate?.([35, 35, 35]);
          continue;
        }
        this.game.gameOver();
        break;
      }
    }

    canAvoid(obstacle, player) {
      if (obstacle.action === "jump") return player.isJumping;
      if (obstacle.action === "slide") return player.isSliding;
      return false;
    }
  }

  class BackgroundManager {
    constructor(game) {
      this.game = game;
      this.scroll = 0;
    }

    update(dt) {
      this.scroll += this.game.worldSpeed * dt;
    }

    level(score) {
      if (score >= 9000) return 4;
      if (score >= 5000) return 3;
      if (score >= 2000) return 2;
      return 1;
    }

    draw(ctx) {
      const game = this.game;
      const w = game.width;
      const h = game.height;
      const level = this.level(game.score.value);
      const sky = level === 2 ? ["#09101f", "#1c3659"] : level === 3 ? ["#344047", "#68727a"] : level === 4 ? ["#132034", "#2c5b91"] : ["#42aaf3", "#9ddcff"];
      const grass = level === 3 ? "#4b6f31" : "#288d36";
      const grad = ctx.createLinearGradient(0, 0, 0, h * .65);
      grad.addColorStop(0, sky[0]);
      grad.addColorStop(1, sky[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      this.drawStands(ctx, w, h, level);

      ctx.fillStyle = grass;
      ctx.beginPath();
      ctx.moveTo(w * .16, h);
      ctx.lineTo(w * .39, h * .27);
      ctx.lineTo(w * .61, h * .27);
      ctx.lineTo(w * .84, h);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,.72)";
      ctx.lineWidth = Math.max(2, w * .008);
      [-1, 0, 1].forEach((lane) => {
        const near = this.game.lanes.x(lane, 1);
        const far = this.game.lanes.x(lane, 0);
        ctx.beginPath();
        ctx.moveTo(far, h * .28);
        ctx.lineTo(near, h);
        ctx.stroke();
      });

      ctx.strokeStyle = "rgba(255,255,255,.16)";
      ctx.lineWidth = 1;
      const step = 88;
      for (let y = h - (this.scroll % step); y > h * .3; y -= step) {
        const z = (y - h * .26) / (h * .55);
        const left = this.game.lanes.x(-1.22, z);
        const right = this.game.lanes.x(1.22, z);
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.stroke();
      }

      if (level >= 2) this.drawLights(ctx, w, h, level);
      if (level === 3) this.drawRain(ctx, w, h);
      if (level === 4) this.drawConfetti(ctx, w, h);
    }

    drawStands(ctx, w, h, level) {
      ctx.fillStyle = level === 2 ? "#101722" : "#1b1b1b";
      ctx.beginPath();
      ctx.moveTo(0, h * .36);
      ctx.lineTo(w * .32, h * .28);
      ctx.lineTo(w * .16, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w, h * .36);
      ctx.lineTo(w * .68, h * .28);
      ctx.lineTo(w * .84, h);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
      for (let i = 0; i < 16; i += 1) {
        const y = h * .38 + i * 30;
        ctx.fillStyle = i % 2 ? "#f4f4f4" : "#080808";
        ctx.fillRect(0, y, w * .19, 8);
        ctx.fillRect(w * .81, y, w * .19, 8);
      }
    }

    drawLights(ctx, w, h, level) {
      ctx.fillStyle = level === 2 ? "rgba(255,244,190,.6)" : "rgba(255,255,255,.32)";
      for (const x of [w * .16, w * .84]) {
        ctx.beginPath();
        ctx.moveTo(x, h * .09);
        ctx.lineTo(w * .5, h * .56);
        ctx.lineTo(x + (x < w * .5 ? 80 : -80), h * .09);
        ctx.closePath();
        ctx.fill();
      }
    }

    drawRain(ctx, w, h) {
      ctx.strokeStyle = "rgba(190,220,255,.45)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 48; i += 1) {
        const x = (i * 53 + this.scroll * .18) % w;
        const y = (i * 91 + this.scroll * .55) % h;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 10, y + 24);
        ctx.stroke();
      }
    }

    drawConfetti(ctx, w, h) {
      for (let i = 0; i < 34; i += 1) {
        ctx.fillStyle = i % 2 ? "#fff" : "#111";
        ctx.fillRect((i * 47 + this.scroll * .08) % w, (i * 71 + this.scroll * .18) % (h * .45), 7, 13);
      }
    }
  }

  class Renderer {
    constructor(game) {
      this.game = game;
    }

    draw() {
      const { ctx, width, height } = this.game;
      ctx.clearRect(0, 0, width, height);
      this.game.background.draw(ctx);
      const entities = [...this.game.obstacles.items, ...this.game.items.items].sort((a, b) => a.z - b.z);
      entities.forEach((entity) => this.drawEntity(entity));
      this.drawPlayer();
      this.drawEffects();
    }

    drawEntity(entity) {
      const game = this.game;
      const ctx = game.ctx;
      const z = clamp(entity.z, 0, 1.25);
      const x = game.lanes.x(entity.lane, z);
      const y = game.lanes.y(z);
      const scale = game.lanes.scale(z);
      const w = entity.w * scale;
      const h = entity.h * scale;
      ctx.save();
      ctx.globalAlpha = clamp((entity.z + .15) / .2, 0, 1);
      ctx.translate(x, y);
      if (entity.kind === "item") ctx.rotate(Math.sin(entity.spin) * .09);
      this.shadow(ctx, w * .42, h * .13, scale);
      if (entity.kind === "item") this.drawItem(ctx, entity, w, h);
      else this.drawObstacle(ctx, entity, w, h);
      ctx.restore();
    }

    drawPlayer() {
      const game = this.game;
      const player = game.player;
      const ctx = game.ctx;
      const x = game.lanes.x(player.visualLane, 1);
      const y = game.height * .79 - player.y * .22;
      const scale = 1.05;
      const w = 104 * scale;
      const h = player.isSliding ? 86 : 132;
      ctx.save();
      ctx.translate(x, y);
      this.shadow(ctx, 46, 12, 1);
      if (game.power.shielded) {
        ctx.strokeStyle = "rgba(105,190,255,.9)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.ellipse(0, -70, 54, 73, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (game.power.active === "turbo") {
        ctx.strokeStyle = "rgba(90,200,255,.72)";
        ctx.lineWidth = 4;
        for (let i = -1; i <= 1; i += 1) {
          ctx.beginPath();
          ctx.moveTo(i * 18, -26);
          ctx.lineTo(i * 28, 80);
          ctx.stroke();
        }
      }
      const img = this.playerImage();
      if (img) ctx.drawImage(img, -w / 2, -h, w, h);
      else this.fallbackPlayer(ctx, player, w, h);
      ctx.restore();
    }

    playerImage() {
      const player = this.game.player;
      const assets = this.game.assets;
      if (player.state === "jumping") return assets.image(assets.manifestPath("player", "jump"));
      if (player.state === "sliding") return assets.image(assets.manifestPath("player", "slide"));
      if (player.state === "hit") return assets.image(assets.manifestPath("player", "hit"));
      return assets.runFrame(Math.floor(player.runTime * 10));
    }

    drawItem(ctx, entity, w, h) {
      const path = {
        ball: this.game.assets.manifestPath("items", "ball"),
        turbo: this.game.assets.manifestPath("items", "turbo"),
        gloves: this.game.assets.manifestPath("items", "gloves"),
        shield: this.game.assets.manifestPath("items", "shield")
      }[entity.type];
      const img = this.game.assets.image(path);
      if (img) {
        ctx.drawImage(img, -w / 2, -h, w, h);
        return;
      }
      ctx.fillStyle = entity.type === "ball" ? "#ffd447" : entity.type === "shield" ? "#66c7ff" : "#fff";
      ctx.beginPath();
      ctx.arc(0, -h / 2, w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#101010";
      ctx.font = `900 ${Math.max(16, w * .4)}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(entity.type === "ball" ? "B" : entity.type[0].toUpperCase(), 0, -h / 2);
    }

    drawObstacle(ctx, entity, w, h) {
      const path = {
        cone: this.game.assets.manifestPath("obstacles", "cone"),
        rival: this.game.assets.manifestPath("obstacles", "rival"),
        goalkeeper: this.game.assets.manifestPath("obstacles", "goalkeeper"),
        mud: this.game.assets.manifestPath("obstacles", "mud")
      }[entity.type];
      const img = this.game.assets.image(path);
      if (img) {
        ctx.drawImage(img, -w / 2, -h, w, h);
        return;
      }
      if (entity.type === "barrier") {
        ctx.fillStyle = "#f5f5f5";
        ctx.fillRect(-w / 2, -h, w, h * .18);
        ctx.fillStyle = "#161616";
        ctx.fillRect(-w / 2, -h * .78, w, h * .22);
        ctx.fillStyle = "#f5f5f5";
        ctx.fillRect(-w / 2, -h * .5, w, h * .18);
        return;
      }
      ctx.fillStyle = entity.type === "mud" ? "#5b3c23" : entity.type === "cone" ? "#ff742d" : "#111";
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h, w, h, 8);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    fallbackPlayer(ctx, player, w, h) {
      if (player.isSliding) {
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.roundRect(-w / 2, -54, w, 42, 16);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.fillRect(-w * .24, -48, w * .48, 22);
        return;
      }
      ctx.fillStyle = "#f4c49c";
      ctx.beginPath();
      ctx.arc(0, -h + 28, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#171717";
      ctx.beginPath();
      ctx.arc(0, -h + 18, 20, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.roundRect(-26, -h + 50, 52, 54, 10);
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.font = "900 22px Arial";
      ctx.textAlign = "center";
      ctx.fillText("10", 0, -h + 86);
      const leg = Math.sin(player.runTime * 18) * 12;
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(-13, -32);
      ctx.lineTo(-22 + leg, 0);
      ctx.moveTo(13, -32);
      ctx.lineTo(22 - leg, 0);
      ctx.stroke();
    }

    shadow(ctx, w, h, scale) {
      ctx.fillStyle = `rgba(0,0,0,${.22 + scale * .18})`;
      ctx.beginPath();
      ctx.ellipse(0, -2, w, h, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    drawEffects() {
      const game = this.game;
      if (game.flash <= 0) return;
      const ctx = game.ctx;
      ctx.save();
      ctx.globalAlpha = game.flash * 1.8;
      ctx.fillStyle = game.state === "gameOver" ? "#ff432e" : "#ffffff";
      ctx.fillRect(0, 0, game.width, game.height);
      ctx.restore();
    }
  }

  class Game {
    constructor() {
      this.canvas = document.getElementById("game-canvas");
      this.ctx = this.canvas.getContext("2d");
      this.assets = new AssetLoader();
      this.storage = new StorageManager(document.getElementById("storage-warning"));
      this.ui = new UIManager(this.storage);
      this.player = new Player();
      this.score = new ScoreSystem();
      this.power = new PowerUpSystem();
      this.lanes = new LaneManager(this);
      this.background = new BackgroundManager(this);
      this.obstacles = new ObstacleManager(this);
      this.items = new ItemManager(this);
      this.collision = new CollisionSystem(this);
      this.renderer = new Renderer(this);
      this.input = new InputManager(this.canvas, this);
      this.state = "ready";
      this.width = 360;
      this.height = 640;
      this.baseSpeed = 365;
      this.worldSpeed = this.baseSpeed;
      this.elapsed = 0;
      this.difficulty = 0;
      this.lastTime = 0;
      this.flash = 0;
      this.previousBest = 0;
      this.bindUI();
      this.resize();
      window.addEventListener("resize", () => this.resize());
      document.addEventListener("visibilitychange", () => {
        if (document.hidden && this.state === "running") this.pause();
      });
    }

    async boot() {
      await this.assets.load();
      this.loop(0);
      this.ui.show("start");
      this.ui.update(this);
    }

    bindUI() {
      document.getElementById("play-btn").addEventListener("click", () => this.start());
      document.getElementById("pause-btn").addEventListener("click", () => this.pause());
      document.getElementById("resume-btn").addEventListener("click", () => this.resume());
      document.getElementById("restart-btn").addEventListener("click", () => this.start());
      document.getElementById("restart-pause-btn").addEventListener("click", () => this.start());
      document.getElementById("ranking-play-btn").addEventListener("click", () => this.start());
      document.getElementById("ranking-close-btn").addEventListener("click", () => {
        this.ui.show(this.state === "gameOver" ? "gameOver" : "start");
      });
      document.querySelectorAll("[data-open-ranking]").forEach((btn) => {
        btn.addEventListener("click", () => this.ui.show("ranking"));
      });
      document.getElementById("record-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const name = document.getElementById("record-name").value;
        this.storage.saveScore(name, this.score.value, this.score.balls);
        this.ui.renderGameOver(this.score.value, this.previousBest, this.score.balls);
        this.ui.show("gameOver");
      });
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.width = Math.max(320, Math.round(rect.width * dpr));
      this.height = Math.max(568, Math.round(rect.height * dpr));
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    reset() {
      this.player.reset();
      this.score.reset();
      this.power.reset();
      this.obstacles.reset();
      this.items.reset();
      this.elapsed = 0;
      this.difficulty = 0;
      this.worldSpeed = this.baseSpeed;
      this.flash = 0;
    }

    start() {
      this.previousBest = this.storage.getBestScore();
      this.reset();
      this.state = "running";
      this.player.state = "running";
      this.ui.hideAll();
      this.ui.update(this);
    }

    pause() {
      if (this.state !== "running") return;
      this.state = "paused";
      this.ui.show("pause");
    }

    resume() {
      if (this.state !== "paused") return;
      this.state = "running";
      this.lastTime = performance.now();
      this.ui.hideAll();
    }

    togglePause() {
      if (this.state === "running") this.pause();
      else if (this.state === "paused") this.resume();
    }

    action(type) {
      if (this.state === "ready") {
        this.start();
        return;
      }
      if (this.state !== "running") return;
      if (type === "left") this.player.move(-1);
      if (type === "right") this.player.move(1);
      if (type === "jump") this.player.jump(this.power.highJump);
      if (type === "slide") this.player.slide();
    }

    gameOver() {
      if (this.state === "gameOver") return;
      this.state = "gameOver";
      this.player.hit();
      this.score.breakStreak();
      this.flash = .32;
      navigator.vibrate?.([50, 30, 80]);
      this.ui.renderGameOver(this.score.value, this.previousBest, this.score.balls);
      if (this.score.value > this.previousBest || this.storage.isHighScore(this.score.value)) {
        this.ui.renderRecord(this.score.value);
        this.ui.show("record");
      } else {
        this.ui.show("gameOver");
      }
    }

    update(dt) {
      this.flash = Math.max(0, this.flash - dt);
      this.player.update(dt, this.state === "running");
      if (this.state !== "running") return;
      this.elapsed += dt;
      this.difficulty = Math.floor(this.elapsed / 20);
      this.worldSpeed = (this.baseSpeed + this.difficulty * 38) * this.power.speedMultiplier;
      this.power.update(dt);
      this.score.update(dt, this.worldSpeed, this.power.scoreMultiplier);
      this.background.update(dt);
      this.obstacles.update(dt);
      this.items.update(dt);
      this.collision.update();
      this.ui.update(this);
    }

    loop(time) {
      const dt = clamp((time - this.lastTime) / 1000 || 0, 0, .033);
      this.lastTime = time;
      this.update(dt);
      this.renderer.draw();
      requestAnimationFrame((next) => this.loop(next));
    }
  }

  const game = new Game();
  window.babyRunnerGame = game;
  game.boot();
})();
