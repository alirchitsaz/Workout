/* biomechanics.js - physics-aware setup engine for a dual adjustable-pulley trainer.
   Exposes window.BIO. Load BEFORE app.js. */
(function () {
  var MACHINE = { positions: 20, minHeightIn: 6, maxHeightIn: 78, armAngles: 11, depthSteps: 5 };

  var L = {
    floor:0.00, ankle:0.06, knee:0.28, midThigh:0.42, hip:0.52, navel:0.62,
    sternum:0.72, armpit:0.77, shoulder:0.82, chin:0.88, eye:0.94, crown:1.00, reachUp:1.26
  };
  var LABEL = {
    floor:"the floor", ankle:"ankle", knee:"knee", midThigh:"mid-thigh", hip:"hip",
    navel:"navel", sternum:"mid-chest", armpit:"armpit/chest", shoulder:"shoulder",
    chin:"chin", eye:"eye", crown:"top of head", reachUp:"overhead reach"
  };

  var MOVES = {
    "standing-cable-chest-press":{face:"away",pulley:"shoulder",start:"armpit",finish:"sternum",
      why:"Pulleys at shoulder height keep the push horizontal so tension stays on the pecs. If the handles sit above your shoulders at the start, the pulley is too high - drop it a notch."},
    "single-arm-cable-press":{face:"away",pulley:"shoulder",start:"armpit",finish:"sternum",
      why:"Same as the two-arm press; the anti-rotation demand is a bonus, not a reason to raise the pulley."},
    "flat-bench-cable-press":{face:"away",bench:true,pulleyIn:20,start:"navel",finish:"sternum",
      why:"Lying down, set the pulleys so the cable is level with your shoulders (~18-22in). That is the LOW settings, not mid."},
    "low-to-high-cable-press":{face:"away",pulley:"hip",start:"hip",finish:"eye",
      why:"Low pulley so you press up and in - that biases the upper chest."},
    "mid-cable-fly":{face:"away",pulley:"shoulder",start:"shoulder",finish:"sternum",
      why:"Shoulder-height pulleys keep the fly arc in the chest plane; hug the hands together at the centerline."},
    "seated-cable-row":{face:"toward",bench:true,pulley:"navel",start:"navel",finish:"navel",
      why:"Seated, your shoulders drop - pull to the lower chest/upper abs with the pulley near navel height."},
    "standing-cable-row":{face:"toward",pulley:"sternum",start:"sternum",finish:"sternum",
      why:"Chest-height pulley keeps the pull path around the lower ribs."},
    "half-kneeling-lat-pulldown":{face:"toward",pulley:"reachUp",start:"reachUp",finish:"chin",
      why:"Top setting so you pull down from full overhead to the collarbone."},
    "straight-arm-pulldown":{face:"toward",pulley:"reachUp",start:"eye",finish:"midThigh",
      why:"High pulley, straight arms sweeping to the thighs - isolates the lats, no biceps."},
    "face-pull":{face:"toward",pulley:"crown",start:"eye",finish:"chin",
      why:"Rope at or just above head height; pull to the face and rotate - the best rear-delt/posture move."},
    "high-cable-row":{face:"toward",pulley:"eye",start:"eye",finish:"sternum",
      why:"Slightly above shoulder so the elbows drive down and back into the upper back."},
    "cable-overhead-press":{face:"away",pulley:"shoulder",start:"shoulder",finish:"reachUp",
      why:"Pulleys at shoulder height so the cable pulls straight down at lockout - matches the press."},
    "cable-lateral-raise":{face:"side",pulley:"floor",start:"midThigh",finish:"shoulder",
      why:"Lowest setting; raise across the body to shoulder height for constant tension on the side delt."},
    "rear-delt-cable-fly":{face:"toward",pulley:"shoulder",start:"shoulder",finish:"shoulder",
      why:"Shoulder height, arms crossed to start, pull wide - keeps load on the rear delts."},
    "rope-biceps-curl":{face:"toward",pulley:"floor",start:"midThigh",finish:"sternum",
      why:"Lowest setting; elbows pinned so the curl runs from thigh to chest."},
    "cable-hammer-curl":{face:"toward",pulley:"floor",start:"midThigh",finish:"sternum",
      why:"Same as the curl, neutral grip."},
    "rope-triceps-pushdown":{face:"toward",pulley:"crown",start:"sternum",finish:"midThigh",
      why:"High pulley, elbows parked; press from chest to thighs."},
    "overhead-rope-triceps-extension":{face:"away",pulley:"hip",start:"crown",finish:"reachUp",
      why:"Low pulley behind you; reach from behind the head to full overhead."},
    "cable-squat":{face:"toward",pulley:"knee",start:"hip",finish:"sternum",
      why:"Low pulley, hold at chest - the cable helps you sit back into the squat."},
    "cable-pull-through":{face:"away",pulley:"floor",start:"knee",finish:"hip",
      why:"Lowest setting, rope between the legs; drive hips to lockout."},
    "cable-rdl":{face:"toward",pulley:"floor",start:"knee",finish:"hip",
      why:"Lowest setting; hinge with a long spine, feel the hamstrings."},
    "glute-kickback":{face:"toward",pulley:"floor",start:"ankle",finish:"knee",
      why:"Ankle strap on the lowest setting; drive the heel back without arching."},
    "pallof-press":{face:"side",pulley:"sternum",start:"sternum",finish:"sternum",
      why:"Handle at sternum height; resist rotation - do not let the torso twist."},
    "cable-chop":{face:"side",pulley:"crown",start:"shoulder",finish:"hip",
      why:"High-to-low: pulley high, rotate down to the opposite hip."},
    "cable-lift":{face:"side",pulley:"floor",start:"hip",finish:"crown",
      why:"Low-to-high: pulley low, rotate up and finish tall."},
    "kneeling-cable-crunch":{face:"toward",pulley:"reachUp",start:"crown",finish:"knee",
      why:"Top setting, rope by the head; curl the ribs toward the hips."}
  };

  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

  function settingForHeight(targetIn, m){
    var clamped = clamp(targetIn, m.minHeightIn, m.maxHeightIn);
    var frac = (clamped - m.minHeightIn) / (m.maxHeightIn - m.minHeightIn);
    var notch = Math.round(frac * (m.positions - 1)) + 1;
    var actualIn = m.minHeightIn + (notch - 1) / (m.positions - 1) * (m.maxHeightIn - m.minHeightIn);
    var track8 = Math.round((1 - frac) * 7) + 1;
    return { notch: notch, actualIn: Math.round(actualIn), track8: track8, requestedIn: Math.round(targetIn) };
  }

  function solve(exId, userHeightIn, machine){
    var m = machine || MACHINE;
    var mv = MOVES[exId];
    if (!mv) return null;
    var h = userHeightIn || 69;
    var pulleyIn = mv.bench ? (mv.pulleyIn || 20) : h * L[mv.pulley];
    var setting = settingForHeight(pulleyIn, m);
    var startIn = Math.round(h * (L[mv.start] != null ? L[mv.start] : L.sternum));
    var finishIn = Math.round(h * (L[mv.finish] != null ? L[mv.finish] : L.sternum));
    var gap = setting.actualIn - startIn;
    var startTooHigh = mv.face === "away" && gap > h * 0.10;
    return {
      id: exId, move: mv, machine: m, userHeightIn: h,
      face: mv.face, bench: !!mv.bench, pulley: setting,
      pulleyLandmark: mv.bench ? "shoulder (lying)" : LABEL[mv.pulley],
      startIn: startIn, finishIn: finishIn,
      startLandmark: LABEL[mv.start] || "chest", finishLandmark: LABEL[mv.finish] || "chest",
      why: mv.why, startTooHigh: startTooHigh,
      instruction: "Set the pulley to notch " + setting.notch + " of " + m.positions +
        " (~" + setting.actualIn + "in, about " + (mv.bench ? "shoulder height lying down" : LABEL[mv.pulley]) + "). " +
        "Handles should line up with your " + (LABEL[mv.start] || "chest") + " at the start."
    };
  }

  window.BIO = { MACHINE: MACHINE, MOVES: MOVES, LANDMARK: L, solve: solve,
                 settingForHeight: settingForHeight, hasMove: function(id){ return !!MOVES[id]; } };
})();
