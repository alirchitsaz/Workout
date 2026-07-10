/* biomechanics.js - Apex Free-Arm Trainer model. Load BEFORE app.js. window.BIO */
(function () {
  // Vertical track: 1 = HIGHEST, 8 = LOWEST (as labeled on the machine).
  var MACHINE = { tracks:8, trackTopIn:76, trackBottomIn:6, armAngles:11, armDepth:5, stackMin:10, stackMax:200, stackInc:10,
    dumbbells:[3,5,8,10,12], attachments:["d-handle","rope","straight-bar","v-bar","lat-bar","ankle-strap"] };
  var L = { floor:0.00, ankle:0.06, knee:0.28, midThigh:0.42, hip:0.52, navel:0.62,
    sternum:0.72, armpit:0.77, shoulder:0.82, chin:0.88, eye:0.94, crown:1.00, reachUp:1.26 };
  var LABEL = { floor:"the floor", ankle:"ankle", knee:"knee", midThigh:"mid-thigh", hip:"hip",
    navel:"navel", sternum:"mid-chest", armpit:"chest", shoulder:"shoulder",
    chin:"chin", eye:"eye", crown:"top of head", reachUp:"overhead" };
  var MOVES = {
    "standing-cable-chest-press":{posture:"standing",face:"away",pulley:"shoulder",start:"armpit",finish:"sternum",ang:6,dep:3,why:"Arms at shoulder height, tilt neutral. Press forward and slightly in so tension stays on the pecs."},
    "single-arm-cable-press":{posture:"standing",face:"away",pulley:"shoulder",start:"armpit",finish:"sternum",ang:6,dep:3,why:"One arm; resist the twist. Same shoulder-height setup as the two-arm press."},
    "flat-bench-cable-press":{posture:"lying",bench:true,headToMachine:true,face:"up",pulleyIn:16,start:"chestLie",finish:"lockoutLie",ang:5,dep:2,why:"Lie with your HEAD toward the machine and the arms LOW behind your head. The cable pulls low-to-high across your torso, so you press up and toward your feet - a decline-emphasis press with heavy anti-extension core, not a flat-chest builder."},
    "low-to-high-cable-press":{posture:"standing",face:"away",pulley:"hip",start:"hip",finish:"eye",ang:8,dep:3,why:"Low track, tilt up. Press up and in to bias the upper chest."},
    "mid-cable-fly":{posture:"standing",face:"away",pulley:"shoulder",start:"shoulder",finish:"sternum",ang:6,dep:5,why:"Shoulder height, arms swung wide (out to 5). Hug the hands together at the centerline."},
    "seated-cable-row":{posture:"seated",bench:true,face:"toward",pulleyIn:24,start:"navel",finish:"navel",ang:5,dep:2,why:"Seated on the bench facing the machine, low track ~24in. Pull to the lower chest."},
    "standing-cable-row":{posture:"standing",face:"toward",pulley:"sternum",start:"sternum",finish:"sternum",ang:6,dep:3,why:"Chest-height track keeps the pull path around the lower ribs."},
    "half-kneeling-lat-pulldown":{posture:"half-kneel",face:"toward",pulley:"reachUp",start:"reachUp",finish:"chin",ang:6,dep:3,why:"Highest track (1). Half-kneel and pull from full overhead to the collarbone."},
    "straight-arm-pulldown":{posture:"standing",face:"toward",pulley:"reachUp",start:"eye",finish:"midThigh",ang:6,dep:3,why:"High track, straight arms sweeping to the thighs. Lats only."},
    "face-pull":{posture:"standing",face:"toward",pulley:"crown",start:"eye",finish:"chin",ang:6,dep:4,why:"Rope at head height; pull to the face and rotate. Best rear-delt/posture move."},
    "high-cable-row":{posture:"standing",face:"toward",pulley:"eye",start:"eye",finish:"sternum",ang:6,dep:3,why:"Just above shoulder so elbows drive down and back into the upper back."},
    "cable-overhead-press":{posture:"standing",face:"away",pulley:"shoulder",start:"shoulder",finish:"reachUp",ang:6,dep:3,why:"Shoulder-height arms so the cable pulls straight down at lockout."},
    "cable-lateral-raise":{posture:"standing",face:"side",pulley:"floor",start:"midThigh",finish:"shoulder",ang:5,dep:2,why:"Lowest track; raise across the body to shoulder height for constant side-delt tension."},
    "rear-delt-cable-fly":{posture:"standing",face:"toward",pulley:"shoulder",start:"shoulder",finish:"shoulder",ang:6,dep:5,why:"Shoulder height, arms crossed to start, swung wide. Pull apart."},
    "rope-biceps-curl":{posture:"standing",face:"toward",pulley:"floor",start:"midThigh",finish:"sternum",ang:5,dep:2,why:"Lowest track; elbows pinned so the curl runs thigh to chest."},
    "cable-hammer-curl":{posture:"standing",face:"toward",pulley:"floor",start:"midThigh",finish:"sternum",ang:5,dep:2,why:"Same as the curl, neutral grip on the rope."},
    "rope-triceps-pushdown":{posture:"standing",face:"toward",pulley:"crown",start:"sternum",finish:"midThigh",ang:6,dep:3,why:"High track, elbows parked; press from chest to thighs."},
    "overhead-rope-triceps-extension":{posture:"standing",face:"away",pulley:"hip",start:"crown",finish:"reachUp",ang:7,dep:2,why:"Low track behind you; reach from behind the head to full overhead."},
    "cable-squat":{posture:"standing",face:"toward",pulley:"knee",start:"hip",finish:"sternum",ang:5,dep:2,why:"Low track, hold at chest; the cable helps you sit back into the squat."},
    "cable-pull-through":{posture:"standing",face:"away",pulley:"floor",start:"knee",finish:"hip",ang:5,dep:2,why:"Lowest track, rope between the legs; drive hips to lockout."},
    "cable-rdl":{posture:"standing",face:"toward",pulley:"floor",start:"knee",finish:"hip",ang:5,dep:2,why:"Lowest track; hinge with a long spine, feel the hamstrings."},
    "glute-kickback":{posture:"standing",face:"toward",pulley:"floor",start:"ankle",finish:"knee",ang:5,dep:2,why:"Ankle strap on the lowest track; drive the heel back without arching."},
    "pallof-press":{posture:"standing",face:"side",pulley:"sternum",start:"sternum",finish:"sternum",ang:6,dep:3,why:"Handle at sternum height; resist rotation, do not twist."},
    "cable-chop":{posture:"standing",face:"side",pulley:"crown",start:"shoulder",finish:"hip",ang:6,dep:3,why:"High-to-low: high track, rotate down to the opposite hip."},
    "cable-lift":{posture:"standing",face:"side",pulley:"floor",start:"hip",finish:"crown",ang:6,dep:3,why:"Low-to-high: low track, rotate up and finish tall."},
    "kneeling-cable-crunch":{posture:"kneel",face:"toward",pulley:"reachUp",start:"crown",finish:"knee",ang:6,dep:3,why:"Highest track, rope by the head; curl the ribs toward the hips."}
  };
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
  function trackHeight(t,m){ m=m||MACHINE; var f=(clamp(t,1,m.tracks)-1)/(m.tracks-1); return Math.round(m.trackTopIn - f*(m.trackTopIn-m.trackBottomIn)); }
  function trackForHeight(inch,m){ m=m||MACHINE; var c=clamp(inch,m.trackBottomIn,m.trackTopIn); var f=(m.trackTopIn-c)/(m.trackTopIn-m.trackBottomIn); var t=Math.round(f*(m.tracks-1))+1; return {track:t, actualIn:trackHeight(t,m)}; }
  var BENCH_TOP=18;
  function landmarkIn(name,h,posture){
    if(posture==="lying") return BENCH_TOP+4;
    if(posture==="seated"){var v=(L[name]!=null?L[name]:L.sternum);return Math.round(Math.max(BENCH_TOP,h*v-h*0.25));}
    if(posture==="kneel"||posture==="half-kneel"){var vv=(L[name]!=null?L[name]:L.sternum);return Math.round(Math.max(6,h*vv-h*0.12));}
    return Math.round(h*(L[name]!=null?L[name]:L.sternum));
  }
  function solve(exId,userHeightIn,machine){
    var m=machine||MACHINE, mv=MOVES[exId]; if(!mv) return null;
    var h=userHeightIn||69, posture=mv.posture||"standing";
    var pulleyIn = mv.pulleyIn!=null ? mv.pulleyIn : h*L[mv.pulley];
    var tf=trackForHeight(pulleyIn,m);
    var startIn=landmarkIn(mv.start,h,posture), finishIn=landmarkIn(mv.finish,h,posture);
    var startTooHigh = mv.face==="away" && posture==="standing" && (tf.actualIn-startIn)>h*0.10;
    var pd = mv.pulleyIn!=null ? (posture==="lying"?"low, behind your head":"low track") : LABEL[mv.pulley];
    var benchTxt = mv.headToMachine ? " Lie head-toward-machine; bench centered." : (mv.bench?" Bench centered between the arms.":"");
    return { id:exId, move:mv, machine:m, userHeightIn:h, posture:posture, face:mv.face, bench:!!mv.bench, headToMachine:!!mv.headToMachine,
      track:tf.track, actualIn:tf.actualIn, ang:mv.ang||6, dep:mv.dep||3,
      startIn:startIn, finishIn:finishIn, startLandmark:landmarkLabel(mv.start), finishLandmark:landmarkLabel(mv.finish),
      why:mv.why, startTooHigh:startTooHigh, short:"Track "+tf.track+" of 8",
      instruction:"Track "+tf.track+" of 8 (~"+tf.actualIn+" in, "+pd+") \u00b7 Arm tilt "+(mv.ang||6)+"/11 \u00b7 Arm in/out "+(mv.dep||3)+"/5."+benchTxt };
  }
  function landmarkLabel(n){ if(n==="chestLie")return "chest (lying)"; if(n==="lockoutLie")return "arms extended"; return LABEL[n]||"chest"; }
  window.BIO = { MACHINE:MACHINE, MOVES:MOVES, LANDMARK:L, solve:solve, trackHeight:trackHeight, trackForHeight:trackForHeight, hasMove:function(id){return !!MOVES[id];} };
})();
