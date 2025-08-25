/* Ninja Village Defense — Single Player (HTML5 Canvas)
   - Player + 2 AI companions
   - Enemies attack gates; if gate breaks they go for bases
   - Context action: Attack enemy / Repair gate or base / Heal teammate
   - Random boosts: ATK/DEF/HEALTH/FIX
   - Lose: all ninjas down OR all bases destroyed
   - Win: survive all waves
*/

(() => {
  // ===== Canvas & UI =====
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // HUD elements
  const elName = document.getElementById('playerName');
  const elHp = document.getElementById('hpFill');
  const elAtk = document.getElementById('atk');
  const elDef = document.getElementById('def');
  const elHeal = document.getElementById('heal');
  const elFix = document.getElementById('fix');
  const elWave = document.getElementById('wave');
  const elEnemiesLeft = document.getElementById('enemiesLeft');
  const contextBtn = document.getElementById('contextBtn');

  // Overlay
  const overlay = document.getElementById('overlay');
  const startBtn = document.getElementById('startBtn');
  const nameInput = document.getElementById('nameInput');
  const atkInput = document.getElementById('atkInput');
  const defInput = document.getElementById('defInput');
  const healInput = document.getElementById('healInput');
  const fixInput = document.getElementById('fixInput');

  // Touch controls
  const dirBtns = document.querySelectorAll('.btn.dir');
  const touchAction = document.getElementById('touchAction');

  // ===== Game Config =====
  const W = canvas.width, H = canvas.height;
  const PLAYER_COUNT = 1;
  const COMPANIONS = 2; // AI teammates
  const GATES = 3;
  const BASES = 3;
  const BOOST_INTERVAL = 6000; // ms
  const WAVE_COUNT = 8;
  const WAVE_ENEMIES_BASE = 6;

  const COLORS = {
    player: '#68e1fd',
    companion: '#49f27a',
    enemy: '#ff5959',
    gate: '#c08a3e',
    base: '#6cc070',
    text: '#e6e6e6',
    hpRed: '#ff4040',
    hpGreen: '#2ecc71',
    fix: '#ffd166'
  };

  // ===== Helpers =====
  const rand = (min, max) => Math.random() * (max - min) + min;
  const randi = (min, max) => Math.floor(rand(min, max + 1));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist2 = (a, b) => { const dx=a.x-b.x, dy=a.y-b.y; return dx*dx + dy*dy; };
  const dist = (a, b) => Math.hypot(a.x-b.x, a.y-b.y);

  // ===== Entities =====
  class Unit {
    constructor(x, y, name, stats, isPlayer=false) {
      this.x=x; this.y=y;
      this.r=12;
      this.name=name;
      this.maxHp=100; this.hp=this.maxHp;
      this.atk=stats.atk; this.def=stats.def; this.heal=stats.heal; this.fix=stats.fix;
      this.speed=2.4;
      this.isPlayer=isPlayer;
      this.dead=false;
      this.actionCd=0;
    }
    step(dt) {
      this.actionCd = Math.max(0, this.actionCd - dt);
      if (this.hp<=0) { this.dead=true; }
    }
    draw() {
      // body
      ctx.fillStyle = this.isPlayer ? COLORS.player : COLORS.companion;
      if (this.dead) ctx.fillStyle = '#555';
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2); ctx.fill();

      // name
      ctx.fillStyle = COLORS.text;
      ctx.font = '12px sans-serif';
      ctx.textAlign='center';
      ctx.fillText(this.name, this.x, this.y - this.r - 8);

      // hp bar
      const w=26, h=4;
      ctx.fillStyle = '#00000088';
      ctx.fillRect(this.x - w/2, this.y + this.r + 4, w, h);
      const ratio = clamp(this.hp/this.maxHp, 0, 1);
      ctx.fillStyle = COLORS.hpGreen;
      if (ratio < 0.4) ctx.fillStyle = COLORS.hpRed;
      ctx.fillRect(this.x - w/2, this.y + this.r + 4, w*ratio, h);
    }
  }

  class Enemy {
    constructor(x, y, wave) {
      this.x=x; this.y=y; this.r=11;
      this.maxHp = 45 + wave*10; this.hp = this.maxHp;
      this.atk = 3 + Math.floor(wave/2);
      this.speed = 1.2 + wave*0.05;
      this.targetGate=null; this.targetBase=null;
      this.dead=false;
    }
    step(dt, gates, bases) {
      if (this.hp<=0) { this.dead=true; return; }

      // acquire targets
      if (!this.targetGate || this.targetGate.hp<=0) {
        // find closest alive gate
        const aliveG = gates.filter(g=>g.hp>0);
        if (aliveG.length) {
          this.targetGate = aliveG.reduce((best,g)=> dist(this, g) < dist(this,best)? g: best, aliveG[0]);
        } else {
          this.targetGate = null;
        }
      }
      if (!this.targetGate && !this.targetBase) {
        const aliveB = bases.filter(b=>b.hp>0);
        if (aliveB.length) {
          this.targetBase = aliveB[randi(0, aliveB.length-1)];
        }
      }

      // move/attack
      let target = this.targetGate || this.targetBase;
      if (!target) return;
      const d = dist(this, target);
      if (d > this.r + target.r + 2) {
        const dx = (target.x - this.x) / d;
        const dy = (target.y - this.y) / d;
        this.x += dx * this.speed * dt*0.06;
        this.y += dy * this.speed * dt*0.06;
      } else {
        // attack structure
        target.hp -= this.atk * dt*0.02;
      }
    }
    draw() {
      ctx.fillStyle = COLORS.enemy;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2); ctx.fill();

      // hp bar
      const w=22, h=3;
      ctx.fillStyle = '#00000088';
      ctx.fillRect(this.x - w/2, this.y + this.r + 3, w, h);
      const ratio = clamp(this.hp/this.maxHp, 0, 1);
      ctx.fillStyle = ratio<0.4 ? COLORS.hpRed : COLORS.hpGreen;
      ctx.fillRect(this.x - w/2, this.y + this.r + 3, w*ratio, h);
    }
  }

  class Structure {
    constructor(x,y, type) {
      this.x=x; this.y=y;
      this.type=type; // 'gate' or 'base'
      this.r = type==='gate'? 14 : 18;
      this.maxHp = type==='gate'? 140 : 220;
      this.hp = this.maxHp;
    }
    draw() {
      ctx.fillStyle = this.type==='gate'? COLORS.gate : COLORS.base;
      ctx.beginPath(); ctx.rect(this.x-18, this.y-12, 36, 24); ctx.fill();

      // hp bar
      const w=36, h=5;
      ctx.fillStyle='#00000088'; ctx.fillRect(this.x-w/2, this.y-20, w, h);
      const ratio = clamp(this.hp/this.maxHp,0,1);
      ctx.fillStyle = ratio<0.4? COLORS.hpRed : COLORS.hpGreen;
      ctx.fillRect(this.x-w/2, this.y-20, w*ratio, h);

      ctx.fillStyle = '#ddd';
      ctx.font='11px sans-serif'; ctx.textAlign='center';
      ctx.fillText(this.type.toUpperCase(), this.x, this.y+22);
    }
  }

  class Boost {
    constructor(x,y,type) {
      this.x=x; this.y=y; this.r=10; this.type=type; // 'atk','def','heal','fix','hp'
      this.ttl = 15000; // ms
    }
    step(dt){ this.ttl -= dt; }
    draw() {
      const map = { atk:'#ff9f1c', def:'#2ec4b6', heal:'#9b5de5', fix:'#ffd166', hp:'#ef476f' };
      ctx.fillStyle = map[this.type] || '#ccc';
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='#111'; ctx.font='bold 11px sans-serif'; ctx.textAlign='center';
      ctx.fillText(this.type.toUpperCase(), this.x, this.y+4);
    }
  }

  // ===== World/State =====
  const state = {
    started:false,
    over:false,
    wave:0,
    enemies:[],
    ninjas:[],
    gates:[],
    bases:[],
    boosts:[],
    spawnTimer:0,
    nextWaveTimer:2000,
    enemiesToSpawn:0
  };

  // ===== Input =====
  const input = { up:false, down:false, left:false, right:false };
  const setDir = (dir, val)=>{ input[dir]=val; };

  // keyboard
  window.addEventListener('keydown', e=>{
    if (e.key==='ArrowUp'||e.key==='w') setDir('up', true);
    if (e.key==='ArrowDown'||e.key==='s') setDir('down', true);
    if (e.key==='ArrowLeft'||e.key==='a') setDir('left', true);
    if (e.key==='ArrowRight'||e.key==='d') setDir('right', true);
    if (e.key===' ') doContextAction();
    if (e.key==='r') doRepair();
    if (e.key==='e') doHeal();
  });
  window.addEventListener('keyup', e=>{
    if (e.key==='ArrowUp'||e.key==='w') setDir('up', false);
    if (e.key==='ArrowDown'||e.key==='s') setDir('down', false);
    if (e.key==='ArrowLeft'||e.key==='a') setDir('left', false);
    if (e.key==='ArrowRight'||e.key==='d') setDir('right', false);
  });

  // touch
  dirBtns.forEach(btn=>{
    const dir = btn.dataset.dir;
    const on = ()=> setDir(dir, true);
    const off = ()=> setDir(dir, false);
    btn.addEventListener('touchstart', on); btn.addEventListener('mousedown', on);
    btn.addEventListener('touchend', off); btn.addEventListener('mouseup', off);
    btn.addEventListener('mouseleave', off);
  });
  touchAction.addEventListener('touchstart', ()=> doContextAction());
  touchAction.addEventListener('mousedown', ()=> doContextAction());
  contextBtn.addEventListener('click', ()=> doContextAction());

  // ===== Setup =====
  function randomPlacements(count, margin=40) {
    const pts=[];
    for (let i=0;i<count;i++){
      pts.push({x: rand(margin, W-margin), y: rand(margin, H-margin)});
    }
    return pts;
  }

  function startGame() {
    // validate stats: sum 10
    const atk = Number(atkInput.value|0), def = Number(defInput.value|0), heal = Number(healInput.value|0), fix = Number(fixInput.value|0);
    const sum = atk+def+heal+fix;
    if (sum !== 10) {
      alert('Please distribute exactly 10 points across ATK/DEF/HEAL/FIX.');
      return;
    }
    const pname = (nameInput.value || 'ShadowFox').slice(0,16);

    // world
    state.gates = randomPlacements(GATES).map(p => new Structure(p.x,p.y,'gate'));
    state.bases = randomPlacements(BASES).map(p => new Structure(p.x,p.y,'base'));

    // ninjas: player + companions with slight variance
    const player = new Unit(W*0.5, H*0.6, pname, {atk,def,heal,fix}, true);
    state.ninjas = [player];

    for (let i=0;i<COMPANIONS;i++) {
      const tweak = () => Math.max(1, Math.min(6, Math.round(rand(-1,1)+2)));
      const c = new Unit(player.x+rand(-60,60), player.y+rand(-60,60), `Ally${i+1}`, {
        atk: Math.max(1, atk + randi(-1,1)),
        def: Math.max(1, def + randi(-1,1)),
        heal: Math.max(1, heal + randi(-1,1)),
        fix: Math.max(1, fix + randi(-1,1)),
      }, false);
      state.ninjas.push(c);
    }

    overlay.classList.remove('show');
    state.started = true; state.over=false; state.wave=0;
    nextWave();
    updateHUD();
  }

  // ===== Actions =====
  function nearest(list, from, radius=40) {
    let best=null, bestD=Infinity;
    list.forEach(o=>{
      const d = dist(from,o);
      if (d<radius && d<bestD) { best=o; bestD=d; }
    });
    return best;
  }

  function doAttack(attacker, target) {
    if (!target || attacker.actionCd>0 || attacker.dead) return;
    const dmg = Math.max(1, attacker.atk - 0.3*(target.def||0));
    target.hp -= dmg;
    attacker.actionCd = 350; // ms
  }

  function doRepair() {
    const me = state.ninjas[0];
    const target = nearest([...state.gates, ...state.bases].filter(s=>s.hp>0 && s.hp<s.maxHp), me, 42);
    if (!target || me.actionCd>0 || me.dead) return;
    target.hp = clamp(target.hp + (4 + me.fix*1.2), 0, target.maxHp);
    me.actionCd = 300;
  }

  function doHeal() {
    const me = state.ninjas[0];
    const ally = nearest(state.ninjas.filter(n=>!n.dead && n!==me && n.hp< n.maxHp), me, 42);
    if (!ally || me.actionCd>0 || me.dead) return;
    ally.hp = clamp(ally.hp + (5 + me.heal*1.5), 0, ally.maxHp);
    me.actionCd = 350;
  }

  function doContextAction() {
    const me = state.ninjas[0];
    if (me.dead) return;

    // priority: attack enemy in range
    let targetE = nearest(state.enemies.filter(e=>!e.dead), me, 40);
    if (targetE) { doAttack(me, targetE); return; }

    // then heal ally
    let ally = nearest(state.ninjas.filter(n=>n!==me && !n.dead && n.hp< n.maxHp), me, 42);
    if (ally) { doHeal(); return; }

    // then repair structure
    let structure = nearest([...state.gates, ...state.bases].filter(s=>s.hp>0 && s.hp<s.maxHp), me, 42);
    if (structure) { doRepair(); return; }
  }

  // ===== AI =====
  function companionAI(n, dt) {
    if (n.dead) return;

    // if low hp and near player with heal, move towards player
    const player = state.ninjas[0];
    // decide need
    const damagedGate = state.gates.find(g=>g.hp>0 && g.hp<g.maxHp);
    const threatenedGate = damagedGate || state.gates.find(g=> state.enemies.some(e=> e.targetGate===g));
    const aliveEnemies = state.enemies.filter(e=>!e.dead);

    // target selection: nearest enemy if close, else fix/repair, else follow player
    let target = null;
    // heal nearby ally if very low
    const lowAlly = state.ninjas.find(x => !x.dead && x.hp < x.maxHp*0.5 && dist(x,n) < 80);
    if (lowAlly && n.heal >= 2) {
      // move to ally
      target = lowAlly;
      moveTowards(n, target, n.speed, dt);
      if (dist(n, target) < 36) {
        // heal
        if (n.actionCd<=0) {
          target.hp = clamp(target.hp + (4 + n.heal*1.2), 0, target.maxHp);
          n.actionCd=350;
        }
      }
      return;
    }

    // attack if enemy in perception
    const nearEnemy = aliveEnemies.sort((a,b)=> dist(n,a)-dist(n,b))[0];
    if (nearEnemy && dist(n, nearEnemy) < 160) {
      moveTowards(n, nearEnemy, n.speed*1.05, dt);
      if (dist(n, nearEnemy) < (n.r + nearEnemy.r + 2)) {
        if (n.actionCd<=0) {
          doAttack(n, nearEnemy);
        }
      }
      return;
    }

    // repair if structure damaged
    if (threatenedGate && n.fix >= 2) {
      moveTowards(n, threatenedGate, n.speed, dt);
      if (dist(n, threatenedGate) < (n.r + threatenedGate.r + 16)) {
        if (n.actionCd<=0) {
          threatenedGate.hp = clamp(threatenedGate.hp + (3 + n.fix), 0, threatenedGate.maxHp);
          n.actionCd=320;
        }
      }
      return;
    }

    // follow player loosely
    const d = dist(n, player);
    if (d > 60) {
      moveTowards(n, player, n.speed*0.9, dt);
    }
  }

  function moveTowards(n, target, speed, dt) {
    const d = dist(n, target);
    if (d < 1) return;
    const dx = (target.x - n.x)/d;
    const dy = (target.y - n.y)/d;
    n.x += dx * speed * dt*0.06;
    n.y += dy * speed * dt*0.06;
  }

  // ===== Waves =====
  function nextWave() {
    state.wave++;
    if (state.wave > WAVE_COUNT) {
      gameOver(true);
      return;
    }
    const count = WAVE_ENEMIES_BASE + Math.floor(state.wave*1.5);
    state.enemiesToSpawn = count;
    state.spawnTimer = 0;
    state.nextWaveTimer = 0;
    // update HUD
    elWave.textContent = state.wave + '/' + WAVE_COUNT;
  }

  function spawnEnemy() {
    if (state.enemiesToSpawn<=0) return;
    // spawn at border
    const side = randi(0,3);
    let x=0,y=0;
    if (side===0){ x=rand(0,W); y=10; }
    if (side===1){ x=W-10; y=rand(0,H); }
    if (side===2){ x=rand(0,W); y=H-10; }
    if (side===3){ x=10; y=rand(0,H); }
    const e = new Enemy(x,y, state.wave);
    state.enemies.push(e);
    state.enemiesToSpawn--;
  }

  // ===== Boosts =====
  function spawnBoost() {
    const types = ['atk','def','heal','fix','hp'];
    const b = new Boost(rand(40,W-40), rand(40,H-40), types[randi(0, types.length-1)]);
    state.boosts.push(b);
  }

  function collectBoost(n, b) {
    if (b.type==='hp') n.hp = clamp(n.hp + 30, 0, n.maxHp);
    if (b.type==='atk') n.atk += 1;
    if (b.type==='def') n.def += 1;
    if (b.type==='heal') n.heal += 1;
    if (b.type==='fix') n.fix += 1;
  }

  // ===== Game Over / HUD =====
  function gameOver(win=false) {
    state.over=true; state.started=false;
    overlay.classList.add('show');
    overlay.querySelector('h1').textContent = win ? '🏆 Victory!' : '💀 Defeat';
    startBtn.textContent = 'Play Again';
  }

  function updateHUD() {
    const me = state.ninjas[0];
    elName.textContent = me.name;
    elHp.style.width = `${clamp(me.hp/me.maxHp,0,1)*100}%`;
    elAtk.textContent = me.atk;
    elDef.textContent = me.def;
    elHeal.textContent = me.heal;
    elFix.textContent = me.fix;

    const aliveEnemies = state.enemies.filter(e=>!e.dead).length + state.enemiesToSpawn;
    elEnemiesLeft.textContent = aliveEnemies;
    elWave.textContent = `${Math.min(state.wave, WAVE_COUNT)}/${WAVE_COUNT}`;

    // context button label
    const nearbyEnemy = nearest(state.enemies.filter(e=>!e.dead), state.ninjas[0], 44);
    const damagedStructure = nearest([...state.gates, ...state.bases].filter(s=>s.hp>0 && s.hp<s.maxHp), state.ninjas[0], 46);
    const healAlly = nearest(state.ninjas.filter(n=>n!==state.ninjas[0] && !n.dead && n.hp<n.maxHp), state.ninjas[0], 46);

    contextBtn.textContent = nearbyEnemy ? 'Attack' : healAlly ? 'Heal' : damagedStructure ? 'Fix' : 'Action';
  }

  // ===== Main Loop =====
  let last = performance.now();
  function loop(now) {
    const dt = now - last; last = now;
    if (state.started && !state.over) {
      step(dt);
      draw();
      updateHUD();
    } else {
      // still draw world if visible? optional
      draw();
    }
    requestAnimationFrame(loop);
  }

  function step(dt) {
    // player movement
    const me = state.ninjas[0];
    if (!me.dead) {
      const sp = me.speed;
      if (input.up) me.y -= sp*dt*0.06;
      if (input.down) me.y += sp*dt*0.06;
      if (input.left) me.x -= sp*dt*0.06;
      if (input.right) me.x += sp*dt*0.06;
      me.x = clamp(me.x, 16, W-16);
      me.y = clamp(me.y, 16, H-16);
    }

    // all ninjas tick + simple collision with boosts
    state.ninjas.forEach(n => {
      n.step(dt);
      for (let i=state.boosts.length-1;i>=0;i--){
        const b = state.boosts[i];
        if (dist(n,b) < n.r + b.r + 2) {
          collectBoost(n,b);
          state.boosts.splice(i,1);
        }
      }
    });

    // companions AI
    for (let i=1;i<state.ninjas.length;i++){
      companionAI(state.ninjas[i], dt);
    }

    // enemies
    state.spawnTimer += dt;
    if (state.enemiesToSpawn>0 && state.spawnTimer > 900) {
      spawnEnemy();
      state.spawnTimer = 0;
    }
    state.enemies.forEach(e => e.step(dt, state.gates, state.bases));
    state.enemies = state.enemies.filter(e=>!e.dead && e.hp>0);

    // boosts
    if (!state._boostTimer) state._boostTimer = 0;
    state._boostTimer += dt;
    if (state._boostTimer > BOOST_INTERVAL) {
      spawnBoost();
      state._boostTimer = 0;
    }
    state.boosts.forEach(b => b.step(dt));
    state.boosts = state.boosts.filter(b=> b.ttl>0);

    // enemy vs ninjas (melee if contact)
    state.enemies.forEach(e=>{
      state.ninjas.forEach(n=>{
        if (n.dead) return;
        if (dist(n,e) < n.r + e.r + 1) {
          const dmgToN = Math.max(1, e.atk - 0.4*n.def);
          n.hp -= dmgToN * dt*0.03;
          if (n.hp<=0) n.dead=true;
        }
      });
    });

    // check wave/battle status
    const enemiesAliveOrIncoming = state.enemies.length + state.enemiesToSpawn;
    if (enemiesAliveOrIncoming===0) {
      // next wave after a pause
      state.nextWaveTimer += dt;
      if (state.nextWaveTimer > 1600) {
        nextWave();
      }
    }

    // lose/win
    const allNinjasDown = state.ninjas.every(n=>n.dead);
    const allBasesDown = state.bases.every(b=>b.hp<=0);
    if (allNinjasDown || allBasesDown) gameOver(false);
  }

  function draw() {
    // background grid
    ctx.fillStyle = '#14171c';
    ctx.fillRect(0,0,W,H);
    ctx.strokeStyle = '#1f242c';
    ctx.lineWidth = 1;
    for (let x=0; x<W; x+=32){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y=0; y<H; y+=32){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // structures
    state.gates.forEach(g=>g.draw());
    state.bases.forEach(b=>b.draw());

    // boosts
    state.boosts.forEach(b=>b.draw());

    // enemies
    state.enemies.forEach(e=>e.draw());

    // ninjas on top
    state.ninjas.forEach(n=>n.draw());

    // hints
    if (!state.started) {
      ctx.fillStyle='#fff'; ctx.font='16px sans-serif'; ctx.textAlign='center';
      ctx.fillText('Configure your ninja then press Start', W/2, H/2 + 120);
    }
  }

  // ===== UI events =====
  startBtn.addEventListener('click', startGame);

  // Initial HUD
  elWave.textContent = '0/' + WAVE_COUNT;
  elEnemiesLeft.textContent = '0';

  // Kickoff
  requestAnimationFrame(loop);
})();