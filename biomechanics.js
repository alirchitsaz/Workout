/* biomechanics.js - Apex Free-Arm Trainer ARM-MOUNT model. Replace your existing file. */
(function () {
  var MACHINE = { tracks:8, trackTopIn:76, trackBottomIn:36, armAngles:11, armDepth:5,
    stackMin:10, stackMax:200, stackInc:10, armLenIn:30,
    dumbbells:[3,5,8,10,12], attachments:["d-handle","rope","straight-bar","v-bar","lat-bar","ankle-strap"] };
  var L={floor:0,ankle:.06,knee:.28,midThigh:.42,hip:.52,navel:.62,sternum:.72,armpit:.77,shoulder:.82,chin:.88,eye:.94,crown:1,reachUp:1.26};
  var LABEL={floor:"the floor",ankle:"ankle",knee:"knee",midThigh:"mid-thigh",hip:"hip",navel:"navel",sternum:"mid-chest",armpit:"chest",shoulder:"shoulder",chin:"chin",eye:"eye",crown:"top of head",reachUp:"overhead"};
  var MOVES={
    "standing-cable-chest-press":{posture:"standing",face:"away",from:"low",start:"armpit",finish:"sternum",wide:false,why:"Track 8 is the vertical arm mount. Swing the metal arms out/up so the HANDLES meet chest height, then press forward and slightly in."},
    "single-arm-cable-press":{posture:"standing",face:"away",from:"low",start:"armpit",finish:"sternum",wide:false,why:"Track 8 mount, one arm angled up/out so the handle meets chest height. Resist rotation."},
    "flat-bench-cable-press":{posture:"lying",bench:true,headToMachine:true,face:"up",from:"low",start:"chestLie",finish:"lockoutLie",wide:false,why:"Head toward the machine. Track 8 mount; arms angle up/out so the handles start at chest height. This is decline/core-biased, not a flat chest press."},
    "low-to-high-cable-press":{posture:"standing",face:"away",from:"low",start:"hip",finish:"eye",wide:false,why:"Track 8 mount; arms angle to the lower-rib/hip start, then press up and in."},
    "mid-cable-fly":{posture:"standing",face:"away",from:"low",start:"shoulder",finish:"sternum",wide:true,why:"Track 8 mount; arms out wide and angled up until handles meet shoulder/chest height."},
    "seated-cable-row":{posture:"seated",bench:true,face:"toward",from:"mid",start:"navel",finish:"navel",wide:false,why:"Mount near lower-chest height; arms extend to the handle start, then row to ribs."},
    "standing-cable-row":{posture:"standing",face:"toward",from:"mid",start:"sternum",finish:"sternum",wide:false,why:"Mount near chest height; arms level to the handles."},
    "half-kneeling-lat-pulldown":{posture:"half-kneel",face:"toward",from:"high",start:"reachUp",finish:"chin",wide:false,why:"Track 1 mount; arms angle down from high so handles are overhead."},
    "straight-arm-pulldown":{posture:"standing",face:"toward",from:"high",start:"eye",finish:"midThigh",wide:false,why:"Track 1 mount; arms angle down to eye-level handle start."},
    "face-pull":{posture:"standing",face:"toward",from:"high",start:"eye",finish:"chin",wide:false,why:"Track 1 mount; arms angle down until rope/handles meet face height."},
    "high-cable-row":{posture:"standing",face:"toward",from:"high",start:"eye",finish:"sternum",wide:false,why:"Track 1 mount; arms angle down from high for high row."},
    "cable-overhead-press":{posture:"standing",face:"away",from:"mid",start:"shoulder",finish:"reachUp",wide:false,why:"Mount near shoulder height; handles start at shoulders then press overhead."},
    "cable-lateral-raise":{posture:"standing",face:"side",from:"low",start:"midThigh",finish:"shoulder",wide:false,why:"Track 8 mount; arms angle down/out to hand by thigh, then raise."},
    "rear-delt-cable-fly":{posture:"standing",face:"toward",from:"mid",start:"shoulder",finish:"shoulder",wide:true,why:"Mount near shoulder height and arms out wide."},
    "rope-biceps-curl":{posture:"standing",face:"toward",from:"low",start:"midThigh",finish:"sternum",wide:false,why:"Track 8 mount; arms angle down so rope starts by thighs."},
    "cable-hammer-curl":{posture:"standing",face:"toward",from:"low",start:"midThigh",finish:"sternum",wide:false,why:"Track 8 mount; neutral rope starts by thighs."},
    "rope-triceps-pushdown":{posture:"standing",face:"toward",from:"high",start:"sternum",finish:"midThigh",wide:false,why:"Track 1 mount; arms angle down to rope at chest height."},
    "overhead-rope-triceps-extension":{posture:"standing",face:"away",from:"low",start:"crown",finish:"reachUp",wide:false,why:"Track 8 mount behind you; arms angle up so rope starts behind head."},
    "cable-squat":{posture:"standing",face:"toward",from:"low",start:"hip",finish:"sternum",wide:false,why:"Track 8 mount; handles/bar start low at hip/chest hold."},
    "cable-pull-through":{posture:"standing",face:"away",from:"low",start:"knee",finish:"hip",wide:false,why:"Track 8 mount; rope starts low between legs."},
    "cable-rdl":{posture:"standing",face:"toward",from:"low",start:"knee",finish:"hip",wide:false,why:"Track 8 mount; bar starts low for hinge."},
    "glute-kickback":{posture:"standing",face:"toward",from:"low",start:"ankle",finish:"knee",wide:false,why:"Track 8 mount; ankle strap starts low."},
    "pallof-press":{posture:"standing",face:"side",from:"mid",start:"sternum",finish:"sternum",wide:false,why:"Mount near sternum height; handle starts at sternum."},
    "cable-chop":{posture:"standing",face:"side",from:"high",start:"shoulder",finish:"hip",wide:false,why:"Track 1 mount; high-to-low chop."},
    "cable-lift":{posture:"standing",face:"side",from:"low",start:"hip",finish:"crown",wide:false,why:"Track 8 mount; low-to-high lift."},
    "kneeling-cable-crunch":{posture:"kneel",face:"toward",from:"high",start:"crown",finish:"knee",wide:false,why:"Track 1 mount; rope starts by head."}
  };
  var DEG=Math.PI/180, BENCH_TOP=18;
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function trackHeight(t,m){m=m||MACHINE;var f=(clamp(t,1,m.tracks)-1)/(m.tracks-1);return Math.round(m.trackTopIn-f*(m.trackTopIn-m.trackBottomIn));}
  function trackForHeight(inch,m){m=m||MACHINE;var c=clamp(inch,m.trackBottomIn,m.trackTopIn);var f=(m.trackTopIn-c)/(m.trackTopIn-m.trackBottomIn);var t=Math.round(f*(m.tracks-1))+1;return {track:t,actualIn:trackHeight(t,m)};}
  function landmarkIn(name,h,posture){
    if(posture==="lying")return BENCH_TOP+4;
    if(posture==="seated"){var v=(L[name]!=null?L[name]:L.sternum);return Math.round(Math.max(BENCH_TOP,h*v-h*.25));}
    if(posture==="kneel"||posture==="half-kneel"){var vv=(L[name]!=null?L[name]:L.sternum);return Math.round(Math.max(6,h*vv-h*.12));}
    return Math.round(h*(L[name]!=null?L[name]:L.sternum));
  }
  function solve(exId,userHeightIn,machine){
    var m=machine||MACHINE,mv=MOVES[exId]; if(!mv)return null;
    var h=userHeightIn||69,posture=mv.posture||"standing",armLen=m.armLenIn||30;
    var handleIn=landmarkIn(mv.start,h,posture);
    var tf=mv.from==="low"?{track:m.tracks,actualIn:trackHeight(m.tracks,m)}:mv.from==="high"?{track:1,actualIn:trackHeight(1,m)}:trackForHeight(handleIn,m);
    var actualMount=tf.actualIn;
    var tiltDeg=Math.asin(clamp((handleIn-actualMount)/armLen,-1,1))/DEG;
    var tiltSetting=clamp(Math.round(6+tiltDeg/15),1,11);
    var inOut=mv.wide?5:(mv.from==="low"?4:3);
    var startIn=handleIn,finishIn=landmarkIn(mv.finish,h,posture);
    var pd=mv.from==="low"?"Track 8 mount (~3 ft); arm angles from mount to handle":mv.from==="high"?"Track 1 mount; arm angles down from high mount":"mid mount near handle height";
    var benchTxt=mv.headToMachine?" Lie head-toward-machine; bench centered.":(mv.bench?" Bench centered.":"");
    return {id:exId,move:mv,machine:m,userHeightIn:h,posture:posture,face:mv.face,bench:!!mv.bench,headToMachine:!!mv.headToMachine,from:mv.from,
      track:tf.track,mountIn:actualMount,handleIn:handleIn,tiltDeg:tiltDeg,ang:tiltSetting,dep:inOut,armLen:armLen,
      startIn:startIn,finishIn:finishIn,startLandmark:landmarkLabel(mv.start),finishLandmark:landmarkLabel(mv.finish),why:mv.why,
      instruction:"Track "+tf.track+" of 8 (vertical ARM MOUNT: "+pd+"). Then set Arm tilt "+tiltSetting+"/11 and Arm in/out "+inOut+"/5 so the HANDLES—not the tower—line up with your "+landmarkLabel(mv.start)+"."+benchTxt};
  }
  function landmarkLabel(n){if(n==="chestLie")return "chest";if(n==="lockoutLie")return "arms extended";return LABEL[n]||"chest";}
  window.BIO={MACHINE:MACHINE,MOVES:MOVES,LANDMARK:L,solve:solve,trackHeight:trackHeight,trackForHeight:trackForHeight,hasMove:function(id){return !!MOVES[id];}};
})();
