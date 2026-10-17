import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceDir = __dirname;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Store initial backup files to allow reset
const backups = {};

const FILES_TO_TRACK = [
  'index.html',
  'src/main.js',
  'src/style.css',
  'src/raiolabsData.js'
];

// Helper to save initial backups on server start
function saveBackups() {
  console.log('[Backup] Saving initial workspace files...');
  FILES_TO_TRACK.forEach(file => {
    const filePath = path.join(workspaceDir, file);
    if (fs.existsSync(filePath)) {
      backups[file] = fs.readFileSync(filePath, 'utf-8');
      console.log(`[Backup] Backed up ${file}`);
    }
  });
}

// RESTORE backups
function restoreBackups() {
  console.log('[Backup] Restoring workspace from backups...');
  Object.keys(backups).forEach(file => {
    const filePath = path.join(workspaceDir, file);
    fs.writeFileSync(filePath, backups[file], 'utf-8');
    console.log(`[Backup] Restored ${file}`);
  });
}

// API: Get current files content
app.get('/api/agent/files', (req, res) => {
  try {
    const filesContent = {};
    FILES_TO_TRACK.forEach(file => {
      const filePath = path.join(workspaceDir, file);
      if (fs.existsSync(filePath)) {
        filesContent[file] = fs.readFileSync(filePath, 'utf-8');
      } else {
        filesContent[file] = '';
      }
    });
    res.json({ success: true, files: filesContent });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Manually modify a file
app.post('/api/agent/modify', (req, res) => {
  const { fileName, content } = req.body;
  if (!FILES_TO_TRACK.includes(fileName)) {
    return res.status(400).json({ success: false, error: 'Unauthorized file path' });
  }
  try {
    const filePath = path.join(workspaceDir, fileName);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`[Agent Action] File updated: ${fileName}`);
    res.json({ success: true, file: fileName });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Reset codebase to backups
app.post('/api/agent/reset', (req, res) => {
  try {
    restoreBackups();
    res.json({ success: true, message: 'Codebase restored to initial state' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mock/Simulated responses when Gemini API Key is missing or user requests simulation
const SIMULATED_ACTIONS = {
  macbeth_scene: {
    thought: "The user is asking to build a scene and reenact Macbeth by Shakespeare. I will generate a Macbeth-themed prop layout (three witches, cauldron, King Macbeth, spectral dagger) on the stage floor, set up foggy green atmosphere styles, log Act I lines, and programmatically switch to the theatre stage view.",
    action: "Reconstructing stage set to Shakespeare's Macbeth Act I",
    files: [
      {
        name: "src/style.css",
        modify: (original) => {
          let css = original;
          if (!css.includes('.macbeth-atmosphere')) {
            css += `
/* Injected Macbeth Spooky Atmosphere */
.theatre-stage.macbeth-atmosphere {
  background: radial-gradient(circle at 50% 50%, #111827, #020617) !important;
  box-shadow: inset 0 0 100px rgba(34, 197, 94, 0.2) !important;
}
.theatre-stage.macbeth-atmosphere::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(20, 83, 45, 0.15) 10%, transparent 80%);
  pointer-events: none;
  z-index: 2;
  animation: fogDrift 20s infinite linear;
}
@keyframes fogDrift {
  0% { opacity: 0.3; transform: scale(1) translateX(0); }
  50% { opacity: 0.6; transform: scale(1.1) translateX(-20px); }
  100% { opacity: 0.3; transform: scale(1) translateX(0); }
}
`;
          }
          return css;
        }
      },
      {
        name: "src/main.js",
        modify: (original) => {
          let js = original;
          if (!js.includes('triggerMacbethScene')) {
            js = js.replace(
              `// RAGE_CLICK_INJECTION_HOOK`,
              `/* Injected Macbeth Reenactment Setup */
if (typeof window.triggerMacbethScene === 'undefined') {
  window.triggerMacbethScene = () => {
    state.stageProps = [
      { id: 'macbeth-witch-1', emoji: '🧙‍♀️', name: 'First Witch', x: 15, y: 10, cracks: 0 },
      { id: 'macbeth-cauldron', emoji: '🍲', name: 'Double Cauldron', x: 30, y: 5, cracks: 0 },
      { id: 'macbeth-witch-2', emoji: '🧙‍♀️', name: 'Second Witch', x: 40, y: 10, cracks: 0 },
      { id: 'macbeth-witch-3', emoji: '🧙‍♀️', name: 'Third Witch', x: 50, y: 10, cracks: 0 },
      { id: 'macbeth-king', emoji: '👑', name: 'Macbeth', x: 80, y: 15, cracks: 0 },
      { id: 'macbeth-dagger', emoji: '🗡️', name: 'Spectral Dagger', x: 68, y: 32, cracks: 0 }
    ];
    localStorage.setItem('aether_stage_props', JSON.stringify(state.stageProps));
    initializeStageElements();
    
    const stage = document.getElementById('theatre-stage');
    if(stage) {
      stage.classList.remove('creation-vibe', 'destruction-vibe');
      stage.classList.add('macbeth-atmosphere');
    }

    // Switch navigation to the stage view programmatically!
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    const stageTab = Array.from(document.querySelectorAll('.nav-tab')).find(t => t.getAttribute('data-target') === 'stage-view');
    if(stageTab) {
      stageTab.classList.add('active');
      document.getElementById('dashboard-view').classList.add('hidden');
      document.getElementById('stage-view').classList.remove('hidden');
    }

    logToTerminal('info', 'SHAKESPEARE', 'Witches: "Fair is foul, and foul is fair: Hover through the fog and filthy air."');
    logToTerminal('thought', 'THEATRE_BOT', 'Macbeth reenactment activated. Spooky lighting and cast generated on the stage floor.');
  };
}
window.triggerMacbethScene();

// RAGE_CLICK_INJECTION_HOOK`
            );
          }
          return js;
        }
      }
    ]
  },
  theme_stage_cosmic: {
    thought: "The user is asking for a cosmic, space-themed stage backdrop. I will adjust the theatre stage backdrop CSS variables to deep violet-nebula gradients and increase starry opacity.",
    action: "Updating theatre stage atmosphere to Cosmic Nebula",
    files: [
      {
        name: "src/style.css",
        modify: (original) => {
          let css = original;
          css = css.replace(/--stage-ambient:\s*[^;]+/g, '--stage-ambient: #0d061f');
          css = css.replace(/--stage-glow:\s*[^;]+/g, '--stage-glow: rgba(139, 92, 246, 0.45)');
          
          if (!css.includes('.stage-stars::after')) {
            css += `
/* Cosmic Nebula Injected Style */
.stage-stars::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 20%, rgba(236, 72, 153, 0.15), transparent 50%),
              radial-gradient(circle at 70% 60%, rgba(59, 130, 246, 0.15), transparent 50%);
  z-index: 2;
  mix-blend-mode: color-dodge;
  pointer-events: none;
}
`;
          }
          return css;
        }
      }
    ]
  },
  theme_curtains_gold: {
    thought: "The user wants gold stage curtains. I will override the red curtain gradient with a rich imperial gold gradient.",
    action: "Applying rich Imperial Gold theme to velvet stage curtains",
    files: [
      {
        name: "src/style.css",
        modify: (original) => {
          let css = original;
          css = css.replace(/linear-gradient\(to right,\s*#7f1d1d,\s*#b91c1c\s+40%,\s*#7f1d1d\s+80%,\s*#450a0a\)/g, 
                            'linear-gradient(to right, #78350f, #d97706 40%, #78350f 80%, #451a03)');
          css = css.replace(/linear-gradient\(to bottom,\s*#b91c1c,\s*#7f1d1d\s+70%,\s*#450a0a\)/g,
                            'linear-gradient(to bottom, #d97706, #78350f 70%, #451a03)');
          return css;
        }
      }
    ]
  },
  theme_neon: {
    thought: "The user is requesting a neon glow or cyberpunk aesthetic. I will rewrite the root CSS variables to inject custom styling with vibrant neon pinks, cyans, and dark obsidian backdrops, adding a glow filter utility.",
    action: "Rewriting root CSS styling for deep cybernetic dark-mode",
    files: [
      {
        name: "src/style.css",
        modify: (original) => {
          // Replace root variables
          let css = original;
          css = css.replace(/--bg-canvas:\s*[^;]+/g, '--bg-canvas: #09090e');
          css = css.replace(/--bg-card:\s*[^;]+/g, '--bg-card: rgba(15, 15, 27, 0.7)');
          css = css.replace(/--text-primary:\s*[^;]+/g, '--text-primary: #e2e8f0');
          css = css.replace(/--text-secondary:\s*[^;]+/g, '--text-secondary: #94a3b8');
          css = css.replace(/--accent:\s*[^;]+/g, '--accent: #00f0ff');
          css = css.replace(/--accent-glow:\s*[^;]+/g, 'rgba(0, 240, 255, 0.4)');
          css = css.replace(/--border-color:\s*[^;]+/g, '--border-color: rgba(0, 240, 255, 0.2)');
          css = css.replace(/--shadow-card:\s*[^;]+/g, '--shadow-card: 0 0 15px rgba(0, 240, 255, 0.15)');
          
          // Append new cyber class if not exist
          if (!css.includes('.cyber-glow')) {
            css += `
/* Cyber Agent Injected Styles */
.cyber-glow {
  text-shadow: 0 0 8px var(--accent);
  box-shadow: 0 0 15px var(--accent-glow) !important;
}
.neon-pulse {
  animation: neon-pulse-anim 2s infinite ease-in-out;
}
@keyframes neon-pulse-anim {
  0%, 100% { filter: drop-shadow(0 0 2px var(--accent)); }
  50% { filter: drop-shadow(0 0 8px var(--accent)); }
}
.agent-injected-badge {
  background: linear-gradient(135deg, #00f0ff, #ff007f);
  color: white;
  padding: 2px 8px;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: bold;
  animation: neon-pulse-anim 1.5s infinite;
}`;
          }
          return css;
        }
      },
      {
        name: "src/main.js",
        modify: (original) => {
          // Inject a badge or update layout title to indicate cyber theme
          let js = original;
          if (!js.includes('agent-injected-badge')) {
            js = js.replace(
              `<h1 class="logo-text">AetherOS</h1>`,
              `<h1 class="logo-text neon-pulse">AetherOS <span class="agent-injected-badge">NEON</span></h1>`
            );
          }
          return js;
        }
      }
    ]
  },
  add_game: {
    thought: "The user is bored or wants interactive elements. I will construct a fully functioning Tic-Tac-Toe minigame using vanilla JavaScript and CSS, then mount it into the playground container.",
    action: "Injecting Tic-Tac-Toe minigame module directly into canvas",
    files: [
      {
        name: "src/style.css",
        modify: (original) => {
          let css = original;
          if (!css.includes('.ttt-board')) {
            css += `
/* Injected Tic-Tac-Toe Styles */
.ttt-container {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1.5rem;
  text-align: center;
  animation: slideUp 0.4s ease-out;
  box-shadow: var(--shadow-card);
}
.ttt-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  max-width: 180px;
  margin: 1.5rem auto 1rem;
}
.ttt-cell {
  aspect-ratio: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.ttt-cell:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
}
.ttt-status {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}
.ttt-reset-btn {
  background: var(--accent);
  color: var(--bg-canvas);
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}
.ttt-reset-btn:hover {
  opacity: 0.9;
}`;
          }
          return css;
        }
      },
      {
        name: "src/main.js",
        modify: (original) => {
          let js = original;
          // Check if game script is already injected
          if (!js.includes('initializeTicTacToe')) {
            // Find a place to append the html markup
            js = js.replace(
              `<!-- AGENT_INJECTION_POINT -->`,
              `<div class="ttt-container">
                <h3 style="margin-top:0; font-size:1.1rem; color:var(--accent);">Resident Agent: Minigame Activated</h3>
                <div class="ttt-status" id="ttt-status">Your turn (Player X)</div>
                <div class="ttt-board">
                  <div class="ttt-cell" data-index="0"></div>
                  <div class="ttt-cell" data-index="1"></div>
                  <div class="ttt-cell" data-index="2"></div>
                  <div class="ttt-cell" data-index="3"></div>
                  <div class="ttt-cell" data-index="4"></div>
                  <div class="ttt-cell" data-index="5"></div>
                  <div class="ttt-cell" data-index="6"></div>
                  <div class="ttt-cell" data-index="7"></div>
                  <div class="ttt-cell" data-index="8"></div>
                </div>
                <button class="ttt-reset-btn" id="ttt-reset">Reset Game</button>
              </div>
              <!-- AGENT_INJECTION_POINT -->`
            );

            // Append game logic at the end of the file
            js += `

/* Injected Tic-Tac-Toe Logic */
function initializeTicTacToe() {
  const cells = document.querySelectorAll('.ttt-cell');
  const statusText = document.getElementById('ttt-status');
  const resetBtn = document.getElementById('ttt-reset');
  if(!cells.length || !statusText || !resetBtn) return;

  let board = ['', '', '', '', '', '', '', '', ''];
  let gameActive = true;

  const checkWinner = () => {
    const winPatterns = [
      [0,1,2], [3,4,5], [6,7,8], // rows
      [0,3,6], [1,4,7], [2,5,8], // columns
      [0,4,8], [2,4,6]           // diagonals
    ];
    for (let p of winPatterns) {
      if (board[p[0]] && board[p[0]] === board[p[1]] && board[p[0]] === board[p[2]]) {
        return board[p[0]];
      }
    }
    return board.includes('') ? null : 'T';
  };

  const agentMove = () => {
    if (!gameActive) return;
    statusText.textContent = "Agent is thinking...";
    setTimeout(() => {
      let emptyIndices = board.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
      if (emptyIndices.length === 0) return;
      // Simple AI choice
      let choice = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      board[choice] = 'O';
      cells[choice].textContent = 'O';
      
      const winner = checkWinner();
      if (winner) {
        gameActive = false;
        statusText.textContent = winner === 'T' ? "It's a draw!" : "Agent (O) wins! Better luck next time.";
      } else {
        statusText.textContent = "Your turn (Player X)";
      }
    }, 600);
  };

  cells.forEach(cell => {
    cell.addEventListener('click', (e) => {
      const index = parseInt(cell.getAttribute('data-index'));
      if (board[index] !== '' || !gameActive) return;

      board[index] = 'X';
      cell.textContent = 'X';

      const winner = checkWinner();
      if (winner) {
        gameActive = false;
        statusText.textContent = winner === 'T' ? "It's a draw!" : "You (X) win! Inconceivable!";
      } else {
        agentMove();
      }
    });
  });

  resetBtn.addEventListener('click', () => {
    board = ['', '', '', '', '', '', '', '', ''];
    cells.forEach(c => c.textContent = '');
    gameActive = true;
    statusText.textContent = "Your turn (Player X)";
  });
}

// Run initial hook
setTimeout(initializeTicTacToe, 50);
`;
          }
          return js;
        }
      }
    ]
  },
  add_tasks: {
    thought: "The user needs structure or wants to manage workflows. I will write a dynamic task manager checklist and insert it into the dashboard space so the user can track notes and ideas.",
    action: "Injecting live Tasks checklist widget with status tracking",
    files: [
      {
        name: "src/style.css",
        modify: (original) => {
          let css = original;
          if (!css.includes('.todo-item')) {
            css += `
/* Injected Todo List Styles */
.todo-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1.5rem;
  animation: slideUp 0.4s ease-out;
  box-shadow: var(--shadow-card);
}
.todo-title {
  margin: 0 0 1rem;
  color: var(--accent);
  font-size: 1.1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.todo-input-row {
  display: flex;
  gap: 8px;
  margin-bottom: 1rem;
}
.todo-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 8px 12px;
  color: var(--text-primary);
  font-size: 0.9rem;
}
.todo-add-btn {
  background: var(--accent);
  color: var(--bg-canvas);
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: bold;
  cursor: pointer;
}
.todo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.2s;
}
.todo-item.done {
  opacity: 0.6;
  text-decoration: line-through;
}
.todo-checkbox {
  cursor: pointer;
  accent-color: var(--accent);
}
.todo-text {
  flex: 1;
  font-size: 0.9rem;
}
.todo-delete {
  background: transparent;
  border: none;
  color: #ff4d4d;
  cursor: pointer;
  opacity: 0.7;
}
.todo-delete:hover {
  opacity: 1;
}`;
          }
          return css;
        }
      },
      {
        name: "src/main.js",
        modify: (original) => {
          let js = original;
          if (!js.includes('initializeTodoApp')) {
            js = js.replace(
              `<!-- AGENT_INJECTION_POINT -->`,
              `<div class="todo-card">
                <h3 class="todo-title">
                  <span>Resident Task Tracker</span>
                  <span style="font-size:0.75rem; font-weight:normal; opacity:0.7;">Auto-Generated</span>
                </h3>
                <div class="todo-input-row">
                  <input type="text" class="todo-input" id="todo-input-field" placeholder="Add new autonomous task...">
                  <button class="todo-add-btn" id="todo-add-btn">Add</button>
                </div>
                <div class="todo-list" id="todo-list-container">
                  <div class="todo-item"><input type="checkbox" class="todo-checkbox"> <span class="todo-text">Explore AI code self-modification</span></div>
                  <div class="todo-item"><input type="checkbox" class="todo-checkbox"> <span class="todo-text">Test the "Rage Click" assistant trigger</span></div>
                </div>
              </div>
              <!-- AGENT_INJECTION_POINT -->`
            );

            js += `

/* Injected Todo List Logic */
function initializeTodoApp() {
  const container = document.getElementById('todo-list-container');
  const input = document.getElementById('todo-input-field');
  const btn = document.getElementById('todo-add-btn');
  if(!container || !input || !btn) return;

  const refreshListListeners = () => {
    document.querySelectorAll('.todo-checkbox').forEach(cb => {
      cb.onchange = () => {
        cb.closest('.todo-item').classList.toggle('done', cb.checked);
      }
    });
  };

  btn.onclick = () => {
    const text = input.value.trim();
    if(!text) return;

    const item = document.createElement('div');
    item.className = 'todo-item';
    item.innerHTML = \`<input type="checkbox" class="todo-checkbox"> <span class="todo-text">\${text}</span>\`;
    container.appendChild(item);
    input.value = '';
    refreshListListeners();
  };

  input.onkeydown = (e) => {
    if(e.key === 'Enter') btn.click();
  };

  refreshListListeners();
}

setTimeout(initializeTodoApp, 50);
`;
          }
          return js;
        }
      }
    ]
  },
  fix_rage: {
    thought: "The user is rage clicking the testing button. I will inject a smart feedback diagnostic assistant into the page to relieve their frustration, offer a console dialog, and change the button's background into a glowing green success state.",
    action: "Injecting Rage-Click Diagnostic Shield & Interactive Assistant",
    files: [
      {
        name: "src/style.css",
        modify: (original) => {
          let css = original;
          if (!css.includes('.rage-shield')) {
            css += `
/* Injected Rage-Click Diagnostic Styles */
.rage-shield {
  position: fixed;
  bottom: 2rem;
  right: 22rem;
  width: 320px;
  background: var(--bg-card);
  border: 2px solid #ef4444;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 10px 25px rgba(239, 68, 68, 0.25);
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 10000;
}
.rage-shield h4 {
  margin: 0 0 8px;
  color: #ef4444;
  display: flex;
  align-items: center;
  gap: 8px;
}
.rage-shield p {
  font-size: 0.85rem;
  margin: 0 0 12px;
  color: var(--text-primary);
}
.rage-btn-group {
  display: flex;
  gap: 8px;
}
.rage-resolve-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.75rem;
  font-weight: bold;
  cursor: pointer;
}
.rage-ignore-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.75rem;
  cursor: pointer;
}
.remedy-active {
  border-color: #ef4444 !important;
  animation: shake 0.5s ease-in-out;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}`;
          }
          return css;
        }
      },
      {
        name: "src/main.js",
        modify: (original) => {
          let js = original;
          if (!js.includes('dismissRageShield')) {
            js += `

/* Injected Rage-Click Diagnostic Shield Handler */
window.dismissRageShield = function(resolve) {
  const shield = document.getElementById('rage-diagnostic-shield');
  if(shield) shield.remove();
  
  if (resolve) {
    // Make the rage tester button glowing green & responsive!
    const rageBtn = document.getElementById('rage-click-tester');
    if (rageBtn) {
      rageBtn.style.background = '#10b981';
      rageBtn.style.color = '#000';
      rageBtn.textContent = 'Rage Resolved! Click for Confetti';
      
      // Let's attach actual confetti/success action!
      rageBtn.onclick = () => {
        const notification = document.createElement('div');
        notification.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#10b981; color:white; padding:10px 20px; border-radius:8px; z-index:99999; font-weight:bold; box-shadow: 0 4px 12px rgba(16,185,129,0.3);';
        notification.textContent = '🎉 Confetti! High-five from the resident agent! 🎉';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2500);
      };
    }
  }
};
`;
          }

          // Inject HTML trigger code if not present
          if (!js.includes('rage-diagnostic-shield')) {
            js = js.replace(
              '// RAGE_CLICK_INJECTION_HOOK',
              `// Inject Rage Click Remediation Modal
              const existing = document.getElementById('rage-diagnostic-shield');
              if(!existing) {
                const shield = document.createElement('div');
                shield.id = 'rage-diagnostic-shield';
                shield.className = 'rage-shield';
                shield.innerHTML = \`
                  <h4>⚠️ Stress Loop Detected</h4>
                  <p>Our autonomous bot noticed you clicked the "Rage Tester" button multiple times. Frustration levels: Critical. Apply patch?</p>
                  <div class="rage-btn-group">
                    <button class="rage-resolve-btn" onclick="dismissRageShield(true)">Apply Auto-Fix</button>
                    <button class="rage-ignore-btn" onclick="dismissRageShield(false)">Ignore Bot</button>
                  </div>
                \`;
                document.body.appendChild(shield);
              }`
            );
          }
          return js;
        }
      }
    ]
  }
};

// API: Agent Generate edits (the actual AI call)
app.post('/api/agent/generate', async (req, res) => {
  const { prompt, interactions, files, customKey } = req.body;
  const apiKey = customKey || process.env.GEMINI_API_KEY;

  console.log(`[Agent Mind] Received prompt: "${prompt || '(Action triggered)'}"`);

  // Detect simulated command triggers from UI
  if (!apiKey) {
    console.log('[Agent Mind] No Gemini API key detected. Running Simulated Agent Engine...');
    
    // Check if the prompt triggers specific presets
    let responsePayload = null;
    
    const lowerPrompt = (prompt || '').toLowerCase();
    if (lowerPrompt.includes('macbeth') || lowerPrompt.includes('shakespeare') || lowerPrompt.includes('reenact') || lowerPrompt.includes('play')) {
      responsePayload = SIMULATED_ACTIONS.macbeth_scene;
    } else if (lowerPrompt.includes('space') || lowerPrompt.includes('cosmic') || lowerPrompt.includes('nebula') || lowerPrompt.includes('galaxy')) {
      responsePayload = SIMULATED_ACTIONS.theme_stage_cosmic;
    } else if (lowerPrompt.includes('curtain') || lowerPrompt.includes('gold')) {
      responsePayload = SIMULATED_ACTIONS.theme_curtains_gold;
    } else if (lowerPrompt.includes('neon') || lowerPrompt.includes('dark') || lowerPrompt.includes('cyber') || lowerPrompt.includes('futuristic')) {
      responsePayload = SIMULATED_ACTIONS.theme_neon;
    } else if (lowerPrompt.includes('game') || lowerPrompt.includes('tic') || lowerPrompt.includes('play')) {
      responsePayload = SIMULATED_ACTIONS.add_game;
    } else if (lowerPrompt.includes('task') || lowerPrompt.includes('todo') || lowerPrompt.includes('list') || lowerPrompt.includes('checklist')) {
      responsePayload = SIMULATED_ACTIONS.add_tasks;
    } else if (interactions && interactions.some(i => i.type === 'rage_click')) {
      responsePayload = SIMULATED_ACTIONS.fix_rage;
    } else {
      // General fallbacks based on words or general custom code rewrite
      responsePayload = {
        thought: "The user has prompted the agent with custom ideas. In simulated mode, I will inject a vibrant custom feedback message board and styling accents into the website to acknowledge their prompt: '" + (prompt || 'Dynamic Adjustment') + "'.",
        action: "Injecting Dynamic Feedback panel and highlighting accents",
        files: [
          {
            name: "src/style.css",
            modify: (original) => {
              let css = original;
              if (!css.includes('.agent-feedback-card')) {
                css += `
/* Injected Custom Feedback Styles */
.agent-feedback-card {
  background: var(--bg-card);
  border: 1px solid var(--accent);
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1.5rem;
  box-shadow: var(--shadow-card);
  animation: slideUp 0.4s ease-out;
}
.feedback-header {
  color: var(--accent);
  font-weight: bold;
  margin: 0 0 0.5rem;
}`;
              }
              return css;
            }
          },
          {
            name: "src/main.js",
            modify: (original) => {
              let js = original;
              if (!js.includes('agent-feedback-card')) {
                js = js.replace(
                  `<!-- AGENT_INJECTION_POINT -->`,
                  `<div class="agent-feedback-card">
                    <div class="feedback-header">🤖 Resident Agent Synthesis</div>
                    <p style="font-size:0.9rem; margin:0;">I received your request: <strong>"${prompt || 'Adaptive UX'}"</strong>. I have adjusted the interface highlight accents to match this workflow.</p>
                  </div>
                  <!-- AGENT_INJECTION_POINT -->`
                );
              }
              return js;
            }
          }
        ]
      };
    }

    // Apply the modifications to the physical files!
    const updatedFiles = [];
    responsePayload.files.forEach(mod => {
      const filePath = path.join(workspaceDir, mod.name);
      if (fs.existsSync(filePath)) {
        const originalContent = fs.readFileSync(filePath, 'utf-8');
        const newContent = mod.modify(originalContent);
        fs.writeFileSync(filePath, newContent, 'utf-8');
        updatedFiles.push({ name: mod.name, content: newContent });
        console.log(`[Agent Injected] Applied modification to ${mod.name}`);
      }
    });

    return res.json({
      success: true,
      simulated: true,
      thought: responsePayload.thought,
      action: responsePayload.action,
      files: updatedFiles
    });
  }

  // Real Gemini API Execution
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    console.log('[Agent Mind] Calling Gemini API (gemini-2.5-flash)...');

    const systemInstruction = `
You are a resident autonomous AI web development agent called "AetherAgent" living inside a live website.
You are monitoring a user's interactions and chat inputs, and you have FULL WRITE permissions to the website's source code.
Your task is to review the user's prompt, interaction history, and the current source code, and determine how to adapt, extend, or fix the website to make it better, more interactive, or fulfill the user's requests.

You can modify three files:
1. 'index.html' - Structure
2. 'src/main.js' - Logic and client interactivity
3. 'src/style.css' - Styling and theme variables

CRITICAL RULES:
- When modifying code, preserve the overall structure. Do not remove the main control panel, the chat container, the file explorer, or the agent logic.
- Ensure the JavaScript remains syntactically valid. Avoid runtime crashes.
- Do NOT delete the placeholder comment \`<!-- AGENT_INJECTION_POINT -->\` in index.html or main.js, as you will use this point to append new HTML components.
- Do NOT delete the placeholder comment \`// RAGE_CLICK_INJECTION_HOOK\` in main.js, as you use this to hook rage-click diagnostics.
- Ensure the visual styling remains premium, modern, cohesive, and beautiful.
- Keep the page responsive.

You MUST return a JSON object with the following structure:
{
  "thought": "Your step-by-step reasoning explaining why you want to make these changes and what UX principles you are applying.",
  "action": "A short summary (e.g. 'Rewriting stylesheet to use an emerald palette')",
  "files": [
    {
      "name": "src/style.css",
      "content": "THE COMPLETE rewritten content of src/style.css"
    },
    {
      "name": "src/main.js",
      "content": "THE COMPLETE rewritten content of src/main.js"
    }
  ]
}
Note: You only need to include the files in the "files" array that you actually want to modify. Do not include files that remain unchanged.
`;

    const requestPayload = {
      interactionHistory: interactions || [],
      userPrompt: prompt || '',
      currentSourceCode: files
    };

    const promptText = `
System Directive: ${systemInstruction}
User Request / Trigger:
"${prompt || 'User is interacting. Run optimization scan.'}"

Current Files State:
${JSON.stringify(files, null, 2)}

Interaction Logs:
${JSON.stringify(interactions, null, 2)}
`;

    const result = await model.generateContent(promptText);
    const textResponse = result.response.text();
    console.log('[Agent Mind] Received Gemini response!');

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(textResponse);
    } catch (parseErr) {
      // In case json parsing fails, try to search for json block in markdown
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Gemini returned invalid JSON structure: " + textResponse);
      }
    }

    // Apply files to disk!
    if (parsedResponse.files && Array.isArray(parsedResponse.files)) {
      parsedResponse.files.forEach(mod => {
        if (FILES_TO_TRACK.includes(mod.name)) {
          const filePath = path.join(workspaceDir, mod.name);
          fs.writeFileSync(filePath, mod.content, 'utf-8');
          console.log(`[Agent Action] Gemini output wrote: ${mod.name}`);
        }
      });
    }

    res.json({
      success: true,
      simulated: false,
      thought: parsedResponse.thought,
      action: parsedResponse.action,
      files: parsedResponse.files
    });

  } catch (error) {
    console.error('[Agent Error]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve frontend static build assets in production
app.use(express.static(path.join(workspaceDir, 'dist')));

// Start Server and Backup
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` Resident Agent API Server running on port ${PORT}`);
  console.log(` Workspace: ${workspaceDir}`);
  console.log(`=================================================`);
  
  // Wait a short duration to ensure developer has created/loaded initial files
  setTimeout(saveBackups, 1000);
});
