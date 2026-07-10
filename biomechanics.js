/* biomechanics.js - physics + posture engine. Exposes window.BIO. Load BEFORE app.js. */
(function () {
  var MACHINE = { positions: 20, minHeightIn: 6, maxHeightIn: 78, armAngles: 11, depthSteps: 5 };
  var L = { floor:0.00, ankle:0.06, knee:0.28, midThigh:0.42, hip:0.52, navel:0.62,
    sternum:0.72, armpit:0.77, shoulder:0.82, chin:0.88, eye:0.94, crown:1.00, reachUp:1.26 };
  var LABEL = { floor:"the floor", ankle:"ankle", knee:"knee", midThigh:"mid-thigh", hip:"hip",
    navel:"navel", sternum:"mid-chest", armpit:"chest", shoulder:"shoulder",
    chin:"chin", eye:"eye", crown:"top of head", reachUp:"overhead" };
  // posture: standing | lying | seated | kneel | half-kneel
  var MOVES = {
    "standing-cable-chest-press":{posture:"standing",face:"away",pulley:"shoulder",start:"armpit",finish:"sternum",why:"Pulleys at shoulder height keep the push horizontal so tension stays on the pecs."},
    "single-arm-cable-press":{posture:"standing",face:"away",pulley:"shoulder",start:"armpit",finish:"sternum",why:"Same as the two-arm press; the anti-rotation demand is a bonus."},
    "flat-bench-cable-press":{posture:"lying",bench:true,headToMachine:true,face:"up",pulleyIn:16,start:"chestLie",finish:"lockoutLie",why:"Lie with your HEAD toward the machine and the low pulleys behind your head. The cable then pulls low-to-high across your torso, so you press up and toward your feet. That makes this a decline-emphasis press (lower chest, triceps) with a heavy anti-extension core demand - not a flat-chest builder."},
    "low-to-high-cable-press":{posture:"standing",face:"away",pulley:"hip",start:"hip",finish:"eye",why:"Low pulley so you press up and in - biases the upper chest."},
    "mid-cable-fly":{posture:"standing",face:"away",pulley:"shoulder",start:"shoulder",finish:"sternum",why:"Shoulder-height pulleys keep the fly arc in the chest plane."},
    "seated-cable-row":{posture:"seated",bench:true,face:"toward",pulleyIn:24,start:"navel",finish:"navel",why:"Seated on the bench facing the tower, pull to the lower chest with a low pulley (~24in)."},
    "standing-cable-row":{posture:"standing",face:"toward",pulley:"sternum",start:"sternum",finish:"sternum",why:"Chest-height pulley keeps the pull path around the lower ribs."},
    "half-kneeling-lat-pulldown":{posture:"half-kneel",face:"toward",pulley:"reachUp",start:"reachUp",finish:"chin",why:"Half-kneeling under the high pulley, pull down from full overhead to the collarbone."},
    "straight-arm-pulldown":{posture:"standing",face:"toward",pulley:"reachUp",start:"eye",finish:"midThigh",why:"High pulley, straight arms sweeping to the thighs."},
    "face-pull":{posture:"standing",face:"toward",pulley:"crown",start:"eye",finish:"chin",why:"Rope at or just above head height; pull to the face and rotate."},
    "high-cable-row":{posture:"standing",face:"toward",pulley:"eye",start:"eye",finish:"sternum",why:"Slightly above shoulder so the elbows drive down and back."},
    "cable-overhead-press":{posture:"standing",face:"away",pulley:"shoulder",start:"shoulder",finish:"reachUp",why:"Pulleys at shoulder height so the cable pulls straight down at lockout."},
    "cable-lateral-raise":{posture:"standing",face:"side",pulley:"floor",start:"midThigh",finish:"shoulder",why:"Lowest setting; raise across the body to shoulder height."},
    "rear-delt-cable-fly":{posture:"standing",face:"toward",pulley:"shoulder",start:"shoulder",finish:"shoulder",why:"Shoulder height, arms crossed to start, pull wide."},
    "rope-biceps-curl":{posture:"standing",face:"toward",pulley:"floor",start:"midThigh",finish:"sternum",why:"Lowest setting; elbows pinned so the curl runs from thigh to chest."},
    "cable-hammer-curl":{posture:"standing",face:"toward",pulley:"floor",start:"midThigh",finish:"sternum",why:"Same as the curl, neutral grip."},
    "rope-triceps-pushdown":{posture:"standing",face:"toward",pulley:"crown",start:"sternum",finish:"midThigh",why:"High pulley, elbows parked; press from chest to thighs."},
    "overhead-rope-triceps-extension":{posture:"standing",face:"away",pulley:"hip",start:"crown",finish:"reachUp",why:"Low pulley behind you; reach from behind the head to full overhead."},
    "cable-squat":{posture:"standing",face:"toward",pulley:"knee",start:"hip",finish:"sternum",why:"Low pulley, hold at chest - the cable helps you sit back."},
    "cable-pull-through":{posture:"standing",face:"away",pulley:"floor",start:"knee",finish:"hip",why:"Lowest setting, rope between the legs; drive hips to lockout."},
    "cable-rdl":{posture:"standing",face:"toward",pulley:"floor",start:"knee",finish:"hip",why:"Lowest setting; hinge with a long spine."},
    "glute-kickback":{posture:"standing",face:"toward",pulley:"floor",start:"ankle",finish:"knee",why:"Ankle strap on the lowest setting; drive the heel back."},
    "pallof-press":{posture:"standing",face:"side",pulley:"sternum",start:"sternum",finish:"sternum",why:"Handle at sternum height; resist rotation."},
    "cable-chop":{posture:"standing",face:"side",pulley:"crown",start:"shoulder",finish:"hip",why:"High-to-low: pulley high, rotate down to the opposite hip."},
    "cable-lift":{posture:"standing",face:"side",pulley:"floor",start:"hip",finish:"crown",why:"Low-to-high: pulley low, rotate up and finish tall."},
    "kneeling-cable-crunch":{posture:"kneel",face:"toward",pulley:"reachUp",start:"crown",finish:"knee",why:"Kneeling under the high pulley, rope by the head; curl the ribs toward the hips."}
  };
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
  function settingForHeight(targetIn, m){
    var c = clamp(targetIn, m.minHeightIn, m.maxHeightIn);
    var frac = (c - m.minHeightIn) / (m.maxHeightIn - m.minHeightIn);
    var notch = Math.round(frac * (m.positions - 1)) + 1;
    var actualIn = m.minHeightIn + (notch - 1) / (m.positions - 1) * (m.maxHeightIn - m.minHeightIn);
    return { notch: notch, actualIn: Math.round(actualIn), requestedIn: Math.round(targetIn) };
  }
  var BENCH_TOP = 18;
  function landmarkIn(name, h, posture){
    if(posture==="lying"){ return BENCH_TOP + 4; }
    if(posture==="seated"){ var v=(L[name]!=null?L[name]:L.sternum); return Math.round(Math.max(BENCH_TOP, h*v - h*0.25)); }
    if(posture==="kneel"||posture==="half-kneel"){ var vv=(L[name]!=null?L[name]:L.sternum); return Math.round(Math.max(6, h*vv - h*0.12)); }
    return Math.round(h*(L[name]!=null?L[name]:L.sternum));
  }
  function solve(exId, userHeightIn, machine){
    var m = machine || MACHINE, mv = MOVES[exId];
    if (!mv) return null;
    var h = userHeightIn || 69, posture = mv.posture || "standing";
    var pulleyIn = mv.pulleyIn != null ? mv.pulleyIn : h * L[mv.pulley];
    var setting = settingForHeight(pulleyIn, m);
    var startIn = landmarkIn(mv.start, h, posture);
    var finishIn = landmarkIn(mv.finish, h, posture);
    var startTooHigh = mv.face === "away" && posture==="standing" && (setting.actualIn - startIn) > h * 0.10;
    var pulleyDesc = mv.pulleyIn != null ? (posture==="lying"?"low, behind your head":"low, ~"+mv.pulleyIn+" in") : LABEL[mv.pulley];
    var bench = mv.headToMachine ? " Lie head-toward-machine, bench centered." : (mv.bench?" Bench centered between the towers.":"");
    return { id:exId, move:mv, machine:m, userHeightIn:h, posture:posture, face:mv.face, bench:!!mv.bench, headToMachine:!!mv.headToMachine, pulley:setting,
      startIn:startIn, finishIn:finishIn, startLandmark:landmarkLabel(mv.start), finishLandmark:landmarkLabel(mv.finish),
      why:mv.why, startTooHigh:startTooHigh,
      short:"Pulley notch "+setting.notch+" (~"+setting.actualIn+" in)",
      instruction:"Set the pulley to notch "+setting.notch+" of "+m.positions+" (~"+setting.actualIn+" in, "+pulleyDesc+")."+bench };
  }
  function landmarkLabel(n){ if(n==="chestLie") return "chest (lying)"; if(n==="lockoutLie") return "arms extended"; return LABEL[n]||"chest"; }
  window.BIO = { MACHINE:MACHINE, MOVES:MOVES, LANDMARK:L, solve:solve, settingForHeight:settingForHeight, hasMove:function(id){return !!MOVES[id];} };
})();
