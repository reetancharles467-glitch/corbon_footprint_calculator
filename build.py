# Builds the deployable site from the original single-file index.html.
import re,sys
src=open(sys.argv[1],encoding='utf-8').read().replace('\r\n','\n')
css=re.search(r'<style>\n(.*?)</style>',src,re.S).group(1)
js=re.search(r'<script>\n(.*?)</script>',src,re.S).group(1)
# expose state to enhancements.js; pause canvas loop when tab hidden / on phones
js=js.replace('  function init(){','  window.CTP={CATEGORIES:CATEGORIES,ALL_KEYS:ALL_KEYS,state:state};\n  function init(){',1)
js=js.replace('    requestAnimationFrame(frame);\n  }','    if(!document.hidden&&window.innerWidth>=640){requestAnimationFrame(frame);}else{lastT=null;setTimeout(function(){requestAnimationFrame(frame);},400);}\n  }',1)
open('css/style.css','w',encoding='utf-8').write(css)
open('js/app.js','w',encoding='utf-8').write(js)

def pic(n,alt):
    b=f'assets/img/scene{n}'
    return (f'<picture><source type="image/webp" srcset="{b}-768.webp 768w, {b}.webp 1376w" sizes="100vw">'
            f'<img src="{b}.jpg" srcset="{b}-768.jpg 768w, {b}.jpg 1376w" sizes="100vw" alt="{alt}" width="1376" height="768" loading="lazy" decoding="async"></picture>')
S=[("Human activities create emissions","Cars, power stations, factories, kitchens and landfills: ordinary life runs on burning carbon. Every habit you are about to measure starts here.","Smoking power plant beside a busy city and highways"),
("Carbon dioxide accumulates","CO\u2082 does not simply disappear. Much of it stays in the air for centuries, and its concentration has climbed from about 280 ppm before industry to over 420 ppm today.","Earth from space with glowing city lights and a haze of emissions"),
("The greenhouse effect","Sunlight reaches the surface and warms it. Greenhouse gases then hold back some of the outgoing heat, like a blanket that keeps getting thicker.","Earth wrapped in layers of trapped heat while sunlight arrives"),
("Earth heats up","The planet is now more than 1.1 \u00B0C warmer than in the late 1800s. Small averages hide big shifts in oceans, forests and weather.","Earth glowing with heat over Africa and Europe"),
("The ice gives way","Glaciers and ice sheets are shrinking, and meltwater adds to rising seas that threaten coasts and the people who live on them.","Glacier calving into the sea with floating ice"),
("Climate disasters","Heatwaves, drought, wildfire, floods and stronger storms are becoming more intense. This is the cost of an unchecked footprint.","Wildfire, parched land, a tornado and a flooded city")]
S2=[("Sustainable actions","Solar and wind power, trams, bike lanes, efficient buildings and shared gardens already work. Your recommendations above are the personal version of this.","Green city with solar roofs, wind turbines, a tram and cyclists"),
("A healthy Earth, a hopeful future","Every tonne you avoid counts. Measure, act, then measure again, and keep your report to track the change.","Healthy Earth with aurora and sunrise")]
def scene(i,t,p,a,total,last=False):
    cta='<a class="btn btn--primary scene__cta" href="#calculator">Measure my footprint</a>' if i==6 else ('<a class="btn btn--ghost scene__cta" href="#top">Back to top</a>' if last else '')
    h='h2'
    return (f'<section class="scene" aria-labelledby="sc{i}">'
            f'<div class="scene__media">{pic(i,a)}</div><div class="scene__veil" aria-hidden="true"></div>'
            f'<div class="scene__inner"><div class="scene__card"><p class="scene__count">{i} / 8</p><{h} id="sc{i}">{t}</{h}><p>{p}</p>{cta}</div></div></section>')
story1='<div id="story">'+''.join(scene(i+1,*S[i],8) for i in range(6))+'</div>\n'
story2='<div id="hope">'+''.join(scene(i+7,*S2[i],8,last=(i==1)) for i in range(2))+'</div>\n'

flight=('''<article class="q-card reveal" data-category="flight"><div class="q-card-head"><span class="q-icon" style="--icon-bg:#E8F3FB;">\u2708\uFE0F</span>
<div><h3>Flights</h3><p>Hours spent in the air per year (about 90 kg CO\u2082e per hour).</p></div><span class="q-chip" id="chip-flight">0 kg CO\u2082e/yr</span></div>
<div class="q-controls"><input type="range" min="0" max="200" step="1" value="0" class="q-slider" id="slider-flight"><div class="q-number"><input type="number" min="0" max="200" step="1" value="0" id="number-flight"><span>hrs/yr</span></div></div></article>
        ''')
insights='''<section class="insights" id="insights" aria-labelledby="insH"><div class="section-head"><p class="eyebrow">Beyond the number</p><h2 id="insH">What your footprint means</h2>
<p class="section-sub">Includes flights. Updates when you press Calculate.</p></div><div class="insight-grid">
<div class="insight-card"><h3>Your badge</h3><div class="badge-big" role="status"><span class="badge-big__icon" id="badgeIcon" aria-hidden="true"></span><div><div class="badge-big__name" id="badgeName"></div><p id="badgeDesc"></p></div></div></div>
<div class="insight-card"><h3>Biggest emission source</h3><p id="topSource"></p><h3>Tree equivalent</h3><p>About <strong id="treeCount" data-mono>0</strong> mature trees would be needed to absorb your yearly emissions.</p></div>
<div class="insight-card insight-card--wide"><h3>You vs. the targets (tons CO\u2082e per year)</h3><div id="cmpChart" role="img" aria-label="Bar comparison of sustainable target, global average and your result"></div></div>
<div class="insight-card insight-card--wide"><h3>What if&hellip;</h3><div class="whatif-controls"><label>Category <select id="whatifCat"></select></label>
<label>Reduce by <output id="whatifPctOut">20%</output> <input type="range" class="q-slider" id="whatifPct" min="0" max="100" step="5" value="20"></label></div><p class="whatif-out" id="whatifOut" aria-live="polite"></p></div>
</div><div class="report-bar"><button class="btn btn--primary" id="reportBtn" type="button">Download my report</button></div></section>
'''
h=src
h=h.replace(re.search(r'<style>.*?</style>',h,re.S).group(0),'<link rel="stylesheet" href="css/style.css" />\n<link rel="stylesheet" href="css/enhancements.css" />\n<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; img-src \'self\' data: blob:; style-src \'self\' \'unsafe-inline\'; script-src \'self\'; object-src \'none\'; base-uri \'self\'; form-action \'self\'" />',1)
h=h.replace(re.search(r'<script>.*?</script>',h,re.S).group(0),'<script src="js/app.js" defer></script>\n<script src="js/enhancements.js" defer></script>',1)
h=h.replace('<body>\n','<body>\n<a class="skip-link" href="#main">Skip to content</a>\n',1)
h=h.replace('<main id="top">','<main id="main"><span id="top"></span>',1)
h=h.replace('<nav class="header-nav">','<nav class="header-nav" aria-label="Primary">',1)
h=h.replace('<a href="#results">Results</a>','<a href="#story">Story</a>\n      <a href="#results">Results</a>',1)
h=h.replace('  <section class="calculator" id="calculator">',story1+'  <section class="calculator" id="calculator">',1)
h=h.replace('        <button class="btn btn--primary btn--wide reveal" id="calculateBtn"',flight+'<button class="btn btn--primary btn--wide reveal" id="calculateBtn"',1)
h=h.replace('  <section class="recommendations"',insights+'  <section class="recommendations"',1)
h=h.replace('</main>',story2+'</main>',1)
open('index.html','w',encoding='utf-8').write(h)
print('built',len(h))
