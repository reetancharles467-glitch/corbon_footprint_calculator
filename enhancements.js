/* CarbonTrack Pro - enhancements. Vanilla JS, deferred. Reads state via window.CTP (exposed by app.js).
   Security: only numbers from validated inputs and static strings are rendered; report text goes through esc(). */
(function(){"use strict";
var $=function(id){return document.getElementById(id)};
var reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function num(v,min,max){v=parseFloat(v);return isNaN(v)?min:Math.min(max,Math.max(min,v))}

/* ---------- Story: observer + rAF parallax (only for scenes on screen, desktop only) ---------- */
(function(){var scenes=[].slice.call(document.querySelectorAll(".scene"));if(!scenes.length)return;
 var live=new Set(),ticking=false,par=!reduce&&innerWidth>768;
 if(!("IntersectionObserver" in window)){scenes.forEach(function(s){s.classList.add("in-view")});return}
 var io=new IntersectionObserver(function(es){es.forEach(function(e){
   if(e.isIntersecting){e.target.classList.add("in-view");live.add(e.target)}else live.delete(e.target)});
   if(par)tick()},{threshold:.2,rootMargin:"100px 0px"});
 scenes.forEach(function(s){io.observe(s)});
 function paint(){ticking=false;live.forEach(function(s){var r=s.getBoundingClientRect(),m=s.querySelector(".scene__media");
   if(m)m.style.transform="translate3d(0,"+((r.top+r.height/2-innerHeight/2)*-0.08).toFixed(1)+"px,0)"})}
 function tick(){if(!ticking){ticking=true;requestAnimationFrame(paint)}}
 if(par)addEventListener("scroll",tick,{passive:true});
})();

/* ---------- Accessibility: label sliders/numbers from their card headings ---------- */
document.querySelectorAll(".q-card").forEach(function(c){var h=c.querySelector("h3");if(!h)return;
 c.querySelectorAll("input").forEach(function(i){i.setAttribute("aria-label",h.textContent+(i.type==="number"?" (exact value)":""))})});
var lb=$("liveBadge");if(lb)lb.setAttribute("aria-live","polite");

/* ---------- Flights (hours in the air per year x ~90 kg CO2e/h, economy, representative) ---------- */
var FLIGHT_KG_H=90,flightHrs=0;
var fs=$("slider-flight"),fn=$("number-flight");
function fill(s){s.style.setProperty("--fill",((s.value-s.min)/(s.max-s.min)*100)+"%")}
function setFlight(v){flightHrs=num(v,0,200);fs.value=flightHrs;fn.value=flightHrs;fill(fs);
 $("chip-flight").textContent=Math.round(flightHrs*FLIGHT_KG_H)+" kg CO\u2082e/yr"}
if(fs&&fn){fs.addEventListener("input",function(){setFlight(fs.value)});fn.addEventListener("input",function(){if(fn.value!=="")setFlight(fn.value)});setFlight(fs.value)}

/* ---------- Snapshot-based insights ---------- */
var snap=null,CT=function(){return window.CTP};
var BADGES=[{max:2.3,i:"\uD83C\uDF0D",n:"Climate Hero",d:"At or below the Paris-aligned 2.3 t target."},
 {max:3.5,i:"\uD83C\uDFC6",n:"Eco Champion",d:"Well under the global average. Close to the target."},
 {max:4.7,i:"\uD83C\uDF31",n:"Eco Friendly",d:"At or below the global average of 4.7 t."},
 {max:1e9,i:"\uD83C\uDF21\uFE0F",n:"Needs Improvement",d:"Above the global average. Your recommendations show where to start."}];
function take(){var c=CT();if(!c)return;var cats=c.ALL_KEYS.map(function(k){return{k:k,label:c.CATEGORIES[k].label,icon:c.CATEGORIES[k].icon,year:c.CATEGORIES[k].factor(c.state[k])*365}});
 cats.push({k:"flight",label:"Flights",icon:"\u2708\uFE0F",year:flightHrs*FLIGHT_KG_H});
 var total=cats.reduce(function(s,x){return s+x.year},0);
 var top=cats.slice().sort(function(a,b){return b.year-a.year})[0];
 snap={cats:cats,total:total,tons:total/1000,top:top};render()}
function badge(t){return BADGES.find(function(b){return t<=b.max})}
function render(){if(!snap)return;var t=snap.tons,b=badge(t);
 $("badgeIcon").textContent=b.i;$("badgeName").textContent=b.n;$("badgeDesc").textContent=b.d;
 $("topSource").textContent="Your largest contributor is "+snap.top.label+" ("+Math.round(snap.top.year)+" kg CO\u2082e/year, "+Math.round(snap.top.year/Math.max(1,snap.total)*100)+"% of your total).";
 $("treeCount").textContent=Math.ceil(snap.total/21).toLocaleString();   /* ~21 kg CO2 absorbed per mature tree per year */
 var rows=[["Sustainable target",2.3,"#35A06B"],["Global average",4.7,"#E8A33D"],["You",t,t<=2.3?"#35A06B":t<=4.7?"#E8A33D":"#E2574C"]];
 var mx=Math.max(6,t*1.1);
 $("cmpChart").innerHTML=rows.map(function(r){return'<div class="cmp-row"><span>'+r[0]+'</span><div class="cmp-track"><div class="cmp-fill" style="width:'+Math.min(100,r[1]/mx*100)+'%;background:'+r[2]+'"></div></div><span class="cmp-val">'+r[1].toFixed(1)+' t</span></div>'}).join("");
 var sel=$("whatifCat");if(!sel.options.length){snap.cats.forEach(function(c){var o=document.createElement("option");o.value=c.k;o.textContent=c.icon+" "+c.label;sel.appendChild(o)});}
 sel.value=snap.top.k;
 whatif()}
function whatif(){if(!snap)return;var k=$("whatifCat").value,p=num($("whatifPct").value,0,100),c=snap.cats.find(function(x){return x.k===k});if(!c)return;
 $("whatifPctOut").textContent=p+"%";var s=c.year*p/100;
 $("whatifOut").textContent="Reducing "+c.label+" by "+p+"% saves about "+Math.round(s)+" kg CO\u2082e a year (\u2248 "+Math.ceil(s/21)+" trees) and brings you to "+((snap.total-s)/1000).toFixed(2)+" t/year."}
["whatifCat","whatifPct"].forEach(function(id){var e=$(id);if(e)e.addEventListener("input",whatif)});

/* ---------- Downloadable report (self-contained HTML; print to PDF from the browser) ---------- */
function report(){if(!snap)take();var b=badge(snap.tons),
 bars=snap.cats.map(function(c){return'<tr><td>'+esc(c.icon+" "+c.label)+'</td><td><div style="background:#35A06B;height:12px;width:'+Math.min(100,c.year/Math.max(1,snap.top.year)*100)+'%"></div></td><td>'+Math.round(c.year)+' kg</td></tr>'}).join(""),
 recs=[].slice.call(document.querySelectorAll("#recGrid .rec-card")).map(function(r){var h=r.querySelector("h4"),p=r.querySelector("p");return'<li><b>'+esc(h?h.textContent:"")+'</b>: '+esc(p?p.textContent:"")+'</li>'}).join("");
 var html='<!doctype html><meta charset="utf-8"><title>CarbonTrack Pro report</title><style>body{font:16px/1.5 Georgia,serif;max-width:760px;margin:30px auto;padding:0 20px;color:#172621}td{padding:6px 10px;border-bottom:1px solid #e4e9e2}table{width:100%;border-collapse:collapse}</style>'+
 '<h1>CarbonTrack Pro: my footprint</h1><p>'+new Date().toLocaleDateString()+'</p><h2>'+esc(b.i+" "+b.n)+'</h2><p>'+esc(b.d)+'</p>'+
 '<p><b>'+snap.tons.toFixed(2)+' t CO\u2082e / year</b> (target 2.3 t, global average 4.7 t). Equivalent to about '+Math.ceil(snap.total/21)+' trees per year.</p>'+
 '<h2>Breakdown (per year)</h2><table>'+bars+'</table><h2>Recommendations</h2><ul>'+recs+'</ul><p><small>Representative emission factors for educational use, not a certified audit.</small></p>';
 var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([html],{type:"text/html"}));a.download="carbontrack-report.html";document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href)},1000)}
var rb=$("reportBtn");if(rb)rb.addEventListener("click",report);
var cb=$("calculateBtn");if(cb)cb.addEventListener("click",take);
take();
})();
