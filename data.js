/* data.js - readable exercise + template data. */
function C(id,name,cat,muscles,attach,group,pos,bench,goals,cues,reps,sets,rest){
  return {id:id,name:name,cat:cat,muscles:muscles.split(','),equipment:'functional-trainer',attach:attach,
    setup:{group:group,pos:pos,bench:bench||''},goals:goals.split(','),cues:cues.split('|'),
    reps:reps,sets:sets,rest:rest,status:'testing',load:'cable',complexity:'medium'};
}
function F(id,name,cat,muscles,equipment,goals,cues,reps,sets,rest,load){
  return {id:id,name:name,cat:cat,muscles:muscles.split(','),equipment:equipment,attach:'none',setup:null,
    goals:goals.split(','),cues:cues.split('|'),reps:reps,sets:sets,rest:rest,status:'verified',load:load,complexity:'low'};
}

var EX = [
  C('standing-cable-chest-press','Standing Cable Chest Press','push','chest,triceps,core','d-handle','mid-dual-press','Split stance, centered between both arms','','strength,hypertrophy,fat-loss','Ribs down|Press slightly together|Control the return','8-12',3,65),
  C('flat-bench-cable-press','Flat Bench Cable Press','push','chest,triceps,shoulders','d-handle','bench-mid-press','Flat bench centered lengthwise between arms','Bench centered','strength,hypertrophy','Pin shoulder blades|Wrists stacked|Press smoothly','8-12',3,75),
  C('low-to-high-cable-press','Low-to-High Cable Press','push','upper chest,shoulders,triceps','d-handle','low-dual-press','Standing centered, handles low beside ribs','','hypertrophy,fat-loss','Press up toward eye line|Keep ribs stacked|Finish without shrugging','10-12',3,60),
  C('mid-cable-fly','Mid Cable Fly','push','chest,shoulders','d-handle','mid-dual-fly','Standing one step forward, arms wide','','hypertrophy,posture','Soft elbows|Hug wide|Pause at center','10-15',3,50),
  C('single-arm-cable-press','Single-Arm Cable Press','push','chest,triceps,core','d-handle','mid-single-press','One arm working, split stance','','strength,posture,hypertrophy','Resist rotation|Press across ribs|Slow return','8-12 each side',3,55),
  C('seated-cable-row','Seated Cable Row','pull','back,biceps,rear delts','d-handle','bench-mid-row','Seated tall on bench facing machine','Bench facing machine','strength,hypertrophy,posture','Tall chest|Pull elbows back|Do not shrug','8-12',3,65),
  C('standing-cable-row','Standing Cable Row','pull','back,biceps,core','d-handle','mid-dual-row','Tall stance, slight knee bend','','strength,hypertrophy,posture','Brace first|Pull elbows to back pockets|Slow reach','8-12',3,65),
  C('half-kneeling-lat-pulldown','Half-Kneeling Lat Pulldown','pull','lats,biceps,core','d-handle','high-dual-pulldown','Half kneeling, centered under high cables','','strength,hypertrophy,posture','Elbows to ribs|Long neck|Slow return overhead','8-12',3,70),
  C('straight-arm-pulldown','Straight Arm Pulldown','pull','lats,core,triceps','straight-bar','high-bar-pull','Standing tall, slight hip hinge','','hypertrophy,posture','Arms long|Pull bar to thighs|Feel lats','10-15',3,55),
  C('face-pull','Rope Face Pull','pull','rear delts,upper back,shoulders','rope','high-rope-posture','Standing tall, rope at face height','','posture,mobility,hypertrophy','Pull rope apart|Elbows high|Keep neck relaxed','12-15',2,45),
  C('high-cable-row','High Cable Row','pull','upper back,lats,biceps','d-handle','high-dual-row','Standing or kneeling, elbows angled down','','hypertrophy,posture','Lead with elbows|Squeeze upper back|Reach long','10-12',3,55),
  C('cable-overhead-press','Cable Overhead Press','push','shoulders,triceps,core','d-handle','low-dual-shoulder','Standing centered, handles at shoulders','','strength,hypertrophy','Glutes on|Press overhead|No lean back','8-10',3,65),
  C('cable-lateral-raise','Cable Lateral Raise','push','shoulders,upper back','d-handle','low-single-shoulder','Standing side-on, one handle working','','hypertrophy,posture','Lead with elbow|Stop below shrug|Slow lower','10-15',2,40),
  C('rear-delt-cable-fly','Rear Delt Cable Fly','pull','rear delts,upper back','d-handle','mid-dual-posture','Standing centered, arms crossed to start','','posture,hypertrophy','Wide reach|Pull apart|No shrug','12-15',2,45),
  C('rope-biceps-curl','Rope Biceps Curl','pull','biceps,forearms','rope','low-rope-arms','Standing tall, elbows by ribs','','hypertrophy,strength','Elbows quiet|Curl and separate|Slow down','10-15',3,45),
  C('cable-hammer-curl','Cable Hammer Curl','pull','biceps,forearms','rope','low-rope-arms','Standing tall, neutral grip','','hypertrophy,strength','Thumbs up|No sway|Control the stretch','10-15',3,45),
  C('rope-triceps-pushdown','Rope Triceps Pushdown','push','triceps,core','rope','high-rope-arms','Standing tall, elbows by sides','','hypertrophy,strength','Elbows parked|Press rope down|Separate at bottom','10-15',3,45),
  C('overhead-rope-triceps-extension','Overhead Rope Triceps Extension','push','triceps,core,shoulders','rope','low-rope-arms','Facing away, rope behind head','','hypertrophy','Ribs down|Elbows forward|Reach long','10-15',2,45),
  C('cable-squat','Cable Squat','legs','quads,glutes,core','straight-bar','low-bar-legs','Standing facing machine, bar at chest','','strength,hypertrophy,fat-loss','Sit between feet|Chest tall|Drive floor away','8-12',3,65),
  C('cable-pull-through','Cable Pull-Through','legs','glutes,hamstrings,core','rope','low-rope-hinge','Facing away, rope between legs','','hypertrophy,strength','Hips back|Long spine|Stand tall','10-12',3,60),
  C('cable-rdl','Cable Romanian Deadlift','legs','hamstrings,glutes,back','straight-bar','low-bar-hinge','Standing facing machine, arms long','','strength,hypertrophy','Reach hips back|Feel hamstrings|Do not round','8-12',3,70),
  C('glute-kickback','Cable Glute Kickback','legs','glutes,hamstrings,core','ankle-strap','low-single-glute','Facing machine, ankle strap on working leg','','hypertrophy,posture','Brace lightly|Drive heel back|No low-back swing','10-15 each side',2,40),
  C('pallof-press','Pallof Press','core','core,glutes,shoulders','d-handle','mid-single-core','Side-on stance, handle at sternum','','posture,strength,guest-safe','Do not rotate|Reach long|Breathe','8-12 each side',2,35),
  C('cable-chop','Cable Chop','core','core,shoulders,glutes','d-handle','high-single-core','Side-on stance, high-to-low path','','youth-athletic,fat-loss','Rotate through ribs|Hips controlled|Slow return','8-12 each side',2,35),
  C('cable-lift','Cable Lift','core','core,shoulders,glutes','d-handle','low-single-core','Side-on stance, low-to-high path','','posture,strength,youth-athletic','Move as one unit|Finish tall|Slow down','8-12 each side',2,35),
  C('kneeling-cable-crunch','Kneeling Cable Crunch','core','core','rope','high-rope-core','Kneeling facing machine','','hypertrophy,strength','Curl ribs down|Hips quiet|Do not yank','10-15',2,40),

  F('goblet-squat','Goblet Squat','legs','quads,glutes,core','dumbbells','strength,fat-loss,guest-safe,youth-athletic','Tall chest|Knees track toes|Stand strong','8-12',3,45,'dumbbell'),
  F('dumbbell-rdl','Dumbbell Romanian Deadlift','legs','hamstrings,glutes,back','dumbbells','strength,hypertrophy,guest-safe','Hips back|Long spine|Stand tall','8-12',3,50,'dumbbell'),
  F('dumbbell-floor-press','Dumbbell Floor Press','push','chest,triceps','dumbbells','strength,hypertrophy,guest-safe','Elbows kiss floor|Press straight up|Wrists stacked','8-12',3,45,'dumbbell'),
  F('dumbbell-lateral-raise','Dumbbell Lateral Raise','push','shoulders,upper back','dumbbells','hypertrophy,posture,guest-safe','Soft elbows|Stop before shrug|Slow lower','10-15',2,40,'dumbbell'),
  F('dumbbell-curl','Dumbbell Curl','pull','biceps,forearms','dumbbells','hypertrophy,guest-safe','Elbows by ribs|No swing|Slow down','10-15',2,40,'dumbbell'),
  F('dumbbell-shoulder-press','Dumbbell Shoulder Press','push','shoulders,triceps,core','dumbbells','strength,hypertrophy,guest-safe','Sit or stand tall|Press over shoulders|Keep ribs stacked','8-12',2,45,'dumbbell'),

  F('bodyweight-squat','Bodyweight Squat','legs','quads,glutes,core','bodyweight','guest-safe,youth-athletic,fat-loss,mobility','Feet rooted|Reach hips down|Stand tall','10-15',2,35,'bodyweight'),
  F('bench-step-up','Bench Step-Up','legs','quads,glutes,core','bench','guest-safe,youth-athletic,fat-loss','Whole foot on bench|Drive through lead leg|Step down softly','8-10 each side',2,45,'bodyweight'),
  F('split-squat-support','Supported Split Squat','legs','quads,glutes,core','bench','strength,guest-safe,youth-athletic','Use bench or rail for balance|Drop straight down|Drive through front foot','6-10 each side',2,45,'bodyweight'),
  F('push-up','Push-Up','push','chest,triceps,core','bodyweight','strength,guest-safe,youth-athletic','Hands under shoulders|Body as one piece|Press floor away','6-12',2,45,'bodyweight'),
  F('incline-push-up','Incline Push-Up','push','chest,triceps,core','bench','guest-safe,youth-athletic,strength','Hands on bench|Straight line|Chest to bench','6-12',2,45,'bodyweight'),
  F('plank','Plank','core','core,shoulders,glutes','floor','guest-safe,youth-athletic,posture','Ribs tucked|Glutes on|Breathe','20-40 sec',2,35,'time'),
  F('side-plank','Side Plank','core','core,shoulders,glutes','floor','guest-safe,posture,youth-athletic','Stack ribs|Push floor away|Long line','15-30 sec each side',2,30,'time'),
  F('dead-bug','Dead Bug','core','core,hip flexors','floor','guest-safe,posture,mobility','Low back quiet|Move slow|Exhale','6-10 each side',2,30,'bodyweight'),
  F('bear-crawl','Bear Crawl','athletic','core,shoulders,quads','floor','youth-athletic,fat-loss,guest-safe','Quiet hips|Small steps|Soft hands','15-25 sec',2,35,'time'),
  F('broad-jump','Broad Jump Stick','athletic','glutes,quads,calves','floor','youth-athletic,fat-loss','Jump soft|Stick the landing|Reset each rep','3-5 reps',3,40,'bodyweight'),
  F('agility-footwork','Agility Footwork','athletic','conditioning,calves,core','floor','youth-athletic,fat-loss,guest-safe','Quick feet|Soft knees|Tall posture','20 sec',3,30,'time'),
  F('squat-to-reach','Squat to Reach','mobility','quads,glutes,mobility','floor','mobility,guest-safe,youth-athletic','Sit low|Reach overhead|Stand tall','6-10',2,30,'bodyweight'),
  F('hip-hinge-drill','Hip Hinge Drill','mobility','hamstrings,glutes,back','floor','mobility,guest-safe,posture','Push hips back|Long spine|Feel hamstrings','8-10',2,30,'bodyweight'),
  F('scap-push-up','Scap Push-Up','push','shoulders,upper back,core','floor','posture,guest-safe,youth-athletic','Keep arms long|Reach floor away|No elbow bend','8-12',2,30,'bodyweight'),
  F('mobility-flow','Family Mobility Flow','mobility','mobility,back,hips,shoulders','floor','mobility,guest-safe,posture','Move slowly|Use easy range|Breathe out','5 min',1,20,'time')
];

function T(id,title,focus,goals,ids){ return {id:id,title:title,focus:focus,goals:goals.split(','),ids:ids.split(',')}; }
var TEMPLATES = [
  T('upper-push','Upper Push Build','Chest, shoulders, triceps, core','strength,hypertrophy','standing-cable-chest-press,single-arm-cable-press,flat-bench-cable-press,mid-cable-fly,dumbbell-shoulder-press,dumbbell-lateral-raise,rope-triceps-pushdown,overhead-rope-triceps-extension,pallof-press,push-up'),
  T('upper-pull','Upper Pull Armor','Back, lats, rear delts, biceps','strength,hypertrophy,posture','seated-cable-row,standing-cable-row,half-kneeling-lat-pulldown,straight-arm-pulldown,face-pull,rear-delt-cable-fly,rope-biceps-curl,cable-hammer-curl,dumbbell-curl,scap-push-up'),
  T('lower','Lower Body Engine','Squat, hinge, glutes, trunk','strength,hypertrophy,fat-loss','goblet-squat,cable-squat,dumbbell-rdl,cable-pull-through,cable-rdl,glute-kickback,split-squat-support,pallof-press,plank'),
  T('total','Total Body Rotation','Push, pull, legs, core','strength,fat-loss,hypertrophy','standing-cable-row,standing-cable-chest-press,goblet-squat,cable-pull-through,face-pull,pallof-press'),
  T('posture','Posture Reset','Upper back, shoulders, trunk control','posture,mobility','face-pull,standing-cable-row,cable-lift,pallof-press,scap-push-up,dead-bug,side-plank,mobility-flow'),
  T('guest','Guest Safe Circuit','Simple full-body movement','guest-safe,fat-loss,mobility','bodyweight-squat,incline-push-up,dumbbell-floor-press,goblet-squat,dead-bug,side-plank,mobility-flow'),
  T('youth','Youth Athletic Play','Coordination, crawls, light strength','youth-athletic,fat-loss','agility-footwork,broad-jump,bear-crawl,squat-to-reach,bodyweight-squat,bench-step-up,push-up,plank,mobility-flow')
];
