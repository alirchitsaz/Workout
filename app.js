/* app.js - Chitsaz Training Lab v3.4 - arm-geometry figure (handle at arm end). */
var KEY = "ctl-v33";
var GOALS = { strength:"Strength", hypertrophy:"Muscle", "fat-loss":"Fat loss", posture:"Posture",
  mobility:"Mobility", "youth-athletic":"Athletic", "guest-safe":"Guest" };
var MUSCLES = ["chest","back","lats","shoulders","rear delts","quads","glutes","hamstrings","core","mobility"];
var MODES=["adult","teen","youth","guest"];
var COLORS=["#3ddc84","#7cc4ff","#f5c451","#ff5d6c","#c58cff","#4fd6c8","#ff9f6b"];
var TABS=[["home","Today","\u25C9"],["workout","Workout","\u25B6"],["progress","Progress","\u2197"],["settings","Settings","\u2699"]];
var view="home", wIndex=0, rest=0, restTick=null, activeWorkout=null, _color=null;
var state=load();

function defaults(){
  return {
    activeId:null,
    profiles:[
      {id:"ali",name:"Ali",mode:"adult",goal:"strength",max:120,heightIn:72,testing:true,color:"#3ddc84"},
      {id:"kristen",name:"Kristen",mode:"adult",goal:"posture",max:70,heightIn:61,testing:true,color:"#7cc4ff"},
      {id:"kam",name:"Kam",mode:"teen",goal:"youth-athletic",max:50,heightIn:60,testing:true,color:"#f5c451"},
      {id:"ashton",name:"Ashton",mode:"youth",goal:"youth-athletic",max:25,heightIn:49,testing:false,color:"#ff5d6c"}
    ],
    gym:{tracks:8,trackTopIn:76,trackBottomIn:6,armLenIn:30,armAngles:11,armDepth:5,min:10,max:200,inc:10,
      dumbbells:[3,5,8,10,12], attachments:["d-handle","rope","straight-bar","v-bar","lat-bar","ankle-strap"]},
    assess:{sore:[],minutes:35,goal:"strength",intensity:"moderate",pain:false},
    history:[], filter:"all", q:""
  };
}
function load(){
  var base=defaults();
  try{ var s=JSON.parse(localStorage.getItem(KEY)); if(!s) return base;
    return Object.assign({},base,s,{profiles:(s.profiles&&s.profiles.length)?s.profiles:base.profiles,
      gym:Object.assign({},base.gym,s.gym||{}),assess:Object.assign({},base.assess,s.assess||{}),
      history:Array.isArray(s.history)?s.history:[]});
  }catch(e){ return base; }
}
function save(){ localStorage.setItem(KEY,JSON.stringify(state)); }
function p(){ return state.profiles.filter(function(x){return x.id===state.activeId;})[0]||state.profiles[0]; }
function ex(id){ return EX.filter(function(x){return x.id===id;})[0]; }
function esc(v){ return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }
function ini(n){ return String(n||"?").trim().charAt(0).toUpperCase(); }
function ftin(inch){ return Math.floor(inch/12)+"'"+(inch%12)+'"'; }
function hIn(){ return p().heightIn||69; }
function mach(){ var g=state.gym; return {tracks:g.tracks,trackTopIn:g.trackTopIn,trackBottomIn:g.trackBottomIn,armLenIn:g.armLenIn,armAngles:g.armAngles,armDepth:g.armDepth,stackMin:g.min,stackMax:g.max,stackInc:g.inc}; }
function el(id){ return document.getElementById(id); }
function app(html){ el("app").innerHTML=html; }

function go(v){ view=v; render(); window.scrollTo(0,0); }
function render(){
  save();
  if(!state.activeId){ gate(); return; }
  ({home:home,workout:workout,library:library,progress:progress,settings:settings}[view]||home)();
  renderTabs();
}
function renderTabs(){
  var ex0=document.querySelector(".tabbar");
  var html='<nav class="tabbar">'+TABS.map(function(t){return '<button class="'+(view===t[0]?"on":"")+'" onclick="go(\''+t[0]+'\')"><span class="ti">'+t[2]+'</span>'+t[1]+'</button>';}).join("")+'</nav>';
  if(ex0) ex0.outerHTML=html; else document.body.insertAdjacentHTML("beforeend",html);
}
function gate(){
  var tb=document.querySelector(".tabbar"); if(tb) tb.remove();
  app('<div class="gate"><div><div class="kicker">Chitsaz Training Lab</div><h1>Who\u2019s training?</h1>'+
    '<p>Pick a profile. We\u2019ll remember you next time.</p></div>'+
    '<div class="gate-list">'+state.profiles.map(function(pr){
      return '<button class="gate-person" onclick="pick(\''+pr.id+'\')"><span class="avatar" style="--c:'+pr.color+'">'+ini(pr.name)+'</span>'+
        '<span class="meta"><b>'+esc(pr.name)+'</b><small>'+GOALS[pr.goal]+' \u00b7 '+ftin(pr.heightIn)+'</small></span><span class="go">\u203A</span></button>';
    }).join("")+
    '<button class="gate-add" onclick="sheetAddPerson()"><span class="plus">+</span><span>Add a person</span></button></div></div>');
}
function pick(id){ state.activeId=id; state.assess.goal=p().goal; view="home"; render(); }
function switchUser(){
  openSheet('<h3>Switch profile</h3><p class="sub">Everyone keeps their own plan and history.</p>'+
    '<div class="rows">'+state.profiles.map(function(pr){
      return '<button class="lrow" onclick="pick(\''+pr.id+'\');closeSheet()"><span class="avatar sm" style="--c:'+pr.color+'">'+ini(pr.name)+'</span>'+
        '<span class="lm"><b>'+esc(pr.name)+'</b><small>'+GOALS[pr.goal]+' \u00b7 '+ftin(pr.heightIn)+'</small></span>'+(pr.id===state.activeId?'<span style="color:var(--green)">\u2713</span>':'<span class="go">\u203A</span>')+'</button>';
    }).join("")+'</div><div class="sheet-actions"><button class="btn" onclick="sheetAddPerson()">+ Add person</button>'+
    '<button class="btn" onclick="state.activeId=null;closeSheet();render()">Sign out to gate</button></div>');
}
function greeting(){ var h=new Date().getHours(); return h<12?"Good morning":h<18?"Good afternoon":"Good evening"; }
function home(){
  var plan=buildPlan();
  app('<header class="appbar"><div class="appbar-left"><h1>'+greeting()+',<br>'+esc(p().name)+'</h1></div>'+
    '<button class="avatar" style="--c:'+p().color+'" onclick="switchUser()">'+ini(p().name)+'</button></header>'+
  '<div class="stack"><section class="card hero"><div class="kicker">Today\u2019s session</div>'+
    '<h2>'+esc(plan.title)+'</h2><div class="facts">'+esc(plan.focus)+' \u00b7 '+plan.minutes+' min \u00b7 '+plan.items.length+' exercises</div>'+
    '<button class="start" onclick="startWorkout()">Start workout \u2192</button>'+
    '<button class="adjust" onclick="sheetAdjust()">Adjust\u2026</button>'+
    '<div class="plist">'+plan.items.map(function(it,i){var e=ex(it.id);
      return '<div class="prow"><span class="n">'+(i+1)+'</span><span class="pm"><b>'+esc(e.name)+'</b><small>'+it.sets+' \u00d7 '+esc(it.reps)+'</small></span><span class="dotpill '+e.status+'">'+statusLabel(e.status)+'</span></div>';
    }).join("")+'</div></section></div>');
}
function sheetAdjust(){
  openSheet('<h3>Adjust today</h3><p class="sub">Tune the plan to how you feel.</p>'+
    '<div class="field"><label>Goal</label><select onchange="state.assess.goal=this.value;save()">'+
      Object.keys(GOALS).map(function(k){return '<option value="'+k+'" '+(state.assess.goal===k?"selected":"")+'>'+GOALS[k]+'</option>';}).join("")+'</select></div>'+
    '<div class="field"><label>Length</label><div class="seg">'+[20,35,50].map(function(m){return '<button class="'+(state.assess.minutes===m?"on":"")+'" onclick="state.assess.minutes='+m+';save();sheetAdjust()">'+m+' min</button>';}).join("")+'</div></div>'+
    '<div class="field"><label>Intensity</label><div class="seg">'+["easy","moderate","hard"].map(function(l){return '<button class="'+(state.assess.intensity===l?"on":"")+'" onclick="state.assess.intensity=\''+l+'\';save();sheetAdjust()">'+l+'</button>';}).join("")+'</div></div>'+
    '<div class="field"><label>Sore / avoid today</label><div class="chips">'+MUSCLES.map(function(m){return '<button class="chip '+(state.assess.sore.indexOf(m)>=0?"on":"")+'" onclick="toggleSore(\''+m+'\')">'+m+'</button>';}).join("")+'</div></div>'+
    '<div class="sheet-actions"><button class="btn primary block" onclick="closeSheet();render()">Apply</button></div>');
}
function toggleSore(m){ var s=state.assess.sore; state.assess.sore=s.indexOf(m)>=0?s.filter(function(x){return x!==m;}):s.concat(m); save(); sheetAdjust(); }

function buildPlan(){
  var count=state.assess.minutes===20?4:state.assess.minutes===35?5:7;
  var lastT=state.history[0]?state.history[0].template:null;
  var scored=TEMPLATES.map(function(t){var s=50;
    if(t.goals.indexOf(state.assess.goal)>=0)s+=24; if(t.goals.indexOf(p().goal)>=0)s+=12;
    if(p().mode==="guest"&&t.id==="guest")s+=45; if((p().mode==="teen"||p().mode==="youth")&&t.id==="youth")s+=24;
    if(state.assess.pain&&(t.id==="guest"||t.id==="posture"))s+=18; if(lastT===t.id)s-=90;
    state.assess.sore.forEach(function(m){if(t.focus.toLowerCase().indexOf(m)>=0)s-=15;});
    return Object.assign({},t,{score:s});
  }).sort(function(a,b){return b.score-a.score;});
  var t=scored[0];
  var pool=t.ids.map(ex).filter(Boolean).filter(elig).sort(function(a,b){return scoreEx(b)-scoreEx(a);});
  var items=pool.slice(0,count).sort(function(a,b){return grp(a).localeCompare(grp(b));}).map(prescribe);
  return {template:t.id,title:t.title,focus:t.focus,minutes:state.assess.minutes,items:items};
}
function elig(e){ if(!e)return false;
  if(p().mode==="guest"&&e.goals.indexOf("guest-safe")<0)return false;
  if(e.status!=="verified"&&!p().testing)return false;
  if(e.setup&&state.gym.attachments.indexOf(e.attach)<0)return false; return true; }
function scoreEx(e){var s=30;
  if(e.goals.indexOf(state.assess.goal)>=0)s+=16; if(e.goals.indexOf(p().goal)>=0)s+=10;
  if(e.status==="verified")s+=8; if(p().mode==="guest"&&e.complexity==="low")s+=12;
  if((p().mode==="teen"||p().mode==="youth")&&e.goals.indexOf("youth-athletic")>=0)s+=12;
  state.assess.sore.forEach(function(m){if(e.muscles.indexOf(m)>=0)s-=16;}); return s; }
function prescribe(e){var sets=e.sets;
  if(state.assess.minutes===20)sets=Math.max(1,sets-1); if(state.assess.minutes===50&&p().mode!=="guest")sets+=1;
  if(p().mode==="guest"||p().mode==="youth")sets=Math.min(sets,2);
  if(state.assess.intensity==="easy")sets=Math.max(1,sets-1); if(state.assess.intensity==="hard"&&p().mode!=="guest")sets+=1;
  var load=loadFor(e); var done=[]; for(var i=0;i<sets;i++)done.push({weight:load.weight||"",reps:"",rpe:7,done:false});
  return {id:e.id,sets:sets,reps:e.reps,rest:e.rest,load:load,done:done}; }
function nearestDumbbell(target){
  var d=state.gym.dumbbells&&state.gym.dumbbells.length?state.gym.dumbbells:[5];
  return d.reduce(function(a,b){return Math.abs(b-target)<Math.abs(a-target)?b:a;});
}
function loadFor(e){
  if(e.load==="time")return {weight:0,hint:"Track crisp seconds; stop before form fades."};
  if(e.load==="bodyweight")return {weight:0,hint:"Progress by range, tempo, and extra reps."};
  if(e.load==="dumbbell"){var t=(p().mode==="teen"||p().mode==="youth")?5:p().mode==="guest"?5:12;var w=nearestDumbbell(t);return {weight:w,hint:"Use your "+w+" lb dumbbells; slow the lowering if easy."};}
  var last=lastPerf(e.id); var target=e.cat==="legs"?50:e.cat==="pull"?40:30;
  if(p().mode==="teen"||p().mode==="youth")target=Math.min(target,30); if(p().mode==="guest")target=10;
  if(state.assess.intensity==="hard")target+=10;
  if(last){target=last.weight; if(parseInt(last.reps,10)>=hi(e.reps)&&last.rpe<=8)target+=state.gym.inc; if(last.rpe>=9.5)target-=state.gym.inc;}
  var capped=Math.min(target,p().max,state.gym.max); var r=Math.max(state.gym.min,Math.floor(capped/state.gym.inc)*state.gym.inc);
  return {weight:r,hint:(last?"Last "+last.weight+"\u00d7"+last.reps+" @ RPE "+last.rpe+". ":"")+"Suggested "+r+" lb per stack."}; }
function hi(r){var m=String(r).match(/(\d+)(?!.*\d)/);return m?+m[1]:10;}
function lastPerf(id){var h=state.history.filter(function(x){return x.profile===p().id;});
  for(var i=0;i<h.length;i++){var e=h[i].exercises.filter(function(x){return x.id===id;})[0];
    if(e&&e.sets.length)return e.sets.slice().sort(function(a,b){return b.weight-a.weight;})[0];} return null;}

function startWorkout(){ activeWorkout=buildPlan(); wIndex=0; view="workout"; render(); window.scrollTo(0,0); }
function workout(){
  if(!activeWorkout){ app('<header class="appbar"><h1>Workout</h1></header><div class="empty"><div class="big">\u25B6</div><b>No active workout</b><p>Head to Today and press Start.</p><button class="btn primary" onclick="go(\'home\')">Go to Today</button></div>'); renderTabs(); return; }
  var wp=activeWorkout; wIndex=Math.min(wIndex,wp.items.length-1);
  var it=wp.items[wIndex]; var e=ex(it.id);
  app('<div class="player-bar"><button class="link" onclick="'+(wIndex>0?"prevEx()":"go(\'home\')")+'">\u2039 '+(wIndex>0?"Back":"Home")+'</button>'+
    '<div class="mid"><b>Exercise '+(wIndex+1)+' of '+wp.items.length+'</b><small>'+esc(wp.title)+'</small></div>'+
    '<button class="link" onclick="'+(wIndex<wp.items.length-1?"nextEx()":"sheetFinish()")+'">'+(wIndex<wp.items.length-1?"Next \u203A":"Finish")+'</button></div>'+
  '<div class="progress-dots">'+wp.items.map(function(x,i){return '<span class="pd '+(i===wIndex?"on":"")+' '+(x.done.some(function(s){return s.done;})?"done":"")+'"></span>';}).join("")+'</div>'+
  '<div class="ex-title"><div class="row"><div><div class="kicker">'+esc(cat(e.cat))+'</div><h2>'+esc(e.name)+'</h2><small>'+esc(e.muscles.join(" \u00b7 "))+'</small></div>'+
    '<button class="icon-btn" onclick="sheetExMenu('+wIndex+')">\u22EF</button></div></div>'+
  figureCard(e)+
  '<div class="cues">'+e.cues.map(function(c){return '<span class="cue"><span class="ck">\u2713</span>'+esc(c)+'</span>';}).join("")+'</div>'+
  '<div class="logger"><div class="lg-head"><span>Set</span><span>Weight</span><span>Reps</span><span>RPE</span><span></span></div>'+
    it.done.map(function(s,si){return '<div class="lg-row '+(s.done?"done":"")+'"><span class="setn">'+(si+1)+'</span>'+
      '<input inputmode="numeric" value="'+esc(s.weight)+'" placeholder="'+(it.load.weight||"BW")+'" onchange="setVal('+wIndex+','+si+',\'weight\',this.value)">'+
      '<input inputmode="numeric" value="'+esc(s.reps)+'" placeholder="'+esc(it.reps)+'" onchange="setVal('+wIndex+','+si+',\'reps\',this.value)">'+
      '<input inputmode="numeric" value="'+esc(s.rpe)+'" onchange="setVal('+wIndex+','+si+',\'rpe\',this.value)">'+
      '<button class="ck" onclick="toggleSet('+wIndex+','+si+')">'+(s.done?"\u2713":"+")+'</button></div>';}).join("")+
    '<button class="lg-add" onclick="addSet('+wIndex+')">+ Add set</button></div>'+
  '<div class="fab-note" style="margin-top:10px">'+esc(it.load.hint)+'</div>'+
  (wIndex<wp.items.length-1?nextStrip(wp.items[wIndex+1]):'')+
  '<button class="finish" onclick="sheetFinish()">Finish workout</button>');
  renderTabs();
}
function nextStrip(it){var e=ex(it.id);return '<div class="next-strip"><div><div class="lbl">Up next</div><b>'+esc(e.name)+'</b></div>'+
  '<span class="dotpill '+e.status+' nn">'+statusLabel(e.status)+'</span></div>';}
function nextEx(){ if(wIndex<activeWorkout.items.length-1){wIndex++;render();window.scrollTo(0,0);} }
function prevEx(){ if(wIndex>0){wIndex--;render();window.scrollTo(0,0);} }
function cat(c){return {push:"Push",pull:"Pull",legs:"Legs",core:"Core",mobility:"Mobility",athletic:"Athletic"}[c]||c;}
function sheetExMenu(i){
  var e=ex(activeWorkout.items[i].id);
  openSheet('<h3>'+esc(e.name)+'</h3><p class="sub">Exercise options</p>'+
    '<button class="menu-item" onclick="closeSheet();sheetInfo(\''+e.id+'\')"><span class="ic">\u2139</span>How to do it</button>'+
    '<button class="menu-item" onclick="swap('+i+');closeSheet()"><span class="ic">\u21C4</span>Swap for another '+cat(e.cat).toLowerCase()+' move</button>'+
    '<button class="menu-item danger" onclick="removeEx('+i+');closeSheet()"><span class="ic">\u2715</span>Remove from workout</button>');
}
function swap(i){var cur=ex(activeWorkout.items[i].id);
  var rep=EX.filter(function(c){return c.id!==cur.id&&c.cat===cur.cat&&elig(c);})[0];
  if(rep)activeWorkout.items[i]=prescribe(rep); render();}
function removeEx(i){ if(activeWorkout.items.length<=1)return; activeWorkout.items.splice(i,1); wIndex=Math.min(wIndex,activeWorkout.items.length-1); render(); }

/* ===== FIGURE: arm-geometry (handle at arm end lines up with body) ===== */
function figureCard(e){
  if(!e.setup||!BIO.hasMove(e.id)) return zoneCard(e);
  var s=BIO.solve(e.id,hIn(),mach());
  return '<div class="figure-card">'+figSvg(s,false)+
    '<div class="setrow">'+
      '<div class="setpill"><b>'+s.track+' / 8</b><small>Track</small></div>'+
      '<div class="setpill"><b>'+s.ang+' / 11</b><small>Arm tilt</small></div>'+
      '<div class="setpill"><b>'+s.dep+' / 5</b><small>Arm in\u2013out</small></div>'+
    '</div>'+
    '<div class="callout" style="border-radius:14px;margin-top:10px;border:1px solid var(--line)"><span class="badge">Set up</span><span class="txt">'+esc(s.instruction)+'</span></div></div>';
}
function zoneCard(e){
  var g=e.equipment==="dumbbells"?"\uD83C\uDFCB\uFE0F":e.equipment==="bench"?"\uD83E\uDE91":e.equipment==="bosu"?"\uD83D\uDD35":"\uD83E\uDDD8";
  var note=e.equipment==="dumbbells"?("Use your "+(state.gym.dumbbells.join(", "))+" lb dumbbells."):
    e.equipment==="bench"?"Flat bench, clear of the cable path.":e.equipment==="bosu"?"BOSU dome up for an unstable base.":"Open mat in front of the trainer.";
  return '<div class="figure-card"><div style="display:grid;place-items:center;gap:8px;padding:40px 16px;background:var(--bg2)">'+
    '<div style="font-size:3rem">'+g+'</div><b>'+esc(e.equipment)+'</b></div>'+
    '<div class="callout"><span class="badge">Setup</span><span class="txt">'+esc(note)+'</span></div></div>';
}
function figSvg(s,mini){
  var W=340,H=mini?150:280,floorY=H-20,pad=16,m=s.machine;
  var topIn=Math.max(m.trackTopIn,s.userHeightIn*1.25)+4;
  var ppi=(floorY-pad)/topIn; function y(v){return floorY-v*ppi;}
  var towerLeft=(s.posture==="lying"&&s.headToMachine);
  var towerX=towerLeft?42:298;
  var mountY=y(s.mountIn);
  var drawn=drawBody(s,y,floorY,mini,towerX,towerLeft);
  var svg='<svg class="fig" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet" aria-label="'+esc(s.posture)+' setup">';
  svg+='<line class="floor" x1="10" y1="'+floorY+'" x2="'+(W-10)+'" y2="'+floorY+'"></line>';
  svg+='<rect class="tower" x="'+(towerX-10)+'" y="'+y(m.trackTopIn)+'" width="20" height="'+(floorY-y(m.trackTopIn))+'" rx="6"></rect>';
  svg+='<line class="rail" x1="'+towerX+'" y1="'+y(m.trackTopIn)+'" x2="'+towerX+'" y2="'+y(m.trackBottomIn)+'"></line>';
  if(!mini){ for(var t=1;t<=m.tracks;t++){ var ty=y(BIO.trackHeight(t,m)); var on=(t===s.track);
    var lx=towerLeft?(towerX+14):(towerX-14);
    svg+='<circle class="tickdot '+(on?"on":"")+'" cx="'+lx+'" cy="'+ty+'" r="'+(on?4:2.5)+'"></circle>';
    svg+='<text class="tt '+(on?"on":"")+'" x="'+(towerLeft?lx+8:lx-8)+'" y="'+(ty+3)+'" text-anchor="'+(towerLeft?"start":"end")+'">'+t+'</text>';
  }}
  // RIGID ARM from mount pivot on tower out to the handle at the body
  svg+='<line class="arm" x1="'+towerX+'" y1="'+mountY+'" x2="'+drawn.hx+'" y2="'+drawn.hy+'"></line>';
  svg+='<circle class="pivot" cx="'+towerX+'" cy="'+mountY+'" r="5"></circle>';
  // body
  svg+=drawn.svg;
  // handle at the arm end (this is what lines up with the body)
  svg+='<circle class="handle" cx="'+drawn.hx+'" cy="'+drawn.hy+'" r="7"></circle>';
  if(!mini) svg+='<text class="cap g" x="'+towerX+'" y="'+(mountY-10)+'" text-anchor="middle">track '+s.track+'</text>';
  svg+='</svg>';
  return svg;
}
function drawBody(s,y,floorY,mini,towerX,towerLeft){
  var h=s.userHeightIn;
  function limb(x1,y1,x2,y2){return '<path class="limb" d="M '+x1+' '+y1+' L '+x2+' '+y2+'"></path>';}
  var handleY=y(s.handleIn);
  if(s.posture==="lying"){
    var benchY=y(18), padH=8, headX=towerX+46, feetX=headX+150, bx0=headX-8, bx1=feetX+6;
    var svg='';
    svg+='<rect class="bench" x="'+bx0+'" y="'+benchY+'" width="'+(bx1-bx0)+'" height="'+padH+'" rx="4"></rect>';
    svg+='<line class="bench-leg" x1="'+(bx0+12)+'" y1="'+(benchY+padH)+'" x2="'+(bx0+6)+'" y2="'+floorY+'"></line>';
    svg+='<line class="bench-leg" x1="'+(bx1-12)+'" y1="'+(benchY+padH)+'" x2="'+(bx1-6)+'" y2="'+floorY+'"></line>';
    var torsoY=benchY-2;
    svg+='<rect class="body" x="'+(headX+8)+'" y="'+(torsoY-11)+'" width="64" height="20" rx="10"></rect>';
    svg+='<circle class="body" cx="'+headX+'" cy="'+(torsoY-1)+'" r="10"></circle>';
    svg+=limb(headX+72,torsoY,feetX-6,torsoY-2); svg+=limb(feetX-6,torsoY-2,feetX+2,floorY-2);
    var chestX=headX+22, hx=chestX+26, hy=Math.min(torsoY-18, handleY);
    svg+=limb(chestX,torsoY-6,hx,hy); svg+=limb(chestX+8,torsoY-6,hx-2,hy+2);
    return {svg:svg,hx:hx,hy:hy};
  }
  if(s.posture==="seated"){
    var benchY=y(18), bodyX=180, seatX0=bodyX-32, seatX1=bodyX+30;
    var hipY=benchY-2, shoulderY=hipY-52, crownY=shoulderY-22;
    var svg='';
    svg+='<rect class="bench" x="'+seatX0+'" y="'+benchY+'" width="'+(seatX1-seatX0)+'" height="8" rx="4"></rect>';
    svg+='<line class="bench-leg" x1="'+(seatX0+8)+'" y1="'+(benchY+8)+'" x2="'+(seatX0+3)+'" y2="'+floorY+'"></line>';
    svg+='<line class="bench-leg" x1="'+(seatX1-8)+'" y1="'+(benchY+8)+'" x2="'+(seatX1-3)+'" y2="'+floorY+'"></line>';
    svg+='<rect class="body" x="'+(bodyX-11)+'" y="'+shoulderY+'" width="22" height="'+(hipY-shoulderY)+'" rx="10"></rect>';
    svg+='<circle class="body" cx="'+bodyX+'" cy="'+(crownY+10)+'" r="10"></circle>';
    svg+=limb(bodyX-4,hipY,bodyX-40,hipY+2); svg+=limb(bodyX-40,hipY+2,bodyX-44,floorY);
    var hx=bodyX-42, hy=handleY;   // reach toward tower (left)
    svg+=limb(bodyX,shoulderY+8,hx,hy);
    return {svg:svg,hx:hx,hy:hy};
  }
  if(s.posture==="kneel"||s.posture==="half-kneel"){
    var bodyX=180, kneeY=y(6), hipY=kneeY-(s.posture==="kneel"?38:44), shoulderY=hipY-48, crownY=shoulderY-20;
    var svg='';
    svg+='<rect class="body" x="'+(bodyX-11)+'" y="'+shoulderY+'" width="22" height="'+(hipY-shoulderY)+'" rx="10"></rect>';
    svg+='<circle class="body" cx="'+bodyX+'" cy="'+(crownY+10)+'" r="10"></circle>';
    if(s.posture==="kneel"){ svg+=limb(bodyX-4,hipY,bodyX-16,floorY); svg+=limb(bodyX+4,hipY,bodyX+16,floorY); }
    else { svg+=limb(bodyX-4,hipY,bodyX-26,y(3)); svg+=limb(bodyX-26,y(3),bodyX-30,floorY); svg+=limb(bodyX+4,hipY,bodyX+14,floorY); }
    var hx=bodyX-8, hy=handleY;  // hands up toward overhead handle
    svg+=limb(bodyX,shoulderY+6,hx,hy);
    return {svg:svg,hx:hx,hy:hy};
  }
  // standing
  var bodyX=168, crownY=y(h), shoulderY=y(h*0.82), hipY=y(h*0.50), hr=Math.max(8,(shoulderY-crownY)/2.2);
  var toward=s.face==="toward", side=s.face==="side";
  var hx = toward ? bodyX-42 : (side ? bodyX+40 : bodyX+48);  // toward=reach to tower(left); away=press out(right)
  var hy = handleY;
  var torso='M '+(bodyX-13)+' '+shoulderY+' Q '+(bodyX-16)+' '+((shoulderY+hipY)/2)+' '+(bodyX-9)+' '+hipY+' L '+(bodyX+9)+' '+hipY+' Q '+(bodyX+16)+' '+((shoulderY+hipY)/2)+' '+(bodyX+13)+' '+shoulderY+' Q '+bodyX+' '+(shoulderY-6)+' '+(bodyX-13)+' '+shoulderY+' Z';
  var svg=''; svg+=limb(bodyX-6,hipY,bodyX-12,floorY); svg+=limb(bodyX+6,hipY,bodyX+12,floorY);
  svg+='<path class="body" d="'+torso+'"></path>';
  svg+='<circle class="body" cx="'+bodyX+'" cy="'+(crownY+hr)+'" r="'+hr+'"></circle>';
  svg+=limb(bodyX,shoulderY+2,hx,hy);
  return {svg:svg,hx:hx,hy:hy};
}
function sheetInfo(id){
  var e=ex(id);
  var body='<h3>'+esc(e.name)+'</h3><p class="sub">'+esc(e.muscles.join(" \u00b7 "))+'</p>';
  if(e.setup&&BIO.hasMove(e.id)){ var s=BIO.solve(e.id,hIn(),mach());
    body+='<div class="mini-figs"><div class="mini-fig">'+figSvg(Object.assign({},s,{handleIn:s.startIn}),true)+'<div class="lbl start">Start \u00b7 '+esc(s.startLandmark)+'</div></div>'+
      '<div class="mini-fig">'+figSvg(Object.assign({},s,{handleIn:s.finishIn}),true)+'<div class="lbl">Finish \u00b7 '+esc(s.finishLandmark)+'</div></div></div>'+
      '<div class="callout" style="border-radius:14px;margin-top:14px;border:1px solid var(--line)"><span class="badge">Why</span><span class="txt">'+esc(s.why)+'</span></div>'; }
  body+='<div class="cues" style="margin-top:14px">'+e.cues.map(function(c){return '<span class="cue"><span class="ck">\u2713</span>'+esc(c)+'</span>';}).join("")+'</div>';
  openSheet(body);
}

function setVal(ei,si,k,v){var s=activeWorkout.items[ei].done[si];s[k]=(k==="weight"||k==="rpe")?Number(v):v;save();}
function addSet(ei){var it=activeWorkout.items[ei];it.done.push({weight:it.load.weight||"",reps:"",rpe:7,done:false});render();}
function toggleSet(ei,si){var it=activeWorkout.items[ei],s=it.done[si];s.done=!s.done;
  if(s.done){if(!s.reps)s.reps=it.reps;if(!s.weight)s.weight=it.load.weight;startRest(it.rest);}render();}
function startRest(sec){rest=sec;clearInterval(restTick);restTick=setInterval(function(){rest=Math.max(0,rest-1);paintRest();if(!rest)clearInterval(restTick);},1000);paintRest();}
function paintRest(){var t=el("timer");t.classList.toggle("hide",!rest);
  t.innerHTML='<div style="display:flex;gap:12px;align-items:center;padding:12px 14px"><span style="color:var(--muted);font-size:.72rem;font-weight:800">REST</span>'+
  '<b style="font-size:1.3rem;color:var(--green);font-family:ui-monospace,monospace">'+String(Math.floor(rest/60)).padStart(2,"0")+":"+String(rest%60).padStart(2,"0")+'</b>'+
  '<button class="link" onclick="rest+=15;paintRest()">+15</button><button class="link" onclick="rest=0;paintRest()">Skip</button></div>';}
function sheetFinish(){
  var done=activeWorkout.items.reduce(function(n,i){return n+i.done.filter(function(s){return s.done;}).length;},0);
  openSheet('<h3>Finish workout?</h3><p class="sub">'+done+' sets logged. Saved to '+esc(p().name)+'\u2019s progress.</p>'+
    '<div class="sheet-actions"><button class="btn primary block" onclick="commitWorkout()">Save & finish</button>'+
    '<button class="btn block" onclick="closeSheet()">Keep going</button></div>');
}
function commitWorkout(){
  var wp=activeWorkout; var done=wp.items.reduce(function(n,i){return n+i.done.filter(function(s){return s.done;}).length;},0);
  if(!done){ closeSheet(); return; }
  var exs=wp.items.map(function(i){return {id:i.id,sets:i.done.filter(function(s){return s.done;}).map(function(s){return {weight:Number(s.weight)||0,reps:String(s.reps||i.reps),rpe:Number(s.rpe)||7};})};});
  var vol=exs.reduce(function(a,e){return a+e.sets.reduce(function(x,s){return x+s.weight*(parseInt(s.reps,10)||0);},0);},0);
  state.history.unshift({id:"s"+Date.now(),profile:p().id,date:new Date().toISOString(),title:wp.title,template:wp.template,minutes:wp.minutes,totalSets:done,totalVolume:vol,exercises:exs});
  activeWorkout=null; closeSheet(); view="progress"; render();
}

function library(){
  var q=state.q.toLowerCase(),f=state.filter;
  var list=EX.filter(function(e){var hay=(e.name+" "+e.cat+" "+e.muscles.join(" ")+" "+e.equipment).toLowerCase();
    return (!q||hay.indexOf(q)>=0)&&(f==="all"||f===e.cat||f===e.equipment);});
  app('<header class="appbar"><div class="appbar-left"><h1>Library</h1><div class="sub">'+list.length+' exercises</div></div>'+
    '<button class="avatar" style="--c:'+p().color+'" onclick="switchUser()">'+ini(p().name)+'</button></header>'+
    '<div class="field"><input placeholder="Search\u2026" value="'+esc(state.q)+'" oninput="state.q=this.value;render()"></div>'+
    '<div class="seg" style="margin-bottom:14px">'+["all","push","pull","legs","core"].map(function(x){return '<button class="'+(state.filter===x?"on":"")+'" onclick="state.filter=\''+x+'\';render()">'+x+'</button>';}).join("")+'</div>'+
    '<div class="rows">'+list.map(function(e){return '<button class="lrow" onclick="sheetInfo(\''+e.id+'\')"><span class="ic" style="background:rgba(255,255,255,.06);color:var(--muted)">'+cat(e.cat).charAt(0)+'</span>'+
      '<span class="lm"><b>'+esc(e.name)+'</b><small>'+esc(e.muscles.join(", "))+'</small></span><span class="dotpill '+e.status+'">'+statusLabel(e.status)+'</span></button>';}).join("")+'</div>');
  renderTabs();
}
function progress(){
  var items=state.history.filter(function(s){return s.profile===p().id;});
  var st=stats();
  app('<header class="appbar"><div class="appbar-left"><h1>Progress</h1><div class="sub">'+esc(p().name)+'</div></div>'+
    '<button class="avatar" style="--c:'+p().color+'" onclick="switchUser()">'+ini(p().name)+'</button></header>'+
    '<div class="metric-grid" style="margin-bottom:16px">'+
      '<div class="metric"><b>'+st.sessions+'</b><small>Sessions</small></div>'+
      '<div class="metric"><b>'+st.sets+'</b><small>Sets logged</small></div>'+
      '<div class="metric"><b>'+Math.round(st.volume/1000)+'k</b><small>Volume (lb)</small></div>'+
      '<div class="metric"><b>'+st.streak+'</b><small>Day streak</small></div></div>'+
    (items.length?'<div class="rows">'+items.map(function(s){return '<div class="lrow"><span class="ic">\u2713</span>'+
      '<span class="lm"><b>'+esc(s.title)+'</b><small>'+new Date(s.date).toLocaleDateString()+' \u00b7 '+s.totalSets+' sets \u00b7 '+s.totalVolume+' lb</small></span><span class="go">'+s.minutes+'m</span></div>';}).join("")+'</div>'
      :'<div class="empty"><div class="big">\u2197</div><b>No sessions yet</b><p>Finish a workout to see it here.</p></div>'));
  renderTabs();
}
function stats(pid){pid=pid||p().id;var h=state.history.filter(function(s){return s.profile===pid;});
  return {sessions:h.length,sets:h.reduce(function(a,s){return a+s.totalSets;},0),volume:h.reduce(function(a,s){return a+s.totalVolume;},0),streak:streak(h)};}
function streak(h){if(!h.length)return 0;var d={};h.forEach(function(s){d[new Date(s.date).toDateString()]=1;});var c=0,day=new Date();while(d[day.toDateString()]){c++;day.setDate(day.getDate()-1);}return c||1;}

function settings(){
  app('<header class="appbar"><div class="appbar-left"><h1>Settings</h1></div>'+
    '<button class="avatar" style="--c:'+p().color+'" onclick="switchUser()">'+ini(p().name)+'</button></header>'+
    '<div class="kicker" style="margin:4px 0 8px">People</div>'+
    '<div class="rows" style="margin-bottom:18px">'+state.profiles.map(function(pr){return '<button class="lrow" onclick="sheetEditPerson(\''+pr.id+'\')">'+
      '<span class="avatar sm" style="--c:'+pr.color+'">'+ini(pr.name)+'</span><span class="lm"><b>'+esc(pr.name)+'</b><small>'+GOALS[pr.goal]+' \u00b7 '+ftin(pr.heightIn)+' \u00b7 '+pr.max+' lb cap</small></span><span class="go">\u203A</span></button>';}).join("")+
      '<button class="lrow" onclick="sheetAddPerson()"><span class="ic">+</span><span class="lm"><b>Add person</b></span></button></div>'+
    '<div class="kicker" style="margin:4px 0 8px">Equipment</div>'+
    '<div class="rows"><button class="lrow" onclick="sheetMachine()"><span class="ic">\u2699</span><span class="lm"><b>Apex Free-Arm Trainer</b><small>8 tracks \u00b7 tilt 1-11 \u00b7 in/out 1-5 \u00b7 2\u00d7'+state.gym.max+' lb</small></span><span class="go">\u203A</span></button>'+
    '<button class="lrow" onclick="sheetDumbbells()"><span class="ic">\uD83C\uDFCB\uFE0F</span><span class="lm"><b>Dumbbells</b><small>'+state.gym.dumbbells.join(", ")+' lb</small></span><span class="go">\u203A</span></button>'+
    '<button class="lrow" onclick="sheetAttach()"><span class="ic">\uD83D\uDD17</span><span class="lm"><b>Attachments</b><small>'+state.gym.attachments.join(", ")+'</small></span><span class="go">\u203A</span></button></div>'+
    '<div class="fab-note" style="margin-top:20px">Chitsaz Training Lab \u00b7 '+EX.length+' exercises \u00b7 local-first, no account.</div>');
  renderTabs();
}
function personForm(pr){
  return '<div class="field"><label>Name</label><input id="f-name" value="'+esc(pr.name)+'"></div>'+
    '<div class="field-2"><div class="field"><label>Height ft</label><input id="f-ft" inputmode="numeric" value="'+Math.floor(pr.heightIn/12)+'"></div>'+
    '<div class="field"><label>Height in</label><input id="f-in" inputmode="numeric" value="'+(pr.heightIn%12)+'"></div></div>'+
    '<div class="field-2"><div class="field"><label>Mode</label><select id="f-mode">'+MODES.map(function(m){return '<option '+(pr.mode===m?"selected":"")+'>'+m+'</option>';}).join("")+'</select></div>'+
    '<div class="field"><label>Cable cap (lb)</label><input id="f-max" inputmode="numeric" value="'+pr.max+'"></div></div>'+
    '<div class="field"><label>Goal</label><select id="f-goal">'+Object.keys(GOALS).map(function(k){return '<option value="'+k+'" '+(pr.goal===k?"selected":"")+'>'+GOALS[k]+'</option>';}).join("")+'</select></div>'+
    '<div class="field"><label>Color</label><div class="chips" id="f-color">'+COLORS.map(function(c){return '<button class="chip '+(pr.color===c?"on":"")+'" onclick="pickColor(this,\''+c+'\')" data-c="'+c+'"><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:'+c+'"></span></button>';}).join("")+'</div></div>';
}
function pickColor(btn,c){_color=c;var box=el("f-color");Array.prototype.forEach.call(box.children,function(x){x.classList.remove("on");});btn.classList.add("on");}
function sheetAddPerson(){ _color=COLORS[state.profiles.length%COLORS.length];
  openSheet('<h3>Add person</h3><p class="sub">They get their own plan, height, and history.</p>'+personForm({name:"",heightIn:68,mode:"adult",max:60,goal:"hypertrophy",color:_color})+
    '<div class="sheet-actions"><button class="btn primary block" onclick="saveNewPerson()">Add</button></div>'); }
function saveNewPerson(){
  var id="p"+Date.now();
  state.profiles.push({id:id,name:el("f-name").value||"New Person",mode:el("f-mode").value,goal:el("f-goal").value,
    max:+el("f-max").value||60,heightIn:(+el("f-ft").value||5)*12+(+el("f-in").value||8),testing:true,color:_color||COLORS[0]});
  closeSheet(); if(!state.activeId){ pick(id); } else render();
}
function sheetEditPerson(id){var pr=state.profiles.filter(function(x){return x.id===id;})[0];_color=pr.color;
  openSheet('<h3>Edit '+esc(pr.name)+'</h3>'+personForm(pr)+
    '<div class="sheet-actions"><button class="btn primary block" onclick="saveEditPerson(\''+id+'\')">Save</button>'+
    (state.profiles.length>1?'<button class="btn block" style="color:var(--red)" onclick="delPerson(\''+id+'\')">Remove person</button>':'')+'</div>'); }
function saveEditPerson(id){
  state.profiles=state.profiles.map(function(pr){return pr.id!==id?pr:Object.assign({},pr,{
    name:el("f-name").value||pr.name,mode:el("f-mode").value,goal:el("f-goal").value,max:+el("f-max").value||pr.max,
    heightIn:(+el("f-ft").value||5)*12+(+el("f-in").value||0),color:_color||pr.color});});
  closeSheet();render();
}
function delPerson(id){ if(state.profiles.length<=1)return;
  state.profiles=state.profiles.filter(function(x){return x.id!==id;});
  if(state.activeId===id)state.activeId=state.profiles[0].id; closeSheet();render(); }
function sheetMachine(){
  openSheet('<h3>Apex Free-Arm Trainer</h3><p class="sub">These drive every setup the app shows.</p>'+
    '<div class="legend"><b>Your machine\u2019s levers</b>'+
      '<div><b>Track 1\u20138</b> \u2014 vertical mount height. 1 = highest, 8 = lowest.</div>'+
      '<div><b>Arm tilt 1\u201311</b> \u2014 swings the arm up/down (6 = level).</div>'+
      '<div><b>Arm in/out 1\u20135</b> \u2014 1 = all in, 5 = all out.</div>'+
      '<div>The <b>handle at the arm end</b> is what you line up with your body \u2014 pick the track, then tilt/extend the arm so the handles meet the right spot.</div>'+
      '<div><b>Dual stacks</b> \u2014 '+state.gym.min+'\u2013'+state.gym.max+' lb in '+state.gym.inc+' lb steps, per side.</div></div>'+
    '<div class="field-2"><div class="field"><label>Highest track height (in)</label><input id="m-top" inputmode="numeric" value="'+state.gym.trackTopIn+'"></div>'+
    '<div class="field"><label>Lowest track height (in)</label><input id="m-bot" inputmode="numeric" value="'+state.gym.trackBottomIn+'"></div></div>'+
    '<div class="field"><label>Arm length (in)</label><input id="m-arm" inputmode="numeric" value="'+state.gym.armLenIn+'"></div>'+
    '<div class="field-3"><div class="field"><label>Stack min</label><input id="m-min" inputmode="numeric" value="'+state.gym.min+'"></div>'+
    '<div class="field"><label>Stack max</label><input id="m-max" inputmode="numeric" value="'+state.gym.max+'"></div>'+
    '<div class="field"><label>Step</label><input id="m-inc" inputmode="numeric" value="'+state.gym.inc+'"></div></div>'+
    '<div class="sheet-actions"><button class="btn primary block" onclick="saveMachine()">Save</button></div>'); }
function saveMachine(){state.gym.trackTopIn=+el("m-top").value||76;state.gym.trackBottomIn=+el("m-bot").value||6;
  state.gym.armLenIn=+el("m-arm").value||30;state.gym.min=+el("m-min").value||10;state.gym.max=+el("m-max").value||200;state.gym.inc=+el("m-inc").value||10;closeSheet();render();}
function sheetDumbbells(){
  openSheet('<h3>Dumbbells</h3><p class="sub">List the pairs you own (lb), comma separated.</p>'+
    '<div class="field"><label>Owned dumbbells</label><input id="d-list" value="'+state.gym.dumbbells.join(", ")+'"></div>'+
    '<div class="sheet-actions"><button class="btn primary block" onclick="saveDumbbells()">Save</button></div>'); }
function saveDumbbells(){var v=el("d-list").value.split(",").map(function(x){return parseInt(x.trim(),10);}).filter(function(n){return n>0;});
  if(v.length)state.gym.dumbbells=v.sort(function(a,b){return a-b;});closeSheet();render();}
function sheetAttach(){
  var all=["d-handle","rope","straight-bar","v-bar","lat-bar","curl-bar","ankle-strap"];
  openSheet('<h3>Attachments</h3><p class="sub">What\u2019s in your bin. Exercises filter to these.</p>'+
    '<div class="chips">'+all.map(function(a){return '<button class="chip '+(state.gym.attachments.indexOf(a)>=0?"on":"")+'" onclick="toggleAttach(\''+a+'\')">'+a+'</button>';}).join("")+'</div>'+
    '<div class="sheet-actions"><button class="btn primary block" onclick="closeSheet();render()">Done</button></div>'); }
function toggleAttach(a){var arr=state.gym.attachments;state.gym.attachments=arr.indexOf(a)>=0?arr.filter(function(x){return x!==a;}):arr.concat(a);sheetAttach();}

function openSheet(html){var s=el("sheet"),sc=el("scrim");s.innerHTML='<div class="grabber"></div>'+html;
  s.classList.remove("hide");sc.classList.remove("hide");requestAnimationFrame(function(){s.classList.add("show");sc.classList.add("show");});}
function closeSheet(){var s=el("sheet"),sc=el("scrim");s.classList.remove("show");sc.classList.remove("show");
  setTimeout(function(){s.classList.add("hide");sc.classList.add("hide");},260);}

function grp(e){return e.setup?e.setup.group:e.equipment;}
function statusLabel(s){return s==="testing"?"start light":s;}

render();
