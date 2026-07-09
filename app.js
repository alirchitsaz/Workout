/* app.js - Chitsaz Training Lab. Requires data.js + biomechanics.js loaded first. */
var KEY = "chitsaz-training-lab-v6";
var GOALS = { strength:"Strength", hypertrophy:"Muscle", "fat-loss":"Fat loss", posture:"Posture",
  mobility:"Mobility", "youth-athletic":"Youth athletic", "guest-safe":"Guest safe" };
var MUSCLES = ["chest","back","lats","shoulders","rear delts","quads","glutes","hamstrings","core","mobility"];
var MODES = ["adult","teen","youth","guest"];
var COLORS = ["#39d98a","#7cc4ff","#f4c04e","#e8505b","#c58cff","#4fd6c8","#ff9f6b"];
var VIEWS = [["home","Today"],["workout","Workout"],["library","Library"],["history","Progress"],["menu","Menu"]];

var view = "home";
var wIndex = 0;
var rest = 0, restTick = null;
var state = load();

/* ---------------- state ---------------- */
function defaults(){
  return {
    onboarded:false,
    profiles:[
      { id:"ali",     name:"Ali",     mode:"adult", goal:"strength",       max:120, heightIn:72, testing:true,  color:"#39d98a" },
      { id:"kristen", name:"Kristen", mode:"adult", goal:"posture",        max:70,  heightIn:61, testing:true,  color:"#7cc4ff" },
      { id:"kam",     name:"Kam",     mode:"teen",  goal:"youth-athletic", max:50,  heightIn:60, testing:true,  color:"#f4c04e" },
      { id:"ashton",  name:"Ashton",  mode:"youth", goal:"youth-athletic", max:25,  heightIn:49, testing:false, color:"#e8505b" }
    ],
    active:"ali",
    gym:{ positions:20, minHeightIn:6, maxHeightIn:78,
      attachments:["d-handle","rope","straight-bar","ankle-strap","none"], min:10, max:200, inc:10 },
    assessment:{ sore:[], minutes:35, goal:"strength", intensity:"moderate", pain:false },
    history:[], activeWorkout:null, filter:"all", q:""
  };
}
function load(){
  var base = defaults();
  try{
    var raw = localStorage.getItem(KEY);
    if(!raw) return base;
    var s = JSON.parse(raw);
    return Object.assign({}, base, s, {
      profiles: (Array.isArray(s.profiles) && s.profiles.length) ? s.profiles : base.profiles,
      gym: Object.assign({}, base.gym, s.gym||{}),
      assessment: Object.assign({}, base.assessment, s.assessment||{}),
      history: Array.isArray(s.history) ? s.history : []
    });
  }catch(e){ return base; }
}
function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
function p(){ return state.profiles.filter(function(x){return x.id===state.active;})[0] || state.profiles[0]; }
function ex(id){ return EX.filter(function(x){return x.id===id;})[0]; }
function esc(v){ return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }
function initials(n){ return String(n||"?").split(/[ /]+/).filter(Boolean).slice(0,2).map(function(x){return x[0];}).join("").toUpperCase(); }
function userHeightIn(){ return p().heightIn || 69; }
function ftin(inch){ return Math.floor(inch/12) + "'" + (inch%12) + '"'; }
function machine(){ return { positions:state.gym.positions, minHeightIn:state.gym.minHeightIn, maxHeightIn:state.gym.maxHeightIn, armAngles:11, depthSteps:5 }; }

/* ---------------- routing ---------------- */
function setView(next){ view = next; closeDrawer(); render(); }
function render(){
  save();
  if(!state.onboarded){ renderShell(true); onboarding(); return; }
  renderShell(false);
  ({ home:home, workout:workout, library:library, history:history, menu:menuView,
     profiles:profilesView, machine:machineSetup }[view] || home)();
}
function renderShell(gate){
  var nav = document.getElementById("nav");
  var tabs = document.getElementById("tabs");
  var who = document.getElementById("who");
  if(gate){ nav.innerHTML=""; tabs.innerHTML=""; who.style.display="none"; return; }
  who.style.display="flex";
  nav.innerHTML = VIEWS.map(function(v){ return '<button class="'+(view===v[0]?"on":"")+'" onclick="setView(\''+v[0]+'\')">'+v[1]+'</button>'; }).join("");
  tabs.innerHTML = VIEWS.map(function(v){ return '<button class="'+(view===v[0]?"on":"")+'" onclick="setView(\''+v[0]+'\')"><span class="tab-dot"></span>'+v[1]+'</button>'; }).join("");
  who.style.setProperty("--c", p().color);
  who.innerHTML = '<span class="who-av">'+esc(initials(p().name))+'</span><span class="who-meta">'+esc(p().name)+'<small>'+esc(GOALS[p().goal])+'</small></span>';
}
function main(html){ document.getElementById("main").innerHTML = html; }

/* ---------------- onboarding ---------------- */
function onboarding(){
  main(
  '<div class="onboard"><div class="onboard-card panel">'+
    '<span class="section-kicker">Welcome</span>'+
    '<h2>Let us tune the physics</h2>'+
    '<p>Set your machine once so every cable setup lands at the right height for each person.</p>'+
    '<div class="field-grid">'+
      '<label class="field"><span class="label">Pulley positions</span><input id="ob-pos" type="number" value="'+state.gym.positions+'"></label>'+
      '<label class="field"><span class="label">Lowest pulley (in)</span><input id="ob-min" type="number" value="'+state.gym.minHeightIn+'"></label>'+
      '<label class="field"><span class="label">Highest pulley (in)</span><input id="ob-max" type="number" value="'+state.gym.maxHeightIn+'"></label>'+
    '</div>'+
    '<p class="hint">Not sure? Defaults (20 positions, 6-78 in) match most home functional trainers. Change anytime in Menu &rarr; Machine setup. Family profiles for Ali, Kristen, Kam and Ashton are already loaded - edit heights on the People page.</p>'+
    '<button class="primary big" onclick="finishOnboarding()">Start training</button>'+
  '</div></div>');
}
function finishOnboarding(){
  state.gym.positions = +document.getElementById("ob-pos").value || 20;
  state.gym.minHeightIn = +document.getElementById("ob-min").value || 6;
  state.gym.maxHeightIn = +document.getElementById("ob-max").value || 78;
  state.onboarded = true; view="home"; render();
}

/* ---------------- Today ---------------- */
function selectProfile(id){ state.active=id; state.assessment.goal=p().goal; render(); }
function setMinutes(m){ state.assessment.minutes=m; render(); }
function setIntensity(l){ state.assessment.intensity=l; render(); }
function toggleSore(m){ var s=state.assessment.sore; state.assessment.sore = s.indexOf(m)>=0 ? s.filter(function(x){return x!==m;}) : s.concat(m); render(); }

function home(){
  var plan = buildPlan();
  main(
  '<div class="stack">'+
    '<section class="panel hero">'+
      '<div class="hero-head"><div><span class="section-kicker">Start here</span><h2>Who is training?</h2></div>'+
        '<button class="ghost" onclick="setView(\'profiles\')">Manage people</button></div>'+
      '<div class="profile-grid">'+state.profiles.map(profileCard).join("")+
        '<button class="profile-card add" onclick="setView(\'profiles\')"><span class="plus">+</span>Add person</button></div>'+
    '</section>'+
    '<section class="panel">'+
      '<div class="section"><div><span class="section-kicker">Next for '+esc(p().name)+'</span><h2>'+esc(plan.title)+'</h2>'+
        '<p>'+esc(plan.focus)+' &middot; '+plan.minutes+' min &middot; '+plan.items.length+' moves</p></div>'+
        '<button class="primary" onclick="startWorkout()">Start plan</button></div>'+
      assessmentHtml()+ sorenessHtml()+
      '<div class="preview-grid">'+plan.items.map(mini).join("")+'</div>'+
    '</section>'+
  '</div>');
}
function profileCard(pr){
  var s = statSummary(pr.id);
  return '<button class="profile-card '+(pr.id===state.active?"on":"")+'" style="--c:'+pr.color+'" onclick="selectProfile(\''+pr.id+'\')">'+
    '<span class="profile-avatar">'+esc(initials(pr.name))+'</span>'+
    '<span class="profile-main"><b>'+esc(pr.name)+'</b><small>'+esc(GOALS[pr.goal])+' &middot; '+ftin(pr.heightIn||69)+'</small>'+
    '<span class="profile-meta">'+s.sessions+' sessions</span></span></button>';
}
function assessmentHtml(){
  return '<div class="quick-plan"><div class="micro-grid">'+
    '<label class="control"><span class="label">Goal</span><select onchange="state.assessment.goal=this.value;render()">'+
      Object.keys(GOALS).map(function(k){return '<option value="'+k+'" '+(state.assessment.goal===k?"selected":"")+'>'+GOALS[k]+'</option>';}).join("")+'</select></label>'+
    '<div class="control"><span class="label">Plan length</span><div class="choice-buttons">'+
      [20,35,50].map(function(m){return '<button class="choice-button '+(state.assessment.minutes===m?"on":"")+'" onclick="setMinutes('+m+')"><b>'+m+'</b><span>min</span></button>';}).join("")+'</div></div>'+
    '<div class="control"><span class="label">Vibe</span><div class="choice-buttons">'+
      ["easy","moderate","hard"].map(function(l){return '<button class="choice-button '+(state.assessment.intensity===l?"on":"")+'" onclick="setIntensity(\''+l+'\')"><b>'+l+'</b><span>'+vibeCopy(l)+'</span></button>';}).join("")+'</div></div>'+
    '</div></div>';
}
function vibeCopy(l){ return l==="easy"?"lighter":l==="hard"?"push":"steady"; }
function sorenessHtml(){
  return '<div class="avoid-strip"><div class="row"><b>Avoid today</b>'+
    '<label class="toggle"><input type="checkbox" '+(state.assessment.pain?"checked":"")+' onchange="state.assessment.pain=this.checked;render()"> Pain today</label></div>'+
    '<div class="chips">'+MUSCLES.map(function(m){return '<button class="chip '+(state.assessment.sore.indexOf(m)>=0?"on":"")+'" onclick="toggleSore(\''+m+'\')">'+m+'</button>';}).join("")+'</div></div>';
}
function mini(item){
  var e = ex(item.id); if(!e) return "";
  return '<article class="mini"><span class="status '+e.status+'">'+statusLabel(e.status)+'</span>'+
    '<b>'+esc(e.name)+'</b><small>'+item.sets+' &times; '+esc(item.reps)+'</small><small>'+esc(groupLabel(e))+'</small></article>';
}

/* ---------------- people / profiles page ---------------- */
function profilesView(){
  main(
  '<div class="stack">'+
    '<section class="section"><div><span class="section-kicker">Family</span><h2>People</h2>'+
      '<p>Each person keeps their own goal, height, cable cap, and history.</p></div>'+
      '<button class="primary" onclick="addProfile()">Add person</button></div>'+
    '<div class="people-grid">'+state.profiles.map(personCard).join("")+'</div>'+
  '</div>');
}
function personCard(pr){
  var s = statSummary(pr.id);
  var active = pr.id===state.active;
  return '<article class="person-card" style="--c:'+pr.color+'">'+
    '<div class="ph"><span class="av">'+esc(initials(pr.name))+'</span>'+
      '<div><b>'+esc(pr.name)+'</b><small>'+s.sessions+' sessions &middot; '+s.sets+' sets</small></div></div>'+
    '<label class="field"><span class="label">Name</span><input value="'+esc(pr.name)+'" onchange="editProfile(\''+pr.id+'\',\'name\',this.value)"></label>'+
    '<div class="field-grid">'+
      '<label class="field"><span class="label">Height ft</span><input type="number" min="3" max="7" value="'+Math.floor((pr.heightIn||69)/12)+'" onchange="editHeight(\''+pr.id+'\',\'ft\',this.value)"></label>'+
      '<label class="field"><span class="label">Height in</span><input type="number" min="0" max="11" value="'+((pr.heightIn||69)%12)+'" onchange="editHeight(\''+pr.id+'\',\'in\',this.value)"></label>'+
    '</div>'+
    '<div class="field-grid">'+
      '<label class="field"><span class="label">Mode</span><select onchange="editProfile(\''+pr.id+'\',\'mode\',this.value)">'+
        MODES.map(function(m){return '<option '+(pr.mode===m?"selected":"")+'>'+m+'</option>';}).join("")+'</select></label>'+
      '<label class="field"><span class="label">Cable cap (lb)</span><input type="number" value="'+pr.max+'" onchange="editProfile(\''+pr.id+'\',\'max\',+this.value)"></label>'+
    '</div>'+
    '<label class="field"><span class="label">Goal</span><select onchange="editProfile(\''+pr.id+'\',\'goal\',this.value)">'+
      Object.keys(GOALS).map(function(k){return '<option value="'+k+'" '+(pr.goal===k?"selected":"")+'>'+GOALS[k]+'</option>';}).join("")+'</select></label>'+
    '<div class="field"><span class="label">Color</span><div class="pill-row">'+
      COLORS.map(function(c){return '<button class="pill '+(pr.color===c?"on":"")+'" style="background:'+c+';color:#07100b" onclick="editProfile(\''+pr.id+'\',\'color\',\''+c+'\')">&nbsp;</button>';}).join("")+'</div></div>'+
    '<label class="toggle"><input type="checkbox" '+(pr.testing?"checked":"")+' onchange="editProfile(\''+pr.id+'\',\'testing\',this.checked)"> Include cable setups (start light)</label>'+
    '<div class="row">'+
      '<button class="ghost" onclick="selectProfile(\''+pr.id+'\')">'+(active?"Active":"Make active")+'</button>'+
      (state.profiles.length>1?'<button class="danger" onclick="removeProfile(\''+pr.id+'\')">Remove</button>':'')+
    '</div>'+
  '</article>';
}
function editProfile(id,key,val){ state.profiles = state.profiles.map(function(pr){ return pr.id===id ? Object.assign({}, pr, (function(){var o={};o[key]=val;return o;})()) : pr; }); render(); }
function editHeight(id,which,val){
  state.profiles = state.profiles.map(function(pr){
    if(pr.id!==id) return pr;
    var ft = Math.floor((pr.heightIn||69)/12), inch = (pr.heightIn||69)%12;
    if(which==="ft") ft = +val||ft; else inch = +val||0;
    return Object.assign({}, pr, { heightIn: ft*12 + inch });
  }); render();
}
function addProfile(){
  var id = "p-" + Date.now();
  state.profiles.push({ id:id, name:"New Person", mode:"adult", goal:"hypertrophy", max:60, heightIn:68, testing:true, color:COLORS[state.profiles.length % COLORS.length] });
  state.active = id; view="profiles"; render();
}
function removeProfile(id){
  if(state.profiles.length<=1) return;
  if(!confirm("Remove this person and keep their history hidden?")) return;
  state.profiles = state.profiles.filter(function(pr){return pr.id!==id;});
  if(state.active===id) state.active = state.profiles[0].id;
  render();
}

/* ---------------- plan engine ---------------- */
function buildPlan(){
  var count = state.assessment.minutes===20?4:state.assessment.minutes===35?5:7;
  var lastTemplate = state.history[0] ? state.history[0].template : null;
  var scored = TEMPLATES.map(function(t){
    var s=50;
    if(t.goals.indexOf(state.assessment.goal)>=0) s+=24;
    if(t.goals.indexOf(p().goal)>=0) s+=12;
    if(p().mode==="guest"&&t.id==="guest") s+=45;
    if((p().mode==="teen"||p().mode==="youth")&&t.id==="youth") s+=24;
    if(state.assessment.pain&&(t.id==="guest"||t.id==="posture")) s+=18;
    if(lastTemplate===t.id) s-=90;
    state.assessment.sore.forEach(function(m){ if(t.focus.toLowerCase().indexOf(m)>=0) s-=15; });
    return Object.assign({}, t, {score:s});
  }).sort(function(a,b){return b.score-a.score;});
  var t = scored[0];
  var pool = t.ids.map(ex).filter(Boolean).filter(eligible).sort(function(a,b){return scoreEx(b)-scoreEx(a);});
  var items = setupBatch(pool.slice(0,count)).map(prescribe);
  return { template:t.id, title:t.title, focus:t.focus, minutes:state.assessment.minutes, items:items };
}
function eligible(e){
  if(!e) return false;
  if(p().mode==="guest"&&e.goals.indexOf("guest-safe")<0) return false;
  if((p().mode==="teen"||p().mode==="youth")&&e.complexity==="high") return false;
  if(e.status==="unsafe") return false;
  if(e.status!=="verified"&&!p().testing) return false;
  if(e.setup&&state.gym.attachments.indexOf(e.attach)<0) return false;
  return true;
}
function scoreEx(e){
  var s=30;
  if(e.goals.indexOf(state.assessment.goal)>=0) s+=16;
  if(e.goals.indexOf(p().goal)>=0) s+=10;
  if(e.status==="verified") s+=8;
  if(p().mode==="guest"&&e.complexity==="low") s+=12;
  if((p().mode==="teen"||p().mode==="youth")&&e.goals.indexOf("youth-athletic")>=0) s+=12;
  state.assessment.sore.forEach(function(m){ if(e.muscles.indexOf(m)>=0) s-=16; });
  return s;
}
function setupBatch(list){ return list.slice().sort(function(a,b){return groupLabel(a).localeCompare(groupLabel(b)) || a.cat.localeCompare(b.cat);}); }
function prescribe(e){
  var sets=e.sets, reps=e.reps;
  if(state.assessment.minutes===20) sets=Math.max(1,sets-1);
  if(state.assessment.minutes===50&&p().mode!=="guest") sets+=1;
  if(p().mode==="guest"||p().mode==="youth") sets=Math.min(sets,2);
  if(state.assessment.intensity==="easy") sets=Math.max(1,sets-1);
  if(state.assessment.intensity==="hard"&&p().mode!=="guest") sets+=1;
  var load=loadFor(e,reps);
  var done=[]; for(var i=0;i<sets;i++) done.push({ weight:load.weight||"", reps:"", rpe:7, done:false });
  return { id:e.id, sets:sets, reps:reps, rest:e.rest, load:load, hint:load.hint, done:done };
}
function loadFor(e,reps){
  if(e.load==="time") return { weight:0, hint:"Track crisp seconds and stop before form fades." };
  if(e.load==="bodyweight") return { weight:0, hint:"Progress by range, control, tempo, or extra reps." };
  if(e.load==="dumbbell"){
    var w = (p().mode==="teen"||p().mode==="youth")?5:p().mode==="guest"?8:15;
    return { weight:w, hint:"Use "+w+" lb if clean. If it is too easy, slow the lowering and pause." };
  }
  var last=lastPerf(e.id);
  var target=e.cat==="legs"?50:e.cat==="pull"?40:30;
  if(p().mode==="teen"||p().mode==="youth") target=Math.min(target,30);
  if(p().mode==="guest") target=10;
  if(state.assessment.intensity==="hard") target+=10;
  if(last){ target=last.weight;
    if(parseInt(last.reps,10)>=highRep(reps)&&last.rpe<=8) target+=state.gym.inc;
    if(last.rpe>=9.5) target-=state.gym.inc; }
  var capped=Math.min(target,p().max,state.gym.max);
  var rounded=Math.max(state.gym.min,Math.floor(capped/state.gym.inc)*state.gym.inc);
  return { weight:rounded, hint:(last?"Last best: "+last.weight+"x"+last.reps+" @ RPE "+last.rpe+". ":"")+"Suggested load: "+rounded+" lb." };
}
function highRep(r){ var m=String(r).match(/(\d+)(?!.*\d)/); return m?Number(m[1]):10; }
function lastPerf(id){
  var hist=state.history.filter(function(x){return x.profile===p().id;});
  for(var i=0;i<hist.length;i++){
    var e=hist[i].exercises.filter(function(x){return x.id===id;})[0];
    if(e&&e.sets.length) return e.sets.slice().sort(function(a,b){return b.weight-a.weight;})[0];
  }
  return null;
}

/* ---------------- workout player ---------------- */
function startWorkout(plan){ state.activeWorkout=plan||buildPlan(); wIndex=0; view="workout"; render(); }
function nextExercise(){ if(state.activeWorkout && wIndex<state.activeWorkout.items.length-1){ wIndex++; render(); } }
function prevExercise(){ if(wIndex>0){ wIndex--; render(); } }
function workout(){
  var wp=state.activeWorkout;
  if(!wp){ main('<div class="empty"><h2>No active workout</h2><p>Generate today plan first.</p><button class="primary" onclick="startWorkout()">Start recommended</button></div>'); return; }
  wIndex=Math.min(wIndex, wp.items.length-1);
  var item=wp.items[wIndex];
  main(
  '<div class="stack">'+
    '<section class="section player-top"><div><span class="section-kicker">'+wp.minutes+' min &middot; '+(wIndex+1)+' of '+wp.items.length+'</span><h2>'+esc(wp.title)+'</h2></div>'+
      '<button class="primary" onclick="finishWorkout()">Finish</button></section>'+
    '<div class="dots">'+wp.items.map(function(it,i){return '<span class="dot '+(i===wIndex?"on":"")+' '+(it.done.some(function(s){return s.done;})?"done":"")+'"></span>';}).join("")+'</div>'+
    playerCard(item, wIndex)+
    '<div class="player-nav">'+
      '<button class="ghost" onclick="prevExercise()" '+(wIndex===0?"disabled":"")+'>&larr; Prev</button>'+
      '<button class="ghost" onclick="swap('+wIndex+')">Swap</button>'+
      '<button class="primary" onclick="nextExercise()" '+(wIndex===wp.items.length-1?"disabled":"")+'>Next &rarr;</button>'+
    '</div>'+
  '</div>');
}
function playerCard(item,index){
  var e=ex(item.id); if(!e) return "";
  return '<article class="exercise"><div class="exercise-head"><div><span class="status '+e.status+'">'+statusLabel(e.status)+'</span>'+
    '<h3>'+esc(e.name)+'</h3><small>'+esc(e.muscles.join(", "))+'</small></div></div>'+
    setupHtml(e)+
    '<ul class="cues">'+e.cues.map(function(c){return '<li>'+esc(c)+'</li>';}).join("")+'</ul>'+
    '<div class="load-note"><span class="setup-label">Load</span><b>'+esc(item.hint)+'</b></div>'+
    '<div class="set-table"><div class="set-row labels"><span>Set</span><span>Load</span><span>Reps</span><span>RPE</span><span>Done</span></div>'+
    item.done.map(function(s,si){return '<div class="set-row '+(s.done?"done":"")+'"><span>'+(si+1)+'</span>'+
      '<input value="'+esc(s.weight)+'" placeholder="'+(item.load.weight||"BW")+'" onchange="setVal('+index+','+si+',\'weight\',this.value)">'+
      '<input value="'+esc(s.reps)+'" placeholder="'+esc(item.reps)+'" onchange="setVal('+index+','+si+',\'reps\',this.value)">'+
      '<input value="'+esc(s.rpe)+'" onchange="setVal('+index+','+si+',\'rpe\',this.value)">'+
      '<button onclick="toggleSet('+index+','+si+')">'+(s.done?"OK":"+")+'</button></div>';}).join("")+
    '</div></article>';
}

/* ---------------- setup rendering (physics) ---------------- */
function setupHtml(e){
  if(!e.setup || !BIO.hasMove(e.id)) return nonCableSetupHtml(e);
  var s=BIO.solve(e.id, userHeightIn(), machine());
  return '<div class="setup-panel"><div class="setup-visual">'+bodyTrainerSvg(s, e.name)+'</div>'+
    '<div class="setup-copy"><span class="setup-label">Machine setup</span><h3>'+esc(groupTitle(e.setup.group))+'</h3>'+
    '<p class="setup-instruction"><b>'+esc(s.instruction)+'</b></p>'+
    '<div class="setup-facts">'+
      '<div><span class="setup-label">Pulley notch</span><b>'+s.pulley.notch+' / '+s.machine.positions+'</b></div>'+
      '<div><span class="setup-label">Height</span><b>~'+s.pulley.actualIn+' in</b></div>'+
      '<div><span class="setup-label">Handle start</span><b>'+esc(s.startLandmark)+'</b></div>'+
      '<div><span class="setup-label">Attachment</span><b>'+esc(e.attach)+'</b></div>'+
    '</div>'+
    '<div class="setup-note '+(s.startTooHigh?"warn":"")+'"><span class="setup-label">Why this height</span><b>'+esc(s.why)+'</b></div>'+
    '</div></div>';
}
function nonCableSetupHtml(e){
  var z=zoneFor(e);
  return '<div class="setup-panel"><div class="graphic-card '+z.kind+'"><span class="glyph">'+z.glyph+'</span>'+
    '<span class="setup-label">'+esc(z.label)+'</span><b>'+esc(z.title)+'</b></div>'+
    '<div class="setup-copy"><span class="setup-label">Setup</span><h3>'+esc(z.title)+'</h3><p>'+esc(z.note)+'</p>'+
    '<div class="setup-facts"><div><span class="setup-label">Equipment</span><b>'+esc(e.equipment)+'</b></div>'+
    '<div><span class="setup-label">Status</span><b>'+statusLabel(e.status)+'</b></div></div></div></div>';
}
function zoneFor(e){
  if(e.equipment==="dumbbells") return {kind:"dumbbells",glyph:"\uD83C\uDFCB\uFE0F",label:"Dumbbell zone",title:"Light dumbbell lane",note:"Weight is limited - progress with tempo, pauses, extra reps, and cleaner range."};
  if(e.equipment==="bench") return {kind:"bench",glyph:"\uD83E\uDE91",label:"Bench lane",title:"Bench + open floor",note:"Set the bench clear of the cable path; keep the mat lane open."};
  return {kind:"floor",glyph:"\uD83E\uDDD8",label:"Floor zone",title:"Open mat lane",note:"Use the open mat in front of the trainer. Keep reps controlled."};
}
function bodyTrainerSvg(s,title){
  var W=340,H=380,floorY=344,pad=20;
  var topIn=Math.max(s.machine.maxHeightIn, s.userHeightIn*1.28)+4;
  var ppi=(floorY-pad)/topIn;
  function y(inch){ return floorY-inch*ppi; }
  var facingToward=s.face==="toward";
  var towerX=facingToward?300:296, bodyX=150;
  var handleX=facingToward?bodyX+46:bodyX-30;
  var py=y(s.pulley.actualIn), sy=y(s.startIn), fy=y(s.finishIn);
  var headR=13, crownY=y(s.userHeightIn), shoulderY=y(s.userHeightIn*0.82), hipY=y(s.userHeightIn*0.52);
  var ticks=[0,12,24,36,48,60,72].filter(function(t){return t<=topIn;});
  return '<svg class="trainer-svg" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(title)+' setup, side view">'+
    '<line class="floor" x1="8" y1="'+floorY+'" x2="'+(W-8)+'" y2="'+floorY+'"></line>'+
    ticks.map(function(t){return '<line class="tick" x1="12" y1="'+y(t)+'" x2="18" y2="'+y(t)+'"></line><text class="tick-t" x="22" y="'+(y(t)+4)+'">'+t+'in</text>';}).join("")+
    '<rect class="tower" x="'+(towerX-10)+'" y="'+y(s.machine.maxHeightIn)+'" width="20" height="'+(floorY-y(s.machine.maxHeightIn))+'" rx="5"></rect>'+
    '<line class="rail" x1="'+towerX+'" y1="'+y(s.machine.maxHeightIn)+'" x2="'+towerX+'" y2="'+y(s.machine.minHeightIn)+'"></line>'+
    '<circle class="pulley" cx="'+towerX+'" cy="'+py+'" r="8"></circle>'+
    '<text class="pulley-t" x="'+towerX+'" y="'+(py-14)+'" text-anchor="middle">notch '+s.pulley.notch+'</text>'+
    '<line class="cable" x1="'+towerX+'" y1="'+py+'" x2="'+handleX+'" y2="'+sy+'"></line>'+
    '<path class="arc" d="M '+handleX+' '+sy+' Q '+((handleX+towerX)/2)+' '+(((sy+fy)/2)-24)+' '+handleX+' '+fy+'"></path>'+
    '<circle class="handle ghost" cx="'+handleX+'" cy="'+fy+'" r="9"></circle>'+
    '<text class="h-t ghost" x="'+handleX+'" y="'+(fy+22)+'" text-anchor="middle">finish</text>'+
    '<circle class="person" cx="'+bodyX+'" cy="'+(crownY+headR)+'" r="'+headR+'"></circle>'+
    '<line class="person" x1="'+bodyX+'" y1="'+(crownY+headR*2)+'" x2="'+bodyX+'" y2="'+hipY+'"></line>'+
    '<line class="person" x1="'+bodyX+'" y1="'+hipY+'" x2="'+(bodyX-14)+'" y2="'+floorY+'"></line>'+
    '<line class="person" x1="'+bodyX+'" y1="'+hipY+'" x2="'+(bodyX+14)+'" y2="'+floorY+'"></line>'+
    '<line class="person arm" x1="'+bodyX+'" y1="'+shoulderY+'" x2="'+handleX+'" y2="'+sy+'"></line>'+
    '<circle class="handle" cx="'+handleX+'" cy="'+sy+'" r="10"></circle>'+
    '<text class="h-t" x="'+handleX+'" y="'+(sy-14)+'" text-anchor="middle">start &middot; '+esc(s.startLandmark)+'</text>'+
    (s.startTooHigh?'<text class="flag" x="'+bodyX+'" y="20" text-anchor="middle">handle would sit too high - lower pulley</text>':'')+
  '</svg>';
}

/* ---------------- set logging ---------------- */
function setVal(ei,si,key,val){ var set=state.activeWorkout.items[ei].done[si]; set[key]=(key==="weight"||key==="rpe")?Number(val):val; save(); }
function toggleSet(ei,si){
  var item=state.activeWorkout.items[ei], set=item.done[si];
  set.done=!set.done;
  if(set.done){ if(!set.reps) set.reps=item.reps; if(!set.weight) set.weight=item.load.weight; startRest(item.rest); }
  render();
}
function startRest(sec){ rest=sec; clearInterval(restTick); restTick=setInterval(function(){ rest=Math.max(0,rest-1); paintRest(); if(!rest) clearInterval(restTick); },1000); paintRest(); }
function paintRest(){
  var t=document.getElementById("timer"); t.classList.toggle("hide",!rest);
  t.innerHTML='<div><span>Rest</span><b>'+String(Math.floor(rest/60)).padStart(2,"0")+':'+String(rest%60).padStart(2,"0")+'</b></div>'+
    '<button class="ghost" onclick="rest+=15;paintRest()">+15</button><button class="ghost" onclick="rest=0;paintRest()">Skip</button>';
}
function swap(index){
  var cur=ex(state.activeWorkout.items[index].id);
  var rep=EX.filter(function(c){return c.id!==cur.id && c.cat===cur.cat && eligible(c);})[0];
  if(rep) state.activeWorkout.items[index]=prescribe(rep);
  render();
}
function finishWorkout(){
  var wp=state.activeWorkout; if(!wp) return;
  var completed=wp.items.reduce(function(n,i){return n+i.done.filter(function(s){return s.done;}).length;},0);
  if(!completed){ alert("Log at least one set first."); return; }
  var exercises=wp.items.map(function(i){return { id:i.id, sets:i.done.filter(function(s){return s.done;}).map(function(s){return { weight:Number(s.weight)||0, reps:String(s.reps||i.reps), rpe:Number(s.rpe)||7 };}) };});
  var volume=exercises.reduce(function(sum,e){return sum+e.sets.reduce(function(a,s){return a+s.weight*(parseInt(s.reps,10)||0);},0);},0);
  state.history.unshift({ id:"session-"+Date.now(), profile:p().id, date:new Date().toISOString(),
    title:wp.title, template:wp.template, minutes:wp.minutes, totalSets:completed, totalVolume:volume, exercises:exercises });
  state.activeWorkout=null; view="history"; render();
}

/* ---------------- library ---------------- */
function library(){
  var q=state.q.toLowerCase(), f=state.filter;
  var list=EX.filter(function(e){
    var hay=(e.name+" "+e.cat+" "+e.muscles.join(" ")+" "+e.equipment).toLowerCase();
    return (!q||hay.indexOf(q)>=0) && (f==="all"||f===e.cat||f===e.status||f===e.equipment);
  });
  main(
  '<div class="stack">'+
    '<section class="section"><div><span class="section-kicker">'+list.length+' movements</span><h2>Exercise Library</h2>'+
      '<p>Filtered against your profile, attachments, and room when building workouts.</p></div></section>'+
    '<div class="tools"><input placeholder="Search row, core, press, dumbbell..." value="'+esc(state.q)+'" oninput="state.q=this.value;render()">'+
      '<select onchange="state.filter=this.value;render()">'+
        ["all","verified","testing","push","pull","legs","core","mobility","athletic","dumbbells","bench","floor","functional-trainer"].map(function(x){return '<option '+(state.filter===x?"selected":"")+'>'+x+'</option>';}).join("")+
      '</select></div>'+
    '<div class="library-grid">'+list.map(libraryItem).join("")+'</div>'+
  '</div>');
}
function libraryItem(e){
  return '<button class="library-item '+e.cat+'" onclick="detail(\''+e.id+'\')"><span class="status '+e.status+'">'+statusLabel(e.status)+'</span>'+
    '<b>'+esc(e.name)+'</b><small>'+esc(e.muscles.join(", "))+'</small><small>'+esc(groupLabel(e))+'</small></button>';
}
function detail(id){
  var e=ex(id); if(!e) return;
  var d=document.getElementById("drawer"); d.classList.remove("hide");
  d.innerHTML='<button class="close" onclick="closeDrawer()">&times;</button><article class="exercise"><div class="exercise-head"><div>'+
    '<span class="status '+e.status+'">'+statusLabel(e.status)+'</span><h3>'+esc(e.name)+'</h3><small>'+esc(e.muscles.join(", "))+'</small></div></div>'+
    setupHtml(e)+'<ul class="cues">'+e.cues.map(function(c){return '<li>'+esc(c)+'</li>';}).join("")+'</ul></article>';
}
function closeDrawer(){ var d=document.getElementById("drawer"); if(d) d.classList.add("hide"); }

/* ---------------- history ---------------- */
function history(){
  var items=state.history.filter(function(s){return s.profile===p().id;});
  var st=statSummary();
  main(
  '<div class="stack">'+
    '<section class="section"><div><span class="section-kicker">'+esc(p().name)+'</span><h2>Progress</h2>'+
      '<p>History stays on this device.</p></div></section>'+
    '<div class="metric-grid">'+
      '<div class="metric"><b>'+st.sessions+'</b><small>Sessions</small></div>'+
      '<div class="metric"><b>'+st.sets+'</b><small>Sets</small></div>'+
      '<div class="metric"><b>'+Math.round(st.volume/1000)+'k</b><small>Volume</small></div>'+
      '<div class="metric"><b>'+st.streak+'</b><small>Day streak</small></div>'+
    '</div>'+
    '<div class="history-list">'+(items.length?items.map(function(s){return '<article class="history"><div><b>'+esc(s.title)+'</b>'+
      '<span>'+new Date(s.date).toLocaleDateString()+' &middot; '+s.totalSets+' sets &middot; '+s.totalVolume+' lb</span></div><small>'+s.minutes+' min</small></article>';}).join("")
      :'<div class="empty"><h2>No sessions yet</h2><p>Finish a workout and it shows up here.</p></div>')+'</div>'+
  '</div>');
}

/* ---------------- menu + machine setup ---------------- */
function menuView(){
  var st=statSummary();
  main(
  '<div class="stack">'+
    '<section class="section"><div><span class="section-kicker">Menu</span><h2>Settings and tools</h2>'+
      '<p>Daily training stays clean. Setup and people live here.</p></div></section>'+
    '<section class="menu-grid">'+
      menuRow("People","Names, goals, heights, caps","profiles","\uD83D\uDC65")+
      menuRow("Machine setup","Pulley positions and height range","machine","\u2699\uFE0F")+
      menuRow("Progress",st.sessions+" sessions, "+st.sets+" logged sets","history","\uD83D\uDCC8")+
    '</section>'+
    '<section class="panel"><span class="section-kicker">About</span><h2 style="margin:2px 0 0">Chitsaz Training Lab</h2>'+
      '<p style="color:var(--muted);margin:6px 0 0;line-height:1.5">Local-first workout planning for your functional trainer, bench, dumbbells, and floor. Every cable setup is computed from the active person height and your machine range.</p>'+
      '<div class="metric-grid"><div class="metric"><b>'+EX.length+'</b><small>Exercises</small></div>'+
      '<div class="metric"><b>'+state.profiles.length+'</b><small>People</small></div></div></section>'+
  '</div>');
}
function menuRow(title,detail,target,mark){
  return '<button class="menu-row" onclick="setView(\''+target+'\')"><span class="menu-mark">'+mark+'</span>'+
    '<span><b>'+esc(title)+'</b><small>'+esc(detail)+'</small></span><span class="chevron">&rsaquo;</span></button>';
}
function machineSetup(){
  main(
  '<div class="stack">'+
    '<section class="section"><div><span class="section-kicker">Your room</span><h2>Machine setup</h2>'+
      '<p>These numbers drive every cable notch the app tells you to set.</p></div></section>'+
    '<section class="panel"><div class="field-grid">'+
      '<label class="field"><span class="label">Pulley positions</span><input type="number" value="'+state.gym.positions+'" onchange="state.gym.positions=+this.value||20;render()"></label>'+
      '<label class="field"><span class="label">Lowest pulley (in)</span><input type="number" value="'+state.gym.minHeightIn+'" onchange="state.gym.minHeightIn=+this.value||6;render()"></label>'+
      '<label class="field"><span class="label">Highest pulley (in)</span><input type="number" value="'+state.gym.maxHeightIn+'" onchange="state.gym.maxHeightIn=+this.value||78;render()"></label>'+
      '<label class="field"><span class="label">Stack min (lb)</span><input type="number" value="'+state.gym.min+'" onchange="state.gym.min=+this.value||10;render()"></label>'+
      '<label class="field"><span class="label">Stack max (lb)</span><input type="number" value="'+state.gym.max+'" onchange="state.gym.max=+this.value||200;render()"></label>'+
      '<label class="field"><span class="label">Stack step (lb)</span><input type="number" value="'+state.gym.inc+'" onchange="state.gym.inc=+this.value||10;render()"></label>'+
    '</div>'+
    '<div class="field" style="margin-top:12px"><span class="label">Attachments in the room</span><div class="pill-row">'+
      ["d-handle","rope","straight-bar","curl-bar","v-bar","ankle-strap","none"].map(function(a){return '<button class="pill '+(state.gym.attachments.indexOf(a)>=0?"on":"")+'" onclick="toggleAttach(\''+a+'\')">'+a+'</button>';}).join("")+
    '</div></div></section>'+
  '</div>');
}
function toggleAttach(a){
  var arr=state.gym.attachments;
  state.gym.attachments = arr.indexOf(a)>=0 ? arr.filter(function(x){return x!==a;}) : arr.concat(a);
  render();
}

/* ---------------- stats + labels ---------------- */
function statSummary(profileId){
  var pid = profileId || p().id;
  var hist=state.history.filter(function(s){return s.profile===pid;});
  return { sessions:hist.length,
    sets:hist.reduce(function(a,s){return a+s.totalSets;},0),
    volume:hist.reduce(function(a,s){return a+s.totalVolume;},0),
    streak:streak(hist) };
}
function streak(hist){
  if(!hist.length) return 0;
  var days={}; hist.forEach(function(s){days[new Date(s.date).toDateString()]=1;});
  var c=0, d=new Date();
  while(days[d.toDateString()]){ c++; d.setDate(d.getDate()-1); }
  return c||1;
}
function groupLabel(e){ return e.setup ? groupTitle(e.setup.group) : e.equipment; }
function groupTitle(g){
  var names={"mid-dual-press":"Mid dual press","bench-mid-press":"Bench press lane","low-dual-press":"Low to high press",
    "mid-dual-fly":"Mid cable fly","mid-single-press":"Single-arm press","bench-mid-row":"Bench row lane","mid-dual-row":"Mid dual row",
    "high-dual-pulldown":"High kneeling pulldown","high-bar-pull":"High straight-bar pull","high-rope-posture":"High rope posture",
    "high-dual-row":"High cable row","low-dual-shoulder":"Low shoulder press","low-single-shoulder":"Low single shoulder",
    "mid-dual-posture":"Mid rear-delt fly","low-rope-arms":"Low rope arms","high-rope-arms":"High rope arms","low-bar-legs":"Low bar legs",
    "low-rope-hinge":"Low rope hinge","low-bar-hinge":"Low bar hinge","low-single-glute":"Low single glute","mid-single-core":"Mid single core",
    "high-single-core":"High single core","low-single-core":"Low single core","high-rope-core":"High rope core"};
  return names[g] || String(g||"Cable setup").split("-").join(" ");
}
function statusLabel(s){ if(s==="testing") return "start light"; if(s==="verified") return "verified"; return s; }

render();
