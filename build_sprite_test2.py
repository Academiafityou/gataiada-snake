from PIL import Image
import numpy as np
import base64
import io
import os

img = Image.open(r'C:\Users\Fit You\Desktop\Projeto do Vini\cats\sprite sheet simy.png')
arr = np.array(img)
bg = arr[0, 0]

# 19 frames based on user mapping:
# Row 1 (y=22-179):  1=walk1, 2=walk2, 3=idle
# Row 2 (y=204-356): 4=walk3, 5=jump_up, 6=crouch
# Row 3 (y=384-544): 7=jump_down, 8=death, 9=victory
# Row 4 (y=574-679): 10=crouchwalk1, 11=crouchwalk2, 12=roll1, 13=roll2
# Row 5 (y=698-1007): 14-16=climb(3), 17-19=punch(3)
#   Group 1: x=143-339, Group 2: x=392-599, Group 3: x=643-873
#   Each group = 2 frames, so 6 total (14-19)

frames_def = [
    # Row 1: 3 frames
    ('walk1',       124, 283,   22, 179),
    ('walk2',       418, 586,   22, 179),
    ('idle',        709, 869,   22, 179),
    # Row 2: 3 frames
    ('walk3',       125, 294,  204, 356),
    ('jump_up',     423, 570,  204, 356),
    ('crouch',      698, 879,  204, 356),
    # Row 3: 3 frames
    ('jump_down',   121, 304,  384, 544),
    ('death',       424, 605,  384, 544),
    ('victory',     700, 850,  384, 544),
    # Row 4: 4 frames (verified correct)
    ('crouchwalk1',  79, 263,  572, 680),
    ('crouchwalk2', 289, 463,  572, 680),
    ('roll1',       572, 687,  572, 680),
    ('roll2',       758, 895,  572, 680),
    # Row 5: 3 groups × 2 frames each = 6 frames
    # Splits found by top_y jumps: x=234, x=505, x=767
    ('climb1',      143, 233,  698, 1007),
    ('climb2',      234, 337,  698, 1007),
    ('climb3',      392, 504,  698, 1007),
    ('punch1',      505, 599,  698, 1007),
    ('punch2',      643, 766,  698, 1007),
    ('punch3',      767, 878,  698, 1007),
]

TARGET_SIZE = 128

def remove_green_bg(pixels, threshold=80):
    bg_color = np.array([20, 227, 31], dtype=float)
    dist = np.sqrt(np.sum((pixels.astype(float) - bg_color) ** 2, axis=2))
    alpha = np.where(dist > threshold, 255, 0).astype(np.uint8)
    return alpha

output_dir = r'C:\Users\Fit You\Desktop\Projeto do Vini\sprite_test'
os.makedirs(output_dir, exist_ok=True)

b64_frames = {}
manifest = []

for name, x1, x2, y1, y2 in frames_def:
    crop = img.crop((x1, y1, x2 + 1, y2 + 1))
    crop_rgba = crop.convert('RGBA')
    crop_arr = np.array(crop_rgba)
    rgb = crop_arr[:, :, :3]
    alpha = remove_green_bg(rgb)
    crop_arr[:, :, 3] = alpha
    result = Image.fromarray(crop_arr, 'RGBA')
    
    # Resize to fit TARGET_SIZE
    result.thumbnail((TARGET_SIZE, TARGET_SIZE), Image.LANCZOS)
    final = Image.new('RGBA', (TARGET_SIZE, TARGET_SIZE), (0, 0, 0, 0))
    offset_x = (TARGET_SIZE - result.width) // 2
    offset_y = (TARGET_SIZE - result.height) // 2
    final.paste(result, (offset_x, offset_y), result)
    
    final.save(os.path.join(output_dir, f'{name}.png'))
    
    buf = io.BytesIO()
    final.save(buf, format='PNG')
    b64 = base64.b64encode(buf.getvalue()).decode('ascii')
    b64_frames[name] = f'data:image/png;base64,{b64}'
    
    manifest.append(f'{name}: {result.width}x{result.height} (crop {x2-x1+1}x{y2-y1+1})')
    print(f'{name}: {result.width}x{result.height} (from {x2-x1+1}x{y2-y1+1})')

# Build HTML
sprites_js = ',\n'.join([f'    "{k}": "{v}"' for k, v in b64_frames.items()])

html = f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GATAIADA - Sprite Test - Simy (19 frames)</title>
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
        font-size: 9px;
        padding: 10px;
        text-align: center;
        z-index: 10;
        width: 100%;
        background: rgba(0,0,0,0.5);
        border-bottom: 2px solid #ff99cc;
    }}
    .hud span {{ color: #ffcc66; }}
    canvas {{ display: block; border: 2px solid #ff99cc; border-radius: 8px; margin-top: 8px; }}
    .controls {{
        color: rgba(255,153,204,0.5);
        font-size: 7px;
        padding: 8px;
        text-align: center;
        line-height: 1.8;
    }}
    .controls b {{ color: #ffcc66; }}
    @media (pointer: coarse) {{
        .touch-controls {{ display: flex !important; justify-content: center; gap: 12px; padding: 8px; }}
        .touch-btn {{
            width: 52px; height: 52px; border-radius: 10px;
            border: 2px solid #ff99cc; background: rgba(13,5,32,0.8);
            color: #ff99cc; font-size: 18px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; touch-action: manipulation;
        }}
        .touch-btn:active {{ background: rgba(255,153,204,0.4); }}
    }}
    .touch-controls {{ display: none; }}
</style>
</head>
<body>

<div class="hud">
    SPRITE TEST - SIMY (19 frames) | FPS: <span id="fps">0</span> | State: <span id="state">idle</span>
</div>

<canvas id="game" width="900" height="450"></canvas>

<div class="controls">
    <b>← →</b> Mover | <b>↑</b> Pular | <b>↓</b> Agachar/Caminhar abaixado<br>
    <b>R</b> Reset | <b>Z</b> Rolar | <b>C</b> Escalar | <b>V</b> Soco<br>
    <b>SPACE</b> Vitória | <b>X</b> Morte
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
var GRAVITY = 0.6, JUMP_FORCE = -12, MOVE_SPEED = 4, GROUND_Y = 350, SCALE = 2.5;

var player = {{
    x: 300, y: GROUND_Y, vx: 0, vy: 0,
    facing: 1, grounded: true,
    mode: 'normal', // normal, crouchwalk, roll, climb, punch
    animFrame: 0, animTimer: 0, animSpeed: 150,
    rollTimer: 0, climbTimer: 0, punchTimer: 0
}};

var keys = {{}}, bgScroll = 0;
var images = {{}}, loaded = 0;
var totalSprites = Object.keys(SPRITES).length;

for (var name in SPRITES) {{
    var img = new Image();
    img.onload = function() {{ loaded++; }};
    img.src = SPRITES[name];
    images[name] = img;
}}

function getCurrentSprite() {{
    if (player.mode === 'punch') {{
        var pFrames = ['punch1', 'punch2', 'punch3'];
        return pFrames[player.animFrame % 3];
    }}
    if (player.mode === 'climb') {{
        var cFrames = ['climb1', 'climb2', 'climb3'];
        return cFrames[player.animFrame % 3];
    }}
    if (player.mode === 'roll') {{
        var rFrames = ['roll1', 'roll2'];
        return rFrames[player.animFrame % 2];
    }}
    if (player.mode === 'crouchwalk') {{
        var cwFrames = ['crouchwalk1', 'crouchwalk2'];
        return cwFrames[player.animFrame % 2];
    }}
    if (!player.grounded) {{
        return player.vy < 0 ? 'jump_up' : 'jump_down';
    }}
    if (player.mode === 'crouch') return 'crouch';
    if (Math.abs(player.vx) > 0.5) {{
        var walkFrames = ['walk1', 'walk2', 'walk3'];
        return walkFrames[player.animFrame % 3];
    }}
    return 'idle';
}}

function update(dt) {{
    if (player.mode === 'punch') {{
        player.punchTimer -= dt;
        player.vx = 0;
        player.animTimer += dt;
        if (player.animTimer >= player.animSpeed) {{
            player.animTimer = 0;
            player.animFrame++;
        }}
        if (player.punchTimer <= 0) {{ player.mode = 'normal'; player.animFrame = 0; player.animTimer = 0; }}
        return;
    }}
    if (player.mode === 'roll') {{
        player.rollTimer -= dt;
        player.vx = player.facing * MOVE_SPEED * 1.5;
        player.animTimer += dt;
        if (player.animTimer >= player.animSpeed * 0.5) {{
            player.animTimer = 0;
            player.animFrame++;
        }}
        if (player.rollTimer <= 0) {{ player.mode = 'normal'; player.vx = 0; player.animFrame = 0; player.animTimer = 0; }}
        return;
    }}
    if (player.mode === 'climb') {{
        player.vx = 0;
        if (keys['ArrowUp']) {{ player.vy = -3; }}
        else if (keys['ArrowDown']) {{ player.vy = 3; }}
        else {{ player.vy = 0; }}
        player.animTimer += dt;
        if (player.animTimer >= player.animSpeed) {{
            player.animTimer = 0;
            player.animFrame++;
        }}
        player.climbTimer -= dt;
        if (player.climbTimer <= 0) {{ player.mode = 'normal'; player.vy = 0; player.animFrame = 0; player.animTimer = 0; }}
        return;
    }}

    player.vx = 0;
    var moving = false;

    if (keys['ArrowLeft'] || keys['a']) {{
        player.vx = -MOVE_SPEED;
        player.facing = -1;
        moving = true;
    }} else if (keys['ArrowRight'] || keys['d']) {{
        player.vx = MOVE_SPEED;
        player.facing = 1;
        moving = true;
    }}

    var crouching = (keys['ArrowDown'] || keys['s']) && player.grounded;
    if (crouching) {{
        player.mode = moving ? 'crouchwalk' : 'crouch';
    }} else if (player.mode === 'crouch' || player.mode === 'crouchwalk') {{
        player.mode = 'normal';
    }}

    if ((keys['ArrowUp'] || keys['w']) && player.grounded) {{
        player.vy = JUMP_FORCE;
        player.grounded = false;
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
    }}

    if (moving && player.grounded) {{
        player.animTimer += dt;
        if (player.animTimer >= player.animSpeed) {{
            player.animTimer = 0;
            player.animFrame++;
        }}
    }} else if (!moving) {{
        player.animFrame = 0;
        player.animTimer = 0;
    }}
}}

function drawBackground() {{
    var skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#1a0a2e');
    skyGrad.addColorStop(0.6, '#2a1a4e');
    skyGrad.addColorStop(1, '#3a2a3e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (var i = 0; i < 50; i++) {{
        var sx = ((i * 73) % canvas.width + canvas.width) % canvas.width;
        var sy = (i * 47) % (canvas.height * 0.6);
        ctx.beginPath(); ctx.arc(sx, sy, 1 + (i % 3) * 0.5, 0, Math.PI * 2); ctx.fill();
    }}

    // Wall for climbing test
    ctx.fillStyle = '#4a3a2a';
    ctx.fillRect(canvas.width - 80, GROUND_Y - 200, 20, 240);
    ctx.fillStyle = '#5a4a3a';
    for (var wr = 0; wr < 8; wr++) {{
        ctx.fillRect(canvas.width - 80, GROUND_Y - 200 + wr * 30, 20, 2);
    }}

    ctx.fillStyle = '#3a5a2a';
    ctx.fillRect(0, GROUND_Y + 40, canvas.width, canvas.height - GROUND_Y - 40);
    ctx.fillStyle = '#4a7a3a';
    ctx.fillRect(0, GROUND_Y + 40, canvas.width, 8);
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

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(drawX + drawW / 2, GROUND_Y + 44, drawW / 3, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    document.getElementById('state').textContent = spriteName;
}}

var lastTime = 0, fpsCounter = 0, fpsTimer = 0;

function gameLoop(timestamp) {{
    var dt = timestamp - lastTime;
    lastTime = timestamp;
    fpsCounter++;
    fpsTimer += dt;
    if (fpsTimer >= 1000) {{
        document.getElementById('fps').textContent = fpsCounter;
        fpsCounter = 0; fpsTimer = 0;
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
        player.mode = 'normal'; player.facing = 1; player.grounded = true;
        player.animFrame = 0;
    }}
    if (e.key === 'x' || e.key === 'X') {{
        player.mode = (player.mode === 'death') ? 'normal' : 'death';
    }}
    if (e.key === ' ') {{
        e.preventDefault();
        player.mode = (player.mode === 'victory') ? 'normal' : 'victory';
    }}
    if (e.key === 'z' || e.key === 'Z') {{
        player.mode = 'roll';
        player.rollTimer = 500;
        player.animFrame = 0;
    }}
    if (e.key === 'c' || e.key === 'C') {{
        player.mode = 'climb';
        player.climbTimer = 3000;
        player.animFrame = 0;
        player.x = canvas.width - 100;
        player.y = GROUND_Y - 50;
    }}
    if (e.key === 'v' || e.key === 'V') {{
        player.mode = 'punch';
        player.punchTimer = 400;
        player.animFrame = 0;
    }}
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {{
        e.preventDefault();
    }}
}});

document.addEventListener('keyup', function(e) {{ keys[e.key] = false; }});

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

print(f'\nSaved: {out_path}')
print(f'Size: {os.path.getsize(out_path) / 1024:.0f} KB')
print(f'Total frames: {len(frames_def)}')
