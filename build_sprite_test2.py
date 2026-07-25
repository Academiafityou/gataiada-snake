from PIL import Image
import base64, io, os

img = Image.open(r'C:\Users\Fit You\Desktop\Projeto do Vini\cats\sprite sheet simy.png')
buf = io.BytesIO()
img.save(buf, format='PNG')
sheet_b64 = base64.b64encode(buf.getvalue()).decode('ascii')

# Frame boundaries (x, y, w, h) from the sprite sheet
# Row 1: idle(124,22), walk1(418,22), walk2(709,22)
# Row 2: walk3(125,204), jump_up(423,204), crouch(698,204)
# Row 3: jump_dn(121,384), death(424,384), victory(700,384)

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

<canvas id="game" width="800" height="400"></canvas>

<div class="controls">
    <b>&larr; &rarr;</b> Mover | <b>&uarr;</b> Pular | <b>&darr;</b> Agachar<br>
    <b>R</b> Reset | <b>SPACE</b> Vit&oacute;ria | <b>X</b> Morte
</div>

<script>
var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');
var GRAVITY = 0.35, JUMP_FORCE = -7, MOVE_SPEED = 2.5, GROUND_Y = 330;
var SPRITE_SCALE = 0.55;

var FRAMES = {{
    'idle':    {{x:55, y:65, w:260, h:255}},
    'walk1':   {{x:378, y:65, w:268, h:255}},
    'walk2':   {{x:708, y:65, w:255, h:255}},
    'walk3':   {{x:52, y:368, w:270, h:250}},
    'jump_up': {{x:386, y:368, w:238, h:250}},
    'crouch':  {{x:685, y:435, w:295, h:180}},
    'jump_dn': {{x:32, y:658, w:292, h:262}},
    'death':   {{x:370, y:752, w:290, h:165}},
    'victory': {{x:688, y:655, w:245, h:265}}
}};

var player = {{
    x: 300, y: GROUND_Y, vx: 0, vy: 0,
    facing: 1, grounded: true, mode: 'normal',
    animFrame: 0, animTimer: 0, animSpeed: 180
}};
var keys = {{}};

var sheetImg = new Image();
var sheetReady = false;
var processedCanvas = null;

sheetImg.onload = function() {{
    var oc = document.createElement('canvas');
    oc.width = sheetImg.width;
    oc.height = sheetImg.height;
    var octx = oc.getContext('2d');
    octx.drawImage(sheetImg, 0, 0);

    var imgData = octx.getImageData(0, 0, oc.width, oc.height);
    var d = imgData.data;

    for (var i = 0; i < d.length; i += 4) {{
        var r = d[i], g = d[i+1], b = d[i+2];
        if (g > 180 && g > r * 2.5 && g > b * 2.5) {{
            d[i+3] = 0;
        }}
    }}

    octx.putImageData(imgData, 0, 0);
    processedCanvas = oc;
    sheetReady = true;
}};
sheetImg.src = 'data:image/png;base64,{sheet_b64}';

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
    if (player.mode !== 'death' && player.mode !== 'victory') {{
        player.mode = crouching ? 'crouch' : 'normal';
    }}

    if ((keys['ArrowUp'] || keys['w']) && player.grounded && !crouching) {{
        player.vy = JUMP_FORCE; player.grounded = false;
    }}

    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;

    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - 50) player.x = canvas.width - 50;
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
    ctx.fillRect(0, GROUND_Y + 35, canvas.width, canvas.height - GROUND_Y - 35);
    ctx.fillStyle = '#4a7a3a';
    ctx.fillRect(0, GROUND_Y + 35, canvas.width, 6);

    if (!sheetReady) return;

    var spriteName = getSprite();
    var f = FRAMES[spriteName];
    if (!f) return;

    var dw = f.w * SPRITE_SCALE;
    var dh = f.h * SPRITE_SCALE;
    var dx = player.x;
    var dy = player.y - dh;

    ctx.save();
    ctx.translate(dx + dw/2, dy + dh/2);
    ctx.scale(player.facing, 1);

    ctx.drawImage(processedCanvas,
        f.x, f.y, f.w, f.h,
        -dw/2, -dh/2, dw, dh);

    ctx.restore();

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(dx + dw/2, GROUND_Y + 38, dw/4, 4, 0, 0, Math.PI*2);
    ctx.fill();

    document.getElementById('state').textContent = spriteName + ' (facing:' + (player.facing > 0 ? 'R' : 'L') + ')';
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

print(f'Saved: {out_path}')
print(f'Size: {os.path.getsize(out_path) / 1024:.0f} KB')
