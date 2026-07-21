from PIL import Image
import numpy as np
import base64
import io
import os

TARGET_SIZE = 128

img = Image.open(r'C:\Users\Fit You\Desktop\Projeto do Vini\cats\sprite sheet simy.png')
arr = np.array(img)
bg = arr[0, 0]

def remove_green_bg(pixels):
    dist = np.sqrt(np.sum((pixels.astype(float) - bg.astype(float)) ** 2, axis=2))
    return np.where(dist > 80, 255, 0).astype(np.uint8)

frames_def = [
    # Row 1: 1=parado, 2=andando, 3=andando
    ('idle',    124, 283,   22, 179),
    ('walk1',   418, 586,   22, 179),
    ('walk2',   709, 869,   22, 179),
    # Row 2: 4=andando, 5=pulando, 6=abaixado
    ('walk3',   125, 294,  204, 356),
    ('jump_up', 423, 570,  204, 356),
    ('crouch',  698, 879,  204, 356),
    # Row 3: 7=pulando, 8=morte, 9=vitoria
    ('jump_dn', 121, 304,  384, 544),
    ('death',   424, 605,  384, 544),
    ('victory', 700, 850,  384, 544),
]

output_dir = r'C:\Users\Fit You\Desktop\Projeto do Vini\sprite_test'
os.makedirs(output_dir, exist_ok=True)

b64_frames = {}

for name, x1, x2, y1, y2 in frames_def:
    crop = arr[y1:y2+1, x1:x2+1, :3]
    alpha = remove_green_bg(crop)
    rgba = np.dstack([crop, alpha])
    result = Image.fromarray(rgba, 'RGBA')
    result.thumbnail((TARGET_SIZE, TARGET_SIZE), Image.LANCZOS)
    final = Image.new('RGBA', (TARGET_SIZE, TARGET_SIZE), (0, 0, 0, 0))
    ox = (TARGET_SIZE - result.width) // 2
    oy = (TARGET_SIZE - result.height) // 2
    final.paste(result, (ox, oy), result)
    final.save(os.path.join(output_dir, f'{name}.png'))
    buf = io.BytesIO()
    final.save(buf, format='PNG')
    b64_frames[name] = 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode('ascii')
    print(f'{name}: {result.width}x{result.height} (from {x2-x1+1}x{y2-y1+1})')

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
        color: #ff99cc; font-size: 9px; padding: 10px;
        text-align: center; z-index: 10; width: 100%;
        background: rgba(0,0,0,0.5); border-bottom: 2px solid #ff99cc;
    }}
    .hud span {{ color: #ffcc66; }}
    canvas {{ display: block; border: 2px solid #ff99cc; border-radius: 8px; margin-top: 8px; }}
    .controls {{
        color: rgba(255,153,204,0.5); font-size: 7px;
        padding: 8px; text-align: center; line-height: 1.8;
    }}
    .controls b {{ color: #ffcc66; }}
</style>
</head>
<body>

<div class="hud">
    SPRITE TEST - SIMY (9 frames) | FPS: <span id="fps">0</span> | State: <span id="state">idle</span>
</div>

<canvas id="game" width="900" height="450"></canvas>

<div class="controls">
    <b>&larr; &rarr;</b> Mover | <b>&uarr;</b> Pular | <b>&darr;</b> Agachar<br>
    <b>R</b> Reset | <b>SPACE</b> Vit&oacute;ria | <b>X</b> Morte
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
    facing: 1, grounded: true, mode: 'normal',
    animFrame: 0, animTimer: 0, animSpeed: 150
}};

var keys = {{}};
var images = {{}}, loaded = 0;

for (var name in SPRITES) {{
    var img = new Image();
    img.onload = function() {{ loaded++; }};
    img.src = SPRITES[name];
    images[name] = img;
}}

function getSprite() {{
    if (player.mode === 'death') return 'death';
    if (player.mode === 'victory') return 'victory';
    if (player.mode === 'crouch') return 'crouch';
    if (!player.grounded) return player.vy < 0 ? 'jump_up' : 'jump_dn';
    if (Math.abs(player.vx) > 0.5) {{
        return ['walk1','walk2','walk3'][player.animFrame % 3];
    }}
    return 'idle';
}}

function update(dt) {{
    player.vx = 0;
    var moving = false;

    if (keys['ArrowLeft'] || keys['a']) {{
        player.vx = -MOVE_SPEED; player.facing = -1; moving = true;
    }} else if (keys['ArrowRight'] || keys['d']) {{
        player.vx = MOVE_SPEED; player.facing = 1; moving = true;
    }}

    var crouching = (keys['ArrowDown'] || keys['s']) && player.grounded;
    player.mode = crouching ? 'crouch' : 'normal';

    if ((keys['ArrowUp'] || keys['w']) && player.grounded) {{
        player.vy = JUMP_FORCE; player.grounded = false;
    }}

    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;

    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - 60) player.x = canvas.width - 60;
    if (player.y >= GROUND_Y) {{ player.y = GROUND_Y; player.vy = 0; player.grounded = true; }}

    if (moving && player.grounded) {{
        player.animTimer += dt;
        if (player.animTimer >= player.animSpeed) {{
            player.animTimer = 0; player.animFrame++;
        }}
    }} else if (!moving) {{
        player.animFrame = 0; player.animTimer = 0;
    }}
}}

function draw() {{
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
        ctx.beginPath(); ctx.arc(sx, sy, 1 + (i%3)*0.5, 0, Math.PI*2); ctx.fill();
    }}

    ctx.fillStyle = '#3a5a2a';
    ctx.fillRect(0, GROUND_Y + 40, canvas.width, canvas.height - GROUND_Y - 40);
    ctx.fillStyle = '#4a7a3a';
    ctx.fillRect(0, GROUND_Y + 40, canvas.width, 8);

    var spriteName = getSprite();
    var sprite = images[spriteName];
    if (sprite && sprite.complete) {{
        var dw = SCALE * 128, dh = SCALE * 128;
        var dx = player.x, dy = player.y - dh + 40;
        ctx.save();
        ctx.translate(dx + dw/2, dy + dh/2);
        ctx.scale(player.facing, 1);
        ctx.drawImage(sprite, -dw/2, -dh/2, dw, dh);
        ctx.restore();
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(dx + dw/2, GROUND_Y + 44, dw/3, 6, 0, 0, Math.PI*2);
        ctx.fill();
    }}
    document.getElementById('state').textContent = spriteName;
}}

var lastTime = 0, fpsC = 0, fpsT = 0;
function loop(t) {{
    var dt = t - lastTime; lastTime = t;
    fpsC++; fpsT += dt;
    if (fpsT >= 1000) {{ document.getElementById('fps').textContent = fpsC; fpsC = 0; fpsT = 0; }}
    update(dt); draw();
    requestAnimationFrame(loop);
}}

document.addEventListener('keydown', function(e) {{
    keys[e.key] = true;
    if (e.key === 'r' || e.key === 'R') {{
        player.x = 300; player.y = GROUND_Y; player.vx = 0; player.vy = 0;
        player.mode = 'normal'; player.facing = 1; player.grounded = true; player.animFrame = 0;
    }}
    if (e.key === 'x' || e.key === 'X') player.mode = player.mode === 'death' ? 'normal' : 'death';
    if (e.key === ' ') {{ e.preventDefault(); player.mode = player.mode === 'victory' ? 'normal' : 'victory'; }}
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
}});
document.addEventListener('keyup', function(e) {{ keys[e.key] = false; }});

requestAnimationFrame(loop);
</script>
</body>
</html>'''

out_path = r'C:\Users\Fit You\Desktop\Projeto do Vini\sprite_test.html'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(html)

print(f'\nSaved: {out_path}')
print(f'Size: {os.path.getsize(out_path) / 1024:.0f} KB')
