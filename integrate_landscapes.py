import os

path = r"C:\Users\Fit You\Desktop\Projeto do Vini\snake-game.html"
with open(path, "r", encoding="utf-8") as f:
    html = f.read()

# ===== 1. Add landscape state variable =====
html = html.replace(
    "let raceStartTime = 0;",
    "let raceStartTime = 0;\nlet raceLandscape = 'matrix';"
)

# ===== 2. Add "Atacados!" to difficulty selection screen =====
old_diff = """    <button class="race-diff-btn" onclick="selectRaceDiff('hard')" style="background:linear-gradient(135deg,#dd3344,#aa1122);">
        <span class="race-diff-emoji">💀</span>
        <span>Difícil</span>
    </button>
</div>"""

new_diff = """    <button class="race-diff-btn" onclick="selectRaceDiff('hard')" style="background:linear-gradient(135deg,#dd3344,#aa1122);">
        <span class="race-diff-emoji">💀</span>
        <span>Difícil</span>
    </button>
    <button class="race-diff-btn" onclick="selectRaceDiff('atacados')" style="background:linear-gradient(135deg,#ff0066,#cc0044);border:2px solid #ff3388;">
        <span class="race-diff-emoji">💥</span>
        <span>Atacados!</span>
    </button>
</div>"""

if old_diff in html:
    html = html.replace(old_diff, new_diff)
    print("Added Atacados difficulty button")
else:
    print("WARNING: Could not find difficulty buttons!")

# ===== 3. Add landscape selection screen HTML =====
# Find the difficulty screen to add landscape screen after it
old_diff_screen_end = """    <p style="font-family:'Press Start 2P',monospace;font-size:7px;color:rgba(255,153,204,0.5);margin-top:12px;text-align:center;">
        Escolha a dificuldade da corrida
    </p>
</div>

<!-- Screen: Race Game -->"""

landscape_screen = """    <p style="font-family:'Press Start 2P',monospace;font-size:7px;color:rgba(255,153,204,0.5);margin-top:12px;text-align:center;">
        Escolha a dificuldade da corrida
    </p>
</div>

<!-- Screen: Race Landscape Selection -->
<div id="screen-race-landscape" class="screen">
    <h2 class="race-title" style="margin-bottom:10px;">🌍 ESCOLHA A PAISAGEM</h2>
    <p style="font-family:'Press Start 2P',monospace;font-size:8px;color:#ff99cc;margin-bottom:16px;" id="race-landscape-instruction">Clique na paisagem da fase</p>
    <div class="race-landscape-grid" id="race-landscape-grid">
        <!-- JS will populate -->
    </div>
    <div style="display:flex;gap:12px;margin-top:16px;justify-content:center;">
        <button class="race-diff-btn" onclick="showScreen('screen-race-diff')" style="background:linear-gradient(135deg,#555,#333);padding:8px 16px;">
            <span>⬅️ Voltar</span>
        </button>
    </div>
</div>

<!-- Screen: Race Game -->"""

if old_diff_screen_end in html:
    html = html.replace(old_diff_screen_end, landscape_screen)
    print("Added landscape selection screen HTML")
else:
    print("WARNING: Could not find difficulty screen end!")

# ===== 4. Add landscape CSS =====
landscape_css = """
/* Race Landscape Selection */
.race-landscape-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    max-width: 700px;
    margin: 0 auto;
}
.race-landscape-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 6px;
    background: rgba(13,5,32,0.9);
    border: 2px solid rgba(255,153,204,0.2);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
}
.race-landscape-card:hover {
    border-color: #ff99cc;
    transform: scale(1.05);
    box-shadow: 0 0 12px rgba(255,153,204,0.3);
}
.race-landscape-card.selected {
    border-color: #ffcc66;
    box-shadow: 0 0 16px rgba(255,204,102,0.5);
}
.race-landscape-preview {
    width: 80px;
    height: 50px;
    border-radius: 6px;
    margin-bottom: 6px;
    border: 1px solid rgba(255,255,255,0.1);
}
.race-landscape-name {
    font-family: 'Press Start 2P', monospace;
    font-size: 6px;
    color: #ff99cc;
    text-align: center;
    line-height: 1.4;
}
@media (max-width: 768px) {
    .race-landscape-grid { grid-template-columns: repeat(2, 1fr); }
}
"""
html = html.replace("    </style>", landscape_css + "\n    </style>")
print("Added landscape CSS")

# ===== 5. Add landscape definitions + selection JS =====
# Find after selectRaceDiff function
old_select_diff = """function selectRaceDiff(diff) {
    raceState.difficulty = diff;
    startRace();
}"""

new_select_diff = """function selectRaceDiff(diff) {
    raceState.difficulty = diff;
    buildRaceLandscapeGrid();
    showScreen('screen-race-landscape');
}

// --- Landscape definitions ---
var RACE_LANDSCAPES = [
    { id:'matrix', name:'Matrix do Sky', color:'#003300', cat:'Sky', emoji:'🟢', desc:'Letras verdes caindo' },
    { id:'egypt', name:'Pito do Egito', color:'#c2a052', cat:'Pito', emoji:'🏛️', desc:'Piramides e deserto' },
    { id:'house', name:'Reino do Simy', color:'#8b6340', cat:'Simy', emoji:'🏠', desc:'Corredor de casa' },
    { id:'garden', name:'Castelo da Princesa', color:'#ff88aa', cat:'Adora', emoji:'🌸', desc:'Jardim florido' },
    { id:'kidsspace', name:'Espaco Kids!', color:'#aa77cc', cat:'Maya', emoji:'🎨', desc:'Tabuleiro colorido' },
    { id:'spiritual', name:'Mundo Espiritual', color:'#330022', cat:'Dulce Maria', emoji:'👻', desc:'Fantasmas e caveiras' },
    { id:'inverted', name:'Terra Invertida', color:'#dd8833', cat:'Sury', emoji:'🔄', desc:'Tudo de cabeca' },
];

function buildRaceLandscapeGrid() {
    var grid = document.getElementById('race-landscape-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (var i = 0; i < RACE_LANDSCAPES.length; i++) {
        var ls = RACE_LANDSCAPES[i];
        var card = document.createElement('div');
        card.className = 'race-landscape-card' + (raceLandscape === ls.id ? ' selected' : '');
        card.setAttribute('data-id', ls.id);
        var preview = document.createElement('div');
        preview.className = 'race-landscape-preview';
        preview.style.background = ls.id === 'matrix' ? '#000' :
            ls.id === 'egypt' ? 'linear-gradient(180deg,#c2a052,#8b6340)' :
            ls.id === 'house' ? 'linear-gradient(180deg,#8b6340,#5a3a20)' :
            ls.id === 'garden' ? 'linear-gradient(180deg,#ff88aa,#ffccdd)' :
            ls.id === 'kidsspace' ? 'linear-gradient(135deg,#aa77cc,#ff77aa,#77aaff,#aaffaa)' :
            ls.id === 'spiritual' ? 'linear-gradient(180deg,#330022,#660033)' :
            'linear-gradient(180deg,#dd8833,#884400)';
        var nameEl = document.createElement('div');
        nameEl.className = 'race-landscape-name';
        nameEl.textContent = ls.emoji + ' ' + ls.name;
        var descEl = document.createElement('div');
        descEl.style.cssText = "font-family:'Press Start 2P',monospace;font-size:5px;color:rgba(255,153,204,0.5);margin-top:3px;text-align:center;";
        descEl.textContent = ls.desc;
        card.appendChild(preview);
        card.appendChild(nameEl);
        card.appendChild(descEl);
        (function(landscape) {
            card.onclick = function() {
                raceLandscape = landscape.id;
                startRace();
            };
        })(ls);
        grid.appendChild(card);
    }
}"""

if old_select_diff in html:
    html = html.replace(old_select_diff, new_select_diff)
    print("Added landscape selection JS")
else:
    print("WARNING: Could not find selectRaceDiff!")

# ===== 6. Add Atacados difficulty settings in initRace =====
old_init_diff = """    } else {
        baseSpeed = 3.0;
        obsInterval = 1400;
        powerInterval = 3500;
    }"""

new_init_diff = """    } else if (raceState.difficulty === 'atacados') {
        baseSpeed = 3.5;
        obsInterval = 1000;
        powerInterval = 3000;
    } else {
        baseSpeed = 3.0;
        obsInterval = 1400;
        powerInterval = 3500;
    }"""

if old_init_diff in html:
    html = html.replace(old_init_diff, new_init_diff)
    print("Added Atacados difficulty settings")
else:
    print("WARNING: Could not find difficulty settings!")

# ===== 7. Add landscape background drawing functions =====
# Insert before renderRace function
landscape_draw_funcs = """
// ==================================================
//  Race landscape background drawing
// ==================================================

// Matrix rain columns (persistent)
var matrixColumns = [];
function initMatrixColumns() {
    matrixColumns = [];
    for (var i = 0; i < 60; i++) {
        matrixColumns.push({
            x: Math.random() * 1200,
            y: Math.random() * -500,
            speed: 1 + Math.random() * 3,
            chars: [],
            len: 5 + Math.floor(Math.random() * 15)
        });
    }
}
initMatrixColumns();

function drawLandscapeMatrix(ctx, w, h) {
    // Black background
    ctx.fillStyle = '#000800';
    ctx.fillRect(0, 0, w, h);
    // Grid lines
    ctx.strokeStyle = 'rgba(0,255,0,0.05)';
    ctx.lineWidth = 1;
    for (var gx = 0; gx < w; gx += 40) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
    }
    for (var gy = 0; gy < h; gy += 40) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
    }
    // Falling characters
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    var matrixChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';
    for (var c = 0; c < matrixColumns.length; c++) {
        var col = matrixColumns[c];
        col.y += col.speed * 1.5;
        if (col.y > h + 200) { col.y = Math.random() * -300; col.x = Math.random() * w; }
        for (var k = 0; k < col.len; k++) {
            var charY = col.y - k * 14;
            if (charY < -10 || charY > h + 10) continue;
            var alpha = 1 - (k / col.len);
            if (k === 0) {
                ctx.fillStyle = '#aaffaa';
                ctx.shadowColor = '#00ff00';
                ctx.shadowBlur = 8;
            } else {
                ctx.fillStyle = 'rgba(0,' + Math.floor(180 + alpha * 75) + ',0,' + (alpha * 0.8) + ')';
                ctx.shadowBlur = 0;
            }
            var ch = matrixChars[Math.floor((col.y * 7 + k * 13) % matrixChars.length)];
            ctx.fillText(ch, col.x, charY);
        }
        ctx.shadowBlur = 0;
    }
}

function drawLandscapeEgypt(ctx, w, h) {
    // Desert sky gradient
    var skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
    skyGrad.addColorStop(0, '#1a0a00');
    skyGrad.addColorStop(0.5, '#c2a052');
    skyGrad.addColorStop(1, '#e8c872');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.6);
    // Sand
    ctx.fillStyle = '#c2a052';
    ctx.fillRect(0, h * 0.55, w, h * 0.45);
    // Sand dunes
    ctx.fillStyle = '#b89840';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.65);
    for (var dx = 0; dx <= w; dx += 50) {
        ctx.lineTo(dx, h * 0.65 + Math.sin(dx / 100) * 15);
    }
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    // Pyramids
    ctx.fillStyle = '#a08030';
    ctx.beginPath(); ctx.moveTo(w * 0.15, h * 0.55); ctx.lineTo(w * 0.22, h * 0.3); ctx.lineTo(w * 0.29, h * 0.55); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8b6f20';
    ctx.beginPath(); ctx.moveTo(w * 0.22, h * 0.3); ctx.lineTo(w * 0.29, h * 0.55); ctx.lineTo(w * 0.22, h * 0.55); ctx.closePath(); ctx.fill();
    // Big pyramid
    ctx.fillStyle = '#b89840';
    ctx.beginPath(); ctx.moveTo(w * 0.55, h * 0.55); ctx.lineTo(w * 0.68, h * 0.15); ctx.lineTo(w * 0.81, h * 0.55); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#a08030';
    ctx.beginPath(); ctx.moveTo(w * 0.68, h * 0.15); ctx.lineTo(w * 0.81, h * 0.55); ctx.lineTo(w * 0.68, h * 0.55); ctx.closePath(); ctx.fill();
    // Sun
    ctx.fillStyle = '#ffcc44';
    ctx.shadowColor = '#ffcc44';
    ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.arc(w * 0.9, h * 0.2, 25, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // Hieroglyphs on road edges
    ctx.font = '14px serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(139,99,32,0.3)';
    var hiero = '𓀀𓁐𓂀𓃒𓄿𓅱𓆣𓇋𓈖';
    for (var hi = 0; hi < 20; hi++) {
        ctx.fillText(hiero[hi % hiero.length], 30, (hi * 40 + raceRoadOffset * 10) % h);
        ctx.fillText(hiero[(hi + 5) % hiero.length], w - 30, (hi * 40 + raceRoadOffset * 10) % h);
    }
}

function drawLandscapeHouse(ctx, w, h) {
    // Dark house interior
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(0, 0, w, h);
    // Wallpaper pattern
    ctx.fillStyle = 'rgba(139,99,64,0.15)';
    for (var wy = 0; wy < h; wy += 30) {
        for (var wx = 0; wx < w; wx += 30) {
            if ((wx / 30 + wy / 30) % 2 === 0) {
                ctx.fillRect(wx, wy, 30, 30);
            }
        }
    }
    // Left wall
    ctx.fillStyle = '#5a3a20';
    ctx.fillRect(0, 0, 60, h);
    ctx.fillStyle = '#4a2a10';
    ctx.fillRect(55, 0, 10, h);
    // Right wall
    ctx.fillStyle = '#5a3a20';
    ctx.fillRect(w - 60, 0, 60, h);
    ctx.fillStyle = '#4a2a10';
    ctx.fillRect(w - 65, 0, 10, h);
    // Floor baseboard
    ctx.fillStyle = '#3a2a10';
    ctx.fillRect(0, h - 8, w, 8);
    // Pictures on walls
    ctx.fillStyle = '#8b6340';
    ctx.fillRect(10, 40, 40, 30);
    ctx.fillStyle = '#a0724a';
    ctx.fillRect(12, 42, 36, 26);
    ctx.fillRect(w - 50, 80, 40, 30);
    ctx.fillStyle = '#a0724a';
    ctx.fillRect(w - 48, 82, 36, 26);
    // Hanging lamp
    ctx.fillStyle = '#666';
    ctx.fillRect(w / 2 - 2, 0, 4, 20);
    ctx.fillStyle = '#ffee88';
    ctx.shadowColor = '#ffee88';
    ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(w / 2, 25, 8, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // Light glow
    ctx.fillStyle = 'rgba(255,238,136,0.05)';
    ctx.beginPath(); ctx.arc(w / 2, h / 2, 150, 0, Math.PI * 2); ctx.fill();
}

function drawLandscapeGarden(ctx, w, h) {
    // Sky
    var gardenSky = ctx.createLinearGradient(0, 0, 0, h * 0.5);
    gardenSky.addColorStop(0, '#ffccdd');
    gardenSky.addColorStop(1, '#ff88aa');
    ctx.fillStyle = gardenSky;
    ctx.fillRect(0, 0, w, h * 0.5);
    // Grass
    ctx.fillStyle = '#66cc66';
    ctx.fillRect(0, h * 0.45, w, h * 0.55);
    ctx.fillStyle = '#55bb55';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.5);
    for (var gx = 0; gx <= w; gx += 30) {
        ctx.lineTo(gx, h * 0.48 + Math.sin(gx / 40 + raceRoadOffset) * 4);
    }
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    // Flowers
    var flowerColors = ['#ff66aa', '#ffaa66', '#ff66ff', '#ffff66', '#66aaff', '#ff6666'];
    ctx.font = '16px serif';
    ctx.textAlign = 'center';
    for (var fi = 0; fi < 30; fi++) {
        var fx = (fi * 137 + 50) % w;
        var fy = h * 0.52 + (fi * 47) % (h * 0.4);
        ctx.fillText('🌸', fx, fy);
    }
    // Castle turrets in background
    ctx.fillStyle = '#ddaacc';
    ctx.fillRect(w * 0.05, h * 0.15, 25, h * 0.35);
    ctx.fillRect(w * 0.12, h * 0.2, 25, h * 0.3);
    ctx.fillStyle = '#cc99bb';
    // Turret tops
    ctx.beginPath(); ctx.moveTo(w * 0.05 - 3, h * 0.15); ctx.lineTo(w * 0.05 + 12, h * 0.05); ctx.lineTo(w * 0.05 + 28, h * 0.15); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(w * 0.12 - 3, h * 0.2); ctx.lineTo(w * 0.12 + 12, h * 0.1); ctx.lineTo(w * 0.12 + 28, h * 0.2); ctx.closePath(); ctx.fill();
    // Butterflies
    ctx.font = '12px serif';
    var bTime = Date.now() / 500;
    ctx.fillText('🦋', w * 0.3 + Math.sin(bTime) * 30, h * 0.3 + Math.cos(bTime * 1.3) * 15);
    ctx.fillText('🦋', w * 0.7 + Math.cos(bTime * 0.8) * 25, h * 0.25 + Math.sin(bTime) * 12);
}

function drawLandscapeKidsSpace(ctx, w, h) {
    // Colorful checkerboard background
    var colors = ['#ff66aa', '#66aaff', '#aaffaa', '#ffaa66', '#aa66ff', '#ff6666', '#66ffaa', '#ffff66'];
    var tileSize = 30;
    for (var ty = 0; ty < h; ty += tileSize) {
        for (var tx = 0; tx < w; tx += tileSize) {
            var ci = ((tx / tileSize + ty / tileSize) % colors.length + colors.length) % colors.length;
            ctx.fillStyle = colors[ci];
            ctx.globalAlpha = 0.3 + 0.1 * Math.sin((tx + ty) / 50 + raceRoadOffset);
            ctx.fillRect(tx, ty, tileSize, tileSize);
        }
    }
    ctx.globalAlpha = 1;
    // Stars
    ctx.font = '14px serif';
    ctx.textAlign = 'center';
    for (var si = 0; si < 15; si++) {
        var sx = (si * 199 + 30) % w;
        var sy = (si * 131 + 20) % h;
        ctx.fillText('⭐', sx, sy);
    }
    // Confetti
    ctx.font = '10px serif';
    for (var ci2 = 0; ci2 < 20; ci2++) {
        var cx = (ci2 * 173 + raceRoadOffset * 20) % (w + 40) - 20;
        var cy = (ci2 * 97) % h;
        ctx.fillText(['🎉', '🎊', '✨', '💫'][ci2 % 4], cx, cy);
    }
}

function drawLandscapeSpiritual(ctx, w, h) {
    // Dark purple/red gradient
    var spirGrad = ctx.createLinearGradient(0, 0, 0, h);
    spirGrad.addColorStop(0, '#110011');
    spirGrad.addColorStop(0.5, '#330022');
    spirGrad.addColorStop(1, '#220011');
    ctx.fillStyle = spirGrad;
    ctx.fillRect(0, 0, w, h);
    // Fog
    ctx.fillStyle = 'rgba(100,0,50,0.08)';
    for (var fog = 0; fog < 5; fog++) {
        ctx.beginPath();
        ctx.ellipse((w / 2) + Math.sin(Date.now() / 2000 + fog) * 200, h * 0.5 + fog * 30, 300, 40, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    // Ghosts
    ctx.font = '20px serif';
    ctx.textAlign = 'center';
    var ghostTime = Date.now() / 800;
    for (var gi = 0; gi < 8; gi++) {
        var gx = (gi * 157 + 40) % w;
        var gy = (gi * 113 + 30) % h;
        ctx.globalAlpha = 0.3 + 0.2 * Math.sin(ghostTime + gi);
        ctx.fillText('👻', gx + Math.sin(ghostTime + gi * 2) * 10, gy + Math.cos(ghostTime + gi) * 8);
    }
    ctx.globalAlpha = 1;
    // Skulls
    ctx.font = '16px serif';
    for (var sk = 0; sk < 6; sk++) {
        var skx = (sk * 211 + 80) % w;
        var sky2 = (sk * 167 + 60) % h;
        ctx.fillText('💀', skx, sky2);
    }
    // Bats
    ctx.font = '14px serif';
    for (var bi = 0; bi < 5; bi++) {
        var bx = (bi * 251 + 100) % w;
        var by = (bi * 89 + 40) % (h * 0.4);
        ctx.fillText('🦇', bx + Math.sin(ghostTime * 2 + bi) * 15, by);
    }
    // Candles on road edges
    ctx.fillStyle = '#ffee88';
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 15;
    for (var cn = 0; cn < 10; cn++) {
        var cnx = 30;
        var cny = (cn * 50 + raceRoadOffset * 10) % h;
        ctx.beginPath(); ctx.arc(cnx, cny, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(w - 30, cny + 25, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
}

function drawLandscapeInverted(ctx, w, h) {
    // Upside-down gradient
    var invGrad = ctx.createLinearGradient(0, h, 0, 0);
    invGrad.addColorStop(0, '#884400');
    invGrad.addColorStop(0.5, '#dd8833');
    invGrad.addColorStop(1, '#ffaa44');
    ctx.fillStyle = invGrad;
    ctx.fillRect(0, 0, w, h);
    // Inverted ground at top
    ctx.fillStyle = '#556b2f';
    ctx.fillRect(0, 0, w, h * 0.15);
    // Upside-down trees
    ctx.fillStyle = '#3a5a1a';
    for (var ti = 0; ti < 12; ti++) {
        var tx = (ti * 100 + 30) % w;
        ctx.fillRect(tx, h * 0.12, 6, 25);
        ctx.beginPath();
        ctx.arc(tx + 3, h * 0.12 + 15, 15, 0, Math.PI * 2);
        ctx.fill();
    }
    // Floating rocks
    ctx.fillStyle = '#8b7355';
    for (var ri = 0; ri < 8; ri++) {
        var rx = (ri * 150 + 60) % w;
        var ry = h * 0.3 + (ri * 47) % (h * 0.5);
        ctx.beginPath();
        ctx.ellipse(rx, ry + Math.sin(Date.now() / 1000 + ri) * 5, 20, 12, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    // Upside-down emoji items
    ctx.font = '18px serif';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(1, -1);
    ctx.fillText('🌳', -200, 0);
    ctx.fillText('🏠', 0, 0);
    ctx.fillText('🚗', 200, 0);
    ctx.restore();
    // Gravitational particles going up
    ctx.fillStyle = 'rgba(255,170,67,0.3)';
    for (var pi = 0; pi < 15; pi++) {
        var px = (pi * 97 + 40) % w;
        var py = ((pi * 73 - raceRoadOffset * 15) % h + h) % h;
        ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
    }
}

function drawRaceLandscape(ctx, w, h) {
    switch (raceLandscape) {
        case 'matrix': drawLandscapeMatrix(ctx, w, h); break;
        case 'egypt': drawLandscapeEgypt(ctx, w, h); break;
        case 'house': drawLandscapeHouse(ctx, w, h); break;
        case 'garden': drawLandscapeGarden(ctx, w, h); break;
        case 'kidsspace': drawLandscapeKidsSpace(ctx, w, h); break;
        case 'spiritual': drawLandscapeSpiritual(ctx, w, h); break;
        case 'inverted': drawLandscapeInverted(ctx, w, h); break;
        default: drawLandscapeMatrix(ctx, w, h); break;
    }
}

"""

# Insert before renderRace
html = html.replace(
    "function renderRace() {",
    landscape_draw_funcs + "function renderRace() {"
)
print("Added landscape drawing functions")

# ===== 8. Replace the renderRace background section to use landscape =====
old_render_bg = """    // Fundo
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Gradiente de transição suave
    var progressRatio = racePlayers[0] ? racePlayers[0].progress / TRACK_LENGTH : 0;
    var grad = ctx.createLinearGradient(0, 0, CANVAS_W, 0);

    // Gradiente baseado na progressão
    if (progressRatio < 0.25) {
        grad.addColorStop(0, 'rgba(26,10,46,0.3)');
        grad.addColorStop(1, 'rgba(26,10,46,0)');
    } else if (progressRatio < 0.5) {
        grad.addColorStop(0, 'rgba(46,26,10,0.3)');
        grad.addColorStop(1, 'rgba(46,26,10,0)');
    } else if (progressRatio < 0.75) {
        grad.addColorStop(0, 'rgba(26,26,46,0.3)');
        grad.addColorStop(1, 'rgba(26,26,46,0)');
    } else {
        grad.addColorStop(0, 'rgba(46,42,26,0.3)');
        grad.addColorStop(1, 'rgba(46,42,26,0)');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);"""

new_render_bg = """    // Paisagem de fundo
    drawRaceLandscape(ctx, CANVAS_W, CANVAS_H);"""

if old_render_bg in html:
    html = html.replace(old_render_bg, new_render_bg)
    print("Replaced renderRace background with landscape")
else:
    print("WARNING: Could not find renderRace background section!")

# ===== 9. Add Atacados screen shake in renderRace =====
old_render_start = """function renderRace() {
    var canvas = document.getElementById('race-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;"""

new_render_start = """function renderRace() {
    var canvas = document.getElementById('race-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Atacados screen shake
    if (raceState.difficulty === 'atacados') {
        var shakeX = (Math.random() - 0.5) * 4;
        var shakeY = (Math.random() - 0.5) * 4;
        canvas.style.transform = 'translate(' + shakeX + 'px,' + shakeY + 'px)';
    } else {
        canvas.style.transform = '';
    }"""

if old_render_start in html:
    html = html.replace(old_render_start, new_render_start)
    print("Added Atacados screen shake")
else:
    print("WARNING: Could not find renderRace start!")

# ===== 10. Reset matrix columns on landscape change (in initRace) =====
html = html.replace(
    "raceStartTime = Date.now();",
    "raceStartTime = Date.now();\n    if (raceLandscape === 'matrix') initMatrixColumns();"
)

with open(path, "w", encoding="utf-8") as f:
    f.write(html)

size = os.path.getsize(path)
print("\nFile size: {:.1f} MB".format(size / (1024*1024)))

# Verify braces
with open(path, "r", encoding="utf-8") as f:
    content = f.read()
script_start = content.find('<script>')
script_end = content.find('</script>')
script = content[script_start:script_end]
opens = script.count('{')
closes = script.count('}')
print("Script braces: {} = {}, balanced = {}".format(opens, closes, opens == closes))
