from PIL import Image
import base64, io, os, json, numpy as np

def remove_green(img_path, out_path=None, size=None):
    img = Image.open(img_path).convert('RGBA')
    arr = np.array(img).astype(float)
    r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
    mask = (g > 180) & (g > r * 2.5) & (g > b * 2.5)
    arr[mask, 3] = 0
    result = Image.fromarray(arr.astype(np.uint8), 'RGBA')
    if size:
        result = result.resize((size, size), Image.LANCZOS)
    if out_path:
        result.save(out_path, format='PNG')
    return result

def process_sheet(path, out_path):
    img = Image.open(path)
    arr = np.array(img).astype(float)
    r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
    mask = (g > 180) & (g > r * 2.5) & (g > b * 2.5)
    rgba = np.dstack([arr[:,:,0].astype(np.uint8), arr[:,:,1].astype(np.uint8), arr[:,:,2].astype(np.uint8), np.full_like(arr[:,:,0], 255, dtype=np.uint8)])
    rgba[mask, 3] = 0
    result = Image.fromarray(rgba, 'RGBA')
    result.save(out_path, format='PNG')
    return result

with open(r'C:\Users\Fit You\Desktop\Projeto do Vini\cats\frame_data.json') as f:
    frame_data = json.load(f)

cats_info = [
    ('Simy', 'Simy', 'Marrom', '#8B5E3C', 'Triple Jump', 'Pula 3 vezes no ar!', 'Sprite sheet simy.png'),
    ('Adora', 'Adora', 'Rosa', '#E75480', 'Float', 'Flutua 2s no ar!', 'sprite sheet adora.png'),
    ('Maya', 'Maya', 'Lilas', '#9B59B6', 'Wall Jump', 'Pula nas paredes!', 'sprite sheet maya.png'),
    ('Dulce Maria', 'Dulce', 'Vermelho', '#E74C3C', 'Fireball', 'Lanca bolas de fogo!', 'sprite sheet Dulce.png'),
    ('Sky', 'Sky', 'Verde', '#27AE60', 'Dash', 'Impulso rapido!', 'Sprite sheet sky.png'),
    ('Pito', 'Pito', 'Azul', '#2980B9', 'Shield', 'Escudo 3s!', 'sprite sheet pito.png'),
    ('Sury', 'Sury', 'Laranja', '#E67E22', 'Mega Jump', 'Pula telhados!', 'sprite sheet Sury.png'),
]

print("Loading assets...")
base = r'C:\Users\Fit You\Desktop\Projeto do Vini\cats'

print("Processing and saving sprite sheets...")
cat_sheet_urls = {}
for dn, sk, cn, c, p, pd, sf in cats_info:
    key = sk.lower()
    out = f'{base}\\sheet_{key}.png'
    process_sheet(f'{base}\\{sf}', out)
    cat_sheet_urls[dn] = f'cats/sheet_{key}.png'
    print(f'  {dn}: saved sheet_{key}.png')

print("Processing and saving portraits...")
cat_portrait_urls = {}
for dn, sk, cn, c, p, pd, sf in cats_info:
    key = sk.lower()
    out = f'{base}\\portrait_{key}.png'
    remove_green(f'{base}\\{dn}.png', out, 128)
    cat_portrait_urls[dn] = f'cats/portrait_{key}.png'
    print(f'  {dn}: saved portrait_{key}.png')

print("Processing and saving face icons...")
cat_face_urls = {}
for dn, sk, cn, c, p, pd, sf in cats_info:
    key = sk.lower()
    out = f'{base}\\face_{key}.png'
    remove_green(f'{base}\\{dn}.png', out, 32)
    cat_face_urls[dn] = f'cats/face_{key}.png'
    print(f'  {dn}: saved face_{key}.png')

print("Processing phase images (removing green bg)...")
phase_files = {
    'casa': 'casa_small.png',
    'castelo': 'Castelo_small.png',
    'esfinge': 'Esfinge_small.png',
    'matrix': 'Matrix_small.png',
    'saches': 'saches_small.png',
    'hotel': 'hotel_small.png',
    'espaco': 'espaco_small.png',
}
phase_urls = {}
for key, fname in phase_files.items():
    out = f'{base}\\{key}_clean.png'
    remove_green(f'{base}\\{fname}', out)
    phase_urls[key] = f'cats/{key}_clean.png'
    print(f'  {key}: saved {key}_clean.png')

print("Processing boss/xepa assets...")
boss_urls = {}
for key, fname in [('odair_sprite', 'odair_sprite_clean.png'), ('odair_face', 'Rosto telinha.png'), ('xepa_boss', 'xepa_boss_final.png'), ('xepa_enemy', 'xepa_enemy_final.png')]:
    out = f'{base}\\{key}_cleaned.png'
    remove_green(f'{base}\\{fname}', out)
    boss_urls[key] = f'cats/{key}_cleaned.png'
    print(f'  {key}: saved {key}_cleaned.png')

print("Building game HTML...")

cat_frames = {}
for dn, sk, cn, c, p, pd, sf in cats_info:
    cat_frames[dn] = frame_data[sk]

portraits_js = ""
for dn, sk, cn, c, p, pd, sf in cats_info:
    frames_str = json.dumps(cat_frames[dn]).replace('"', "'")
    portraits_js += f"    {{name:'{dn}',color_name:'{cn}',color:'{c}',power:'{p}',power_desc:'{pd}',portrait:'{cat_portrait_urls[dn]}',sheet:'{cat_sheet_urls[dn]}',face:'{cat_face_urls[dn]}',frames:{frames_str}}},\n"

# Level order (reordered as requested)
levels_js = """
var LEVELS = [
    {name:'Reino do Simy',desc:'A Casa de Rachel - Derrote o Sr. Odair!',theme:'house',color:'#D4A574',bg1:'#5BB8F5',bg2:'#E8D5B0',ground:'#8B6B4A',platform:'#A0845A',enemies:8,boss_hp:8,boss_name:'Sr. Odair'},
    {name:'Pito do Egito',desc:'Piramide misteriosa - Cuidado com areia movedica!',theme:'desert',color:'#DAA520',bg1:'#2e1a0a',bg2:'#4e3a1a',ground:'#7a6a3a',platform:'#9a8a5a',enemies:8,boss_hp:5,boss_name:'Esfinx'},
    {name:'Matrix do Sky',desc:'Mundo digital - Agentes te caçam!',theme:'matrix',color:'#00FF41',bg1:'#001a00',bg2:'#003a00',ground:'#0a5a0a',platform:'#0a7a0a',enemies:9,boss_hp:5,boss_name:'Agente Verde'},
    {name:'Hotel Velha Guarda',desc:'Hotel assombrado - Fantasmas dao dano!',theme:'spirit',color:'#9B59B6',bg1:'#1a0a3a',bg2:'#3a1a5a',ground:'#5a3a7a',platform:'#7a5a9a',enemies:10,boss_hp:6,boss_name:'Fantasma'},
    {name:'Planeta dos Sachês',desc:'Planeta misterioso - Pense de cabeca!',theme:'inverted',color:'#E74C3C',bg1:'#2e0a0a',bg2:'#4e1a1a',ground:'#6a3a3a',platform:'#8a5a5a',enemies:11,boss_hp:7,boss_name:'Sachê Lorde'},
    {name:'Castelo da Princesa Dorothy',desc:'Castelo encantado - Armadilhas por todo lado!',theme:'castle',color:'#8E44AD',bg1:'#1a0a2e',bg2:'#2a1a4e',ground:'#4a3a6a',platform:'#6a5a8a',enemies:10,boss_hp:6,boss_name:'Dorothy'},
    {name:'Espaço Kids!',desc:'Espaço profundo - O boss final te espera!',theme:'space',color:'#3498DB',bg1:'#000a1a',bg2:'#0a1a3a',ground:'#1a2a4a',platform:'#2a3a6a',enemies:12,boss_hp:8,boss_name:'Mestre das Estrelas'}
];

var WORLD_MAP_NODES = [
    {x:120,y:380,level:0,prev:[],name:'Fase 1'},
    {x:250,y:310,level:1,prev:[0],name:'Fase 2'},
    {x:390,y:360,level:2,prev:[1],name:'Fase 3'},
    {x:510,y:270,level:3,prev:[2],name:'Fase 4'},
    {x:630,y:340,level:4,prev:[3],name:'Fase 5'},
    {x:760,y:250,level:5,prev:[4],name:'Fase 6'},
    {x:870,y:170,level:6,prev:[5],name:'FINAL'}
];
"""

html = f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GATAIADA - O Jogo do Plataforma</title>
<style>
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ background:#0d0520; font-family:'Courier New',monospace; overflow:hidden; height:100vh; display:flex; justify-content:center; align-items:center; }}
canvas {{ display:block; image-rendering:pixelated; width:960px; height:540px; }}
</style>
</head>
<body>
<video id="introVid" src="cats/abertura_plataforma.mp4" muted loop style="position:absolute;left:-9999px;"></video>
<canvas id="game" tabindex="0" style="display:block;margin:0 auto;"></canvas>
<script>
var C = document.getElementById('game');
var X = C.getContext('2d');
var W = 960, H = 540;
C.width = W; C.height = H;
C.focus(); C.addEventListener('click', function(){{ C.focus(); }});

var introVid=document.getElementById('introVid');
var introPlaying=false;
function tryPlayIntro(){{ if(!introPlaying&&introVid){{ introVid.play().then(function(){{ introPlaying=true; }}).catch(function(){{}}); }} }}
tryPlayIntro();
document.addEventListener('keydown',tryPlayIntro,false);
document.addEventListener('click',tryPlayIntro,false);

var CATS = [
{portraits_js}];

{levels_js}

var odairSprite=new Image(); odairSprite.src='{boss_urls["odair_sprite"]}';
var odairFace=new Image(); odairFace.src='{boss_urls["odair_face"]}';
var casaImg=new Image(); casaImg.src='{phase_urls["casa"]}';
var casteloImg=new Image(); casteloImg.src='{phase_urls["castelo"]}';
var esfingeImg=new Image(); esfingeImg.src='{phase_urls["esfinge"]}';
var matrixImg=new Image(); matrixImg.src='{phase_urls["matrix"]}';
var sachesImg=new Image(); sachesImg.src='{phase_urls["saches"]}';
var hotelImg=new Image(); hotelImg.src='{phase_urls["hotel"]}';
var espacoImg=new Image(); espacoImg.src='{phase_urls["espaco"]}';
var xepaBossImg=new Image(); xepaBossImg.src='{boss_urls["xepa_boss"]}';
var xepaEnemyImg=new Image(); xepaEnemyImg.src='{boss_urls["xepa_enemy"]}';

var GRAVITY = 0.45;
var TILE = 32;
var TILE_ROWS = 17;

var game = {{
    state:'title', selectedCat:0, currentLevel:0,
    levelsUnlocked:[true,true,true,true,true,true,true],
    lives:7, maxLives:7, chances:3, maxChances:3,
    coins:0, score:0, time:180, grown:false
}};

var player = {{
    x:0, y:0, vx:0, vy:0, w:28, h:36, baseW:28, baseH:36,
    grounded:false, facing:1, hp:3, maxHp:3,
    powerActive:false, powerTimer:0, powerCooldown:0,
    jumpCount:0, maxJumps:1, dashTimer:0, dashDir:0,
    wallTouchL:false, wallTouchR:false, wallSliding:false,
    invincible:0, animFrame:0, animTimer:0, animState:'idle',
    sheetReady:false, crouching:false, preCrouchW:28, preCrouchH:36
}};

var catFaceImgs = {{}};
var processedSheets = {{}};
var catPortraitImgs = {{}};
var sheetsLoaded = 0;

var extAssets = [odairSprite,odairFace,casaImg,casteloImg,esfingeImg,matrixImg,sachesImg,hotelImg,espacoImg,xepaBossImg,xepaEnemyImg];

window.onerror = function(msg, url, line, col, err) {{
    X.fillStyle='#000'; X.fillRect(0,0,W,H);
    X.fillStyle='#ff0000'; X.font='bold 18px Courier New'; X.textAlign='center';
    X.fillText('ERRO: '+msg,W/2,H/2-20);
    X.font='11px Courier New'; X.fillStyle='#ff6666';
    X.fillText('Linha: '+line+(col?' Col: '+col:''),W/2,H/2+10);
    if(err&&err.stack) X.fillText(err.stack.split('\\n').slice(0,3).join(' | '),W/2,H/2+30);
    return true;
}};

CATS.forEach(function(cat, idx) {{
    var img = new Image();
    img.onload = function() {{
        processedSheets[cat.name] = img;
        sheetsLoaded++;
        if (sheetsLoaded >= CATS.length) player.sheetReady = true;
    }};
    img.src = cat.sheet;
    var pImg = new Image();
    pImg.src = cat.portrait;
    catPortraitImgs[cat.name] = pImg;
    var fImg = new Image();
    fImg.src = cat.face;
    catFaceImgs[cat.name] = fImg;
}});

var enemies=[], projectiles=[], particles=[], collectibles=[], furniture=[];
var boss=null, levelWidth=0, cameraX=0, mapTiles=[];
var keys={{}};
var selectIndex=0, mapIndex=0, titleTimer=0;
var levelCompleteTimer=0, deathTimer=0, gameOverTimer=0, lastTime=0;
var mouseX=0, mouseY=0, hoverIndex=-1, selectAnimTimer=0, mapHoverIndex=-1;

function buildHouseLevel() {{
    var cols=160, rows=TILE_ROWS;
    levelWidth=cols*TILE;
    mapTiles=[];
    for(var r=0;r<rows;r++){{ mapTiles[r]=[]; for(var c=0;c<cols;c++) mapTiles[r][c]=0; }}
    for(var c=0;c<cols;c++){{ mapTiles[rows-1][c]=1; mapTiles[rows-2][c]=1; }}
    for(var c=0;c<18;c++){{ mapTiles[rows-2][c]=5; mapTiles[rows-3][c]=6; }}
    for(var r=4;r<rows-2;r++) mapTiles[r][15]=1;
    mapTiles[rows-3][15]=0; mapTiles[rows-4][15]=0; mapTiles[rows-5][15]=0;
    mapTiles[rows-6][15]=0;
    for(var r=0;r<4;r++) for(var c=15;c<100;c++) mapTiles[r][c]=1;
    for(var c=15;c<100;c++){{ mapTiles[rows-2][c]=7; mapTiles[rows-3][c]=7; }}
    for(var r=0;r<rows;r++) mapTiles[r][99]=1;
    mapTiles[rows-3][99]=0; mapTiles[rows-4][99]=0; mapTiles[rows-5][99]=0;
    mapTiles[rows-6][99]=0;
    for(var r=4;r<rows;r++) for(var c=100;c<160;c++) mapTiles[r][c]=0;
    for(var c=100;c<160;c++){{ mapTiles[rows-2][c]=7; mapTiles[rows-3][c]=7; }}
    for(var r=0;r<4;r++) for(var c=100;c<160;c++) mapTiles[r][c]=1;
    for(var r=0;r<rows;r++) mapTiles[r][159]=1;
    for(var c=40;c<55;c++) mapTiles[rows-5][c]=2;
    for(var c=60;c<70;c++) mapTiles[rows-8][c]=2;
    for(var c=105;c<115;c++) mapTiles[rows-7][c]=2;
    for(var c=125;c<135;c++) mapTiles[rows-5][c]=2;
    for(var c=105;c<125;c++) for(var r=rows-11;r<rows-9;r++) mapTiles[r][c]=2;
    for(var c=5;c<14;c++) if(mapTiles[rows-3][c]===6){{ mapTiles[rows-3][c]=0; mapTiles[rows-4][c]=0; mapTiles[rows-5][c]=0; mapTiles[rows-6][c]=0; }}

    furniture=[];
    furniture.push({{x:16*TILE,y:(rows-5)*TILE,w:6*TILE,h:2*TILE,type:'sofa',color:'#8B4513'}});
    furniture.push({{x:16*TILE,y:(rows-8)*TILE,w:4*TILE,h:3*TILE,type:'tv',color:'#222'}});
    furniture.push({{x:22*TILE,y:(rows-4)*TILE,w:3*TILE,h:TILE,type:'table',color:'#A0522D'}});
    furniture.push({{x:42*TILE,y:(rows-5)*TILE,w:8*TILE,h:2*TILE,type:'dtable',color:'#DEB887'}});
    for(var i=0;i<8;i++) furniture.push({{x:(42+i)*TILE+8,y:(rows-6)*TILE,w:TILE-16,h:TILE,type:'chair',color:'#8B7355'}});
    furniture.push({{x:62*TILE,y:(rows-8)*TILE,w:3*TILE,h:4*TILE,type:'fridge',color:'#F0F0F0'}});
    furniture.push({{x:66*TILE,y:(rows-6)*TILE,w:4*TILE,h:2*TILE,type:'stove',color:'#444',onFire:true}});
    furniture.push({{x:82*TILE,y:(rows-6)*TILE,w:TILE,h:2*TILE,type:'toilet',color:'#F5F5F5'}});
    furniture.push({{x:88*TILE,y:(rows-8)*TILE,w:3*TILE,h:4*TILE,type:'shower',color:'#87CEEB'}});
    furniture.push({{x:102*TILE,y:(rows-5)*TILE,w:5*TILE,h:2*TILE,type:'sofa',color:'#D2691E'}});
    furniture.push({{x:102*TILE,y:(rows-8)*TILE,w:4*TILE,h:3*TILE,type:'tv',color:'#222'}});
    furniture.push({{x:110*TILE,y:(rows-7)*TILE,w:5*TILE,h:3*TILE,type:'window',color:'#87CEEB'}});
    furniture.push({{x:130*TILE,y:(rows-5)*TILE,w:6*TILE,h:2*TILE,type:'bed',color:'#9370DB'}});
    furniture.push({{x:137*TILE,y:(rows-8)*TILE,w:4*TILE,h:3*TILE,type:'wardrobe',color:'#8B6914'}});

    collectibles=[];
    for(var i=0;i<15;i++) collectibles.push({{x:150+Math.random()*140*TILE,y:150+Math.random()*250,w:16,h:16,type:'coin',collected:false}});
    for(var i=0;i<5;i++) collectibles.push({{x:400+i*300+Math.random()*100,y:(rows-5)*TILE-20,w:16,h:16,type:'heart',collected:false}});
    for(var i=0;i<3;i++) collectibles.push({{x:500+i*500,y:(rows-5)*TILE-25,w:20,h:20,type:'sache',collected:false}});
    collectibles.push({{x:80*TILE,y:(rows-6)*TILE-20,w:20,h:20,type:'extra_life',collected:false}});

    enemies=[];
    var groundY=(rows-3)*TILE-24;
    enemies.push({{x:25*TILE,y:groundY,w:24,h:24,vx:1,vy:0,hp:1,type:'cockroach',alive:true,grounded:false}});
    enemies.push({{x:35*TILE,y:groundY,w:20,h:20,vx:1.5,vy:0,hp:1,type:'spider',alive:true,grounded:false}});
    enemies.push({{x:50*TILE,y:groundY-60,w:20,h:20,vx:1.2,vy:0,hp:1,type:'fly',alive:true,grounded:false,flying:true}});
    enemies.push({{x:70*TILE,y:groundY,w:24,h:24,vx:-1,vy:0,hp:1,type:'rat',alive:true,grounded:false}});
    enemies.push({{x:85*TILE,y:groundY,w:20,h:20,vx:1,vy:0,hp:1,type:'cockroach',alive:true,grounded:false}});
    enemies.push({{x:110*TILE,y:groundY,w:24,h:24,vx:-1.5,vy:0,hp:2,type:'spider',alive:true,grounded:false,hp:2}});
    enemies.push({{x:120*TILE,y:groundY-40,w:20,h:20,vx:1,vy:0,hp:1,type:'fly',alive:true,grounded:false,flying:true}});
    enemies.push({{x:135*TILE,y:groundY,w:24,h:24,vx:-1,vy:0,hp:1,type:'rat',alive:true,grounded:false}});

    boss={{x:148*TILE,y:(rows-7)*TILE,w:96,h:96,hp:8,maxHp:8,vx:-0.5,vy:0,alive:true,phase:0,phaseTimer:0,attackTimer:0,color:'#4a3728',name:'Sr. Odair',big:true,grounded:false}};

    player.x=2*TILE; player.y=(rows-4)*TILE-player.h;
    player.vx=0; player.vy=0; player.hp=player.maxHp;
    player.grounded=false; player.facing=1;
    player.powerActive=false; player.invincible=120; player.jumpCount=0;
    cameraX=0; projectiles=[]; particles=[]; game.time=180;
}}

function initLevel(cols,rows){{ levelWidth=cols*TILE; mapTiles=[]; for(var r=0;r<rows;r++){{ mapTiles[r]=[]; for(var c=0;c<cols;c++) mapTiles[r][c]=0; }} for(var c=0;c<cols;c++){{ mapTiles[rows-1][c]=1; mapTiles[rows-2][c]=1; }} furniture=[]; collectibles=[]; enemies=[]; }}
function addPlat(c,r,w){{ for(var i=0;i<w;i++) if(mapTiles[r]&&c+i<mapTiles[r].length) mapTiles[r][c+i]=2; }}
function addWall(c,r1,r2){{ for(var r=r1;r<=r2;r++) if(mapTiles[r]&&c<mapTiles[r].length) mapTiles[r][c]=1; }}
function addCoins(x,y,count,spacing){{ for(var i=0;i<count;i++) collectibles.push({{x:x+i*spacing,y:y,w:16,h:16,type:'coin',collected:false}}); }}
function addHeart(x,y){{ collectibles.push({{x:x,y:y,w:16,h:16,type:'heart',collected:false}}); }}
function addSache(x,y){{ collectibles.push({{x:x,y:y,w:20,h:20,type:'sache',collected:false}}); }}
function addExtraLife(x,y){{ collectibles.push({{x:x,y:y,w:20,h:20,type:'extra_life',collected:false}}); }}
function spawnPlayer(rows,startCol){{ player.x=startCol*TILE; player.y=(rows-4)*TILE-player.h; player.vx=0; player.vy=0; player.hp=player.maxHp; player.grounded=false; player.facing=1; player.powerActive=false; player.invincible=60; player.jumpCount=0; cameraX=0; projectiles=[]; particles=[]; }}
function makeBoss(cols,rows,L,big){{ var bw=big?120:64, bh=big?140:64; boss={{x:(cols-8)*TILE,y:(rows-(big?8:6))*TILE,w:bw,h:bh,hp:L.boss_hp,maxHp:L.boss_hp,vx:-1,vy:0,alive:true,phase:0,phaseTimer:0,attackTimer:0,color:L.color,name:L.boss_name,big:big||false,grounded:false}}; }}

function buildLevel2(){{
    var L=LEVELS[1], rows=TILE_ROWS, cols=140;
    initLevel(cols,rows);
    for(var c=10;c<35;c++){{ mapTiles[rows-2][c]=2; mapTiles[rows-3][c]=2; }}
    addWall(35,rows-7,rows-3); mapTiles[rows-4][35]=0; mapTiles[rows-3][35]=0;
    addPlat(38,rows-6,8); addPlat(50,rows-8,6); addPlat(60,rows-5,10);
    addPlat(45,rows-10,4); addPlat(55,rows-12,5);
    addWall(70,rows-9,rows-3); addPlat(73,rows-7,6); addPlat(82,rows-5,8);
    addWall(90,rows-7,rows-3); mapTiles[rows-4][90]=0; mapTiles[rows-3][90]=0;
    addPlat(93,rows-9,5); addPlat(100,rows-6,7);
    addWall(107,rows-10,rows-3); mapTiles[rows-4][107]=0; mapTiles[rows-5][107]=0; mapTiles[rows-3][107]=0;
    addPlat(110,rows-8,8); addPlat(120,rows-5,6); addPlat(115,rows-11,4);
    for(var c=125;c<cols-5;c++) mapTiles[rows-2][c]=2;
    addCoins(5*TILE,(rows-5)*TILE,5,40); addCoins(40*TILE,(rows-7)*TILE,4,35);
    addCoins(52*TILE,(rows-9)*TILE,3,30); addCoins(62*TILE,(rows-6)*TILE,5,35);
    addCoins(75*TILE,(rows-8)*TILE,4,30); addCoins(95*TILE,(rows-10)*TILE,3,35);
    addCoins(112*TILE,(rows-9)*TILE,4,30); addCoins(128*TILE,(rows-5)*TILE,6,30);
    addHeart(50*TILE,(rows-9)*TILE); addHeart(95*TILE,(rows-11)*TILE);
    addSache(75*TILE,(rows-9)*TILE-20);
    addExtraLife(115*TILE,(rows-12)*TILE-10);
    var gy=(rows-3)*TILE-24;
    enemies.push({{x:15*TILE,y:gy,w:24,h:24,vx:1,vy:0,hp:1,type:'rat',alive:true,grounded:false}});
    enemies.push({{x:25*TILE,y:gy,w:20,h:20,vx:-1.5,vy:0,hp:1,type:'cockroach',alive:true,grounded:false}});
    enemies.push({{x:42*TILE,y:(rows-7)*TILE-24,w:20,h:20,vx:1,vy:0,hp:1,type:'spider',alive:true,grounded:false}});
    enemies.push({{x:55*TILE,y:(rows-13)*TILE,w:20,h:20,vx:1.2,vy:0,hp:1,type:'fly',alive:true,grounded:false,flying:true}});
    enemies.push({{x:63*TILE,y:gy,w:24,h:24,vx:-1,vy:0,hp:1,type:'rat',alive:true,grounded:false}});
    enemies.push({{x:78*TILE,y:(rows-8)*TILE-24,w:20,h:20,vx:1.5,vy:0,hp:2,type:'spider',alive:true,grounded:false}});
    enemies.push({{x:85*TILE,y:gy,w:24,h:24,vx:1,vy:0,hp:1,type:'cockroach',alive:true,grounded:false}});
    enemies.push({{x:98*TILE,y:(rows-7)*TILE-24,w:20,h:20,vx:-1,vy:0,hp:1,type:'rat',alive:true,grounded:false}});
    makeBoss(cols,rows,L,false);
    spawnPlayer(rows,3);
}}

function buildLevel3(){{
    var L=LEVELS[2], rows=TILE_ROWS, cols=150;
    initLevel(cols,rows);
    addPlat(8,rows-5,6); addPlat(16,rows-7,5); addPlat(24,rows-4,7);
    addPlat(14,rows-10,4); addPlat(33,rows-8,5);
    addPlat(40,rows-5,8); addPlat(50,rows-7,4); addPlat(56,rows-10,6);
    addPlat(64,rows-5,5); addPlat(70,rows-8,7); addPlat(78,rows-6,4);
    addPlat(45,rows-12,3); addPlat(60,rows-13,4);
    addPlat(84,rows-4,8); addPlat(94,rows-7,5); addPlat(101,rows-9,6);
    addPlat(109,rows-5,7); addPlat(118,rows-8,5);
    addPlat(110,rows-12,3); addPlat(125,rows-10,4);
    addPlat(125,rows-5,8); addPlat(135,rows-7,5);
    for(var c=135;c<cols-5;c++) mapTiles[rows-2][c]=2;
    addCoins(10*TILE,(rows-6)*TILE,4,35); addCoins(18*TILE,(rows-8)*TILE,3,30);
    addCoins(35*TILE,(rows-9)*TILE,4,30); addCoins(42*TILE,(rows-6)*TILE,5,35);
    addCoins(52*TILE,(rows-8)*TILE,3,30); addCoins(58*TILE,(rows-11)*TILE,4,25);
    addCoins(66*TILE,(rows-6)*TILE,3,35); addCoins(72*TILE,(rows-9)*TILE,4,30);
    addCoins(86*TILE,(rows-5)*TILE,5,35); addCoins(96*TILE,(rows-8)*TILE,3,30);
    addCoins(103*TILE,(rows-10)*TILE,4,25); addCoins(111*TILE,(rows-6)*TILE,5,35);
    addCoins(127*TILE,(rows-6)*TILE,5,35); addCoins(137*TILE,(rows-8)*TILE,3,30);
    addHeart(45*TILE,(rows-13)*TILE); addHeart(110*TILE,(rows-13)*TILE);
    addSache(60*TILE,(rows-14)*TILE-10); addSache(125*TILE,(rows-11)*TILE-10);
    addExtraLife(94*TILE,(rows-8)*TILE-10);
    var gy=(rows-3)*TILE-24;
    enemies.push({{x:12*TILE,y:(rows-6)*TILE-24,w:20,h:20,vx:1,vy:0,hp:1,type:'fly',alive:true,grounded:false,flying:true}});
    enemies.push({{x:26*TILE,y:gy,w:24,h:24,vx:1,vy:0,hp:1,type:'rat',alive:true,grounded:false}});
    enemies.push({{x:36*TILE,y:(rows-9)*TILE-24,w:20,h:20,vx:-1.2,vy:0,hp:1,type:'fly',alive:true,grounded:false,flying:true}});
    enemies.push({{x:42*TILE,y:gy,w:24,h:24,vx:1.5,vy:0,hp:1,type:'cockroach',alive:true,grounded:false}});
    enemies.push({{x:52*TILE,y:(rows-8)*TILE-24,w:20,h:20,vx:1,vy:0,hp:1,type:'spider',alive:true,grounded:false}});
    enemies.push({{x:66*TILE,y:gy,w:20,h:20,vx:-1,vy:0,hp:1,type:'rat',alive:true,grounded:false}});
    enemies.push({{x:74*TILE,y:(rows-9)*TILE-24,w:20,h:20,vx:1.2,vy:0,hp:1,type:'fly',alive:true,grounded:false,flying:true}});
    enemies.push({{x:86*TILE,y:gy,w:24,h:24,vx:1,vy:0,hp:2,type:'cockroach',alive:true,grounded:false}});
    enemies.push({{x:102*TILE,y:(rows-10)*TILE-24,w:20,h:20,vx:-1,vy:0,hp:1,type:'fly',alive:true,grounded:false,flying:true}});
    enemies.push({{x:112*TILE,y:gy,w:24,h:24,vx:1.5,vy:0,hp:1,type:'rat',alive:true,grounded:false}});
    makeBoss(cols,rows,L,false);
    spawnPlayer(rows,3);
}}

function buildLevel4(){{
    var L=LEVELS[3], rows=TILE_ROWS, cols=140;
    initLevel(cols,rows);
    for(var c=15;c<30;c++){{ mapTiles[rows-2][c]=7; mapTiles[rows-3][c]=7; }}
    addWall(30,rows-8,rows-3); mapTiles[rows-4][30]=0; mapTiles[rows-3][30]=0;
    addPlat(33,rows-6,6); addPlat(42,rows-8,5); addPlat(50,rows-5,7);
    addPlat(38,rows-11,3); addPlat(55,rows-10,4);
    addWall(58,rows-10,rows-3); mapTiles[rows-4][58]=0; mapTiles[rows-5][58]=0; mapTiles[rows-3][58]=0;
    addPlat(61,rows-7,6); addPlat(70,rows-5,8);
    addWall(79,rows-8,rows-3); mapTiles[rows-4][79]=0; mapTiles[rows-3][79]=0;
    addPlat(82,rows-6,5); addPlat(90,rows-8,6);
    addPlat(87,rows-12,4); addPlat(98,rows-5,7);
    addWall(105,rows-9,rows-3); mapTiles[rows-4][105]=0; mapTiles[rows-5][105]=0; mapTiles[rows-3][105]=0;
    addPlat(108,rows-7,6); addPlat(118,rows-5,5);
    for(var c=118;c<cols-5;c++) mapTiles[rows-2][c]=7;
    furniture.push({{x:16*TILE,y:(rows-5)*TILE,w:5*TILE,h:2*TILE,type:'sofa',color:'#4a2a4a'}});
    furniture.push({{x:16*TILE,y:(rows-8)*TILE,w:3*TILE,h:2*TILE,type:'tv',color:'#111'}});
    furniture.push({{x:50*TILE,y:(rows-6)*TILE,w:3*TILE,h:TILE,type:'table',color:'#5a3a2a'}});
    furniture.push({{x:70*TILE,y:(rows-6)*TILE,w:5*TILE,h:2*TILE,type:'bed',color:'#6a2a6a'}});
    furniture.push({{x:98*TILE,y:(rows-6)*TILE,w:4*TILE,h:2*TILE,type:'sofa',color:'#3a2a5a'}});
    addCoins(5*TILE,(rows-5)*TILE,5,40); addCoins(35*TILE,(rows-7)*TILE,4,30);
    addCoins(44*TILE,(rows-9)*TILE,3,30); addCoins(52*TILE,(rows-6)*TILE,5,35);
    addCoins(63*TILE,(rows-8)*TILE,4,30); addCoins(72*TILE,(rows-6)*TILE,5,35);
    addCoins(84*TILE,(rows-7)*TILE,4,30); addCoins(92*TILE,(rows-9)*TILE,3,30);
    addCoins(100*TILE,(rows-6)*TILE,5,35); addCoins(110*TILE,(rows-8)*TILE,4,30);
    addCoins(120*TILE,(rows-5)*TILE,5,35);
    addHeart(38*TILE,(rows-12)*TILE); addHeart(87*TILE,(rows-13)*TILE);
    addSache(55*TILE,(rows-11)*TILE-10);
    addExtraLife(108*TILE,(rows-8)*TILE-10);
    var gy=(rows-3)*TILE-24;
    enemies.push({{x:18*TILE,y:gy,w:24,h:24,vx:1,vy:0,hp:1,type:'rat',alive:true,grounded:false}});
    enemies.push({{x:25*TILE,y:gy,w:20,h:20,vx:-1,vy:0,hp:1,type:'cockroach',alive:true,grounded:false}});
    enemies.push({{x:36*TILE,y:(rows-7)*TILE-24,w:20,h:20,vx:1.2,vy:0,hp:1,type:'spider',alive:true,grounded:false}});
    enemies.push({{x:45*TILE,y:(rows-10)*TILE,w:20,h:20,vx:1,vy:0,hp:1,type:'fly',alive:true,grounded:false,flying:true}});
    enemies.push({{x:53*TILE,y:gy,w:24,h:24,vx:-1.5,vy:0,hp:1,type:'rat',alive:true,grounded:false}});
    enemies.push({{x:64*TILE,y:(rows-8)*TILE-24,w:20,h:20,vx:1,vy:0,hp:2,type:'spider',alive:true,grounded:false}});
    enemies.push({{x:73*TILE,y:gy,w:24,h:24,vx:1,vy:0,hp:1,type:'cockroach',alive:true,grounded:false}});
    enemies.push({{x:84*TILE,y:(rows-7)*TILE-24,w:20,h:20,vx:-1.2,vy:0,hp:1,type:'fly',alive:true,grounded:false,flying:true}});
    enemies.push({{x:92*TILE,y:gy,w:24,h:24,vx:1,vy:0,hp:1,type:'rat',alive:true,grounded:false}});
    enemies.push({{x:110*TILE,y:(rows-8)*TILE-24,w:20,h:20,vx:1.5,vy:0,hp:1,type:'spider',alive:true,grounded:false}});
    makeBoss(cols,rows,L,false);
    spawnPlayer(rows,3);
}}

function buildLevel5(){{
    var L=LEVELS[4], rows=TILE_ROWS, cols=145;
    initLevel(cols,rows);
    addPlat(8,rows-5,7); addPlat(17,rows-7,5); addPlat(25,rows-4,8);
    addPlat(15,rows-10,4); addPlat(35,rows-8,6);
    addPlat(43,rows-5,7); addPlat(52,rows-9,5); addPlat(60,rows-6,6);
    addPlat(48,rows-12,3); addPlat(57,rows-13,4);
    addPlat(68,rows-4,8); addPlat(78,rows-7,5); addPlat(85,rows-9,6);
    addPlat(93,rows-5,7); addPlat(102,rows-8,5);
    addPlat(88,rows-12,3); addPlat(108,rows-11,4);
    addPlat(109,rows-5,7); addPlat(120,rows-7,6);
    for(var c=128;c<cols-5;c++) mapTiles[rows-2][c]=2;
    addCoins(10*TILE,(rows-6)*TILE,5,35); addCoins(19*TILE,(rows-8)*TILE,3,30);
    addCoins(27*TILE,(rows-5)*TILE,5,35); addCoins(37*TILE,(rows-9)*TILE,4,30);
    addCoins(45*TILE,(rows-6)*TILE,5,35); addCoins(54*TILE,(rows-10)*TILE,3,30);
    addCoins(62*TILE,(rows-7)*TILE,4,30); addCoins(70*TILE,(rows-5)*TILE,5,35);
    addCoins(80*TILE,(rows-8)*TILE,3,30); addCoins(87*TILE,(rows-10)*TILE,4,25);
    addCoins(95*TILE,(rows-6)*TILE,5,35); addCoins(104*TILE,(rows-9)*TILE,3,30);
    addCoins(111*TILE,(rows-6)*TILE,5,35); addCoins(122*TILE,(rows-8)*TILE,4,30);
    addCoins(130*TILE,(rows-5)*TILE,5,35);
    addHeart(48*TILE,(rows-13)*TILE); addHeart(108*TILE,(rows-12)*TILE);
    addSache(57*TILE,(rows-14)*TILE-10); addSache(88*TILE,(rows-13)*TILE-10);
    addExtraLife(120*TILE,(rows-8)*TILE-10);
    var gy=(rows-3)*TILE-24;
    enemies.push({{x:12*TILE,y:(rows-6)*TILE-24,w:20,h:20,vx:1,vy:0,hp:1,type:'spider',alive:true,grounded:false}});
    enemies.push({{x:20*TILE,y:gy,w:24,h:24,vx:1.5,vy:0,hp:1,type:'rat',alive:true,grounded:false}});
    enemies.push({{x:30*TILE,y:gy,w:20,h:20,vx:-1,vy:0,hp:1,type:'cockroach',alive:true,grounded:false}});
    enemies.push({{x:38*TILE,y:(rows-9)*TILE-24,w:20,h:20,vx:1.2,vy:0,hp:1,type:'fly',alive:true,grounded:false,flying:true}});
    enemies.push({{x:46*TILE,y:gy,w:24,h:24,vx:1,vy:0,hp:1,type:'rat',alive:true,grounded:false}});
    enemies.push({{x:54*TILE,y:(rows-10)*TILE-24,w:20,h:20,vx:-1,vy:0,hp:2,type:'spider',alive:true,grounded:false}});
    enemies.push({{x:63*TILE,y:gy,w:24,h:24,vx:1.5,vy:0,hp:1,type:'cockroach',alive:true,grounded:false}});
    enemies.push({{x:72*TILE,y:(rows-8)*TILE-24,w:20,h:20,vx:1,vy:0,hp:1,type:'fly',alive:true,grounded:false,flying:true}});
    enemies.push({{x:80*TILE,y:gy,w:20,h:20,vx:-1.5,vy:0,hp:1,type:'rat',alive:true,grounded:false}});
    enemies.push({{x:95*TILE,y:gy,w:24,h:24,vx:1,vy:0,hp:1,type:'spider',alive:true,grounded:false}});
    enemies.push({{x:103*TILE,y:(rows-9)*TILE-24,w:20,h:20,vx:1.2,vy:0,hp:1,type:'fly',alive:true,grounded:false,flying:true}});
    makeBoss(cols,rows,L,false);
    spawnPlayer(rows,3);
}}

function buildLevel6(){{
    var L=LEVELS[5], rows=TILE_ROWS, cols=140;
    initLevel(cols,rows);
    for(var c=10;c<25;c++){{ mapTiles[rows-2][c]=5; mapTiles[rows-3][c]=6; }}
    addWall(25,rows-9,rows-3); mapTiles[rows-4][25]=0; mapTiles[rows-5][25]=0; mapTiles[rows-3][25]=0;
    addPlat(28,rows-6,6); addPlat(36,rows-8,5); addPlat(44,rows-5,7);
    addPlat(33,rows-11,3); addPlat(50,rows-10,4);
    addWall(55,rows-10,rows-3); mapTiles[rows-4][55]=0; mapTiles[rows-5][55]=0; mapTiles[rows-3][55]=0;
    addPlat(58,rows-7,6); addPlat(66,rows-5,8);
    addWall(75,rows-9,rows-3); mapTiles[rows-4][75]=0; mapTiles[rows-3][75]=0;
    addPlat(78,rows-6,5); addPlat(85,rows-8,6);
    addPlat(80,rows-12,4); addPlat(92,rows-5,7);
    addWall(100,rows-9,rows-3); mapTiles[rows-4][100]=0; mapTiles[rows-5][100]=0; mapTiles[rows-3][100]=0;
    addPlat(103,rows-7,6); addPlat(112,rows-5,5);
    for(var c=112;c<cols-5;c++) mapTiles[rows-2][c]=5;
    furniture.push({{x:11*TILE,y:(rows-5)*TILE,w:5*TILE,h:3*TILE,type:'sofa',color:'#6a2a8a'}});
    furniture.push({{x:28*TILE,y:(rows-7)*TILE,w:3*TILE,h:TILE,type:'table',color:'#8B4513'}});
    furniture.push({{x:58*TILE,y:(rows-8)*TILE,w:3*TILE,h:3*TILE,type:'wardrobe',color:'#5a3a6a'}});
    furniture.push({{x:66*TILE,y:(rows-6)*TILE,w:4*TILE,h:2*TILE,type:'bed',color:'#8a4a8a'}});
    furniture.push({{x:92*TILE,y:(rows-6)*TILE,w:3*TILE,h:TILE,type:'table',color:'#6B4226'}});
    addCoins(5*TILE,(rows-5)*TILE,4,40); addCoins(30*TILE,(rows-7)*TILE,4,30);
    addCoins(38*TILE,(rows-9)*TILE,3,30); addCoins(46*TILE,(rows-6)*TILE,5,35);
    addCoins(60*TILE,(rows-8)*TILE,4,30); addCoins(68*TILE,(rows-6)*TILE,5,35);
    addCoins(80*TILE,(rows-7)*TILE,4,30); addCoins(87*TILE,(rows-9)*TILE,3,30);
    addCoins(94*TILE,(rows-6)*TILE,5,35); addCoins(105*TILE,(rows-8)*TILE,4,30);
    addCoins(114*TILE,(rows-6)*TILE,5,35);
    addHeart(33*TILE,(rows-12)*TILE); addHeart(80*TILE,(rows-13)*TILE);
    addSache(50*TILE,(rows-11)*TILE-10);
    addExtraLife(103*TILE,(rows-8)*TILE-10);
    var gy=(rows-3)*TILE-24;
    enemies.push({{x:13*TILE,y:gy,w:24,h:24,vx:1,vy:0,hp:1,type:'rat',alive:true,grounded:false}});
    enemies.push({{x:20*TILE,y:gy,w:20,h:20,vx:-1.5,vy:0,hp:1,type:'cockroach',alive:true,grounded:false}});
    enemies.push({{x:32*TILE,y:(rows-7)*TILE-24,w:20,h:20,vx:1,vy:0,hp:1,type:'spider',alive:true,grounded:false}});
    enemies.push({{x:38*TILE,y:(rows-10)*TILE,w:20,h:20,vx:1.2,vy:0,hp:1,type:'fly',alive:true,grounded:false,flying:true}});
    enemies.push({{x:48*TILE,y:gy,w:24,h:24,vx:-1,vy:0,hp:1,type:'rat',alive:true,grounded:false}});
    enemies.push({{x:60*TILE,y:(rows-8)*TILE-24,w:20,h:20,vx:1.5,vy:0,hp:2,type:'spider',alive:true,grounded:false}});
    enemies.push({{x:70*TILE,y:gy,w:24,h:24,vx:1,vy:0,hp:1,type:'cockroach',alive:true,grounded:false}});
    enemies.push({{x:80*TILE,y:(rows-8)*TILE-24,w:20,h:20,vx:-1.2,vy:0,hp:1,type:'fly',alive:true,grounded:false,flying:true}});
    enemies.push({{x:88*TILE,y:gy,w:24,h:24,vx:1,vy:0,hp:1,type:'rat',alive:true,grounded:false}});
    enemies.push({{x:105*TILE,y:(rows-8)*TILE-24,w:20,h:20,vx:1.5,vy:0,hp:1,type:'spider',alive:true,grounded:false}});
    makeBoss(cols,rows,L,false);
    spawnPlayer(rows,3);
}}

function buildLevel7(){{
    var L=LEVELS[6], rows=TILE_ROWS, cols=150;
    initLevel(cols,rows);
    addPlat(8,rows-5,6); addPlat(16,rows-7,5); addPlat(24,rows-4,7);
    addPlat(14,rows-10,4); addPlat(33,rows-8,5);
    addPlat(40,rows-5,8); addPlat(50,rows-7,4); addPlat(56,rows-10,6);
    addPlat(64,rows-5,5); addPlat(70,rows-8,7); addPlat(78,rows-6,4);
    addPlat(45,rows-12,3); addPlat(60,rows-13,4);
    addPlat(84,rows-4,8); addPlat(94,rows-7,5); addPlat(101,rows-9,6);
    addPlat(109,rows-5,7); addPlat(118,rows-8,5);
    addPlat(110,rows-12,3); addPlat(125,rows-10,4);
    addPlat(125,rows-5,8); addPlat(135,rows-7,5);
    for(var c=135;c<cols-5;c++) mapTiles[rows-2][c]=2;
    addCoins(10*TILE,(rows-6)*TILE,4,35); addCoins(18*TILE,(rows-8)*TILE,3,30);
    addCoins(35*TILE,(rows-9)*TILE,4,30); addCoins(42*TILE,(rows-6)*TILE,5,35);
    addCoins(52*TILE,(rows-8)*TILE,3,30); addCoins(58*TILE,(rows-11)*TILE,4,25);
    addCoins(66*TILE,(rows-6)*TILE,3,35); addCoins(72*TILE,(rows-9)*TILE,4,30);
    addCoins(86*TILE,(rows-5)*TILE,5,35); addCoins(96*TILE,(rows-8)*TILE,3,30);
    addCoins(103*TILE,(rows-10)*TILE,4,25); addCoins(111*TILE,(rows-6)*TILE,5,35);
    addCoins(127*TILE,(rows-6)*TILE,5,35); addCoins(137*TILE,(rows-8)*TILE,3,30);
    addHeart(45*TILE,(rows-13)*TILE); addHeart(110*TILE,(rows-13)*TILE);
    addSache(60*TILE,(rows-14)*TILE-10); addSache(125*TILE,(rows-11)*TILE-10);
    addExtraLife(94*TILE,(rows-8)*TILE-10);
    var gy=(rows-3)*TILE-24;
    enemies.push({{x:12*TILE,y:(rows-6)*TILE-24,w:24,h:30,vx:0.8,vy:0,hp:1,type:'xepa',alive:true,grounded:false}});
    enemies.push({{x:26*TILE,y:gy,w:24,h:30,vx:0.8,vy:0,hp:1,type:'xepa',alive:true,grounded:false}});
    enemies.push({{x:36*TILE,y:(rows-9)*TILE-24,w:24,h:30,vx:0.8,vy:0,hp:1,type:'xepa',alive:true,grounded:false}});
    enemies.push({{x:42*TILE,y:gy,w:24,h:30,vx:0.8,vy:0,hp:1,type:'xepa',alive:true,grounded:false}});
    enemies.push({{x:52*TILE,y:(rows-8)*TILE-24,w:24,h:30,vx:0.8,vy:0,hp:1,type:'xepa',alive:true,grounded:false}});
    enemies.push({{x:66*TILE,y:gy,w:24,h:30,vx:0.8,vy:0,hp:1,type:'xepa',alive:true,grounded:false}});
    enemies.push({{x:74*TILE,y:(rows-9)*TILE-24,w:24,h:30,vx:0.8,vy:0,hp:1,type:'xepa',alive:true,grounded:false}});
    enemies.push({{x:86*TILE,y:gy,w:24,h:30,vx:0.8,vy:0,hp:1,type:'xepa',alive:true,grounded:false}});
    enemies.push({{x:102*TILE,y:(rows-10)*TILE-24,w:24,h:30,vx:0.8,vy:0,hp:1,type:'xepa',alive:true,grounded:false}});
    enemies.push({{x:112*TILE,y:gy,w:24,h:30,vx:0.8,vy:0,hp:1,type:'xepa',alive:true,grounded:false}});
    enemies.push({{x:120*TILE,y:(rows-8)*TILE-24,w:24,h:30,vx:0.8,vy:0,hp:1,type:'xepa',alive:true,grounded:false}});
    enemies.push({{x:130*TILE,y:gy,w:24,h:30,vx:0.8,vy:0,hp:1,type:'xepa',alive:true,grounded:false}});
    makeBoss(cols,rows,L,true);
    spawnPlayer(rows,3);
}}

function generateLevel(idx){{
    switch(idx){{
        case 0: buildHouseLevel(); break;
        case 1: buildLevel2(); break;
        case 2: buildLevel3(); break;
        case 3: buildLevel4(); break;
        case 4: buildLevel5(); break;
        case 5: buildLevel6(); break;
        case 6: buildLevel7(); break;
        default: buildLevel2(); break;
    }}
}}

function getCatPower(){{ return CATS[game.selectedCat].power; }}

function activatePower(){{
    if(player.powerCooldown>0) return;
    var cat=CATS[game.selectedCat];
    player.powerActive=true; player.powerTimer=180; player.powerCooldown=300;
    switch(cat.power){{
        case 'Triple Jump':
            player.maxJumps=3;
            spawnParticles(player.x+player.w/2,player.y+player.h,'#ffcc00',12);
            break;
        case 'Float':
            player.vy=-3;
            spawnParticles(player.x+player.w/2,player.y+player.h,'#ff99cc',15);
            break;
        case 'Wall Jump':
            spawnParticles(player.x+player.w/2,player.y+player.h/2,'#9B59B6',15);
            break;
        case 'Dash':
            player.dashTimer=20; player.dashDir=player.facing;
            spawnParticles(player.x+player.w/2,player.y+player.h/2,'#00ff00',20);
            break;
        case 'Fireball':
            projectiles.push({{x:player.x+player.w/2,y:player.y+player.h/3,vx:player.facing*8,vy:0,w:12,h:10,friendly:true,life:60}});
            spawnParticles(player.x+player.w/2,player.y+player.h/3,'#ff4400',10);
            break;
        case 'Shield':
            player.invincible=180;
            spawnParticles(player.x+player.w/2,player.y+player.h/2,'#2980B9',20);
            break;
        case 'Mega Jump':
            player.vy=-16;
            spawnParticles(player.x+player.w/2,player.y+player.h,'#ff8800',20);
            break;
    }}
}}

function rectOverlap(a,b){{ return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y; }}
function getTile(col,row){{
    if(row<0||row>=TILE_ROWS) return 0;
    if(row>=mapTiles.length||col<0||col>=(mapTiles[0]?mapTiles[0].length:0)) return 0;
    return mapTiles[row][col]||0;
}}

function spawnParticles(x,y,color,count){{
    for(var i=0;i<count;i++) particles.push({{x:x,y:y,vx:(Math.random()-0.5)*6,vy:(Math.random()-0.5)*6-2,life:20+Math.random()*20,color:color,size:2+Math.random()*3}});
}}

function growPlayer(){{ game.grown=true; player.w=player.baseW*1.8; player.h=player.baseH*1.8; player.y-=(player.h-player.baseH); }}
function shrinkPlayer(){{ game.grown=false; player.y+=(player.h-player.baseH); player.w=player.baseW; player.h=player.baseH; }}

function updatePlayer(){{
    var speed=player.crouching?1.5:3.5; player.vx=0; var moving=false;
    if(player.crouching&&player.grounded){{
        if(keys['ArrowLeft']||keys['a']){{ player.vx=-speed; player.facing=-1; moving=true; }}
        if(keys['ArrowRight']||keys['d']){{ player.vx=speed; player.facing=1; moving=true; }}
    }} else {{
        if(keys['ArrowLeft']||keys['a']){{ player.vx=-speed; player.facing=-1; moving=true; }}
        if(keys['ArrowRight']||keys['d']){{ player.vx=speed; player.facing=1; moving=true; }}
    }}
    if(player.dashTimer>0){{ player.vx=player.dashDir*12; player.dashTimer--;
        if(player.dashTimer%2===0) spawnParticles(player.x+player.w/2,player.y+player.h/2,'#00ff00',2);
    }}
    var grav=GRAVITY;
    if(player.powerActive&&getCatPower()==='Float'&&!player.grounded) grav=GRAVITY*0.15;
    player.vy+=grav; if(player.vy>12) player.vy=12;
    var newX=player.x+player.vx, newY=player.y+player.vy;
    var colL=Math.floor(newX/TILE), colR=Math.floor((newX+player.w)/TILE);

    player.grounded=false;
    var colL2=Math.floor(player.x/TILE), colR2=Math.floor((player.x+player.w)/TILE);
    var rowB2=Math.floor((player.y+player.h)/TILE);
    if(getTile(colL2,rowB2)>0||getTile(colR2,rowB2)>0){{ player.grounded=true; if(getCatPower()!=='Triple Jump') player.jumpCount=0; }}

    var rowCurT=Math.floor(player.y/TILE), rowCurB=Math.floor((player.y+player.h-1)/TILE);
    var blockedX=false;
    for(var r=rowCurT;r<=rowCurB;r++) for(var c=colL;c<=colR;c++){{ var t=getTile(c,r); if(t===1||t===5||t===7) blockedX=true; }}
    if(!blockedX) player.x=newX; else player.vx=0;

    var blockedY=false;
    var colL3=Math.floor(player.x/TILE), colR3=Math.floor((player.x+player.w)/TILE);
    var rowTN=Math.floor(newY/TILE), rowBN=Math.floor((newY+player.h)/TILE);
    for(var r=rowTN;r<=rowBN;r++) for(var c=colL3;c<=colR3;c++){{ var t=getTile(c,r); if(t===1||t===2||t===5||t===7){{ if(player.vy>0){{ player.y=r*TILE-player.h; player.grounded=true; player.jumpCount=0; }} else player.y=(r+1)*TILE; blockedY=true; break; }} if(blockedY) break; }}
    if(!blockedY) player.y=newY; else player.vy=0;

    player.wallTouchL=false; player.wallTouchR=false; player.wallSliding=false;
    if(!player.grounded){{ var wlCol=Math.floor((player.x-2)/TILE); var wrCol=Math.floor((player.x+player.w+2)/TILE);
        for(var r=Math.floor(player.y/TILE);r<=Math.floor((player.y+player.h)/TILE);r++){{
            if(getTile(wlCol,r)===1||getTile(wlCol,r)===5||getTile(wlCol,r)===7) player.wallTouchL=true;
            if(getTile(wrCol,r)===1||getTile(wrCol,r)===5||getTile(wrCol,r)===7) player.wallTouchR=true;
        }}
        if((player.wallTouchL||player.wallTouchR)&&getCatPower()==='Wall Jump'&&(keys['ArrowLeft']||keys['a']||keys['ArrowRight']||keys['d'])){{
            player.wallSliding=true; if(player.vy>1) player.vy=1;
        }}
    }}

    if(player.x<0) player.x=0;
    if(player.x>levelWidth-player.w) player.x=levelWidth-player.w;
    if(player.y>H+100) playerDie();
    if(player.invincible>0) player.invincible--;
    if(player.powerCooldown>0) player.powerCooldown--;
    if(player.powerActive){{ player.powerTimer--;
        if(player.powerTimer<=0){{ player.powerActive=false;
            if(getCatPower()==='Triple Jump') player.maxJumps=1;
        }}
    }}

    if(player.crouching&&player.grounded){{
        if(moving){{ player.animTimer++; if(player.animTimer>10){{ player.animTimer=0; player.animFrame=(player.animFrame+1)%3; }} player.animState='crouch'; }}
        else{{ player.animFrame=0; player.animState='crouch'; }}
    }} else if(moving&&player.grounded){{ player.animTimer++; if(player.animTimer>8){{ player.animTimer=0; player.animFrame=(player.animFrame+1)%3; }} player.animState='walk'; }}
    else if(!player.grounded) player.animState=player.vy<0?'jump_up':'jump_dn';
    else{{ player.animFrame=0; player.animState='idle'; }}
}}

function playerDie(){{
    spawnParticles(player.x+player.w/2,player.y+player.h/2,'#ff4444',20);
    game.chances--;
    if(game.chances<=0){{ game.state='gameover'; gameOverTimer=120; }}
    else{{ player.hp=player.maxHp; player.x=5*TILE; player.y=(TILE_ROWS-4)*TILE-player.h; player.vx=0; player.vy=0; player.invincible=90; if(game.grown) shrinkPlayer(); }}
}}

function playerHit(dmg){{
    if(player.invincible>0) return;
    if(game.grown){{ shrinkPlayer(); player.invincible=60; spawnParticles(player.x+player.w/2,player.y+player.h/2,'#00ff00',10); return; }}
    player.hp-=dmg; player.invincible=60;
    spawnParticles(player.x+player.w/2,player.y+player.h/2,'#ffff00',8);
    if(player.hp<=0) playerDie();
}}

function updateEnemies(){{
    for(var i=0;i<enemies.length;i++){{
        var e=enemies[i]; if(!e.alive) continue;
        if(e.flying){{
            e.x+=e.vx;
            var baseY=(TILE_ROWS-4)*TILE-60+Math.sin(Date.now()*0.003+i*2)*40;
            e.y=baseY;
            if(e.x<cameraX-50||e.x>cameraX+W+200) e.vx*=-1;
        }} else {{
            e.vy+=GRAVITY; e.x+=e.vx;
            var colL=Math.floor(e.x/TILE), colR=Math.floor((e.x+e.w)/TILE), rowB=Math.floor((e.y+e.h)/TILE);
            if(getTile(colL,rowB)>0||getTile(colR,rowB)>0){{ e.vy=0; e.y=rowB*TILE-e.h; e.grounded=true; }}
            if((getTile(colL,Math.floor(e.y/TILE))>0&&e.vx<0)||(getTile(colR,Math.floor(e.y/TILE))>0&&e.vx>0)) e.vx*=-1;
            if((getTile(colL,rowB+1)===0&&e.vx<0)||(getTile(colR,rowB+1)===0&&e.vx>0)) if(e.grounded) e.vx*=-1;
            e.y+=e.vy;
        }}
        if(e.y>H+100) e.alive=false;
        if(rectOverlap(player,e)&&player.invincible<=0){{
            if(player.vy>0&&player.y+player.h-10<e.y+e.h/2){{ e.hp--; if(e.hp<=0){{ e.alive=false; game.score+=100; }} spawnParticles(e.x+e.w/2,e.y+e.h/2,'#ff8800',10); player.vy=-8; }}
            else playerHit(1);
        }}
    }}
}}

function updateBoss(){{
    if(!boss||!boss.alive) return;
    boss.phaseTimer++; boss.attackTimer++; boss.vy+=GRAVITY;
    var dx=player.x-boss.x;
    var speed=boss.big?0.6:1.5;
    if(Math.abs(dx)<500){{
        boss.vx=dx>0?speed:-speed; boss.x+=boss.vx;
        var rowB=Math.floor((boss.y+boss.h)/TILE);
        var colL=Math.floor(boss.x/TILE), colR=Math.floor((boss.x+boss.w)/TILE);
        if(getTile(colL,rowB)>0||getTile(colR,rowB)>0){{ boss.y=rowB*TILE-boss.h; boss.vy=0; boss.grounded=true; }}
        if(getTile(colL,Math.floor(boss.y/TILE))>0&&boss.vx<0) boss.vx=0;
        if(getTile(colR,Math.floor(boss.y/TILE))>0&&boss.vx>0) boss.vx=0;
        boss.y+=boss.vy;
        var atkRate=boss.big?60:80;
        if(boss.attackTimer>atkRate){{
            boss.attackTimer=0;
            var bvx=dx>0?4:-4;
            projectiles.push({{x:boss.x+boss.w/2,y:boss.y+boss.h/3,vx:bvx,vy:-3,w:12,h:12,friendly:false,life:120}});
            if(boss.big) projectiles.push({{x:boss.x+boss.w/2,y:boss.y+boss.h/3,vx:bvx*0.7,vy:-5,w:12,h:12,friendly:false,life:120}});
            spawnParticles(boss.x+boss.w/2,boss.y+boss.h/2,boss.color,5);
        }}
    }}
    if(rectOverlap(player,boss)&&player.invincible<=0) playerHit(1);
    for(var i=projectiles.length-1;i>=0;i--){{ var p=projectiles[i]; if(!p.friendly&&rectOverlap(player,p)){{ playerHit(1); projectiles.splice(i,1); }} }}
}}

function updateProjectiles(){{
    for(var i=projectiles.length-1;i>=0;i--){{
        var p=projectiles[i]; p.x+=p.vx; p.y+=p.vy; p.life--;
        if(getTile(Math.floor(p.x/TILE),Math.floor(p.y/TILE))===1){{ projectiles.splice(i,1); continue; }}
        if(p.life<=0){{ projectiles.splice(i,1); continue; }}
        if(p.friendly&&boss&&boss.alive&&rectOverlap(p,boss)){{
            boss.hp--; spawnParticles(p.x,p.y,'#ff0000',8); projectiles.splice(i,1);
            if(boss.hp<=0){{ boss.alive=false; game.score+=2000; spawnParticles(boss.x+boss.w/2,boss.y+boss.h/2,'#ff00ff',40); game.state='levelcomplete'; levelCompleteTimer=150; game.levelsUnlocked[Math.min(game.currentLevel+1,6)]=true; }}
        }}
    }}
}}

function updateCollectibles(){{
    for(var i=0;i<collectibles.length;i++){{
        var c=collectibles[i]; if(c.collected) continue;
        if(rectOverlap(player,c)){{
            c.collected=true;
            if(c.type==='coin'){{ game.coins++; game.score+=10; spawnParticles(c.x,c.y,'#ffcc00',5); }}
            else if(c.type==='heart'){{ if(player.hp<player.maxHp) player.hp++; game.lives=Math.min(game.lives+1,game.maxLives); spawnParticles(c.x,c.y,'#ff4444',8); }}
            else if(c.type==='sache'){{ if(!game.grown) growPlayer(); spawnParticles(c.x,c.y,'#00ff00',10); }}
            else if(c.type==='extra_life'){{ game.chances=Math.min(game.chances+1,5); spawnParticles(c.x,c.y,'#00ccff',12); }}
        }}
    }}
}}

function updateParticles(){{
    for(var i=particles.length-1;i>=0;i--){{ var p=particles[i]; p.x+=p.vx; p.y+=p.vy; p.vy+=0.1; p.life--; p.size*=0.97; if(p.life<=0) particles.splice(i,1); }}
}}

function drawSprite(animState,x,y,w,h,facing){{
    var cat=CATS[game.selectedCat];
    if(!player.sheetReady||!processedSheets[cat.name]){{
        X.fillStyle=cat.color; X.fillRect(x,y,w,h); return;
    }}
    var sheet=processedSheets[cat.name];
    var frames=cat.frames;
    var frameName=animState==='walk'?['walk1','walk2','walk3'][player.animFrame%3]:animState;
    var f=frames[frameName]||frames['idle'];
    X.save();
    X.translate(x+w/2,y+h/2);
    X.scale(facing,1);
    X.drawImage(sheet,f.x,f.y,f.w,f.h,-w/2,-h/2,w,h);
    X.restore();
}}

function drawFurniture(){{
    X.save(); X.translate(-cameraX,0);
    for(var i=0;i<furniture.length;i++){{
        var f=furniture[i];
        if(f.x+f.w<cameraX-50||f.x>cameraX+W+50) continue;
        X.fillStyle=f.color;
        switch(f.type){{
            case 'sofa': X.fillRect(f.x,f.y,f.w,f.h); X.fillStyle='#6B3410'; X.fillRect(f.x,f.y,f.w,TILE/3); X.fillRect(f.x,f.y+f.h-8,f.w,8); X.fillRect(f.x,f.y,12,f.h); X.fillRect(f.x+f.w-12,f.y,12,f.h); break;
            case 'tv': X.fillStyle='#111'; X.fillRect(f.x,f.y,f.w,f.h); X.fillStyle='#333'; X.fillRect(f.x+4,f.y+4,f.w-8,f.h-10); X.fillStyle='#0af'; X.fillRect(f.x+4,f.y+4,f.w-8,f.h-10); X.fillStyle='#444'; X.fillRect(f.x+f.w/3,f.y+f.h-2,f.w/3,4); break;
            case 'table': case 'dtable': X.fillRect(f.x,f.y,f.w,8); X.fillRect(f.x+4,f.y+8,6,f.h-8); X.fillRect(f.x+f.w-10,f.y+8,6,f.h-8); break;
            case 'chair': X.fillRect(f.x,f.y,f.w,f.h); X.fillStyle='#6B5335'; X.fillRect(f.x+2,f.y-12,f.w-4,14); break;
            case 'fridge': X.fillRect(f.x,f.y,f.w,f.h); X.strokeStyle='#ccc'; X.lineWidth=1; X.strokeRect(f.x+3,f.y+3,f.w-6,f.h/2-4); X.strokeRect(f.x+3,f.y+f.h/2+2,f.w-6,f.h/2-5); break;
            case 'stove': X.fillRect(f.x,f.y,f.w,f.h); X.fillStyle='#666'; for(var s=0;s<4;s++){{ X.beginPath(); X.arc(f.x+8+s*(f.w/4),f.y+6,5,0,Math.PI*2); X.fill(); }} if(f.onFire){{ X.fillStyle='#ff4400'; X.beginPath(); X.moveTo(f.x+10,f.y); X.lineTo(f.x+18,f.y-16); X.lineTo(f.x+26,f.y); X.fill(); X.fillStyle='#ffcc00'; X.beginPath(); X.moveTo(f.x+14,f.y); X.lineTo(f.x+18,f.y-10); X.lineTo(f.x+22,f.y); X.fill(); }} break;
            case 'toilet': X.fillRect(f.x+f.w/4,f.y,f.w/2,f.h*0.6); X.beginPath(); X.arc(f.x+f.w/2,f.y+f.h*0.75,f.w*0.45,0,Math.PI*2); X.fill(); break;
            case 'shower': X.fillStyle='#B0C4DE'; X.fillRect(f.x,f.y,f.w,f.h); X.strokeStyle='#87CEEB'; X.lineWidth=2; X.strokeRect(f.x+2,f.y+2,f.w-4,f.h-4); break;
            case 'bed': X.fillRect(f.x,f.y,f.w,f.h); X.fillStyle='#E6E6FA'; X.fillRect(f.x+4,f.y+4,20,f.h-8); X.fillStyle='#7B68EE'; X.fillRect(f.x,f.y+f.h-6,f.w,6); break;
            case 'wardrobe': X.fillRect(f.x,f.y,f.w,f.h); X.strokeStyle='#6B4226'; X.lineWidth=2; X.strokeRect(f.x+3,f.y+3,f.w/2-5,f.h-6); X.strokeRect(f.x+f.w/2+2,f.y+3,f.w/2-5,f.h-6); break;
            case 'window': X.fillStyle='#87CEEB'; X.fillRect(f.x,f.y,f.w,f.h); X.strokeStyle='#F5F5DC'; X.lineWidth=3; X.strokeRect(f.x,f.y,f.w,f.h); X.beginPath(); X.moveTo(f.x+f.w/2,f.y); X.lineTo(f.x+f.w/2,f.y+f.h); X.moveTo(f.x,f.y+f.h/2); X.lineTo(f.x+f.w,f.y+f.h/2); X.stroke(); break;
        }}
    }}
    X.restore();
}}

function drawHouseBG(){{
    var grad=X.createLinearGradient(0,0,0,H);
    grad.addColorStop(0,'#5BB8F5'); grad.addColorStop(0.5,'#87CEEB'); grad.addColorStop(0.7,'#B0E0E6'); grad.addColorStop(1,'#8B6B4A');
    X.fillStyle=grad; X.fillRect(0,0,W,H);
    for(var cl=0;cl<6;cl++){{ X.fillStyle='rgba(255,255,255,0.4)'; var cx2=(cl*200+50-cameraX*0.2)%1200-100; X.beginPath(); X.ellipse(cx2,60+cl*15,40+cl*10,15+cl*3,0,0,Math.PI*2); X.fill(); X.beginPath(); X.ellipse(cx2+30,55+cl*15,30+cl*8,12+cl*2,0,0,Math.PI*2); X.fill(); }}
    X.fillStyle='#228B22'; X.fillRect(0,(TILE_ROWS-3)*TILE,W,3*TILE);
    X.fillStyle='#32CD32';
    for(var g=0;g<40;g++){{ var gx=(g*80+10)%W; X.beginPath(); X.moveTo(gx,(TILE_ROWS-3)*TILE); X.lineTo(gx+6,(TILE_ROWS-3)*TILE-8-Math.sin(g*0.7)*5); X.lineTo(gx+12,(TILE_ROWS-3)*TILE); X.fill(); }}
    X.save(); X.translate(-cameraX,0);
    X.fillStyle='#FFD700'; X.beginPath(); X.arc(100,80,40,0,Math.PI*2); X.fill();
    X.fillStyle='#FFF8DC'; X.beginPath(); X.arc(98,78,35,0,Math.PI*2); X.fill();
    for(var r2=0;r2<8;r2++){{ X.strokeStyle='#DAA520'; X.lineWidth=2; X.beginPath(); X.arc(100,80,42+r2*6,0,Math.PI*2); X.stroke(); }}
    var houseX=8*TILE, houseY=3*TILE;
    X.fillStyle='#D2691E'; X.fillRect(houseX,houseY,8*TILE,(TILE_ROWS-5)*TILE-houseY);
    X.fillStyle='#C4721E'; X.fillRect(houseX+2,houseY+2,8*TILE-4,(TILE_ROWS-5)*TILE-houseY-2);
    for(var br=0;br<8;br++){{ X.fillStyle='rgba(139,69,19,0.15)'; X.fillRect(houseX,houseY+br*((TILE_ROWS-5)*TILE-houseY)/8,8*TILE,3); }}
    X.fillStyle='#8B0000'; X.beginPath(); X.moveTo(houseX-16,houseY); X.lineTo(houseX+4*TILE,houseY-2*TILE); X.lineTo(houseX+8*TILE+16,houseY); X.closePath(); X.fill();
    X.fillStyle='#A00000'; X.beginPath(); X.moveTo(houseX-12,houseY+2); X.lineTo(houseX+4*TILE,houseY-2*TILE+6); X.lineTo(houseX+8*TILE+12,houseY+2); X.closePath(); X.fill();
    X.fillStyle='#654321'; X.fillRect(houseX+5*TILE,(TILE_ROWS-8)*TILE,2*TILE,3*TILE);
    X.strokeStyle='#FFD700'; X.lineWidth=2; X.strokeRect(houseX+5*TILE+4,(TILE_ROWS-8)*TILE+4,2*TILE-8,3*TILE-8);
    X.fillStyle='#8B6914'; X.beginPath(); X.arc(houseX+5*TILE+2*TILE-12,(TILE_ROWS-6)*TILE,4,0,Math.PI*2); X.fill();
    X.font='bold 14px Courier New'; X.textAlign='center'; X.fillStyle='#FFFFFF'; X.strokeStyle='#000'; X.lineWidth=3;
    X.strokeText('Casa de Rachel',houseX+4*TILE,houseY-2*TILE-10);
    X.fillText('Casa de Rachel',houseX+4*TILE,houseY-2*TILE-10);
    X.fillStyle='#DAA520';
    for(var wi=0;wi<3;wi++){{ var wx=houseX+TILE+wi*3*TILE; X.fillRect(wx,houseY+TILE,2*TILE,2*TILE); X.fillStyle='#87CEEB'; X.fillRect(wx+4,houseY+TILE+4,2*TILE-8,2*TILE-8); X.strokeStyle='#F5F5DC'; X.lineWidth=2; X.strokeRect(wx,houseY+TILE,2*TILE,2*TILE); X.beginPath(); X.moveTo(wx+TILE,houseY+TILE); X.lineTo(wx+TILE,houseY+3*TILE); X.stroke(); X.beginPath(); X.moveTo(wx,houseY+2*TILE); X.lineTo(wx+2*TILE,houseY+2*TILE); X.stroke(); X.fillStyle='#DAA520'; }}
    X.restore();
}}

function drawTitle(){{
    var t=titleTimer;
    X.clearRect(0,0,W,H);
    if(introPlaying&&introVid&&introVid.readyState>=2){{
        var vw=introVid.videoWidth, vh=introVid.videoHeight;
        var scale=Math.max(W/vw,H/vh);
        var dw=vw*scale, dh=vh*scale;
        X.drawImage(introVid,(W-dw)/2,(H-dh)/2,dw,dh);
        X.fillStyle='rgba(0,0,0,0.4)'; X.fillRect(0,0,W,H);
    }} else {{
        X.fillStyle='#0d0520'; X.fillRect(0,0,W,H);
    }}
    X.font='bold 48px Courier New'; X.textAlign='center';
    X.strokeStyle='#000'; X.lineWidth=4; X.strokeText('GATAIADA',W/2,H/2-40);
    X.fillStyle='#ff99cc'; X.fillText('GATAIADA',W/2,H/2-40);
    X.font='bold 18px Courier New'; X.fillStyle='#ffcc66'; X.fillText('O Jogo do Plataforma',W/2,H/2);
    X.font='16px Courier New';
    X.fillStyle=(Math.floor(t/30)%2===0)?'#fff':'#ffcc66';
    X.fillText('Pressione ENTER para jogar',W/2,H/2+70);
    X.font='11px Courier New'; X.fillStyle='rgba(255,153,204,0.5)';
    X.fillText('Setas=Mover Z=Pular X=Poder',W/2,H/2+110);
}}

function drawCharSelect(){{
    selectAnimTimer++;
    X.fillStyle='#0d0520'; X.fillRect(0,0,W,H);
    X.font='bold 24px Courier New'; X.textAlign='center'; X.fillStyle='#ff99cc'; X.fillText('ESCOLHA SEU GATO',W/2,35);
    var cardW=105, cardH=155;
    var totalW=CATS.length*(cardW+8)-8;
    var startX=(W-totalW)/2;
    for(var i=0;i<CATS.length;i++){{
        var cx=startX+i*(cardW+8), cy=55, sel=(i===selectIndex), hov=(i===hoverIndex);
        if(sel||hov){{
            X.shadowColor=CATS[i].color; X.shadowBlur=sel?18:12;
        }}
        X.fillStyle=sel?'rgba(255,153,204,0.35)':hov?'rgba(255,255,255,0.12)':'rgba(255,255,255,0.05)';
        X.strokeStyle=sel?'#ff99cc':hov?CATS[i].color:'rgba(255,255,255,0.15)';
        X.lineWidth=sel?3:hov?2:1;
        X.beginPath(); X.roundRect(cx,cy,cardW,cardH,8); X.fill(); X.stroke();
        X.shadowBlur=0;
        X.drawImage(catPortraitImgs[CATS[i].name],cx+12,cy+6,cardW-24,cardW-24);
        X.font='bold 9px Courier New'; X.fillStyle=CATS[i].color; X.fillText(CATS[i].name,cx+cardW/2,cy+95);
        X.font='7px Courier New'; X.fillStyle='#ffcc66'; X.fillText(CATS[i].power,cx+cardW/2,cy+110);
        X.fillStyle='rgba(255,255,255,0.4)'; X.font='6px Courier New'; X.fillText(CATS[i].power_desc,cx+cardW/2,cy+125);
    }}
    var hi=hoverIndex>=0?hoverIndex:selectIndex;
    var cat=CATS[hi];
    var panelY=cardH+68;
    X.fillStyle='rgba(255,255,255,0.06)';
    X.strokeStyle='rgba(255,255,255,0.15)'; X.lineWidth=1;
    X.beginPath(); X.roundRect(startX,panelY,totalW,100,8); X.fill(); X.stroke();
    var animFrame=Math.floor(selectAnimTimer/10)%4;
    var animStates=['idle','walk1','walk2','walk3'];
    var frameName=animStates[animFrame];
    if(processedSheets[cat.name]){{
        var sheet=processedSheets[cat.name];
        var fr=cat.frames[frameName]||cat.frames['idle'];
        var spriteH=80, spriteW=fr.w*(spriteH/fr.h);
        X.drawImage(sheet,fr.x,fr.y,fr.w,fr.h,W/2-spriteW/2,panelY+10,spriteW,spriteH);
    }} else {{
        X.fillStyle=cat.color; X.fillRect(W/2-20,panelY+10,40,80);
    }}
    X.font='bold 14px Courier New'; X.textAlign='center'; X.fillStyle=cat.color;
    X.fillText(cat.name,W/2,panelY+106);
    X.font='11px Courier New'; X.fillStyle='#ffcc66';
    X.fillText(cat.power+': '+cat.power_desc,W/2,panelY+122);
    X.font='12px Courier New'; X.fillStyle=(Math.floor(Date.now()/500)%2===0)?'#fff':'#ffcc66'; X.textAlign='center';
    X.fillText('ENTER selecionar | ← → escolher | Clique',W/2,H-16);
}}

function drawWorldMap(){{
    var t=Date.now();
    var grad=X.createLinearGradient(0,0,0,H);
    grad.addColorStop(0,'#080218'); grad.addColorStop(0.4,'#0d0530'); grad.addColorStop(1,'#1a0a3a');
    X.fillStyle=grad; X.fillRect(0,0,W,H);
    X.fillStyle='#fff';
    for(var s=0;s<60;s++){{ var sx=(s*137+Math.sin(s*0.3)*50)%W; var sy=(s*89+Math.cos(s*0.7)*30)%H; var sb=0.3+Math.sin(t*0.001+s)*0.3; X.globalAlpha=sb; X.fillRect(sx,sy,1.5,1.5); }}
    X.globalAlpha=1;
    for(var i=0;i<4;i++){{ X.fillStyle='rgba(255,255,255,0.015)'; var cx=(i*250+Math.sin(t*0.0003+i)*30)%1100-50; X.beginPath(); X.ellipse(cx,100+i*80,80+i*20,20+i*5,0,0,Math.PI*2); X.fill(); X.beginPath(); X.ellipse(cx+50,95+i*80,60+i*15,16+i*4,0,0,Math.PI*2); X.fill(); }}
    X.font='bold 22px Courier New'; X.textAlign='center';
    X.strokeStyle='rgba(0,0,0,0.5)'; X.lineWidth=4; X.strokeText('MAPA DO MUNDO',W/2,30);
    X.fillStyle='#ffcc66'; X.fillText('MAPA DO MUNDO',W/2,30);
    for(var i=0;i<WORLD_MAP_NODES.length;i++){{ var n=WORLD_MAP_NODES[i]; for(var j=0;j<n.prev.length;j++){{ var pn=WORLD_MAP_NODES[n.prev[j]]; var unlocked=game.levelsUnlocked[i]; X.strokeStyle=unlocked?'rgba(255,204,102,0.6)':'rgba(255,255,255,0.1)'; X.lineWidth=unlocked?3:1; X.setLineDash(unlocked?[]:[5,5]); X.beginPath(); X.moveTo(pn.x,pn.y); var mx=(pn.x+n.x)/2, my=(pn.y+n.y)/2-15; X.quadraticCurveTo(mx,my,n.x,n.y); X.stroke(); X.setLineDash([]); if(unlocked){{ for(var d=0;d<5;d++){{ var dd=(t*0.001+d*0.2+i)%1; var px=pn.x*(1-dd)*(1-dd)+2*mx*dd*(1-dd)+n.x*dd*dd; var py=pn.y*(1-dd)*(1-dd)+2*my*dd*(1-dd)+n.y*dd*dd; X.fillStyle='rgba(255,204,102,'+(0.6-dd*0.4)+')'; X.beginPath(); X.arc(px,py,2,0,Math.PI*2); X.fill(); }} }}
    }}
    }}
    var phaseImgs=[casaImg,esfingeImg,matrixImg,hotelImg,sachesImg,casteloImg,espacoImg];
    for(var i=0;i<WORLD_MAP_NODES.length;i++){{ var n=WORLD_MAP_NODES[i]; var img=phaseImgs[i]; if(img&&img.complete&&img.naturalWidth>0){{ X.globalAlpha=0.9; X.drawImage(img,n.x-60,n.y-120,120,80); X.globalAlpha=1; }} }}
    for(var i=0;i<WORLD_MAP_NODES.length;i++){{ var n=WORLD_MAP_NODES[i]; var ul=game.levelsUnlocked[i]; var cur=(i===mapIndex); var hov=(i===mapHoverIndex); var rad=cur?24:18;
        if(ul){{ X.fillStyle=LEVELS[i].color+'33'; X.beginPath(); X.arc(n.x,n.y,rad+8+Math.sin(t*0.003)*2,0,Math.PI*2); X.fill(); }}
        var grd=X.createRadialGradient(n.x,n.y,0,n.x,n.y,rad);
        if(ul){{ grd.addColorStop(0,LEVELS[i].color); grd.addColorStop(1,LEVELS[i].color+'88'); }}
        else{{ grd.addColorStop(0,'#444'); grd.addColorStop(1,'#222'); }}
        X.beginPath(); X.arc(n.x,n.y,rad,0,Math.PI*2); X.fillStyle=grd; X.fill();
        if(cur||hov){{ X.strokeStyle='#ffcc66'; X.lineWidth=3; X.beginPath(); X.arc(n.x,n.y,rad+3,0,Math.PI*2); X.stroke(); }}
        else{{ X.strokeStyle=ul?'rgba(255,255,255,0.5)':'#555'; X.lineWidth=2; X.beginPath(); X.arc(n.x,n.y,rad,0,Math.PI*2); X.stroke(); }}
        if(cur){{ X.strokeStyle='rgba(255,204,102,'+(0.2+Math.sin(t*0.005)*0.15)+')'; X.lineWidth=2; X.beginPath(); X.arc(n.x,n.y,rad+8+Math.sin(t*0.005)*3,0,Math.PI*2); X.stroke(); X.beginPath(); X.arc(n.x,n.y,rad+14+Math.sin(t*0.004)*2,0,Math.PI*2); X.stroke(); }}
        if(ul){{ X.font=cur?'bold 11px Courier New':'10px Courier New'; X.textAlign='center'; X.fillStyle='#fff'; X.fillText(n.name,n.x,n.y+4); }}
        else{{ X.font='10px Courier New'; X.textAlign='center'; X.fillStyle='#666'; X.fillText('???',n.x,n.y+4); }}
        if(cur||hov){{ var L=LEVELS[i]; var tipY=Math.min(n.y-40,80); var tipW=280, tipH=52; X.fillStyle='rgba(10,5,30,0.9)'; X.strokeStyle=L.color+'88'; X.lineWidth=1; X.beginPath(); X.roundRect(n.x-tipW/2,tipY,tipW,tipH,6); X.fill(); X.stroke(); X.font='bold 12px Courier New'; X.fillStyle=L.color; X.textAlign='center'; X.fillText(L.name,n.x,tipY+18); X.font='9px Courier New'; X.fillStyle='#ccc'; X.fillText(L.desc,n.x,tipY+34); X.fillStyle='#ff99cc'; X.font='8px Courier New'; X.fillText('Boss: '+L.boss_name+' | Inimigos: '+L.enemies,n.x,tipY+47); }}
    }}
    X.font='11px Courier New'; X.fillStyle=(Math.floor(t/500)%2===0)?'#fff':'#ffcc66'; X.fillText('← → fase | ENTER jogar | Clique | ESC seleção',W/2,H-16);
}}

function drawLevel(){{
    var L=LEVELS[game.currentLevel];
    if(game.currentLevel===0) drawHouseBG();
    else{{ var grad=X.createLinearGradient(0,0,0,H); grad.addColorStop(0,L.bg1); grad.addColorStop(1,L.bg2); X.fillStyle=grad; X.fillRect(0,0,W,H); }}

    X.save(); X.translate(-cameraX,0);
    for(var r=0;r<TILE_ROWS;r++) for(var c=Math.floor(cameraX/TILE);c<Math.ceil((cameraX+W)/TILE)+2;c++){{
        var t=getTile(c,r); if(t===0) continue;
        var tx=c*TILE, ty=r*TILE;
        if(t===1){{ X.fillStyle=L.ground; X.fillRect(tx,ty,TILE,TILE); X.strokeStyle=L.platform; X.lineWidth=1; X.strokeRect(tx+0.5,ty+0.5,TILE-1,TILE-1); }}
        else if(t===2){{ X.fillStyle=L.platform; X.fillRect(tx,ty,TILE,TILE); X.fillStyle='rgba(255,255,255,0.1)'; X.fillRect(tx,ty,TILE,3); }}
        else if(t===5){{ X.fillStyle='#228B22'; X.fillRect(tx,ty,TILE,TILE); X.fillStyle='#32CD32'; X.fillRect(tx+2,ty,TILE-4,TILE/2); }}
        else if(t===6){{ X.fillStyle='#8B4513'; X.fillRect(tx,ty,TILE,TILE); X.strokeStyle='#654321'; X.lineWidth=1; X.strokeRect(tx+0.5,ty+0.5,TILE-1,TILE-1); }}
        else if(t===7){{ X.fillStyle='#DEB887'; X.fillRect(tx,ty,TILE,TILE); X.strokeStyle='#C4A87A'; X.lineWidth=1; X.strokeRect(tx+0.5,ty+0.5,TILE-1,TILE-1); }}
    }}
    X.restore();
    drawFurniture();
    X.save(); X.translate(-cameraX,0);

    for(var i=0;i<collectibles.length;i++){{
        var c=collectibles[i]; if(c.collected) continue;
        if(c.x<cameraX-50||c.x>cameraX+W+50) continue;
        var bob=Math.sin(Date.now()*0.004+i)*4;
        if(c.type==='coin'){{ X.fillStyle='#ffcc00'; X.beginPath(); X.arc(c.x+c.w/2,c.y+c.h/2+bob,8,0,Math.PI*2); X.fill(); X.fillStyle='#aa8800'; X.beginPath(); X.arc(c.x+c.w/2,c.y+c.h/2+bob,4,0,Math.PI*2); X.fill(); }}
        else if(c.type==='heart'){{ X.fillStyle='#ff4444'; X.beginPath(); X.arc(c.x+5,c.y+4+bob,6,0,Math.PI*2); X.fill(); X.beginPath(); X.arc(c.x+13,c.y+4+bob,6,0,Math.PI*2); X.fill(); X.beginPath(); X.moveTo(c.x,c.y+6+bob); X.lineTo(c.x+c.w/2,c.y+c.h+bob); X.lineTo(c.x+c.w,c.y+6+bob); X.closePath(); X.fill(); }}
        else if(c.type==='sache'){{ X.fillStyle='#D2691E'; X.fillRect(c.x,c.y+bob,c.w,c.h); X.fillStyle='#8B4513'; X.fillRect(c.x+2,c.y+bob,c.w-4,6); X.font='8px Courier New'; X.fillStyle='#fff'; X.textAlign='center'; X.fillText('RA',c.x+c.w/2,c.y+c.h/2+bob+3); }}
        else if(c.type==='extra_life'){{ X.fillStyle='#00ccff'; X.beginPath(); X.arc(c.x+c.w/2,c.y+c.h/2+bob,12,0,Math.PI*2); X.fill(); X.font='bold 12px Courier New'; X.fillStyle='#fff'; X.textAlign='center'; X.fillText('1UP',c.x+c.w/2,c.y+c.h/2+bob+4); }}
    }}

    for(var i=0;i<enemies.length;i++){{
        var e=enemies[i]; if(!e.alive) continue;
        if(e.x<cameraX-50||e.x>cameraX+W+50) continue;
        if(e.type==='rat'){{
            X.fillStyle='#886644'; X.fillRect(e.x,e.y,e.w,e.h);
            X.fillStyle='#aa8866'; X.fillRect(e.x+2,e.y+2,e.w-4,e.h-6);
            X.fillStyle='#ff3333'; X.fillRect(e.x+2,e.y+2,6,5); X.fillRect(e.x+e.w-8,e.y+2,6,5);
            X.fillStyle='#111'; X.fillRect(e.x+4,e.y+3,2,2); X.fillRect(e.x+e.w-6,e.y+3,2,2);
            X.strokeStyle='#886644'; X.lineWidth=1; X.beginPath(); X.moveTo(e.x+e.w,e.y+e.h/3); X.lineTo(e.x+e.w+8,e.y+e.h/3-4); X.stroke();
            X.beginPath(); X.moveTo(e.x+e.w,e.y+e.h/3+3); X.lineTo(e.x+e.w+8,e.y+e.h/3+5); X.stroke();
        }} else if(e.type==='cockroach'){{
            X.fillStyle='#3a2a1a'; X.beginPath(); X.ellipse(e.x+e.w/2,e.y+e.h/2,e.w/2,e.h/2.5,0,0,Math.PI*2); X.fill();
            X.fillStyle='#5a3a2a'; X.fillRect(e.x+e.w/2-1,e.y-4,1,5); X.fillRect(e.x+e.w/2+1,e.y-4,1,5);
            X.fillStyle='#111'; X.fillRect(e.x+4,e.y+4,2,2); X.fillRect(e.x+e.w-6,e.y+4,2,2);
            X.strokeStyle='#3a2a1a'; X.lineWidth=0.5;
            for(var l=0;l<3;l++){{ X.beginPath(); X.moveTo(e.x,e.y+e.h*0.3+l*3); X.lineTo(e.x-4,e.y+e.h*0.3+l*3-2); X.stroke(); X.beginPath(); X.moveTo(e.x+e.w,e.y+e.h*0.3+l*3); X.lineTo(e.x+e.w+4,e.y+e.h*0.3+l*3-2); X.stroke(); }}
        }} else if(e.type==='spider'){{
            X.fillStyle='#222'; X.beginPath(); X.arc(e.x+e.w/2,e.y+e.h/2,e.w/2.2,0,Math.PI*2); X.fill();
            X.fillStyle='#cc0000'; X.fillRect(e.x+e.w/2-3,e.y+e.h/2-2,3,3); X.fillRect(e.x+e.w/2+2,e.y+e.h/2-2,3,3);
            X.strokeStyle='#222'; X.lineWidth=1.5;
            for(var l=0;l<4;l++){{ var ang=-0.8+l*0.5; X.beginPath(); X.moveTo(e.x+e.w/2,e.y+e.h/2); X.lineTo(e.x+e.w/2+Math.cos(ang)*e.w,e.y+e.h/2+Math.sin(ang)*e.h); X.stroke(); }}
        }} else if(e.type==='fly'){{
            X.fillStyle='#444'; X.beginPath(); X.arc(e.x+e.w/2,e.y+e.h/2,5,0,Math.PI*2); X.fill();
            X.fillStyle='rgba(200,200,255,0.5)';
            X.beginPath(); X.ellipse(e.x+e.w/2-4,e.y,4,3,-0.3,0,Math.PI*2); X.fill();
            X.beginPath(); X.ellipse(e.x+e.w/2+4,e.y,4,3,0.3,0,Math.PI*2); X.fill();
            X.fillStyle='#ff0'; X.fillRect(e.x+e.w/2-2,e.y+e.h/2-1,2,2); X.fillRect(e.x+e.w/2+2,e.y+e.h/2-1,2,2);
        }} else if(e.type==='xepa'){{
            if(xepaEnemyImg.complete&&xepaEnemyImg.naturalWidth>0){{
                X.save(); X.translate(e.x+e.w/2,e.y+e.h/2); X.scale(e.vx<0?1:-1,1);
                X.drawImage(xepaEnemyImg,-e.w/2,-e.h/2,e.w,e.h);
                X.restore();
            }} else {{
                X.fillStyle='#cc4444'; X.fillRect(e.x,e.y,e.w,e.h);
            }}
        }} else {{
            X.fillStyle='#cc4444'; X.fillRect(e.x,e.y,e.w,e.h);
            X.fillStyle='#ff6666'; X.fillRect(e.x+2,e.y+2,8,6); X.fillRect(e.x+e.w-10,e.y+2,8,6);
            X.fillStyle='#000'; X.fillRect(e.x+4,e.y+4,3,3); X.fillRect(e.x+e.w-8,e.y+4,3,3);
        }}
    }}

    if(boss&&boss.alive){{
        if(game.currentLevel===0&&odairSprite.complete){{
            X.save();
            X.translate(boss.x+boss.w/2,boss.y+boss.h/2);
            X.scale(boss.vx<0?1:-1,1);
            X.drawImage(odairSprite,-boss.w/2,-boss.h/2,boss.w,boss.h);
            X.restore();
        }} else if(game.currentLevel===6&&xepaBossImg.complete&&xepaBossImg.naturalWidth>0){{
            X.save();
            X.translate(boss.x+boss.w/2,boss.y+boss.h/2);
            X.scale(boss.vx<0?1:-1,1);
            X.drawImage(xepaBossImg,-boss.w/2,-boss.h/2,boss.w,boss.h);
            X.restore();
        }} else {{
            X.fillStyle=boss.color; X.fillRect(boss.x,boss.y,boss.w,boss.h);
            if(boss.big){{
                X.fillStyle='#2a1a0a'; X.fillRect(boss.x+10,boss.y+10,30,24); X.fillRect(boss.x+56,boss.y+10,30,24);
                X.fillStyle='#ff0000'; X.fillRect(boss.x+16,boss.y+18,16,12); X.fillRect(boss.x+62,boss.y+18,16,12);
                X.fillStyle='#000'; X.fillRect(boss.x+20,boss.y+22,8,6); X.fillRect(boss.x+66,boss.y+22,8,6);
                X.fillStyle='#fff'; X.fillRect(boss.x+30,boss.y+40,36,12);
                X.fillStyle='#ff0000'; X.fillRect(boss.x+34,boss.y+44,6,4); X.fillRect(boss.x+44,boss.y+44,6,4); X.fillRect(boss.x+54,boss.y+44,6,4);
                X.fillStyle=boss.color; X.fillRect(boss.x+8,boss.y+60,20,36); X.fillRect(boss.x+68,boss.y+60,20,36);
            }} else {{
                X.fillStyle='#fff'; X.fillRect(boss.x+8,boss.y+8,16,16); X.fillRect(boss.x+boss.w-24,boss.y+8,16,16);
                X.fillStyle='#ff0000'; X.fillRect(boss.x+12,boss.y+14,8,8); X.fillRect(boss.x+boss.w-20,boss.y+14,8,8);
            }}
        }}
        var hpW=boss.w*1.2;
        X.fillStyle='rgba(0,0,0,0.7)'; X.fillRect(boss.x+boss.w/2-hpW/2-2,boss.y-22,hpW+4,14);
        X.strokeStyle='#ffcc00'; X.lineWidth=1; X.strokeRect(boss.x+boss.w/2-hpW/2-2,boss.y-22,hpW+4,14);
        if(game.currentLevel===0&&odairFace.complete){{
            X.drawImage(odairFace,boss.x+boss.w/2-hpW/2-20,boss.y-24,16,16);
        }}
        X.fillStyle='#333'; X.fillRect(boss.x+boss.w/2-hpW/2,boss.y-18,hpW,8);
        X.fillStyle='#ff0000'; X.fillRect(boss.x+boss.w/2-hpW/2,boss.y-18,hpW*(boss.hp/boss.maxHp),8);
        X.font='bold 8px Courier New'; X.fillStyle='#ffcc00'; X.textAlign='center'; X.fillText(boss.name||'BOSS',boss.x+boss.w/2,boss.y-28);
    }}

    if(player.invincible<=0||Math.floor(Date.now()/50)%2===0) drawSprite(player.animState,player.x,player.y,player.w,player.h,player.facing);

    if(player.powerActive||player.wallSliding){{
        var cat=CATS[game.selectedCat];
        var pcx=player.x+player.w/2, pcy=player.y+player.h/2;
        if(getCatPower()==='Float'&&player.powerActive&&!player.grounded){{
            X.fillStyle='rgba(255,153,204,0.4)';
            X.beginPath();
            X.ellipse(pcx-12,pcy-10,14,8,Math.sin(Date.now()*0.005)*0.3,0,Math.PI*2);
            X.fill();
            X.beginPath();
            X.ellipse(pcx+12,pcy-10,14,8,-Math.sin(Date.now()*0.005)*0.3,0,Math.PI*2);
            X.fill();
            X.fillStyle='rgba(255,200,230,0.2)';
            X.beginPath();
            X.ellipse(pcx,pcy+player.h/2+5,20,4,0,0,Math.PI*2);
            X.fill();
        }}
        if(getCatPower()==='Wall Jump'&&player.wallSliding){{
            X.fillStyle='rgba(155,89,182,0.5)';
            X.beginPath(); X.arc(pcx,pcy,player.w*0.8,0,Math.PI*2); X.fill();
            X.fillStyle='rgba(180,120,220,0.3)';
            X.beginPath(); X.arc(pcx,pcy,player.w*1.2,0,Math.PI*2); X.fill();
        }}
        if(getCatPower()==='Shield'&&player.powerActive){{
            X.strokeStyle='rgba(41,128,185,0.7)'; X.lineWidth=3;
            X.beginPath(); X.arc(pcx,pcy,player.w*0.9,0,Math.PI*2); X.stroke();
            X.strokeStyle='rgba(100,180,255,0.4)'; X.lineWidth=2;
            X.beginPath(); X.arc(pcx,pcy,player.w*1.1,0,Math.PI*2); X.stroke();
        }}
        if(getCatPower()==='Triple Jump'&&player.powerActive){{
            X.fillStyle='rgba(255,204,0,0.3)';
            for(var pi=0;pi<3;pi++){{
                var px2=pcx+Math.cos(Date.now()*0.008+pi*2.1)*20;
                var py2=pcy+Math.sin(Date.now()*0.008+pi*2.1)*20;
                X.beginPath(); X.arc(px2,py2,3,0,Math.PI*2); X.fill();
            }}
        }}
        if(getCatPower()==='Mega Jump'&&player.powerActive&&player.vy<0){{
            X.fillStyle='rgba(255,136,0,0.4)';
            X.beginPath();
            X.moveTo(pcx-10,pcy+player.h/2);
            X.lineTo(pcx,pcy+player.h/2+20+Math.random()*15);
            X.lineTo(pcx+10,pcy+player.h/2);
            X.fill();
        }}
    }}

    for(var i=0;i<projectiles.length;i++){{ var p=projectiles[i]; X.fillStyle=p.friendly?'#00ffcc':'#ff4444'; X.beginPath(); X.arc(p.x,p.y,p.w/2,0,Math.PI*2); X.fill(); }}
    for(var i=0;i<particles.length;i++){{ var p=particles[i]; X.globalAlpha=p.life/40; X.fillStyle=p.color; X.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size); }}
    X.globalAlpha=1; X.restore();

    X.fillStyle='rgba(0,0,0,0.7)'; X.fillRect(0,0,W,36);
    X.strokeStyle='rgba(255,153,204,0.3)'; X.lineWidth=1; X.strokeRect(0,35,W,1);
    var cat=CATS[game.selectedCat];
    if(catFaceImgs[cat.name]&&catFaceImgs[cat.name].complete){{
        X.save();
        X.beginPath(); X.arc(18,18,14,0,Math.PI*2); X.clip();
        X.drawImage(catFaceImgs[cat.name],4,4,28,28);
        X.restore();
    }}
    X.font='10px Courier New'; X.textAlign='left';
    X.fillStyle='#ff4444'; X.fillText('HP:',36,16);
    for(var i=0;i<player.maxHp;i++){{ X.fillStyle=i<player.hp?'#ff4444':'#333'; X.fillRect(62+i*16,8,12,10); X.strokeStyle='#888'; X.lineWidth=0.5; X.strokeRect(62+i*16,8,12,10); }}
    X.fillStyle='#ffcc00'; X.fillText('★'+game.coins,62+player.maxHp*16+10,16);
    X.fillStyle='#fff'; X.font='10px Courier New'; X.fillText('Score:'+game.score,62+player.maxHp*16+70,16);
    X.textAlign='center'; X.fillStyle='#ff99cc'; X.font='bold 12px Courier New'; X.fillText(L.name,W/2,16);
    X.textAlign='right'; X.fillStyle=game.time<20?'#ff4444':'#fff'; X.font='11px Courier New'; X.fillText('Tempo: '+Math.ceil(game.time),W-10,16);
    X.fillStyle='#ff99cc'; X.fillText('Vidas: '+game.chances,W-10,30);
    X.textAlign='left';
    X.fillStyle='rgba(255,255,255,0.4)'; X.font='9px Courier New'; X.fillText(CATS[game.selectedCat].power,36,30);
    if(game.grown){{ X.textAlign='center'; X.font='bold 10px Courier New'; X.fillStyle='#00ff00'; X.fillText('GRANDE!',W/2,50); }}
    if(player.powerActive){{ X.textAlign='center'; X.font='bold 12px Courier New'; X.fillStyle='#00ffcc'; X.fillText(CATS[game.selectedCat].power+' ATIVO!',W/2,60); }}
}}

function drawLevelComplete(){{
    X.fillStyle='rgba(0,0,0,0.7)'; X.fillRect(0,0,W,H);
    X.font='bold 36px Courier New'; X.textAlign='center'; X.fillStyle='#ffcc00'; X.fillText('FASE COMPLETA!',W/2,H/2-40);
    X.font='18px Courier New'; X.fillStyle='#fff'; X.fillText('Score: '+game.score,W/2,H/2+10); X.fillText('Saches: '+game.coins,W/2,H/2+40);
    if(levelCompleteTimer<100){{ X.font='14px Courier New'; X.fillStyle=(Math.floor(Date.now()/400)%2===0)?'#fff':'#ffcc66'; X.fillText('ENTER para continuar',W/2,H/2+90); }}
}}

function drawGameOver(){{
    X.fillStyle='rgba(0,0,0,0.8)'; X.fillRect(0,0,W,H);
    X.font='bold 42px Courier New'; X.textAlign='center'; X.fillStyle='#ff4444'; X.fillText('GAME OVER',W/2,H/2-30);
    X.font='18px Courier New'; X.fillStyle='#fff'; X.fillText('Score final: '+game.score,W/2,H/2+20);
    if(gameOverTimer<80){{ X.font='14px Courier New'; X.fillStyle=(Math.floor(Date.now()/400)%2===0)?'#fff':'#ffcc66'; X.fillText('ENTER para recomeçar',W/2,H/2+70); }}
}}

function update(dt){{
    titleTimer++;
    if(game.state==='playing'){{ updatePlayer(); updateEnemies(); updateBoss(); updateProjectiles(); updateCollectibles(); updateParticles(); cameraX=player.x-W/3; if(cameraX<0) cameraX=0; if(cameraX>levelWidth-W) cameraX=levelWidth-W; game.time-=1/60; if(game.time<=0){{ game.time=0; playerDie(); }} }}
    else if(game.state==='levelcomplete'){{ updateParticles(); levelCompleteTimer--; }}
    else if(game.state==='gameover') gameOverTimer--;
}}

function draw(){{
    X.clearRect(0,0,W,H);
    switch(game.state){{
        case 'title': drawTitle(); break;
        case 'select': drawCharSelect(); break;
        case 'worldmap': drawWorldMap(); break;
        case 'playing': drawLevel(); break;
        case 'levelcomplete': drawLevel(); drawLevelComplete(); break;
        case 'gameover': drawLevel(); drawGameOver(); break;
    }}
    X.fillStyle='rgba(255,255,255,0.3)'; X.font='9px Courier New'; X.textAlign='left';
    X.fillText('F:'+frameCount+' S:'+game.state+' L:'+game.currentLevel,4,H-4);
}}

var frameCount=0;
function loop(t){{ try{{ var dt=t-lastTime; lastTime=t; update(dt); draw(); }} catch(e){{ try{{ X.fillStyle='#000'; X.fillRect(0,0,W,H); X.fillStyle='#ff0000'; X.font='bold 18px Courier New'; X.textAlign='center'; X.fillText('ERRO: '+(e.message||e||'unknown'),W/2,H/2-30); X.font='12px Courier New'; X.fillStyle='#ff6666'; X.fillText('Frame: '+frameCount+' State: '+game.state,W/2,H/2); if(e&&e.stack) X.fillText(String(e.stack).split('\\n').slice(0,3).join(' | '),W/2,H/2+20); }} catch(e2){{ X.fillStyle='red'; X.font='bold 20px Courier New'; X.textAlign='center'; X.fillText('CRITICAL ERROR',W/2,H/2); }} }} finally{{ frameCount++; requestAnimationFrame(loop); }} }}

document.addEventListener('keydown',function(e){{
    keys[e.key]=true;
    switch(game.state){{
        case 'title': if(e.key==='Enter'){{ game.state='select'; selectIndex=0; }} break;
        case 'select':
            if(e.key==='ArrowLeft') selectIndex=(selectIndex-1+CATS.length)%CATS.length;
            if(e.key==='ArrowRight') selectIndex=(selectIndex+1)%CATS.length;
            if(e.key==='Enter'){{ game.selectedCat=selectIndex; player.maxJumps=(CATS[game.selectedCat].power==='Triple Jump')?3:1; game.state='worldmap'; mapIndex=0; }}
            if(e.key==='Escape') game.state='title';
            break;
        case 'worldmap':
            if(e.key==='ArrowLeft') for(var i=mapIndex-1;i>=0;i--) if(game.levelsUnlocked[i]){{ mapIndex=i; break; }}
            if(e.key==='ArrowRight') for(var i=mapIndex+1;i<WORLD_MAP_NODES.length;i++) if(game.levelsUnlocked[i]){{ mapIndex=i; break; }}
            if(e.key==='Enter'){{ try{{ game.currentLevel=mapIndex; generateLevel(game.currentLevel); game.state='playing'; }}catch(e){{ game.state='worldmap'; alert('Erro ao gerar fase: '+e.message); }} }}
            if(e.key==='Escape') game.state='select';
            break;
        case 'playing':
            if(e.key==='z'||e.key==='Z'||e.key==='ArrowUp'||e.key==='w'){{
                if(player.crouching){{
                    player.crouching=false; player.y-=(player.h-player.preCrouchH); player.h=player.preCrouchH; player.w=player.preCrouchW;
                }}
                if(player.wallSliding){{
                    player.vy=-9;
                    player.facing=player.wallTouchL?1:-1;
                    player.wallSliding=false;
                    spawnParticles(player.x+player.w/2,player.y+player.h/2,'#9B59B6',8);
                }} else if(player.grounded){{
                    player.vy=-8; player.grounded=false; player.jumpCount++;
                }} else if(player.jumpCount<player.maxJumps){{
                    player.vy=-8; player.jumpCount++;
                    spawnParticles(player.x+player.w/2,player.y+player.h,'rgba(255,255,255,0.5)',4);
                }}
            }}
            if((e.key==='ArrowDown'||e.key==='s'||e.key==='S')&&player.grounded){{
                if(!player.crouching){{
                    player.crouching=true;
                    player.preCrouchW=player.w; player.preCrouchH=player.h;
                    var oldH=player.h;
                    player.h=player.h*0.55;
                    player.w=player.w*1.3;
                    player.y=player.y+oldH-player.h;
                }}
            }}
            if(e.key==='x'||e.key==='X') activatePower();
            if(e.key==='Escape') game.state='worldmap';
            var num=parseInt(e.key); if(!isNaN(num)&&num>=0&&num<=6){{ try{{ game.currentLevel=num; generateLevel(game.currentLevel); }}catch(e){{ alert('Erro ao gerar fase: '+e.message); }} }}
            break;
        case 'levelcomplete': if(e.key==='Enter'&&levelCompleteTimer<100) game.state='worldmap'; break;
        case 'gameover':
            if(e.key==='Enter'&&gameOverTimer<80){{ game.lives=7; game.chances=3; game.score=0; game.coins=0; game.grown=false; player.w=player.baseW; player.h=player.baseH; game.state='title'; }}
            break;
    }}
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
}});
document.addEventListener('keyup',function(e){{
    keys[e.key]=false;
    if((e.key==='ArrowDown'||e.key==='s'||e.key==='S')&&player.crouching){{
        player.crouching=false;
        player.y=player.y+player.h-player.preCrouchH;
        player.h=player.preCrouchH;
        player.w=player.preCrouchW;
    }}
}});
C.addEventListener('mousemove',function(e){{
    var rect=C.getBoundingClientRect();
    mouseX=(e.clientX-rect.left)*(W/rect.width);
    mouseY=(e.clientY-rect.top)*(H/rect.height);
    if(game.state==='select'){{
        var cardW=105, cardH=155;
        var totalW=CATS.length*(cardW+8)-8;
        var startX=(W-totalW)/2;
        hoverIndex=-1;
        for(var i=0;i<CATS.length;i++){{
            var cx=startX+i*(cardW+8), cy=55;
            if(mouseX>=cx&&mouseX<=cx+cardW&&mouseY>=cy&&mouseY<=cy+cardH){{
                hoverIndex=i; selectIndex=i;
            }}
        }}
    }}
    if(game.state==='worldmap'){{
        mapHoverIndex=-1;
        for(var i=0;i<WORLD_MAP_NODES.length;i++){{ var n=WORLD_MAP_NODES[i]; var dx=mouseX-n.x, dy=mouseY-n.y; if(dx*dx+dy*dy<600){{ mapHoverIndex=i; mapIndex=i; }} }}
    }}
}});
C.addEventListener('click',function(e){{
    C.focus();
    if(game.state==='select'&&hoverIndex>=0){{
        game.selectedCat=hoverIndex;
        player.maxJumps=(CATS[game.selectedCat].power==='Triple Jump')?3:1;
        game.state='worldmap'; mapIndex=0;
    }}
    if(game.state==='worldmap'&&mapHoverIndex>=0&&game.levelsUnlocked[mapHoverIndex]){{ try{{ game.currentLevel=mapHoverIndex; generateLevel(game.currentLevel); game.state='playing'; }}catch(e){{ alert('Erro ao gerar fase: '+e.message); }} }}
}});
requestAnimationFrame(loop);
</script>
</body>
</html>'''

out_path = r'C:\Users\Fit You\Desktop\Projeto do Vini\gataiada_platformer.html'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(html)

print(f'Saved: {out_path}')
print(f'Size: {os.path.getsize(out_path) / 1024 / 1024:.1f} MB')
