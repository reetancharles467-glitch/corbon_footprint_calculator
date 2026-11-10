(function () {
  "use strict";

  /* EMISSION FACTORS & SUSTAINABLE LIMITS (kg CO2e per day for the given input) */
  var CATEGORIES = {
    waste:       { label:"Household waste", icon:"🗑️", color:"#35A06B", factor:function(v){ return v * 0.57; }, sustainableDaily:0.5 },
    vehicle:     { label:"Vehicle usage",    icon:"🚗", color:"#4E8FE0", factor:function(v){ return v * 0.192; }, sustainableDaily:2.0 },
    electricity: { label:"Electricity",      icon:"⚡", color:"#E8A33D", factor:function(v){ return (v * 0.475) / 30; }, sustainableDaily:2.4 },
    lpg:         { label:"LPG cylinders",    icon:"🔥", color:"#E2574C", factor:function(v){ return (v * 42.3) / 30; }, sustainableDaily:1.0 },
    meat:        { label:"Meat meals",       icon:"🍖", color:"#C2547A", factor:function(v){ return (v * 3.3) / 7; }, sustainableDaily:1.5 },
    transit:     { label:"Public transport", icon:"🚌", color:"#6C63C4", factor:function(v){ return (v * 0.10) / 7; }, sustainableDaily:1.0 }
  };
  var ALL_KEYS = ["waste", "vehicle", "electricity", "lpg", "meat", "transit"];
  var SUSTAINABLE_TOTAL = ALL_KEYS.reduce(function(s,k){ return s + CATEGORIES[k].sustainableDaily; }, 0);

  var VERDICT_BANDS = [
    { max: SUSTAINABLE_TOTAL * 0.7,  key:"excellent", label:"Excellent", flag:"level-good",
      title:"You're living well within a sustainable budget.",
      desc:"Your footprint is already close to a Paris-aligned pace. Keep an eye on electricity and vehicle use, the two habits most likely to creep up." },
    { max: SUSTAINABLE_TOTAL * 1.15, key:"good", label:"Good", flag:"level-good",
      title:"You're doing better than the global average.",
      desc:"A couple of targeted changes would bring you into the excellent range without much sacrifice." },
    { max: SUSTAINABLE_TOTAL * 2.0,  key:"moderate", label:"Moderate", flag:"level-mid",
      title:"You're tracking close to the global average.",
      desc:"A few focused changes to your highest-impact habits could meaningfully shrink your footprint." },
    { max: Infinity, key:"high", label:"High", flag:"level-high",
      title:"Your footprint is well above a sustainable pace.",
      desc:"The good news: a small number of habits are likely driving most of this number. Fixing those first has outsized impact." }
  ];

  var TIPS = {
    waste:       { icon:"🗑️", title:"Cut what goes in the bin", big:"Start composting food scraps and switch to a weekly recycling routine — it typically cuts household waste emissions by a third.", small:"Keep your waste sorting up — it's already working in your favor." },
    vehicle:     { icon:"🚗", title:"Rethink short drives", big:"Swap two or three short car trips a week for walking, cycling, or transit. It's the single fastest way to shrink this number.", small:"Your driving footprint is already lean — carpooling occasionally could trim it further." },
    electricity: { icon:"⚡", title:"Shift your electricity load", big:"Switch to LED lighting, unplug idle devices, and if available, opt into a renewable energy plan from your utility.", small:"Efficient usage — consider a smart plug audit to squeeze out the last bit of waste." },
    lpg:         { icon:"🔥", title:"Improve cooking efficiency", big:"Use lids while cooking, batch-cook meals, and service burners regularly — small habits that meaningfully cut gas use.", small:"Your cooking gas use is efficient — pressure-cooking more meals could trim it slightly." },
    meat:        { icon:"🍖", title:"Add a few plant-based meals", big:"Swapping just 3 meat meals a week for plant-based ones is one of the highest-leverage changes any household can make.", small:"A well-balanced plate — going meat-free one more day a week is an easy next step." },
    transit:     { icon:"🚌", title:"Choose transit when you can", big:"Swap a few car trips a week for bus or rail — even a partial switch adds up fast over a year.", small:"Good use of public transport — off-peak travel or combining errands could trim it a little more." }
  };

  var state = {};
  ALL_KEYS.forEach(function(k){
    var el = document.getElementById("slider-" + k);
    state[k] = el ? Number(el.value) : 0;
  });

  function computeTotal(keys){
    return keys.reduce(function(sum,k){ return sum + CATEGORIES[k].factor(state[k]); }, 0);
  }

  function setSliderFill(slider){
    var min = Number(slider.min || 0);
    var max = Number(slider.max || 100);
    var val = Number(slider.value);
    var pct = ((val - min) / (max - min)) * 100;
    slider.style.setProperty("--fill", pct + "%");
  }

  function updateChip(key){
    var chip = document.getElementById("chip-" + key);
    if (!chip) return;
    var daily = CATEGORIES[key].factor(state[key]);
    chip.textContent = daily.toFixed(1) + " kg CO\u2082e/day";
    chip.classList.remove("level-mid", "level-high");
    var ratio = daily / CATEGORIES[key].sustainableDaily;
    if (ratio > 1.6) chip.classList.add("level-high");
    else if (ratio > 1) chip.classList.add("level-mid");
  }

  function animateCount(el, target, decimals){
    if (!el) return;
    decimals = decimals || 0;
    var start = Number(el.getAttribute("data-current") || 0);
    var startTime = null;
    var duration = 450;
    function tick(ts){
      if (startTime === null) startTime = ts;
      var p = Math.min(1, (ts - startTime) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = start + (target - start) * eased;
      el.textContent = val.toFixed(decimals);
      if (p < 1) window.requestAnimationFrame(tick);
      else el.setAttribute("data-current", target);
    }
    window.requestAnimationFrame(tick);
  }

  var GAUGE_CIRC = 2 * Math.PI * 70;

  function updateLiveGauge(){
    var total = computeTotal(ALL_KEYS);
    var gaugeNumber = document.getElementById("gaugeNumber");
    var gaugeValue = document.getElementById("gaugeValue");
    var liveYearly = document.getElementById("liveYearly");
    var liveBadge = document.getElementById("liveBadge");

    animateCount(gaugeNumber, total, 1);
    if (liveYearly) liveYearly.textContent = Math.round(total * 365).toLocaleString();

    var scaleMax = SUSTAINABLE_TOTAL * 2.2;
    var pct = Math.min(1, total / scaleMax);
    var offset = GAUGE_CIRC * (1 - pct);
    if (gaugeValue) gaugeValue.style.strokeDashoffset = offset;

    var band = null;
    for (var i = 0; i < VERDICT_BANDS.length; i++){
      if (total <= VERDICT_BANDS[i].max){ band = VERDICT_BANDS[i]; break; }
    }
    if (!band) band = VERDICT_BANDS[VERDICT_BANDS.length - 1];

    if (gaugeValue){
      gaugeValue.style.stroke = (band.key === "excellent" || band.key === "good") ? "var(--mint)" :
        (band.key === "moderate" ? "var(--amber)" : "var(--coral)");
    }
    if (liveBadge) liveBadge.textContent = band.label.toUpperCase();
  }

  function wireControl(key){
    var slider = document.getElementById("slider-" + key);
    var number = document.getElementById("number-" + key);
    if (!slider || !number) return;

    setSliderFill(slider);

    function sync(value){
      var min = Number(slider.min);
      var max = Number(slider.max);
      var clamped = Math.min(max, Math.max(min, value));
      if (isNaN(clamped)) clamped = min;
      state[key] = clamped;
      slider.value = clamped;
      number.value = clamped;
      setSliderFill(slider);
      updateChip(key);
      updateLiveGauge();
    }

    slider.addEventListener("input", function(){ sync(Number(slider.value)); });
    number.addEventListener("input", function(){
      if (number.value === "") return;
      sync(Number(number.value));
    });
    number.addEventListener("blur", function(){ sync(Number(number.value || 0)); });
  }

  function renderDoughnut(){
    var wrap = document.getElementById("doughnutChart");
    if (!wrap) return;

    var entries = ALL_KEYS.map(function(k){
      return { key:k, label:CATEGORIES[k].label, value:CATEGORIES[k].factor(state[k]), color:CATEGORIES[k].color, icon:CATEGORIES[k].icon };
    }).filter(function(e){ return e.value > 0.001; });

    var total = entries.reduce(function(s,e){ return s + e.value; }, 0);
    var R = 80;
    var CIRC = 2 * Math.PI * R;
    var svgNS = "http://www.w3.org/2000/svg";

    wrap.innerHTML = "";
    var svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 200 200");
    svg.setAttribute("class", "donut-svg");

    var track = document.createElementNS(svgNS, "circle");
    track.setAttribute("cx","100"); track.setAttribute("cy","100"); track.setAttribute("r", String(R));
    track.setAttribute("class","donut-track"); track.setAttribute("stroke-width","26");
    svg.appendChild(track);

    var cumulative = 0;
    entries.forEach(function(e){
      var fraction = total > 0 ? e.value / total : 0;
      var dash = fraction * CIRC;
      var circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx","100"); circle.setAttribute("cy","100"); circle.setAttribute("r", String(R));
      circle.setAttribute("stroke", e.color); circle.setAttribute("stroke-width","26"); circle.setAttribute("fill","none");
      circle.setAttribute("class","donut-segment");
      circle.style.strokeDasharray = "0 " + CIRC;
      circle.style.strokeDashoffset = String(-cumulative);
      var title = document.createElementNS(svgNS, "title");
      title.textContent = e.icon + " " + e.label + ": " + e.value.toFixed(2) + " kg CO\u2082e/day";
      circle.appendChild(title);
      svg.appendChild(circle);

      (function(circleEl, dashLen){
        window.requestAnimationFrame(function(){
          window.requestAnimationFrame(function(){
            circleEl.style.strokeDasharray = dashLen + " " + (CIRC - dashLen);
          });
        });
      })(circle, dash);

      cumulative += dash;
    });

    wrap.appendChild(svg);

    var center = document.createElement("div");
    center.className = "donut-center";
    center.innerHTML = '<span class="donut-center-num" data-mono>' + total.toFixed(1) + '</span><span class="donut-center-unit">kg CO\u2082e / day</span>';
    wrap.appendChild(center);

    var legend = document.getElementById("doughnutLegend");
    if (legend){
      var sorted = entries.slice().sort(function(a,b){ return b.value - a.value; });
      legend.innerHTML = sorted.map(function(e){
        return '<div class="legend-item"><span class="legend-swatch" style="background:' + e.color + '"></span>' +
          '<span class="legend-name">' + e.icon + ' ' + e.label + '</span>' +
          '<span class="legend-val">' + e.value.toFixed(2) + ' kg</span></div>';
      }).join("");
    }
  }

  function renderBarChart(){
    var list = document.getElementById("barChart");
    if (!list) return;

    var rows = ALL_KEYS.map(function(k){
      return { key:k, label:CATEGORIES[k].label, icon:CATEGORIES[k].icon,
        yours:CATEGORIES[k].factor(state[k]), limit:CATEGORIES[k].sustainableDaily };
    });

    var scaleMax = Math.max.apply(null, rows.map(function(r){ return Math.max(r.yours, r.limit); })) * 1.15 || 1;

    list.innerHTML = rows.map(function(r){
      var yoursPct = Math.min(100, (r.yours / scaleMax) * 100);
      var limitPct = Math.min(100, (r.limit / scaleMax) * 100);
      var ratio = r.limit > 0 ? r.yours / r.limit : 0;
      var barColor = ratio > 1.6 ? "var(--coral)" : (ratio > 1 ? "var(--amber)" : "var(--mint-strong)");
      return '<div class="bar-row">' +
        '<div class="bar-row-head"><span>' + r.icon + ' ' + r.label + '</span>' +
        '<span class="bar-row-val" data-mono>' + r.yours.toFixed(2) + ' kg <span class="bar-row-limit">/ limit ' + r.limit.toFixed(2) + '</span></span></div>' +
        '<div class="bar-track"><div class="bar-fill" data-target="' + yoursPct + '" style="width:0%; background:' + barColor + ';"></div>' +
        '<div class="bar-limit-marker" style="left:' + limitPct + '%;" title="Sustainable limit: ' + r.limit.toFixed(2) + ' kg/day"></div></div></div>';
    }).join("");

    window.requestAnimationFrame(function(){
      window.requestAnimationFrame(function(){
        var fills = list.querySelectorAll(".bar-fill");
        for (var i = 0; i < fills.length; i++){
          fills[i].style.width = fills[i].getAttribute("data-target") + "%";
        }
      });
    });
  }

  function renderRecommendations(){
    var grid = document.getElementById("recGrid");
    if (!grid) return;

    var scored = ALL_KEYS.map(function(k){
      var daily = CATEGORIES[k].factor(state[k]);
      var limit = CATEGORIES[k].sustainableDaily;
      var excess = daily - limit;
      var ratio = limit > 0 ? daily / limit : 0;
      return { key:k, daily:daily, limit:limit, excess:excess, ratio:ratio };
    }).sort(function(a,b){ return b.excess - a.excess; });

    grid.innerHTML = scored.map(function(s){
      var tip = TIPS[s.key];
      var priority = "low";
      if (s.ratio > 1.6) priority = "high";
      else if (s.ratio > 1) priority = "medium";
      var text = s.excess > 0 ? tip.big : tip.small;
      var impact = s.excess > 0
        ? "Potential savings: up to " + Math.max(s.excess, 0.1).toFixed(1) + " kg CO\u2082e/day"
        : "Already within a sustainable range";
      return '<article class="rec-card priority-' + priority + '">' +
        '<div class="rec-card-top"><span class="rec-icon">' + tip.icon + '</span>' +
        '<span class="rec-priority">' + priority + ' priority</span></div>' +
        '<h4>' + tip.title + '</h4><p>' + text + '</p>' +
        '<span class="rec-impact">' + impact + '</span></article>';
    }).join("");
  }

  function renderResults(){
    var dailyTotal = computeTotal(ALL_KEYS);
    var yearlyTons = (dailyTotal * 365) / 1000;

    var band = null;
    for (var i = 0; i < VERDICT_BANDS.length; i++){
      if (dailyTotal <= VERDICT_BANDS[i].max){ band = VERDICT_BANDS[i]; break; }
    }
    if (!band) band = VERDICT_BANDS[VERDICT_BANDS.length - 1];

    var flagEl = document.getElementById("verdictFlag");
    if (flagEl){
      flagEl.textContent = band.label.toUpperCase();
      flagEl.className = "verdict-flag " + band.flag;
    }
    var titleEl = document.getElementById("verdictTitle");
    if (titleEl) titleEl.textContent = band.title;
    var descEl = document.getElementById("verdictDesc");
    if (descEl) descEl.textContent = band.desc;

    animateCount(document.getElementById("verdictDaily"), dailyTotal, 1);
    animateCount(document.getElementById("verdictYearly"), yearlyTons, 2);

    renderDoughnut();
    renderBarChart();
  }

  function wireCalculateButton(){
    var btn = document.getElementById("calculateBtn");
    if (!btn) return;
    btn.addEventListener("click", function(){
      renderResults();
      renderRecommendations();

      var card = document.getElementById("verdictCard");
      if (card){
        card.classList.remove("just-calculated");
        void card.offsetWidth;
        card.classList.add("just-calculated");
      }

      var results = document.getElementById("results");
      if (results) results.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function wireScrollProgress(){
    var fill = document.getElementById("progressFill");
    if (!fill) return;
    function update(){
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      fill.style.width = pct + "%";
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  function wireScrollReveal(){
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    items.forEach(function(el){
      el.classList.add("reveal-armed");
      io.observe(el);
    });

    setTimeout(function(){
      var stuck = document.querySelectorAll(".reveal.reveal-armed:not(.is-visible)");
      for (var i = 0; i < stuck.length; i++) stuck[i].classList.add("is-visible");
    }, 1500);
  }

  function wireParallax(){
    var blobs = document.querySelectorAll(".blob[data-depth]");
    if (!blobs.length) return;
    var ticking = false;
    window.addEventListener("scroll", function(){
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function(){
        var y = window.scrollY || document.documentElement.scrollTop;
        blobs.forEach(function(b){
          var depth = Number(b.getAttribute("data-depth"));
          b.style.transform = "translate3d(0," + (y * depth * 0.3) + "px,0)";
        });
        ticking = false;
      });
    }, { passive: true });
  }

  function wireScrollCue(){
    var cue = document.getElementById("scrollCue");
    if (!cue) return;
    cue.addEventListener("click", function(){
      var target = document.getElementById("calculator");
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  }

  window.CTP={CATEGORIES:CATEGORIES,ALL_KEYS:ALL_KEYS,state:state};
  function init(){
    var yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    ALL_KEYS.forEach(function(k){ wireControl(k); updateChip(k); });
    updateLiveGauge();

    wireCalculateButton();
    wireScrollProgress();
    wireScrollReveal();
    wireParallax();
    wireScrollCue();

    renderResults();
    renderRecommendations();
  }

  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/* ==========================================================================
   Ambient "carbon story" background — smoke rising -> ozone thinning ->
   earth heating -> "Your choices matter."
   Independent, self-booting IIFE. Uses the site's own palette so it reads
   as part of the existing ambient blob-field rather than a separate layer.
   Fixed + z-index:-1 + pointer-events:none throughout: cannot intercept
   input or affect layout of the calculator/content above it.
   ========================================================================== */
(function(){
  "use strict";

  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isMobile = window.innerWidth < 640;

  // colors pulled straight from :root's own palette, so the story stays
  // on-brand: mint (cool) -> amber (transition) -> coral (heat)
  var COOL = { r: 53,  g: 160, b: 107 };  // --mint-strong
  var MID  = { r: 232, g: 163, b: 61  };  // --amber
  var HOT  = { r: 226, g: 87,  b: 76  };  // --coral
  var ICE  = { r: 207, g: 233, b: 224 };  // matches blob--b

  function lerp(a,b,t){ return a + (b-a)*t; }
  function clamp(v,min,max){ return v<min?min:v>max?max:v; }
  function lerpColor(c1,c2,t){ return { r:lerp(c1.r,c2.r,t), g:lerp(c1.g,c2.g,t), b:lerp(c1.b,c2.b,t) }; }
  function rgb(c,a){ return "rgba("+(c.r|0)+","+(c.g|0)+","+(c.b|0)+","+a+")"; }
  function paletteAt(p){ return p < 0.55 ? lerpColor(COOL, MID, p/0.55) : lerpColor(MID, HOT, (p-0.55)/0.45); }

  var canvas = document.getElementById("cfc-bg-canvas");
  var textEl = document.getElementById("cfc-bg-text");
  if (!canvas || !textEl) return;
  var ctx = canvas.getContext("2d", { alpha: true });

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;
  function resize(){
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W*dpr); canvas.height = Math.round(H*dpr);
    canvas.style.width = W+"px"; canvas.style.height = H+"px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
    isMobile = W < 640;
    buildOzoneCracks();
  }

  // ---- Scene 1: smoke / CO2 particles ----
  var PARTICLE_COUNT = isMobile ? 16 : 32; // kept low: this is an accent, not the main visual
  var particles = [];
  function spawnParticle(p){
    p.x = Math.random()*W; p.y = H + Math.random()*80;
    p.vx = (Math.random()-0.5)*8; p.vy = -(14 + Math.random()*16);
    p.size = 10 + Math.random()*22; p.life = 0;
    p.maxLife = 7 + Math.random()*5; p.baseAlpha = 0.06 + Math.random()*0.09;
    p.wobble = Math.random()*Math.PI*2;
  }
  for (var i=0;i<PARTICLE_COUNT;i++){ var p={}; spawnParticle(p); p.life = Math.random()*p.maxLife; particles.push(p); }
  function updateParticles(dt){
    for (var i=0;i<particles.length;i++){
      var pt = particles[i]; pt.life += dt;
      if (pt.life >= pt.maxLife){ spawnParticle(pt); continue; }
      pt.wobble += dt*0.6;
      pt.x += (pt.vx + Math.sin(pt.wobble)*5)*dt;
      pt.y += pt.vy*dt; pt.size += dt*2.6;
    }
  }
  function drawParticles(alpha, tint){
    if (alpha <= 0.01) return;
    for (var i=0;i<particles.length;i++){
      var pt = particles[i];
      var lifeT = pt.life/pt.maxLife;
      var fade = lifeT<0.15 ? lifeT/0.15 : 1-Math.max(0,(lifeT-0.6)/0.4);
      var a = Math.max(0, pt.baseAlpha*fade*alpha);
      if (a <= 0.004) continue;
      var grad = ctx.createRadialGradient(pt.x,pt.y,0,pt.x,pt.y,pt.size);
      grad.addColorStop(0, rgb(tint,a)); grad.addColorStop(1, rgb(tint,0));
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(pt.x,pt.y,pt.size,0,Math.PI*2); ctx.fill();
    }
  }

  // ---- Scene 2: ozone layer thinning / cracking ----
  var cracks = [];
  function buildOzoneCracks(){
    cracks = [];
    var count = isMobile ? 6 : 10;
    for (var i=0;i<count;i++){
      var startX = (W/count)*i + Math.random()*30;
      var segs = []; var x = startX, y = H*0.16 + Math.random()*H*0.06;
      var segCount = 5 + ((Math.random()*4)|0);
      for (var s=0;s<segCount;s++){ x += (Math.random()-0.5)*50; y += 8 + Math.random()*18; segs.push({x:x,y:y}); }
      cracks.push({ start:{x:startX,y:H*0.16}, segs:segs, reveal: Math.random() });
    }
  }
  function drawOzone(alpha, t){
    if (alpha <= 0.01) return;
    var bandY = H*0.1, bandH = H*0.14;
    var grad = ctx.createLinearGradient(0,bandY,0,bandY+bandH);
    grad.addColorStop(0, rgb(ICE, 0.10*alpha)); grad.addColorStop(1, rgb(ICE, 0.015*alpha));
    ctx.fillStyle = grad; ctx.fillRect(0,bandY,W,bandH);
    ctx.strokeStyle = "rgba(255,255,255,"+(0.28*alpha)+")"; ctx.lineWidth = 1;
    for (var i=0;i<cracks.length;i++){
      var c = cracks[i]; var reveal = clamp(t*1.4 - c.reveal*0.4, 0, 1);
      if (reveal <= 0) continue;
      ctx.beginPath(); ctx.moveTo(c.start.x, c.start.y);
      var n = Math.max(1, Math.round(c.segs.length*reveal));
      for (var s=0;s<n;s++) ctx.lineTo(c.segs[s].x, c.segs[s].y);
      ctx.globalAlpha = alpha; ctx.stroke(); ctx.globalAlpha = 1;
    }
  }

  // ---- Scene 3: heating earth ----
  function drawEarth(alpha, colorT){
    if (alpha <= 0.01) return;
    var cx = W*0.5, cy = H*0.5, r = Math.min(W,H)*0.16;
    var core = lerpColor(COOL, HOT, colorT);
    ctx.save(); ctx.globalAlpha = alpha*0.5;
    var outer = ctx.createRadialGradient(cx,cy,r*0.2,cx,cy,r*1.9);
    outer.addColorStop(0, rgb(core,0.22)); outer.addColorStop(1, rgb(core,0));
    ctx.fillStyle = outer; ctx.beginPath(); ctx.arc(cx,cy,r*1.9,0,Math.PI*2); ctx.fill();
    var body = ctx.createRadialGradient(cx-r*0.3,cy-r*0.3,r*0.1,cx,cy,r);
    body.addColorStop(0, rgb(lerpColor({r:230,g:250,b:238}, {r:252,g:225,b:190}, colorT), 0.5));
    body.addColorStop(1, rgb(core, 0.35));
    ctx.fillStyle = body; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // ---- scroll progress across the whole page ----
  var rawProgress = 0, progress = 0;
  function readScroll(){
    var max = document.documentElement.scrollHeight - window.innerHeight;
    rawProgress = max > 4 ? clamp(window.scrollY / max, 0, 1) : 0;
  }
  window.addEventListener("scroll", readScroll, { passive: true });
  window.addEventListener("resize", function(){ resize(); readScroll(); }, { passive: true });

  var lastT = null, textVisible = false;
  function frame(now){
    if (lastT === null) lastT = now;
    var dt = Math.min(0.05, (now-lastT)/1000); lastT = now;
    var smoothing = 1 - Math.pow(0.001, dt);
    progress += (rawProgress - progress) * smoothing;

    ctx.clearRect(0,0,W,H);

    // very light ambient tint wash — meant to whisper, not repaint the page
    var bg = paletteAt(progress);
    ctx.fillStyle = rgb(bg, 0.05 + progress*0.05);
    ctx.fillRect(0,0,W,H);

    updateParticles(dt);
    var s = progress*4;
    var w0 = clamp(1-Math.abs(s-0.5),0,1);
    var w1 = clamp(1-Math.abs(s-1.5),0,1);
    var w2 = clamp(1-Math.abs(s-2.5),0,1);
    var w3 = clamp(1-Math.abs(s-3.5),0,1);

    var particleTint = lerpColor(COOL, HOT, progress);
    drawParticles(0.5 + w0*0.5, particleTint);
    drawOzone(w1, clamp(s-1,0,1));
    drawEarth(w2*0.9 + w3*0.4, progress);

    var showText = w3 > 0.55;
    if (showText !== textVisible){ textVisible = showText; textEl.classList.toggle("cfc-visible", textVisible); }
    textEl.style.opacity = String(clamp(w3*1.3,0,1));

    if(!document.hidden&&window.innerWidth>=640){requestAnimationFrame(frame);}else{lastT=null;setTimeout(function(){requestAnimationFrame(frame);},400);}
  }

  resize(); readScroll(); progress = rawProgress;
  if (!reducedMotion) requestAnimationFrame(frame);
})();
