const KEY = "chitsaz-training-lab-v5";

const GOALS = {
  strength: "Strength",
  hypertrophy: "Muscle",
  "fat-loss": "Fat loss",
  posture: "Posture",
  mobility: "Mobility",
  "youth-athletic": "Youth athletic",
  "guest-safe": "Guest safe",
};

const MUSCLES = [
  "chest",
  "back",
  "lats",
  "shoulders",
  "rear delts",
  "quads",
  "glutes",
  "hamstrings",
  "core",
  "mobility",
];

const VIEWS = [
  ["home", "Home"],
  ["workout", "Workout"],
  ["library", "Library"],
  ["history", "Progress"],
  ["menu", "Menu"],
];

const PRESETS = [
  {
    id: "press",
    name: "Dual press and fly",
    tag: "Chest / shoulders",
    setup: { track: 5, angle: 8, depth: 3, group: "mid-dual-press", pos: "Centered split stance or bench lane", attach: "d-handle", bench: "Optional centered bench" },
    note: "Mid track, arms opened wide enough to press slightly inward without the cables scraping the forearms.",
  },
  {
    id: "row",
    name: "Rows and posture",
    tag: "Back / rear delts",
    setup: { track: 5, angle: 4, depth: 3, group: "mid-dual-row", pos: "Facing machine, tall chest", attach: "d-handle", bench: "Bench facing machine for seated rows" },
    note: "Mid track keeps the pull path around lower ribs, with easy swaps between standing row and seated bench row.",
  },
  {
    id: "pulldown",
    name: "High pull station",
    tag: "Lats / triceps",
    setup: { track: 1, angle: 5, depth: 3, group: "high-pull", pos: "Half-kneeling or standing under high cables", attach: "rope or straight-bar", bench: "" },
    note: "Top track is for pulldowns, face pulls, triceps pushdowns, and straight-arm pulldowns.",
  },
  {
    id: "low",
    name: "Low cable station",
    tag: "Legs / arms",
    setup: { track: 8, angle: 5, depth: 3, group: "low-cable", pos: "Standing in front of tower or facing away", attach: "rope / straight-bar", bench: "" },
    note: "Bottom track supports squats, pull-throughs, curls, low cable raises, and hinge patterns.",
  },
  {
    id: "core",
    name: "Single-arm core",
    tag: "Anti-rotation",
    setup: { track: 5, angle: 5, depth: 3, group: "mid-single-core", pos: "Side-on stance, handle at sternum", attach: "d-handle", bench: "" },
    note: "Keep one arm set around sternum height for Pallof presses, chops, and lifts.",
  },
];

let view = "home";
let rest = 0;
let restTick = null;
let state = load();

function defaults() {
  return {
    profiles: [
      { id: "ali", name: "Ali", mode: "adult", goal: "strength", max: 120, testing: true, color: "#36d48f", note: "Strength plus muscle, with full cable access." },
      { id: "wife-mom", name: "Wife / Mom", mode: "adult", goal: "posture", max: 70, testing: true, color: "#79c8ff", note: "Posture, strength, and simple progression." },
      { id: "teen-athlete", name: "Teen Athlete", mode: "teen", goal: "youth-athletic", max: 50, testing: true, color: "#f1b84d", note: "Athletic, controlled, age-appropriate work." },
      { id: "guest", name: "Guest", mode: "guest", goal: "guest-safe", max: 30, testing: false, color: "#df2f3f", note: "Simple verified movements only." },
    ],
    active: "ali",
    gym: {
      stackVerified: false,
      depth: "unknown",
      attachments: ["d-handle", "rope", "straight-bar", "none"],
      min: 10,
      max: 200,
      inc: 10,
      preset: "press",
      safety: true,
    },
    assessment: {
      sore: [],
      minutes: 35,
      goal: "strength",
      intensity: "moderate",
      pain: false,
    },
    history: [],
    activeWorkout: null,
    filter: "all",
    q: "",
  };
}

function load() {
  const base = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw);
    return {
      ...base,
      ...saved,
      profiles: Array.isArray(saved.profiles) && saved.profiles.length ? saved.profiles : base.profiles,
      gym: { ...base.gym, ...(saved.gym || {}) },
      assessment: { ...base.assessment, ...(saved.assessment || {}) },
      history: Array.isArray(saved.history) ? saved.history : [],
    };
  } catch {
    return base;
  }
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function p() {
  return state.profiles.find((profile) => profile.id === state.active) || state.profiles[0];
}

function ex(id) {
  return EX.find((item) => item.id === id);
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

function setView(next) {
  view = next;
  closeDrawer();
  render();
}

function render() {
  save();
  renderShell();
  if (view === "home" || view === "today") home();
  if (view === "workout") workout();
  if (view === "gym") gym();
  if (view === "library") library();
  if (view === "history") history();
  if (view === "menu") menuView();
  if (view === "profiles") profilesView();
  if (view === "coach") coach();
}

function renderShell() {
  document.getElementById("nav").innerHTML = VIEWS.map(([id, label]) =>
    `<button class="${view === id ? "on" : ""}" onclick="setView('${id}')">${label}</button>`
  ).join("");

  document.getElementById("tabs").innerHTML = VIEWS.map(([id, label]) =>
    `<button class="${view === id ? "on" : ""}" onclick="setView('${id}')">${label[0]}<br>${label}</button>`
  ).join("");

  const profiles = document.getElementById("profiles");
  if (profiles) {
    profiles.innerHTML = state.profiles.map((profile) =>
      `<button class="profile-btn ${profile.id === state.active ? "on" : ""}" style="--c:${profile.color}" onclick="selectProfile('${profile.id}')"><b>${esc(initials(profile.name))}</b>${esc(profile.name)}</button>`
    ).join("") + `<button class="profile-btn" onclick="addProfile()"><b>+</b>Add</button>`;
  }

  const rail = document.getElementById("rail");
  if (rail) rail.innerHTML = "";
}

function initials(name) {
  return String(name || "?").split(/[ /]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function selectProfile(id) {
  state.active = id;
  state.assessment.goal = p().goal;
  render();
}

function setMinutes(minutes) {
  state.assessment.minutes = minutes;
  render();
}

function setIntensity(level) {
  state.assessment.intensity = level;
  render();
}

function home() {
  const plan = buildPlan();
  main(`
    <div class="stack">
      <section class="panel home-panel">
        <div class="home-head">
          <div>
            <span class="section-kicker">Start here</span>
            <h2>Who's training today?</h2>
            <p>Pick a profile. The workout, loads, and exercise filters adapt to that person.</p>
          </div>
          <button class="ghost" onclick="setView('profiles')">Edit profiles</button>
        </div>
        <div class="profile-grid">${state.profiles.map(profileCard).join("")}</div>
      </section>

      <section class="panel today-command">
        <div class="section">
          <div>
            <span class="section-kicker">Next for ${esc(p().name)}</span>
            <h2>${esc(plan.title)}</h2>
            <p>${esc(plan.focus)}. ${plan.minutes} minutes, ${plan.items.length} movements.</p>
          </div>
          <button class="primary" onclick="startWorkout()">Start plan</button>
        </div>
        ${assessmentHtml(plan)}
        ${sorenessHtml()}
        <div class="summary inline-summary">
          <b>Setup grouped</b>
          <p>Exercises are ordered to reduce cable arm changes.</p>
        </div>
        <div class="preview-grid">${plan.items.map(mini).join("")}</div>
      </section>
    </div>
  `);
}

function profileCard(profile) {
  const active = profile.id === state.active;
  const stats = statSummary(profile.id);
  return `
    <button class="profile-card ${active ? "on" : ""}" style="--c:${profile.color}" onclick="selectProfile('${profile.id}')">
      <span class="profile-avatar">${esc(initials(profile.name))}</span>
      <span class="profile-main">
        <b>${esc(profile.name)}</b>
        <small>${esc(GOALS[profile.goal])} / ${profile.max} lb cap</small>
      </span>
      <span class="profile-meta">${stats.sessions} sessions</span>
    </button>
  `;
}

function assessmentHtml(plan) {
  const selectedSummary = `${state.assessment.minutes} minutes, ${state.assessment.intensity} vibe`;
  return `
    <div class="quick-plan">
      <div class="split-row">
        <div><span class="label">Plan</span><b>${esc(selectedSummary)}</b></div>
        <span class="status verified">${plan.items.length} moves</span>
      </div>
      <div class="micro-grid">
      <label class="control">
        <span class="label">Goal</span>
        <select onchange="state.assessment.goal=this.value;render()">
          ${Object.entries(GOALS).map(([key, label]) => `<option value="${key}" ${state.assessment.goal === key ? "selected" : ""}>${label}</option>`).join("")}
        </select>
      </label>
      <div class="control">
        <span class="label">Plan length</span>
        <div class="choice-buttons">${[20, 35, 50].map((minutes) => `<button type="button" class="choice-button ${state.assessment.minutes === minutes ? "on" : ""}" onclick="setMinutes(${minutes})"><b>${minutes}</b><span>min</span></button>`).join("")}</div>
        <small class="choice-meta">Selected: ${state.assessment.minutes} minutes</small>
      </div>
      <div class="control">
        <span class="label">Vibe</span>
        <div class="choice-buttons">${["easy", "moderate", "hard"].map((level) => `<button type="button" class="choice-button ${state.assessment.intensity === level ? "on" : ""}" onclick="setIntensity('${level}')"><b>${level}</b><span>${vibeCopy(level)}</span></button>`).join("")}</div>
        <small class="choice-meta">Selected: ${state.assessment.intensity}</small>
      </div>
      </div>
    </div>
  `;
}

function vibeCopy(level) {
  if (level === "easy") return "lighter";
  if (level === "hard") return "push";
  return "steady";
}

function sorenessHtml() {
  return `
    <div class="avoid-strip">
      <div class="row">
        <b>Avoid today</b>
        <label class="toggle"><input type="checkbox" ${state.assessment.pain ? "checked" : ""} onchange="state.assessment.pain=this.checked;render()"> Pain today</label>
      </div>
      <div class="chips">${MUSCLES.map((muscle) => `<button class="chip ${state.assessment.sore.includes(muscle) ? "on" : ""}" onclick="toggleSore('${muscle}')">${muscle}</button>`).join("")}</div>
    </div>
  `;
}

function toggleSore(muscle) {
  state.assessment.sore = state.assessment.sore.includes(muscle)
    ? state.assessment.sore.filter((item) => item !== muscle)
    : state.assessment.sore.concat(muscle);
  render();
}

function mini(item) {
  const exercise = ex(item.id);
  if (!exercise) return "";
  return `
    <article class="mini">
      <span class="status ${exercise.status}">${statusLabel(exercise.status)}</span>
      <b>${esc(exercise.name)}</b>
      <small>${item.sets} x ${esc(item.reps)}</small>
      <small>${esc(groupLabel(exercise))}</small>
    </article>
  `;
}

function buildPlan() {
  const count = state.assessment.minutes === 20 ? 4 : state.assessment.minutes === 35 ? 5 : 7;
  const lastTemplate = state.history[0]?.template;
  const scored = TEMPLATES.map((template) => {
    let score = 50;
    if (template.goals.includes(state.assessment.goal)) score += 24;
    if (template.goals.includes(p().goal)) score += 12;
    if (p().mode === "guest" && template.id === "guest") score += 45;
    if ((p().mode === "teen" || p().mode === "youth") && template.id === "youth") score += 24;
    if (state.assessment.pain && (template.id === "guest" || template.id === "posture")) score += 18;
    if (lastTemplate === template.id) score -= 90;
    for (const muscle of state.assessment.sore) {
      if (template.focus.toLowerCase().includes(muscle)) score -= 15;
    }
    return { ...template, score };
  }).sort((a, b) => b.score - a.score);

  const template = scored[0];
  let pool = template.ids.map(ex).filter(Boolean).filter(eligible);
  pool = pool.sort((a, b) => scoreEx(b) - scoreEx(a));
  const items = setupBatch(pool.slice(0, count)).map(prescribe);
  return {
    template: template.id,
    title: template.title,
    focus: template.focus,
    minutes: state.assessment.minutes,
    score: template.score,
    reason: planReason(template),
    items,
  };
}

function planReason(template) {
  const parts = [
    `${GOALS[state.assessment.goal]} matched with ${template.focus.toLowerCase()}`,
    `${p().name} profile cap ${p().max} lb`,
  ];
  if (state.assessment.sore.length) parts.push(`sore areas reduced: ${state.assessment.sore.join(", ")}`);
  if (state.assessment.pain) parts.push("pain flag favors simpler patterns");
  if (p().mode === "guest") parts.push("guest mode filters to verified simple movements");
  if (p().mode === "teen" || p().mode === "youth") parts.push("youth-friendly control and coordination emphasized");
  return `${parts.join(". ")}.`;
}

function eligible(exercise) {
  if (!exercise) return false;
  if (p().mode === "guest" && !exercise.goals.includes("guest-safe")) return false;
  if ((p().mode === "teen" || p().mode === "youth") && exercise.complexity === "high") return false;
  if (exercise.status === "unsafe") return false;
  if (exercise.status !== "verified" && !p().testing) return false;
  if (exercise.setup && !state.gym.attachments.includes(exercise.attach)) return false;
  if (exercise.setup && exercise.status !== "verified" && !p().testing) return false;
  return true;
}

function scoreEx(exercise) {
  let score = 30;
  if (exercise.goals.includes(state.assessment.goal)) score += 16;
  if (exercise.goals.includes(p().goal)) score += 10;
  if (exercise.status === "verified") score += 8;
  if (p().mode === "guest" && exercise.complexity === "low") score += 12;
  if ((p().mode === "teen" || p().mode === "youth") && exercise.goals.includes("youth-athletic")) score += 12;
  for (const muscle of state.assessment.sore) {
    if (exercise.muscles.includes(muscle)) score -= 16;
  }
  return score;
}

function setupBatch(list) {
  return list.slice().sort((a, b) => groupLabel(a).localeCompare(groupLabel(b)) || a.cat.localeCompare(b.cat));
}

function prescribe(exercise) {
  let sets = exercise.sets;
  const reps = exercise.reps;
  const restSeconds = exercise.rest;
  if (state.assessment.minutes === 20) sets = Math.max(1, sets - 1);
  if (state.assessment.minutes === 50 && p().mode !== "guest") sets += 1;
  if (p().mode === "guest" || p().mode === "youth") sets = Math.min(sets, 2);
  if (state.assessment.intensity === "easy") sets = Math.max(1, sets - 1);
  if (state.assessment.intensity === "hard" && p().mode !== "guest") sets += 1;
  const load = loadFor(exercise, reps);
  return {
    id: exercise.id,
    sets,
    reps,
    rest: restSeconds,
    load,
    hint: load.hint,
    done: Array.from({ length: sets }, () => ({ weight: load.weight || "", reps: "", rpe: 7, done: false })),
  };
}

function loadFor(exercise, reps) {
  if (exercise.load === "time") {
    return { weight: 0, hint: "Track crisp seconds and stop before form fades." };
  }
  if (exercise.load === "bodyweight") {
    return { weight: 0, hint: "Progress by range, control, tempo, or extra reps." };
  }
  if (exercise.load === "dumbbell") {
    const weight = p().mode === "teen" || p().mode === "youth" ? 5 : p().mode === "guest" ? 8 : 15;
    return { weight, hint: `Use ${weight} lb if clean. If it is too easy, slow the lowering and pause.` };
  }

  const last = lastPerf(exercise.id);
  let target = exercise.cat === "legs" ? 50 : exercise.cat === "pull" ? 40 : 30;
  if (p().mode === "teen" || p().mode === "youth") target = Math.min(target, 30);
  if (p().mode === "guest") target = 10;
  if (state.assessment.intensity === "hard") target += 10;
  if (last) {
    target = last.weight;
    if (parseInt(last.reps, 10) >= highRep(reps) && last.rpe <= 8) target += state.gym.inc;
    if (last.rpe >= 9.5) target -= state.gym.inc;
  }
  const capped = Math.min(target, p().max, state.gym.max);
  const rounded = Math.max(state.gym.min, Math.floor(capped / state.gym.inc) * state.gym.inc);
  return {
    weight: rounded,
    hint: `${last ? `Last best: ${last.weight} x ${last.reps} @ RPE ${last.rpe}. ` : ""}Suggested cable load: ${rounded} lb.`,
  };
}

function highRep(repRange) {
  const match = String(repRange).match(/(\d+)(?!.*\d)/);
  return match ? Number(match[1]) : 10;
}

function lastPerf(id) {
  const profileHistory = state.history.filter((session) => session.profile === p().id);
  for (const session of profileHistory) {
    const exercise = session.exercises.find((item) => item.id === id);
    if (exercise && exercise.sets.length) {
      return exercise.sets.slice().sort((a, b) => b.weight - a.weight)[0];
    }
  }
  return null;
}

function startWorkout(plan = buildPlan()) {
  state.activeWorkout = plan;
  view = "workout";
  render();
}

function workout() {
  if (!state.activeWorkout) {
    main(`
      <div class="empty">
        <h2>No active workout</h2>
        <p>Generate the recommended plan from Today.</p>
        <button class="primary" onclick="startWorkout()">Start recommended</button>
      </div>
    `);
    return;
  }

  const workoutPlan = state.activeWorkout;
  main(`
    <div class="stack">
      <section class="section">
        <div>
          <span class="section-kicker">${workoutPlan.minutes} min session</span>
          <h2>${esc(workoutPlan.title)}</h2>
          <p>${esc(workoutPlan.focus)}</p>
        </div>
        <button class="primary" onclick="finishWorkout()">Finish</button>
      </section>
      <div class="workout-list">${workoutPlan.items.map(card).join("")}</div>
    </div>
  `);
}

function card(item, index) {
  const exercise = ex(item.id);
  if (!exercise) return "";
  return `
    <article class="exercise">
      <div class="exercise-head">
        <div>
          <span class="status ${exercise.status}">${statusLabel(exercise.status)}</span>
          <h3>${esc(exercise.name)}</h3>
          <small>${esc(exercise.muscles.join(", "))}</small>
        </div>
        <button class="ghost" onclick="swap(${index})">Swap</button>
      </div>
      ${setupHtml(exercise)}
      <ul class="cues">${exercise.cues.map((cue) => `<li>${esc(cue)}</li>`).join("")}</ul>
      <div class="load-note" style="margin:0 10px 10px"><span class="setup-label">Load</span><b>${esc(item.hint)}</b></div>
      <div class="set-table">
        <div class="set-row labels"><span>Set</span><span>Load</span><span>Reps</span><span>RPE</span><span>Done</span></div>
        ${item.done.map((set, setIndex) => `
          <div class="set-row ${set.done ? "done" : ""}">
            <span>${setIndex + 1}</span>
            <input value="${esc(set.weight)}" placeholder="${item.load.weight || "BW"}" onchange="setVal(${index},${setIndex},'weight',this.value)">
            <input value="${esc(set.reps)}" placeholder="${esc(item.reps)}" onchange="setVal(${index},${setIndex},'reps',this.value)">
            <input value="${esc(set.rpe)}" onchange="setVal(${index},${setIndex},'rpe',this.value)">
            <button onclick="toggleSet(${index},${setIndex})">${set.done ? "OK" : "+"}</button>
          </div>
        `).join("")}
      </div>
    </article>
  `;
}

function setupHtml(exercise) {
  if (!exercise.setup) {
    const zone = nonCableZone(exercise);
    return `
      <div class="setup-panel">
        <div class="graphic-card ${zone.kind}">
          ${equipmentSvg(zone.kind)}
          <span class="setup-label">${esc(zone.label)}</span>
          <b>${esc(zone.title)}</b>
        </div>
        <div class="setup-copy">
          <span class="setup-label">Setup</span>
          <h3>${esc(zone.title)}</h3>
          <p>${esc(zone.note)}</p>
          <div class="setup-facts">
            <div><span class="setup-label">Equipment</span><b>${esc(exercise.equipment)}</b></div>
            <div><span class="setup-label">Status</span><b>${statusLabel(exercise.status)}</b></div>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="setup-panel">
      <div class="setup-visual">${trainerSvg(exercise.setup, exercise.name)}</div>
      <div class="setup-copy">
        <span class="setup-label">Machine preset</span>
        <h3>${esc(groupTitle(exercise.setup.group))}</h3>
        <p>${esc(exercise.setup.pos)}${exercise.setup.bench ? ` ${esc(exercise.setup.bench)}.` : "."}</p>
        <div class="setup-facts">
          <div><span class="setup-label">Track</span><b>${exercise.setup.track} of 8</b></div>
          <div><span class="setup-label">Arm angle</span><b>${exercise.setup.angle} of 11</b></div>
          <div><span class="setup-label">Depth</span><b>${exercise.setup.depth} of 5</b></div>
          <div><span class="setup-label">Attachment</span><b>${esc(exercise.attach)}</b></div>
        </div>
        <div class="setup-note"><span class="setup-label">Truth status</span><b>${state.gym.stackVerified ? "Stack checked. Setup still should be tested light first." : "Start light until the exact arm depth and stack labels are checked."}</b></div>
      </div>
    </div>
  `;
}

function trainerSvg(setup, title = "Functional trainer setup") {
  const track = Number(setup.track || 5);
  const angle = Number(setup.angle || 6);
  const depth = Number(setup.depth || 3);
  const y = 72 + (track - 1) * 24;
  const spread = (angle - 6) * 10;
  const depthShift = (depth - 3) * 8;
  const leftPivot = 230;
  const rightPivot = 390;
  const leftEnd = 150 - spread - depthShift;
  const rightEnd = 470 + spread + depthShift;
  const handleY = Math.min(282, y + 34);
  const bench = setup.bench ? `<rect class="bench" x="276" y="278" width="68" height="54" rx="8"></rect>` : "";
  const stanceLabel = setup.bench ? "bench lane" : "stance";

  return `
    <svg class="trainer-svg" viewBox="0 0 620 380" role="img" aria-label="${esc(title)}">
      <path class="floor" d="M80 318 L540 318 L590 364 L30 364 Z"></path>
      <rect class="tower" x="258" y="38" width="104" height="244" rx="10"></rect>
      <rect class="tower" x="282" y="24" width="56" height="276" rx="8"></rect>
      <line class="rail" x1="230" y1="52" x2="230" y2="286"></line>
      <line class="rail" x1="390" y1="52" x2="390" y2="286"></line>
      <line class="arm" x1="${leftPivot}" y1="${y}" x2="${leftEnd}" y2="${handleY}"></line>
      <line class="arm" x1="${rightPivot}" y1="${y}" x2="${rightEnd}" y2="${handleY}"></line>
      <line class="cable" x1="${leftEnd}" y1="${handleY}" x2="302" y2="308"></line>
      <line class="cable" x1="${rightEnd}" y1="${handleY}" x2="318" y2="308"></line>
      <circle class="handle" cx="${leftEnd}" cy="${handleY}" r="13"></circle>
      <circle class="handle" cx="${rightEnd}" cy="${handleY}" r="13"></circle>
      ${bench}
      <circle class="person" cx="310" cy="310" r="14"></circle>
      <text x="310" y="350">${esc(stanceLabel)}</text>
      <text x="310" y="30">Track ${track} - Angle ${angle} - Depth ${depth}</text>
      <g transform="translate(450 58)">
        <rect class="tower" x="0" y="0" width="106" height="58" rx="8"></rect>
        <line class="cable" x1="22" y1="58" x2="${22 - depthShift}" y2="112"></line>
        <line class="cable" x1="84" y1="58" x2="${84 + depthShift}" y2="112"></line>
        <circle class="person" cx="53" cy="132" r="10"></circle>
        <text x="53" y="156">top view</text>
      </g>
    </svg>
  `;
}

function equipmentSvg(kind) {
  if (kind === "functional") {
    return `
      <svg class="equipment-svg" viewBox="0 0 220 150" aria-hidden="true">
        <path class="deck" d="M30 122 L190 122 L208 140 L12 140 Z"></path>
        <rect class="tower" x="88" y="22" width="44" height="96" rx="8"></rect>
        <line class="rail" x1="72" y1="28" x2="72" y2="118"></line>
        <line class="rail" x1="148" y1="28" x2="148" y2="118"></line>
        <line class="arm" x1="72" y1="60" x2="28" y2="78"></line>
        <line class="arm" x1="148" y1="60" x2="192" y2="78"></line>
        <line class="cable" x1="28" y1="78" x2="106" y2="122"></line>
        <line class="cable" x1="192" y1="78" x2="114" y2="122"></line>
        <circle class="node" cx="28" cy="78" r="7"></circle>
        <circle class="node" cx="192" cy="78" r="7"></circle>
      </svg>
    `;
  }
  if (kind === "dumbbells") {
    return `
      <svg class="equipment-svg" viewBox="0 0 220 150" aria-hidden="true">
        <line class="bar" x1="48" y1="64" x2="172" y2="86"></line>
        <line class="bar" x1="48" y1="92" x2="172" y2="60"></line>
        <rect class="plate" x="24" y="48" width="28" height="34" rx="7"></rect>
        <rect class="plate" x="168" y="74" width="28" height="34" rx="7"></rect>
        <rect class="plate alt" x="24" y="78" width="28" height="34" rx="7"></rect>
        <rect class="plate alt" x="168" y="44" width="28" height="34" rx="7"></rect>
      </svg>
    `;
  }
  if (kind === "bench") {
    return `
      <svg class="equipment-svg" viewBox="0 0 220 150" aria-hidden="true">
        <rect class="bench-pad" x="52" y="58" width="116" height="24" rx="8"></rect>
        <line class="leg" x1="78" y1="82" x2="56" y2="124"></line>
        <line class="leg" x1="142" y1="82" x2="164" y2="124"></line>
        <line class="floor-line" x1="34" y1="124" x2="186" y2="124"></line>
      </svg>
    `;
  }
  return `
    <svg class="equipment-svg" viewBox="0 0 220 150" aria-hidden="true">
      <rect class="mat" x="46" y="42" width="128" height="80" rx="14"></rect>
      <path class="route" d="M72 98 C92 54 128 54 150 98"></path>
      <circle class="node" cx="72" cy="98" r="7"></circle>
      <circle class="node" cx="150" cy="98" r="7"></circle>
    </svg>
  `;
}

function equipmentGlyph(exercise) {
  if (exercise.setup) return "FT";
  if (exercise.equipment === "dumbbells") return "DB";
  if (exercise.equipment === "bench") return "BN";
  if (exercise.equipment === "floor") return "FL";
  return "BW";
}

function nonCableZone(exercise) {
  if (exercise.equipment === "dumbbells") {
    return { kind: "dumbbells", label: "Dumbbell zone", title: "Light dumbbell lane", note: "Use the mat or bench area. Since weight is limited, progress with tempo, pauses, extra reps, and cleaner range." };
  }
  if (exercise.equipment === "bench") {
    return { kind: "bench", label: "Bench lane", title: "Bench plus open floor", note: "Set the bench clear of the cable path and keep the mat lane open for step-ups, incline work, and support." };
  }
  return { kind: "floor", label: "Floor zone", title: "Open mat lane", note: "Use the open mat space in front of the trainer. Keep reps controlled and stop if the movement gets sloppy." };
}

function gym() {
  const preset = PRESETS.find((item) => item.id === state.gym.preset) || PRESETS[0];
  main(`
    <div class="stack">
      <section class="section">
        <div>
          <span class="section-kicker">Your room</span>
          <h2>Gym Setup</h2>
          <p>A clean map of the equipment this app actually programs.</p>
        </div>
      </section>

      <div class="equipment-strip">
        ${equipmentTile("functional", "Functional trainer", "Dual arms, tracks 1-8, angles 1-11, depth 1-5")}
        ${equipmentTile("bench", "Bench lane", "Centered for press, rows, step-ups, support")}
        ${equipmentTile("dumbbells", "Dumbbells", "Light load, high control, tempo and pauses")}
        ${equipmentTile("floor", "Open floor", "Core, mobility, athletic work, family-safe circuits")}
      </div>

      <section class="gym-grid">
        <article class="panel machine-panel">
          <div class="section">
            <div>
              <span class="section-kicker">${esc(preset.tag)}</span>
              <h2>${esc(preset.name)}</h2>
              <p>${esc(preset.note)}</p>
            </div>
          </div>
          <div class="setup-visual">${trainerSvg(preset.setup, preset.name)}</div>
          <div class="preset-row">${PRESETS.map((item) => `<button class="mini-btn ${state.gym.preset === item.id ? "on" : ""}" onclick="state.gym.preset='${item.id}';render()">${esc(item.name)}</button>`).join("")}</div>
        </article>

        <article class="panel preset-card">
          <div class="section">
            <div>
              <span class="section-kicker">Machine truth</span>
              <h2>Settings that affect workouts</h2>
            </div>
          </div>
          <div class="form-grid">
            <label class="toggle"><input type="checkbox" ${state.gym.stackVerified ? "checked" : ""} onchange="state.gym.stackVerified=this.checked;render()"> Stack labels checked on the machine</label>
            <label class="control"><span class="label">Depth direction</span><select onchange="state.gym.depth=this.value;render()">${["unknown", "1-inward", "1-outward"].map((value) => `<option ${state.gym.depth === value ? "selected" : ""}>${value}</option>`).join("")}</select></label>
            ${["min", "inc", "max"].map((key) => `<label class="control"><span class="label">Stack ${key}</span><input type="number" value="${state.gym[key]}" onchange="state.gym.${key}=+this.value;render()"></label>`).join("")}
          </div>
          <div class="control">
            <span class="label">Attachments in the room</span>
            <div class="chips">${["d-handle", "rope", "straight-bar", "curl-bar", "v-bar", "ankle-strap", "none"].map((item) => `<label class="toggle"><input type="checkbox" ${state.gym.attachments.includes(item) ? "checked" : ""} onchange="toggleAttach('${item}',this.checked)">${item}</label>`).join("")}</div>
          </div>
        </article>
      </section>

      <section class="equipment-grid">
        ${equipmentCard("Dual-arm trainer", "Tracks 1-8, arm angles 1-11, depth 1-5. Most cable movements are marked testing until you confirm them light.", "testing")}
        ${equipmentCard("Bench and mat lane", "Flat bench work, incline push-ups, step-ups, split squats, core, and floor mobility.", "verified")}
        ${equipmentCard("Light dumbbells", "Best for high-control accessories, tempo work, warm-ups, and guest-safe sessions.", "verified")}
        ${equipmentCard("Attachments", `Available now: ${state.gym.attachments.join(", ")}.`, state.gym.attachments.includes("ankle-strap") ? "testing" : "verified")}
      </section>
    </div>
  `);
}

function equipmentTile(kind, title, text) {
  return `<article class="equipment-card compact-equipment">${equipmentSvg(kind)}<b>${esc(title)}</b><p>${esc(text)}</p></article>`;
}

function equipmentCard(title, text, status) {
  return `<article class="equipment-card"><span class="status ${status}">${statusLabel(status)}</span><b>${esc(title)}</b><p>${esc(text)}</p></article>`;
}

function toggleAttach(item, on) {
  state.gym.attachments = on
    ? Array.from(new Set(state.gym.attachments.concat(item)))
    : state.gym.attachments.filter((existing) => existing !== item);
  render();
}

function library() {
  const query = state.q.toLowerCase();
  const filter = state.filter;
  const list = EX.filter((exercise) => {
    const haystack = `${exercise.name} ${exercise.cat} ${exercise.muscles.join(" ")} ${exercise.equipment}`.toLowerCase();
    return (!query || haystack.includes(query)) && (filter === "all" || filter === exercise.cat || filter === exercise.status || filter === exercise.equipment);
  });

  main(`
    <div class="stack">
      <section class="section">
        <div>
          <span class="section-kicker">${list.length} movements</span>
          <h2>Exercise Library</h2>
          <p>Filtered against your profile, attachments, and room setup when building workouts.</p>
        </div>
      </section>
      <div class="tools">
        <input placeholder="Search row, core, press, dumbbell..." value="${esc(state.q)}" oninput="state.q=this.value;render()">
        <select onchange="state.filter=this.value;render()">
          ${["all", "verified", "testing", "push", "pull", "legs", "core", "mobility", "athletic", "functional-trainer", "dumbbells", "bench", "floor"].map((item) => `<option ${state.filter === item ? "selected" : ""}>${item}</option>`).join("")}
        </select>
      </div>
      <div class="library-grid">${list.map(libraryItem).join("")}</div>
    </div>
  `);
}

function libraryItem(exercise) {
  return `
    <button class="library-item ${exercise.cat}" onclick="detail('${exercise.id}')">
      <span class="library-mark">${equipmentGlyph(exercise)}</span>
      <span class="status ${exercise.status}">${statusLabel(exercise.status)}</span>
      <b>${esc(exercise.name)}</b>
      <small>${esc(exercise.muscles.join(", "))}</small>
      <small>${esc(groupLabel(exercise))}</small>
    </button>
  `;
}

function detail(id) {
  const exercise = ex(id);
  if (!exercise) return;
  const drawer = document.getElementById("drawer");
  drawer.classList.remove("hide");
  drawer.innerHTML = `
    <button class="close" onclick="closeDrawer()">x</button>
    <article class="exercise">
      <div class="exercise-head">
        <div>
          <span class="status ${exercise.status}">${statusLabel(exercise.status)}</span>
          <h3>${esc(exercise.name)}</h3>
          <small>${esc(exercise.muscles.join(", "))}</small>
        </div>
      </div>
      ${setupHtml(exercise)}
      <ul class="cues">${exercise.cues.map((cue) => `<li>${esc(cue)}</li>`).join("")}</ul>
    </article>
  `;
}

function closeDrawer() {
  const drawer = document.getElementById("drawer");
  if (drawer) drawer.classList.add("hide");
}

function history() {
  const items = state.history.filter((session) => session.profile === p().id);
  const stats = statSummary();
  main(`
    <div class="stack">
      <section class="section">
        <div>
          <span class="section-kicker">${esc(p().name)}</span>
          <h2>Progress</h2>
          <p>Local history stays in this browser.</p>
        </div>
      </section>
      <div class="metric-grid">
        <div class="metric"><b>${stats.sessions}</b><small>Sessions</small></div>
        <div class="metric"><b>${stats.sets}</b><small>Sets</small></div>
        <div class="metric"><b>${Math.round(stats.volume / 1000)}k</b><small>Volume</small></div>
        <div class="metric"><b>${stats.streak}</b><small>Day streak</small></div>
      </div>
      <div class="history-list">
        ${items.length ? items.map((session) => `
          <article class="history">
            <div>
              <b>${esc(session.title)}</b>
              <span>${new Date(session.date).toLocaleDateString()} - ${session.totalSets} sets - ${session.totalVolume} lb</span>
            </div>
            <small>${session.minutes} min</small>
          </article>
        `).join("") : `<div class="empty"><h2>No sessions yet</h2><p>Finish a workout and it will show up here.</p></div>`}
      </div>
    </div>
  `);
}

function menuView() {
  const stats = statSummary();
  main(`
    <div class="stack">
      <section class="section">
        <div>
          <span class="section-kicker">Menu</span>
          <h2>Settings and tools</h2>
          <p>Daily training stays clean. Setup, profiles, and exports live here.</p>
        </div>
      </section>

      <section class="menu-grid">
        ${menuRow("Equipment Setup", "Machine presets, stack labels, attachments", "gym", "FT")}
        ${menuRow("Family Profiles", "Names, goals, cable caps, safe modes", "profiles", "PF")}
        ${menuRow("Coach Export", "Copy a private training brief for ChatGPT", "coach", "AI")}
        ${menuRow("Progress", `${stats.sessions} sessions, ${stats.sets} logged sets`, "history", "PR")}
      </section>

      <section class="panel about-panel">
        <div>
          <span class="section-kicker">About</span>
          <h2>Chitsaz Training Lab</h2>
          <p>Local-first workout planning for your functional trainer, bench, dumbbells, and floor space. No account required.</p>
        </div>
        <div class="metric-grid">
          <div class="metric"><b>${EX.length}</b><small>Exercises</small></div>
          <div class="metric"><b>${PRESETS.length}</b><small>Machine presets</small></div>
        </div>
      </section>
    </div>
  `);
}

function menuRow(title, detail, target, mark) {
  return `
    <button class="menu-row" onclick="setView('${target}')">
      <span class="menu-mark">${esc(mark)}</span>
      <span><b>${esc(title)}</b><small>${esc(detail)}</small></span>
      <span class="chevron">&gt;</span>
    </button>
  `;
}

function profilesView() {
  main(`
    <div class="stack">
      <section class="section">
        <div>
          <span class="section-kicker">Family profiles</span>
          <h2>Who is training?</h2>
          <p>Each person gets different caps, goals, and exercise filtering.</p>
        </div>
        <button class="primary" onclick="addProfile()">Add</button>
      </section>
      <div class="form-grid">
        ${state.profiles.map((profile) => `
          <article class="control">
            <div class="row">
              <b>${esc(profile.name)}</b>
              <button class="ghost" onclick="selectProfile('${profile.id}')">Select</button>
            </div>
            <input value="${esc(profile.name)}" onchange="editProfile('${profile.id}','name',this.value)">
            <select onchange="editProfile('${profile.id}','mode',this.value)">${["adult", "teen", "youth", "guest"].map((mode) => `<option ${profile.mode === mode ? "selected" : ""}>${mode}</option>`).join("")}</select>
            <select onchange="editProfile('${profile.id}','goal',this.value)">${Object.entries(GOALS).map(([key, label]) => `<option value="${key}" ${profile.goal === key ? "selected" : ""}>${label}</option>`).join("")}</select>
            <input type="number" value="${profile.max}" onchange="editProfile('${profile.id}','max',+this.value)">
            <label class="toggle"><input type="checkbox" ${profile.testing ? "checked" : ""} onchange="editProfile('${profile.id}','testing',this.checked)"> Include starting cable setups</label>
          </article>
        `).join("")}
      </div>
    </div>
  `);
}

function editProfile(id, key, value) {
  state.profiles = state.profiles.map((profile) => profile.id === id ? { ...profile, [key]: value } : profile);
  render();
}

function addProfile() {
  const id = `profile-${Date.now()}`;
  state.profiles.push({
    id,
    name: "New Profile",
    mode: "adult",
    goal: "hypertrophy",
    max: 60,
    testing: true,
    color: "#79c8ff",
    note: "Custom family profile.",
  });
  state.active = id;
  view = "profiles";
  render();
}

function coach() {
  const text = coachText();
  main(`
    <div class="stack">
      <section class="section">
        <div>
          <span class="section-kicker">Coach handoff</span>
          <h2>Private training brief</h2>
          <p>Copy this into ChatGPT when you want a second opinion using the exact equipment and recent history.</p>
        </div>
        <button class="primary" onclick="copyCoach()">Copy</button>
      </section>
      <section class="summary">
        <b>${EX.length} exercises - ${state.profiles.length} profiles</b>
        <p>Includes room inventory, profile caps, available attachments, today plan, and recent sessions.</p>
      </section>
      <textarea id="brief" style="min-height:360px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.8rem">${esc(text)}</textarea>
    </div>
  `);
}

function coachText() {
  const plan = buildPlan();
  const recent = state.history.filter((session) => session.profile === p().id).slice(0, 6);
  const assessment = {
    goal: state.assessment.goal,
    minutes: state.assessment.minutes,
    intensity: state.assessment.intensity,
    sore: state.assessment.sore,
    pain: state.assessment.pain,
  };
  return JSON.stringify({
    app: "Chitsaz Training Lab",
    generatedAt: new Date().toISOString(),
    room: {
      equipment: ["dual-arm functional trainer", "adjustable bench", "mat lane", "light dumbbells", "D-handles", "rope", "straight bar"],
      machineSetup: {
        trackRange: "1 top through 8 bottom",
        armAngles: "1 through 11",
        depth: `1 through 5, direction ${state.gym.depth}`,
        stack: { min: state.gym.min, max: state.gym.max, increment: state.gym.inc, checked: state.gym.stackVerified },
        attachments: state.gym.attachments,
      },
    },
    profile: p(),
    assessment,
    recommendedPlan: plan,
    recentHistory: recent,
    instruction: "Adjust future workouts conservatively. Prefer balanced push, pull, legs, core, progressive overload, pain-free range, and age-appropriate exercise selection. Any cable setup marked testing should be tried light before heavy loading.",
  }, null, 2);
}

function copyCoach() {
  const text = coachText();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => alert("Training brief copied."));
    return;
  }
  const textarea = document.getElementById("brief");
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  alert("Training brief copied.");
}

function setVal(exerciseIndex, setIndex, key, value) {
  const set = state.activeWorkout.items[exerciseIndex].done[setIndex];
  set[key] = key === "weight" || key === "rpe" ? Number(value) : value;
  save();
}

function toggleSet(exerciseIndex, setIndex) {
  const item = state.activeWorkout.items[exerciseIndex];
  const set = item.done[setIndex];
  set.done = !set.done;
  if (set.done) {
    if (!set.reps) set.reps = item.reps;
    if (!set.weight) set.weight = item.load.weight;
    startRest(item.rest);
  }
  render();
}

function startRest(seconds) {
  rest = seconds;
  clearInterval(restTick);
  restTick = setInterval(() => {
    rest = Math.max(0, rest - 1);
    paintRest();
    if (!rest) clearInterval(restTick);
  }, 1000);
  paintRest();
}

function paintRest() {
  const timer = document.getElementById("timer");
  timer.classList.toggle("hide", !rest);
  timer.innerHTML = `
    <div><span>Rest</span><b>${String(Math.floor(rest / 60)).padStart(2, "0")}:${String(rest % 60).padStart(2, "0")}</b></div>
    <button class="ghost" onclick="rest+=15;paintRest()">+15</button>
    <button class="ghost" onclick="rest=0;paintRest()">Skip</button>
  `;
}

function swap(index) {
  const current = ex(state.activeWorkout.items[index].id);
  const replacement = EX.find((candidate) =>
    candidate.id !== current.id &&
    candidate.cat === current.cat &&
    eligible(candidate)
  );
  if (replacement) state.activeWorkout.items[index] = prescribe(replacement);
  render();
}

function finishWorkout() {
  const workoutPlan = state.activeWorkout;
  if (!workoutPlan) return;
  const completed = workoutPlan.items.reduce((total, item) => total + item.done.filter((set) => set.done).length, 0);
  if (!completed) {
    alert("Log at least one set first.");
    return;
  }
  const exercises = workoutPlan.items.map((item) => ({
    id: item.id,
    sets: item.done.filter((set) => set.done).map((set) => ({
      weight: Number(set.weight) || 0,
      reps: String(set.reps || item.reps),
      rpe: Number(set.rpe) || 7,
    })),
  }));
  const volume = exercises.reduce((sum, exercise) =>
    sum + exercise.sets.reduce((subtotal, set) => subtotal + set.weight * (parseInt(set.reps, 10) || 0), 0)
  , 0);
  state.history.unshift({
    id: `session-${Date.now()}`,
    profile: p().id,
    date: new Date().toISOString(),
    title: workoutPlan.title,
    template: workoutPlan.template,
    minutes: workoutPlan.minutes,
    totalSets: completed,
    totalVolume: volume,
    exercises,
  });
  state.activeWorkout = null;
  view = "history";
  render();
}

function statSummary(profileId = p().id) {
  const history = state.history.filter((session) => session.profile === profileId);
  return {
    sessions: history.length,
    sets: history.reduce((sum, session) => sum + session.totalSets, 0),
    volume: history.reduce((sum, session) => sum + session.totalVolume, 0),
    streak: streak(history),
  };
}

function streak(history) {
  if (!history.length) return 0;
  const days = new Set(history.map((session) => new Date(session.date).toDateString()));
  let count = 0;
  const day = new Date();
  while (days.has(day.toDateString())) {
    count += 1;
    day.setDate(day.getDate() - 1);
  }
  return count || 1;
}

function firstCableName(plan) {
  const first = plan.items.map((item) => ex(item.id)).find((exercise) => exercise && exercise.setup);
  return first ? groupTitle(first.setup.group) : "Floor and dumbbell start";
}

function firstSetupBlock(plan) {
  const first = plan.items.map((item) => ex(item.id)).find((exercise) => exercise && exercise.setup);
  return first ? setupHtml(first) : setupHtml(ex(plan.items[0]?.id));
}

function groupLabel(exercise) {
  if (!exercise.setup) return exercise.equipment;
  return groupTitle(exercise.setup.group);
}

function groupTitle(group) {
  const names = {
    "mid-dual-press": "Mid dual press",
    "bench-mid-press": "Bench press lane",
    "low-dual-press": "Low to high press",
    "mid-dual-fly": "Mid cable fly",
    "mid-single-press": "Single-arm press",
    "bench-mid-row": "Bench row lane",
    "mid-dual-row": "Mid dual row",
    "high-dual-pulldown": "High kneeling pulldown",
    "high-bar-pull": "High straight-bar pull",
    "high-rope-posture": "High rope posture",
    "high-dual-row": "High cable row",
    "low-dual-shoulder": "Low shoulder press",
    "low-single-shoulder": "Low single shoulder",
    "mid-dual-posture": "Mid rear-delt fly",
    "low-rope-arms": "Low rope arms",
    "high-rope-arms": "High rope arms",
    "low-bar-legs": "Low bar legs",
    "low-rope-hinge": "Low rope hinge",
    "low-bar-hinge": "Low bar hinge",
    "low-single-glute": "Low single glute",
    "mid-single-core": "Mid single core",
    "high-single-core": "High single core",
    "low-single-core": "Low single core",
    "high-rope-core": "High rope core",
  };
  return names[group] || String(group || "Cable setup").replaceAll("-", " ");
}

function statusLabel(status) {
  if (status === "testing") return "start light";
  if (status === "verified") return "verified";
  if (status === "draft") return "draft";
  return status;
}

function main(html) {
  document.getElementById("main").innerHTML = html;
}

render();
