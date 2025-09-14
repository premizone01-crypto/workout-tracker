/*
 * Workout Tracker PWA
 *
 * This script implements the main application logic for a simple workout
 * tracking progressive web app. It supports starting a new session,
 * adding exercises and sets, saving workouts to localStorage, viewing
 * historical data, and visualizing progress with Chart.js.
 *
 * The data model is stored in localStorage under the key `workoutData`. The
 * structure looks like this:
 *
 * {
 *   profiles: {
 *     "me": {
 *       exercises: {
 *         "squat": { name: "Back Squat", tags: ["legs"] },
 *         ...
 *       },
 *       workouts: {
 *         "2025-09-14T06:00:00Z": {
 *           startedAt: ISOString,
 *           endedAt: ISOString,
 *           notes: string,
 *           unit: 'kg' | 'lb',
 *           sets: [
 *             { ex: 'squat', set: 1, plannedReps: 8, reps: 8, load: 80, rpe: 7.5, restSec: 120, done: true },
 *             ...
 *           ]
 *         },
 *         ...
 *       }
 *     }
 *   }
 * }
 */

// Application state
let profileId = 'me';
let data = null;
let currentSession = null;

// Elements
const appContainer = document.getElementById('app');
const navHome = document.getElementById('btn-home');
const navNewSession = document.getElementById('btn-new-session');
const navHistory = document.getElementById('btn-history');
const navTemplates = document.getElementById('btn-templates');
const navSettings = document.getElementById('btn-settings');

// Utility: load data from localStorage
function loadData() {
  const json = localStorage.getItem('workoutData');
  if (json) {
    try {
      data = JSON.parse(json);
    } catch (e) {
      console.error('Failed to parse stored data', e);
    }
  }
  if (!data) {
    // initialize default data structure
    data = { profiles: {} };
  }
  if (!data.profiles[profileId]) {
    data.profiles[profileId] = { exercises: {}, workouts: {} };
  }
}

// Utility: save data to localStorage
function saveData() {
  localStorage.setItem('workoutData', JSON.stringify(data));
}

// Utility: show a view (HTML element) and hide others
function showView(view) {
  // Remove any existing child views
  while (appContainer.firstChild) appContainer.removeChild(appContainer.firstChild);
  appContainer.appendChild(view);
}

// Format date/time
function formatDateTime(isoStr) {
  const date = new Date(isoStr);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDate(isoStr) {
  const date = new Date(isoStr);
  return date.toLocaleDateString();
}

// Create home/dashboard view
function createHomeView() {
  const container = document.createElement('div');
  container.classList.add('view', 'active');

  const welcome = document.createElement('h2');
  welcome.textContent = 'Dashboard';
  container.appendChild(welcome);

  // Quick start card
  const quickCard = document.createElement('div');
  quickCard.className = 'dashboard-card';
  const quickTitle = document.createElement('h3');
  quickTitle.textContent = 'Start a new workout';
  quickCard.appendChild(quickTitle);
  const quickBtn = document.createElement('button');
  quickBtn.className = 'primary';
  quickBtn.textContent = 'Start Session';
  quickBtn.addEventListener('click', () => {
    startNewSession();
  });
  quickCard.appendChild(quickBtn);
  container.appendChild(quickCard);

  // Recent workouts
  const workouts = Object.entries(data.profiles[profileId].workouts)
    .sort((a, b) => new Date(b[0]) - new Date(a[0]))
    .slice(0, 5);
  const recentCard = document.createElement('div');
  recentCard.className = 'dashboard-card';
  const recentTitle = document.createElement('h3');
  recentTitle.textContent = 'Recent Workouts';
  recentCard.appendChild(recentTitle);
  if (workouts.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No workouts logged yet.';
    recentCard.appendChild(p);
  } else {
    const list = document.createElement('ul');
    list.style.paddingLeft = '0';
    list.style.listStyle = 'none';
    workouts.forEach(([id, w]) => {
      const li = document.createElement('li');
      li.style.marginBottom = '0.5rem';
      const link = document.createElement('button');
      link.className = 'outline';
      link.textContent = `${formatDate(w.startedAt)} – ${w.sets.length} sets`;
      link.addEventListener('click', () => showWorkoutDetail(id));
      li.appendChild(link);
      list.appendChild(li);
    });
    recentCard.appendChild(list);
  }
  container.appendChild(recentCard);

  return container;
}

// Start a new workout session
function startNewSession() {
  currentSession = {
    startedAt: new Date().toISOString(),
    endedAt: null,
    notes: '',
    unit: 'kg',
    sets: []
  };
  showView(createSessionView());
}

// Build session view for currentSession
function createSessionView() {
  const container = document.createElement('div');
  container.classList.add('view', 'active');

  const header = document.createElement('h2');
  header.textContent = 'Live Session';
  container.appendChild(header);

  // Unit toggle
  const unitToggle = document.createElement('div');
  unitToggle.style.marginBottom = '1rem';
  const labelUnit = document.createElement('label');
  labelUnit.textContent = 'Units: ';
  const selectUnit = document.createElement('select');
  selectUnit.innerHTML = '<option value="kg">kg</option><option value="lb">lb</option>';
  selectUnit.value = currentSession.unit;
  selectUnit.addEventListener('change', () => {
    currentSession.unit = selectUnit.value;
  });
  labelUnit.appendChild(selectUnit);
  unitToggle.appendChild(labelUnit);
  container.appendChild(unitToggle);

  // Add exercise button
  const addExerciseBtn = document.createElement('button');
  addExerciseBtn.className = 'primary';
  addExerciseBtn.textContent = 'Add Exercise';
  addExerciseBtn.addEventListener('click', () => addExerciseFlow());
  container.appendChild(addExerciseBtn);

  // List of exercises in session
  const exercisesDiv = document.createElement('div');
  exercisesDiv.id = 'exercises-container';
  container.appendChild(exercisesDiv);

  // Save session controls
  const controls = document.createElement('div');
  controls.className = 'session-controls';
  const finishBtn = document.createElement('button');
  finishBtn.className = 'primary';
  finishBtn.textContent = 'Finish & Save';
  finishBtn.addEventListener('click', () => finishSession());
  controls.appendChild(finishBtn);
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'outline';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => {
    currentSession = null;
    showView(createHomeView());
  });
  controls.appendChild(cancelBtn);
  container.appendChild(controls);

  // Render existing exercises/sets if any
  renderSessionExercises(exercisesDiv);

  return container;
}

// Render session exercises and sets
function renderSessionExercises(container) {
  container.innerHTML = '';
  // Group sets by exercise
  const groups = {};
  currentSession.sets.forEach(set => {
    if (!groups[set.ex]) groups[set.ex] = [];
    groups[set.ex].push(set);
  });
  Object.keys(groups).forEach(exId => {
    const ex = data.profiles[profileId].exercises[exId] || { name: exId };
    const wrapper = document.createElement('div');
    wrapper.className = 'session-exercise';
    // Exercise header
    const exHeader = document.createElement('h3');
    exHeader.textContent = ex.name;
    wrapper.appendChild(exHeader);
    // Sets table
    groups[exId].forEach((set, idx) => {
      const row = createSetRow(set, idx, exId);
      wrapper.appendChild(row);
    });
    // Button to add set to this exercise
    const addSetBtn = document.createElement('button');
    addSetBtn.className = 'outline';
    addSetBtn.textContent = '+ Set';
    addSetBtn.addEventListener('click', () => {
      addSetToExercise(exId);
    });
    wrapper.appendChild(addSetBtn);
    container.appendChild(wrapper);
  });
}

// Create a row for a set with editable inputs
function createSetRow(set, idx, exId) {
  const row = document.createElement('div');
  row.className = 'set-row';
  // Set number
  const num = document.createElement('span');
  num.textContent = `#${idx + 1}`;
  row.appendChild(num);
  // Planned reps input
  const plannedInput = document.createElement('input');
  plannedInput.type = 'number';
  plannedInput.min = '0';
  plannedInput.value = set.plannedReps || '';
  plannedInput.placeholder = 'Plan reps';
  plannedInput.addEventListener('input', () => {
    set.plannedReps = parseInt(plannedInput.value) || null;
  });
  row.appendChild(plannedInput);
  // Actual reps input
  const repsInput = document.createElement('input');
  repsInput.type = 'number';
  repsInput.min = '0';
  repsInput.value = set.reps || '';
  repsInput.placeholder = 'Reps';
  repsInput.addEventListener('input', () => {
    set.reps = parseInt(repsInput.value) || null;
  });
  row.appendChild(repsInput);
  // Load input
  const loadInput = document.createElement('input');
  loadInput.type = 'number';
  loadInput.min = '0';
  loadInput.value = set.load || '';
  loadInput.placeholder = `Load (${currentSession.unit})`;
  loadInput.addEventListener('input', () => {
    set.load = parseFloat(loadInput.value) || null;
  });
  row.appendChild(loadInput);
  // RPE input
  const rpeInput = document.createElement('input');
  rpeInput.type = 'number';
  rpeInput.min = '0';
  rpeInput.max = '10';
  rpeInput.step = '0.5';
  rpeInput.value = set.rpe || '';
  rpeInput.placeholder = 'RPE';
  rpeInput.addEventListener('input', () => {
    set.rpe = parseFloat(rpeInput.value) || null;
  });
  row.appendChild(rpeInput);
  // Rest input
  const restInput = document.createElement('input');
  restInput.type = 'number';
  restInput.min = '0';
  restInput.value = set.restSec || '';
  restInput.placeholder = 'Rest (s)';
  restInput.addEventListener('input', () => {
    set.restSec = parseInt(restInput.value) || null;
  });
  row.appendChild(restInput);
  // Done toggle
  const doneInput = document.createElement('input');
  doneInput.type = 'checkbox';
  doneInput.checked = !!set.done;
  doneInput.addEventListener('change', () => {
    set.done = doneInput.checked;
    if (set.done) {
      startRestTimer(set);
    }
  });
  row.appendChild(doneInput);
  return row;
}

// Add an exercise to the current session
function addExerciseFlow() {
  const exName = prompt('Enter exercise name:');
  if (!exName) return;
  const id = exName.toLowerCase().replace(/\s+/g, '-');
  // If exercise doesn't exist, add to library
  if (!data.profiles[profileId].exercises[id]) {
    data.profiles[profileId].exercises[id] = { name: exName, tags: [] };
    saveData();
  }
  // Add first set for this exercise
  addSetToExercise(id);
  // Re-render session view
  const exercisesDiv = document.getElementById('exercises-container');
  renderSessionExercises(exercisesDiv);
}

// Add a new set to an exercise in current session
function addSetToExercise(exId) {
  const exSets = currentSession.sets.filter(s => s.ex === exId);
  const last = exSets[exSets.length - 1] || {};
  const newSet = {
    ex: exId,
    set: exSets.length + 1,
    plannedReps: last.plannedReps || null,
    reps: null,
    load: last.load || null,
    rpe: null,
    restSec: last.restSec || 60,
    done: false
  };
  currentSession.sets.push(newSet);
  const exercisesDiv = document.getElementById('exercises-container');
  renderSessionExercises(exercisesDiv);
}

// Start rest timer after a set is marked done
function startRestTimer(set) {
  if (!set.restSec) return;
  const countdown = set.restSec;
  const notificationMsg = `Rest ${set.restSec} seconds for ${data.profiles[profileId].exercises[set.ex].name}`;
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification('Rest Timer Started', { body: notificationMsg });
      }
    });
  }
  // In-app countdown (simple alert after rest)
  setTimeout(() => {
    alert(`Rest period of ${set.restSec}s finished. Ready for next set!`);
  }, countdown * 1000);
}

// Finish session and save
function finishSession() {
  if (!currentSession) return;
  currentSession.endedAt = new Date().toISOString();
  const id = currentSession.startedAt;
  data.profiles[profileId].workouts[id] = currentSession;
  saveData();
  currentSession = null;
  showView(createHomeView());
}

// Show history view
function createHistoryView() {
  const container = document.createElement('div');
  container.classList.add('view', 'active');
  const h2 = document.createElement('h2');
  h2.textContent = 'Workout History';
  container.appendChild(h2);
  const workouts = Object.entries(data.profiles[profileId].workouts).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  if (workouts.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No workouts logged yet.';
    container.appendChild(p);
    return container;
  }
  const table = document.createElement('table');
  table.className = 'history-table';
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  ['Date', 'Sets', 'Volume', 'Duration', 'Action'].forEach(text => {
    const th = document.createElement('th');
    th.textContent = text;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  workouts.forEach(([id, w]) => {
    const row = document.createElement('tr');
    const volume = w.sets.reduce((sum, s) => {
      return sum + (s.reps && s.load ? s.reps * s.load : 0);
    }, 0);
    const duration = w.endedAt ? ((new Date(w.endedAt) - new Date(w.startedAt)) / 60000).toFixed(1) : '-';
    // Date
    let td = document.createElement('td');
    td.textContent = formatDate(w.startedAt);
    row.appendChild(td);
    // Sets
    td = document.createElement('td');
    td.textContent = w.sets.length;
    row.appendChild(td);
    // Volume
    td = document.createElement('td');
    td.textContent = volume.toFixed(1);
    row.appendChild(td);
    // Duration
    td = document.createElement('td');
    td.textContent = duration !== '-' ? `${duration} min` : '-';
    row.appendChild(td);
    // Action
    td = document.createElement('td');
    const btn = document.createElement('button');
    btn.className = 'outline';
    btn.textContent = 'View';
    btn.addEventListener('click', () => showWorkoutDetail(id));
    td.appendChild(btn);
    row.appendChild(td);
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  container.appendChild(table);
  return container;
}

// Show details of a single workout
function showWorkoutDetail(id) {
  const workout = data.profiles[profileId].workouts[id];
  if (!workout) return;
  const container = document.createElement('div');
  container.classList.add('view', 'active');
  const h2 = document.createElement('h2');
  h2.textContent = `Workout Detail – ${formatDateTime(workout.startedAt)}`;
  container.appendChild(h2);
  // Summary
  const summary = document.createElement('p');
  const volume = workout.sets.reduce((sum, s) => sum + (s.reps && s.load ? s.reps * s.load : 0), 0);
  const duration = workout.endedAt ? ((new Date(workout.endedAt) - new Date(workout.startedAt)) / 60000).toFixed(1) : '-';
  summary.textContent = `Sets: ${workout.sets.length} • Volume: ${volume.toFixed(1)} • Duration: ${duration !== '-' ? duration + ' min' : '-'} • Unit: ${workout.unit}`;
  container.appendChild(summary);
  // Sets table
  const table = document.createElement('table');
  table.className = 'history-table';
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  ['Exercise', 'Set', 'Reps', 'Load', 'RPE', 'Volume'].forEach(t => {
    const th = document.createElement('th');
    th.textContent = t;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  workout.sets.forEach(s => {
    const tr = document.createElement('tr');
    // Exercise name
    let td = document.createElement('td');
    td.textContent = data.profiles[profileId].exercises[s.ex]?.name || s.ex;
    tr.appendChild(td);
    // Set number
    td = document.createElement('td');
    td.textContent = s.set;
    tr.appendChild(td);
    // Reps
    td = document.createElement('td');
    td.textContent = s.reps ?? '-';
    tr.appendChild(td);
    // Load
    td = document.createElement('td');
    td.textContent = s.load ? `${s.load} ${workout.unit}` : '-';
    tr.appendChild(td);
    // RPE
    td = document.createElement('td');
    td.textContent = s.rpe ?? '-';
    tr.appendChild(td);
    // Volume
    const vol = s.reps && s.load ? s.reps * s.load : 0;
    td = document.createElement('td');
    td.textContent = vol ? vol.toFixed(1) : '-';
    tr.appendChild(td);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);
  // Charts per exercise
  const chartContainer = document.createElement('div');
  chartContainer.style.marginTop = '2rem';
  container.appendChild(chartContainer);
  // Build dataset for charts: per exercise, volumes, e1RM over sets
  const byExercise = {};
  workout.sets.forEach(s => {
    const exName = data.profiles[profileId].exercises[s.ex]?.name || s.ex;
    if (!byExercise[exName]) byExercise[exName] = [];
    byExercise[exName].push(s);
  });
  Object.keys(byExercise).forEach(exName => {
    const sets = byExercise[exName];
    // Chart volume vs set index
    const labels = sets.map((_, i) => i + 1);
    const volumes = sets.map(s => (s.reps && s.load ? s.reps * s.load : 0));
    const e1rms = sets.map(s => {
      if (s.reps && s.load) {
        return s.load * (1 + s.reps / 30);
      }
      return null;
    });
    const chartCanvas = document.createElement('canvas');
    chartCanvas.height = 200;
    chartContainer.appendChild(chartCanvas);
    new Chart(chartCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Volume',
            data: volumes,
            borderColor: '#007aff',
            backgroundColor: 'rgba(0, 122, 255, 0.2)',
            yAxisID: 'y',
          },
          {
            label: 'e1RM',
            data: e1rms,
            borderColor: '#ff3b30',
            backgroundColor: 'rgba(255, 59, 48, 0.2)',
            yAxisID: 'y1',
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: `${exName} – Volume & e1RM` }
        },
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { text: 'Volume', display: true }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: { drawOnChartArea: false },
            title: { text: 'e1RM', display: true }
          }
        }
      }
    });
  });
  // Back button
  const backBtn = document.createElement('button');
  backBtn.className = 'outline';
  backBtn.textContent = 'Back to History';
  backBtn.style.marginTop = '1rem';
  backBtn.addEventListener('click', () => {
    showView(createHistoryView());
  });
  container.appendChild(backBtn);
  showView(container);
}

// Placeholder templates view
function createTemplatesView() {
  const container = document.createElement('div');
  container.classList.add('view', 'active');
  const h2 = document.createElement('h2');
  h2.textContent = 'Templates';
  container.appendChild(h2);
  const p = document.createElement('p');
  p.textContent = 'Templates feature is under construction.';
  container.appendChild(p);
  return container;
}

// Settings view
function createSettingsView() {
  const container = document.createElement('div');
  container.classList.add('view', 'active');
  const h2 = document.createElement('h2');
  h2.textContent = 'Settings';
  container.appendChild(h2);
  // Unit toggle for future sessions
  const unitDiv = document.createElement('div');
  unitDiv.style.marginBottom = '1rem';
  const label = document.createElement('label');
  label.textContent = 'Default Unit: ';
  const select = document.createElement('select');
  select.innerHTML = '<option value="kg">kg</option><option value="lb">lb</option>';
  select.value = 'kg';
  select.addEventListener('change', () => {
    // update default unit for new sessions
  });
  label.appendChild(select);
  unitDiv.appendChild(label);
  container.appendChild(unitDiv);
  // Export button
  const exportBtn = document.createElement('button');
  exportBtn.className = 'outline';
  exportBtn.textContent = 'Export JSON';
  exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(data.profiles[profileId], null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'workout-data.json';
    link.click();
    URL.revokeObjectURL(url);
  });
  container.appendChild(exportBtn);
  // Import button
  const importInput = document.createElement('input');
  importInput.type = 'file';
  importInput.accept = 'application/json';
  importInput.style.display = 'none';
  importInput.addEventListener('change', () => {
    const file = importInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const imported = JSON.parse(e.target.result);
        // merge imported data
        data.profiles[profileId] = imported;
        saveData();
        alert('Data imported successfully');
        showView(createSettingsView());
      } catch (err) {
        alert('Failed to import file');
      }
    };
    reader.readAsText(file);
  });
  const importBtn = document.createElement('button');
  importBtn.className = 'outline';
  importBtn.textContent = 'Import JSON';
  importBtn.addEventListener('click', () => {
    importInput.click();
  });
  container.appendChild(importInput);
  container.appendChild(importBtn);
  return container;
}

// Initialize app
function init() {
  loadData();
  showView(createHomeView());
  // Navigation events
  navHome.addEventListener('click', () => showView(createHomeView()));
  navNewSession.addEventListener('click', () => startNewSession());
  navHistory.addEventListener('click', () => showView(createHistoryView()));
  navTemplates.addEventListener('click', () => showView(createTemplatesView()));
  navSettings.addEventListener('click', () => showView(createSettingsView()));
}

// Wait DOM ready
document.addEventListener('DOMContentLoaded', init);