from PIL import Image
import numpy as np
import base64
import io
import os

img = Image.open(r'C:\Users\Fit You\Desktop\Projeto do Vini\cats\sprite sheet simy.png')

frames_def = [
    ('idle',      68,  309,  74, 312),
    ('walk1',    388,  640,  74, 312),
    ('walk2',    716,  956,  74, 312),
    ('walk3',     63,  318, 377, 612),
    ('jump_up',  395,  616, 377, 612),
    ('crouch',   696,  971, 377, 612),
    ('jump_down', 42,  317, 667, 912),
    ('death',    381,  654, 667, 912),
    ('victory',  697,  924, 667, 912),
]

TARGET_SIZE = 128

def remove_green_bg(pixels, threshold=80):
    bg = np.array([22, 237, 18], dtype=float)
    dist = np.sqrt(np.sum((pixels.astype(float) - bg) ** 2, axis=2))
    alpha = np.where(dist > threshold, 255, 0).astype(np.uint8)
    return alpha

b64_frames = {}

for name, x1, x2, y1, y2 in frames_def:
    crop = img.crop((x1, y1, x2 + 1, y2 + 1))
    crop_rgba = crop.convert('RGBA')
    crop_arr = np.array(crop_rgba)
    rgb = crop_arr[:, :, :3]
    alpha = remove_green_bg(rgb)
    crop_arr[:, :, 3] = alpha
    result = Image.fromarray(crop_arr, 'RGBA')
    result.thumbnail((TARGET_SIZE, TARGET_SIZE), Image.LANCZOS)
    final = Image.new('RGBA', (TARGET_SIZE, TARGET_SIZE), (0, 0, 0, 0))
    offset_x = (TARGET_SIZE - result.width) // 2
    offset_y = (TARGET_SIZE - result.height) // 2
    final.paste(result, (offset_x, offset_y), result)
    buf = io.BytesIO()
    final.save(buf, format='PNG')
    b64 = base64.b64encode(buf.getvalue()).decode('ascii')
    b64_frames[name] = f'data:image/png;base64,{b64}'

# Build HTML
sprites_js = ',\n'.join([f'    "{k}": "{v}"' for k, v in b64_frames.items()])

html = f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GATAIADA - Sprite Test - Simy</title>
<style>
    * {{ margin:0; padding:0; box-sizing:border-box; }}
    body {{
        background: #0d0520;
        font-family: 'Press Start 2P', monospace;
        overflow: hidden;
        height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
    }}
    .hud {{
        color: #ff99cc;
        font-size: 10px;
        padding: 12px;
        text-align: center;
        z-index: 10;
        width: 100%;
        background: rgba(0,0,0,0.5);
        border-bottom: 2px solid #ff99cc;
    }}
    .hud span {{ color: #ffcc66; }}
    canvas {{
        display: block;
        border: 2px solid #ff99cc;
        border-radius: 8px;
        margin-top: 10px;
    }}
    .controls {{
        color: rgba(255,153,204,0.5);
        font-size: 7px;
        padding: 10px;
        text-align: center;
    }}
    .controls b {{ color: #ffcc66; }}
    @media (pointer: coarse) {{
        .touch-controls {{
            display: flex !important;
            justify-content: center;
            gap: 16px;
            padding: 10px;
        }}
        .touch-btn {{
            width: 56px; height: 56px;
            border-radius: 10px;
            border: 2px solid #ff99cc;
            background: rgba(13,5,32,0.8);
            color: #ff99cc;
            font-size: 20px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            touch-action: manipulation;
        }}
        .touch-btn:active {{ background: rgba(255,153,204,0.4); }}
    }}
    .touch-controls {{ display: none; }}
</style>
</head>
<body>

<div class="hud">
    SPRITE TEST - SIMY | FPS: <span id="fps">0</span> | State: <span id="state">idle</span> | Pos: <span id="pos">0, 0</span>
</div>

<canvas id="game" width="900" height="500"></canvas>

<div class="controls">
    <b>← →</b> Mover | <b>↑</b> Pular | <b>↓</b> Agachar | <b>R</b> Reset | <b>SPACE</b> Vitória | <b>X</b> Morte
</div>

<div class="touch-controls" id="touch-controls">
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
        <div class="touch-btn" id="t-up">▲</div>
        <div style="display:flex;gap:4px;">
            <div class="touch-btn" id="t-left">◀</div>
            <div class="touch-btn" id="t-right">▶</div>
        </div>
        <div class="touch-btn" id="t-down">▼</div>
    </div>
</div>

<script>
var SPRITES = {{
{sprites_js}
}};

var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');

var GRAVITY = 0.6;
var JUMP_FORCE = -12;
var MOVE_SPEED = 4;
var GROUND_Y = 380;
var SCALE = 2.5;

var player = {{
    x: 300, y: GROUND_Y,
    vx: 0, vy: 0,
    facing: 1,
    grounded: true,
    crouching: false,
    jumping: false,
    dead: false,
    celebrating: false,
    animFrame: 0,
    animTimer: 0,
    animSpeed: 150
}};

var keys = {{}};
var bgScroll = 0;

var images = {{}};
var loaded = 0;
var totalSprites = Object.keys(SPRITES).length;

for (var name in SPRITES) {{
    var img = new Image();
    img.onload = function() {{ loaded++; }};
    img.src = SPRITES[name];
    images[name] = img;
}}

function getCurrentSprite() {{
    if (player.dead) return 'death';
    if (player.celebrating) return 'victory';
    if (player.crouching) return 'crouch';
    if (!player.grounded) {{
        return player.vy < 0 ? 'jump_up' : 'jump_down';
    }}
    if (Math.abs(player.vx) > 0.5) {{
        var walkFrames = ['walk1', 'walk2', 'walk3'];
        return walkFrames[player.animFrame % walkFrames.length];
    }}
    return 'idle';
}}

function update(dt) {{
    if (player.dead || player.celebrating) {{
        player.vx = 0;
        return;
    }}

    player.crouching = false;
    var moving = false;

    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {{
        player.vx = -MOVE_SPEED;
        player.facing = -1;
        moving = true;
    }} else if (keys['ArrowRight'] || keys['d'] || keys['D']) {{
        player.vx = MOVE_SPEED;
        player.facing = 1;
        moving = true;
    }} else {{
        player.vx *= 0.7;
        if (Math.abs(player.vx) < 0.1) player.vx = 0;
    }}

    if ((keys['ArrowDown'] || keys['s'] || keys['S']) && player.grounded) {{
        player.crouching = true;
        player.vx = 0;
    }}

    if ((keys['ArrowUp'] || keys['w'] || keys['W'] || keys[' ']) && player.grounded) {{
        player.vy = JUMP_FORCE;
        player.grounded = false;
        player.jumping = true;
    }}

    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;

    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - 60) player.x = canvas.width - 60;

    if (player.y >= GROUND_Y) {{
        player.y = GROUND_Y;
        player.vy = 0;
        player.grounded = true;
        player.jumping = false;
    }}

    if (moving && player.grounded) {{
        player.animTimer += dt;
        if (player.animTimer >= player.animSpeed) {{
            player.animTimer = 0;
            player.animFrame = (player.animFrame + 1) % 3;
        }}
    }} else if (!moving) {{
        player.animFrame = 0;
        player.animTimer = 0;
    }}

    bgScroll -= player.vx * 0.5;
}}

function drawBackground() {{
    // Sky
    var skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#1a0a2e');
    skyGrad.addColorStop(0.6, '#2a1a4e');
    skyGrad.addColorStop(1, '#3a2a3e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (var i = 0; i < 50; i++) {{
        var sx = ((i * 73 + bgScroll * 0.1) % canvas.width + canvas.width) % canvas.width;
        var sy = (i * 47) % (canvas.height * 0.6);
        ctx.beginPath();
        ctx.arc(sx, sy, 1 + (i % 3) * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }}

    // Ground
    ctx.fillStyle = '#3a5a2a';
    ctx.fillRect(0, GROUND_Y + 40, canvas.width, canvas.height - GROUND_Y - 40);
    ctx.fillStyle = '#4a7a3a';
    ctx.fillRect(0, GROUND_Y + 40, canvas.width, 8);

    // Ground details
    ctx.fillStyle = '#2a4a1a';
    for (var g = 0; g < canvas.width + 40; g += 40) {{
        var gx = ((g + bgScroll) % (canvas.width + 40) + canvas.width + 40) % (canvas.width + 40) - 20;
        ctx.fillRect(gx, GROUND_Y + 48, 20, 4);
    }}
}}

function drawPlayer() {{
    var spriteName = getCurrentSprite();
    var sprite = images[spriteName];
    if (!sprite || !sprite.complete) return;

    var drawW = SCALE * 128;
    var drawH = SCALE * 128;
    var drawX = player.x;
    var drawY = player.y - drawH + 40;

    ctx.save();
    ctx.translate(drawX + drawW / 2, drawY + drawH / 2);
    ctx.scale(player.facing, 1);
    ctx.drawImage(sprite, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(drawX + drawW / 2, GROUND_Y + 44, drawW / 3, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    document.getElementById('state').textContent = spriteName;
    document.getElementById('pos').textContent = Math.floor(player.x) + ', ' + Math.floor(player.y);
}}

var lastTime = 0;
var fpsCounter = 0;
var fpsTimer = 0;

function gameLoop(timestamp) {{
    var dt = timestamp - lastTime;
    lastTime = timestamp;

    fpsCounter++;
    fpsTimer += dt;
    if (fpsTimer >= 1000) {{
        document.getElementById('fps').textContent = fpsCounter;
        fpsCounter = 0;
        fpsTimer = 0;
    }}

    update(dt);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawPlayer();

    requestAnimationFrame(gameLoop);
}}

document.addEventListener('keydown', function(e) {{
    keys[e.key] = true;
    if (e.key === 'r' || e.key === 'R') {{
        player.x = 300; player.y = GROUND_Y;
        player.vx = 0; player.vy = 0;
        player.dead = false; player.celebrating = false;
        player.facing = 1; player.grounded = true;
    }}
    if (e.key === 'x' || e.key === 'X') {{
        player.dead = !player.dead;
        player.celebrating = false;
    }}
    if (e.key === ' ') {{
        e.preventDefault();
        player.celebrating = !player.celebrating;
        player.dead = false;
    }}
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {{
        e.preventDefault();
    }}
}});

document.addEventListener('keyup', function(e) {{
    keys[e.key] = false;
}});

// Touch controls
function bindTouch(id, key) {{
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('touchstart', function(e) {{ e.preventDefault(); keys[key] = true; }}, {{passive:false}});
    el.addEventListener('touchend', function(e) {{ e.preventDefault(); keys[key] = false; }}, {{passive:false}});
}}
bindTouch('t-up', 'ArrowUp');
bindTouch('t-down', 'ArrowDown');
bindTouch('t-left', 'ArrowLeft');
bindTouch('t-right', 'ArrowRight');

requestAnimationFrame(gameLoop);
</script>
</body>
</html>'''

out_path = r'C:\Users\Fit You\Desktop\Projeto do Vini\sprite_test.html'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(html)

size = os.path.getsize(out_path)
print(f'File saved: {out_path}')
print(f'Size: {size / 1024:.0f} KB')
