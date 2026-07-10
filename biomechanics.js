/* biomechanics.js - Apex Free-Arm Trainer with ARM GEOMETRY. window.BIO
   Model: the HANDLE is at the end of a swing-arm. Track sets the arm MOUNT height on the
   tower; Arm tilt (1-11, 6=horizontal) swings the arm up/down; Arm in/out (1-5) sets reach.
   We solve so the HANDLE lands on the target body landmark. */
(function () {
  var MACHINE = { tracks:8, trackTopIn:76, trackBottomIn:6, armAngles:11, armDepth:5,
    stackMin:10, stackMax:200, stackInc:10, armLenIn:30,
    dumbbells:[3,5,8,10,12], attachments:["d-handle","rope","straight-bar","v-bar","lat-bar","ankle-strap"] };
  var L = { floor:0.00, ankle:0.06, knee:0.28, midThigh:0.42, hip:0.52, navel:0.62,
    sternum:0.72, armpit:0.77, shoulder:0.82, chin:0.88, eye:0.94, crown:1.00, reachUp:1.26 };
  var LABEL = { floor:"the floor", ankle:"ankle", knee:"knee", midThigh:"mid-thigh", hip:"hip",
    navel:"navel", sternum:"mid-chest", armpit:"chest", shoulder:"shoulder",
    chin:"chin", eye:"eye", crown:"top of head", reachUp:"overhead" };
  // from = resistance line: "low" (arm angled UP to handle), "mid" (arm ~level), "high" (arm angled DOWN)
  var MOVES = {
    "standing-cable-chest-press":{posture:"standing",face:"away",from:"mid",start:"armpit",finish:"sternum",why:"Low track, arms angled up and OUT so the HANDLES meet chest height. Press forward and slightly in."},
    "single-arm-cable-press":{posture:"standing",face:"away",from:"mid",start:"armpit",finish:"sternum",why:"Same as the two-arm press but one side; resist the twist."},
    "flat-bench-cable-press":{posture:"lying",bench:true,headToMachine:true,face:"up",from:"low",start:"chestLie",finish:"lockoutLie",why:"Head toward the machine, arms LOW angled up so the handles sit by your chest. Cable pulls low-to-high across the torso: decline-emphasis press with heavy anti-extension core."},
    "low-to-high-cable-press":{posture:"standing",face:"away",from:"low",start:"hip",finish:"eye",why:"Lowest track, arms angled up; press up and in for the upper chest."},
    "mid-cable-fly":{posture:"standing",face:"away",from:"mid",start:"shoulder",finish:"sternum",why:"Arms out wide (in/out 5) at shoulder height; hug hands to the centerline."},
    "seated-cable-row":{posture:"seated",bench:true,face:"toward",from:"mid",start:"navel",finish:"navel",why:"Seated facing the machine, arms level so handles meet your lower chest. Pull to the ribs."},
    "standing-cable-row":{posture:"standing",face:"toward",from:"mid",start:"sternum",finish:"sternum",why:"Arms level at chest height; pull elbows to your back pockets."},
    "half-kneeling-lat-pulldown":{posture:"half-kneel",face:"toward",from:"high",start:"reachUp",finish:"chin",why:"Highest track, arms angled down so handles are overhead. Pull to the collarbone."},
    "straight-arm-pulldown":{posture:"standing",face:"toward",from:"high",start:"eye",finish:"midThigh",why:"High arms, straight-arm sweep to the thighs. Lats only."},
    "face-pull":{posture:"standing",face:"toward",from:"high",start:"eye",finish:"chin",why:"Arms high so the rope meets face height; pull apart and rotate."},
    "high-cable-row":{posture:"standing",face:"toward",from:"high",start:"eye",finish:"sternum",why:"Arms angled down from high; drive elbows down and back."},
    "cable-overhead-press":{posture:"standing",face:"away",from:"mid",start:"shoulder",finish:"reachUp",why:"Arms at shoulder height so the cable pulls straight down at lockout."},
    "cable-lateral-raise":{posture:"standing",face:"side",from:"low",start:"midThigh",finish:"shoulder",why:"Lowest track; raise across the body to shoulder height."},
    "rear-delt-cable-fly":{posture:"standing",face:"toward",from:"mid",start:"shoulder",finish:"shoulder",why:"Arms out wide at shoulder height; pull apart."},
    "rope-biceps-curl":{posture:"standing",face:"toward",from:"low",start:"midThigh",finish:"sternum",why:"Lowest track, handle by the thighs; curl to the chest."},
    "cable-hammer-curl":{posture:"standing",face:"toward",from:"low",start:"midThigh",finish:"sternum",why:"Same as the curl, neutral grip."},
    "rope-triceps-pushdown":{posture:"standing",face:"toward",from:"high",start:"sternum",finish:"midThigh",why:"High arms; press the rope from chest to thighs, elbows parked."},
    "overhead-rope-triceps-extension":{posture:"standing",face:"away",from:"low",start:"crown",finish:"reachUp",why:"Low arms behind you; reach from behind the head to overhead."},
    "cable-squat":{posture:"standing",face:"toward",from:"low",start:"hip",finish:"sternum",why:"Low arms, hold at chest; the cable helps you sit back."},
    "cable-pull-through":{posture:"standing",face:"away",from:"low",start:"knee",finish:"hip",why:"Lowest arms, rope between the legs; drive hips to lockout."},
    "cable-rdl":{posture:"standing",face:"toward",from:"low",start:"knee",finish:"hip",why:"Lowest arms; hinge with a long spine."},
    "glute-kickback":{posture:"standing",face:"toward",from:"low",start:"ankle",finish:"knee",why:"Ankle strap, lowest arms; drive the heel back."},
    "pallof-press":{posture:"standing",face:"side",from:"mid",start:"sternum",finish:"sternum",why:"Handle at sternum height; resist rotation."},
    "cable-chop":{posture:"standing",face:"side",from:"high",start:"shoulder",finish:"hip",why:"High-to-low; rotate down to the opposite hip."},
    "cable-lift":{posture:"standing",face:"side",from:"low",start:"hip",finish:"crown",why:"Low-to-high; rotate up and finish tall."},
    "kneeling-cable-crunch":{posture:"kneel",face:"toward",from:"high",start:"crown",finish:"knee",why:"Highest arms, rope by the head; curl the ribs toward the hips."}
  };
  var DEG=Math.PI/180;
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
  // base tilt of the arm depending on where resistance comes from
  function baseDeg(from){ return from==="low"?22 : from==="high"?-22 : 4; } // + = handle above mount
  function solve(exId,userHeightIn,machine){
    var m=machine||MACHINE, mv=MOVES[exId]; if(!mv) return null;
    var h=userHeightIn||69, posture=mv.posture||"standing", armLen=m.armLenIn||30;
    // handle should land on the START landmark
    var handleIn = landmarkIn(mv.start,h,posture);
    var bDeg = baseDeg(mv.from);
    // desired mount height so handle (at armLen, angled bDeg) lands on handleIn
    var mountTarget = handleIn - armLen*Math.sin(bDeg*DEG);
    var tf = trackForHeight(mountTarget,m);          // nearest real track
    var actualMount = tf.actualIn;
    // now the exact tilt needed given the REAL mount height
    var ratio = clamp((handleIn-actualMount)/armLen,-1,1);
    var tiltDeg = Math.asin(ratio)/DEG;              // + handle above mount
    var tiltSetting = clamp(Math.round(6 + tiltDeg/15),1,11); // 6 = horizontal
    // in/out (reach). Wide moves (fly/rear-delt) push outward; default mid reach.
    var wide = (exId==="mid-cable-fly"||exId==="rear-delt-cable-fly");
    var inOut = wide?5:clamp(Math.round(3 + Math.cos(tiltDeg*DEG)*0 ),2,4); // keep 2-4 default, 5 for wide
    if(mv.from==="low") inOut = wide?5:3;
    var horizReach = armLen*Math.cos(tiltDeg*DEG)*(inOut/3); // for drawing only
    var startIn=handleIn, finishIn=landmarkIn(mv.finish,h,posture);
    var pd = mv.from==="low"?"low track, arms angled up":mv.from==="high"?"high track, arms angled down":"mid track, arms level";
    var benchTxt = mv.headToMachine ? " Lie head-toward-machine; bench centered." : (mv.bench?" Bench centered between the arms.":"");
    return { id:exId, move:mv, machine:m, userHeightIn:h, posture:posture, face:mv.face, bench:!!mv.bench, headToMachine:!!mv.headToMachine, from:mv.from,
      track:tf.track, mountIn:actualMount, handleIn:handleIn, tiltDeg:tiltDeg, ang:tiltSetting, dep:inOut, horizReach:horizReach, armLen:armLen,
      startIn:startIn, finishIn:finishIn, startLandmark:landmarkLabel(mv.start), finishLandmark:landmarkLabel(mv.finish),
      why:mv.why, startTooHigh:false, short:"Track "+tf.track+" of 8",
      instruction:"Track "+tf.track+" of 8 ("+pd+"). Then set Arm tilt "+tiltSetting+"/11 and Arm in/out "+inOut+"/5 so the HANDLES line up with your "+(landmarkLabel(mv.start))+"."+benchTxt };
  }
  function landmarkLabel(n){ if(n==="chestLie")return "chest"; if(n==="lockoutLie")return "arms extended"; return LABEL[n]||"chest"; }
  window.BIO = { MACHINE:MACHINE, MOVES:MOVES, LANDMARK:L, solve:solve, trackHeight:trackHeight, trackForHeight:trackForHeight, hasMove:function(id){return !!MOVES[id];} };
})();
