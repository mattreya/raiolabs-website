import './style.css';
import {
  FEATURED_PROJECTS,
  HURRICANE_BOT_CATEGORIES,
  WORKSHOP_TRACKS,
  SWARM_SCENARIOS
} from './raiolabsData.js';

// Active configuration state
const state = {
  activeTab: 'src/style.css',
  files: {},
  interactions: [],
  rageClicks: 0,
  lastClickTime: 0,
  rageTimeout: null,
  isGenerating: false,
  settings: {
    useGemini: false,
    apiKey: localStorage.getItem('aether_gemini_key') || ''
  },
  stageActiveTool: 'pointer',
  stageCurrentPropIndex: 0,
  stageProps: [],
  stageBuildCount: 0,
  stageBreakCount: 0,
  projectCategory: 'All',
  projectSearch: '',
  liveGithubRepos: [],
  swarmRunning: false,
  swarmTimers: [],
  activeSwarmScenario: 'spvs_audit',
  activeHurricaneCat: 3
};

// API Base URL
const API_URL = 'http://localhost:3000';

// Boot the application
document.addEventListener('DOMContentLoaded', () => {
  renderLayout();
  setupEventListeners();
  loadFiles();
  initializeStageElements();
  renderProjectsGrid();
  renderHurricaneDetail(state.activeHurricaneCat);
  renderWorkshopsCurriculum();
  setupRaioLabsListeners();
  
  // Start agent greeting
  setTimeout(() => {
    logToTerminal('system', 'SYSTEM', 'RaioLabs LLC // AetherOS resident kernel initialized.');
  }, 200);
  setTimeout(() => {
    logToTerminal('info', 'SWARM_READY', 'Loaded 9 Featured GitHub Projects, 5-Category NIST/CISA Bot Overlay & IDE Swarm Simulator.');
  }, 600);
  setTimeout(() => {
    logToTerminal('thought', 'THOUGHT', 'Observing IDE & Web Cockpit. Explore GitHub projects, launch an A2A Swarm scenario, or prompt me below.');
  }, 1200);
});

// Render the application HTML skeleton
function renderLayout() {
  const root = document.querySelector('#app');
  root.innerHTML = `
    <!-- LEFT PANEL: USER WORKSPACE -->
    <main class="canvas-section">
      <header class="canvas-header">
        <div class="logo-container">
          <div>
            <div style="display:flex; align-items:center; gap:12px;">
              <h1 class="logo-text">RaioLabs <span style="font-weight:400; font-size:1.25rem; opacity:0.85;">// AetherOS</span></h1>
              <span class="system-badge">AGENTIC IDE & SWARM HUB</span>
            </div>
            <p style="font-size:0.8rem; color:var(--text-secondary); margin-top:4px;">
              Matt Raio, MSIS / CCNA • Agentic AI Architect, eBPF Security Builder & Multi-Agent Swarm Engineer
            </p>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <a href="https://github.com/mattreya" target="_blank" rel="noopener noreferrer" class="github-header-link">
            🐙 github.com/mattreya ↗
          </a>
          <button class="settings-btn" id="btn-open-settings" style="font-size: 0.9rem;">
            ⚙️ System Settings
          </button>
        </div>
      </header>

      <nav class="canvas-nav">
        <button class="nav-tab active" data-target="projects-view">🚀 GitHub Projects</button>
        <button class="nav-tab" data-target="swarm-view">🐝 IDE Swarm Systems</button>
        <button class="nav-tab" data-target="workshops-view">🎓 Agentic Workshops</button>
        <button class="nav-tab" data-target="dashboard-view">📊 AetherOS Sandbox</button>
        <button class="nav-tab" data-target="stage-view">🎭 Prop Theatre Stage</button>
      </nav>

      <!-- 1. GITHUB PROJECTS VIEW -->
      <div id="projects-view" class="stage-view-container">
        <section class="hero-banner">
          <div class="hero-banner-content">
            <span class="hero-eyebrow">OPEN-SOURCE R&D • LINKEDIN BACKLOG & ACTIVE LABS</span>
            <h2>Autonomous Swarms, Federal Compliance Bots & Kernel-Level Security</h2>
            <p>
              Explore Matt Raio's favorite GitHub repositories spanning <strong>Git-worktree AI Swarms</strong>,
              <strong>NSA/FBI/CISA Compliance Subagents</strong>, <strong>Rust/eBPF CPU Guardians</strong>,
              <strong>NetClaw BGP Automation</strong>, and <strong>3D Time / Post-Quantum Cryptography</strong>.
            </p>
          </div>
          <div class="hero-stats-grid">
            <div class="hero-stat-box">
              <span class="hero-stat-num">60+</span>
              <span class="hero-stat-lbl">Public GitHub Repos</span>
            </div>
            <div class="hero-stat-box">
              <span class="hero-stat-num">Cat 1–5</span>
              <span class="hero-stat-lbl">NIST/CISA Bot Overlay</span>
            </div>
            <div class="hero-stat-box">
              <span class="hero-stat-num">Ring-0</span>
              <span class="hero-stat-lbl">eBPF Kernel Telemetry</span>
            </div>
          </div>
        </section>

        <!-- Filter & Live Sync Bar -->
        <div class="projects-toolbar">
          <div class="category-pills" id="project-category-pills">
            <button class="pill-btn active" data-cat="All">All Featured (9)</button>
            <button class="pill-btn" data-cat="Swarm & IDE">🐝 Swarm & IDE</button>
            <button class="pill-btn" data-cat="SecOps & Governance">🛡️ SecOps & Federal</button>
            <button class="pill-btn" data-cat="eBPF & Kernel">⚡ eBPF & Kernel</button>
            <button class="pill-btn" data-cat="NetOps & Infra">🌐 NetOps & VibeOps</button>
            <button class="pill-btn" data-cat="Quantum & Physics">⚛️ Quantum & 3D Time</button>
          </div>
          <div class="projects-search-row">
            <input type="text" id="project-search-input" class="text-input" placeholder="Search repos by keyword, tech (eBPF, MCP, A2A, BGP, HIPAA)..." style="max-width:340px;">
            <button class="btn-secondary" id="btn-sync-github">
              🔄 Live Sync @mattreya GitHub API
            </button>
          </div>
        </div>

        <!-- Curated Projects Grid -->
        <div class="projects-grid" id="projects-grid-container"></div>

        <!-- Live GitHub API Drawer (populated on click) -->
        <div id="live-github-section" class="hidden" style="margin-top: 1rem;">
          <div class="section-subheader">
            <h3>📡 Live Public Repositories from <code>github.com/mattreya</code></h3>
            <span id="live-github-count" class="system-badge">Fetching...</span>
          </div>
          <div class="live-repos-grid" id="live-repos-container"></div>
        </div>
      </div>

      <!-- 2. IDE SWARM SYSTEMS VIEW -->
      <div id="swarm-view" class="stage-view-container hidden">
        <section class="hero-banner swarm-hero">
          <div class="hero-banner-content">
            <span class="hero-eyebrow">AUTONOMOUS SWARM SYSTEMS IN THE IDE • MCP + A2A + GIT WORKTREES</span>
            <h2>Inside the Agentic IDE Cockpit</h2>
            <p>
              Instead of relying on a single chatty LLM that hallucinates across your repository, RaioLabs architectures deploy
              <strong>specialized multi-agent swarms</strong> inside VS Code & Google Antigravity. Each agent operates in its own
              isolated <strong>Git Worktree</strong>, communicates via <strong>Agent-to-Agent (A2A)</strong> JSON-RPC & <strong>Model Context Protocol (MCP)</strong>,
              syncs persistent state to <code>summary.md</code> (<strong>The Hippocampus</strong>), and is policed at ring-0 by <strong>eBPF</strong>.
            </p>
          </div>
        </section>

        <!-- Interactive Swarm Simulator Controls -->
        <div class="card-widget swarm-cockpit-card">
          <div class="swarm-cockpit-header">
            <div>
              <h3>⚡ Interactive IDE Multi-Agent Swarm Simulator</h3>
              <p style="margin:0;">Select a real-world RaioLabs workflow and watch the Orchestrator, Coder, NSA/SPVS Auditor, and eBPF Guardian coordinate live.</p>
            </div>
            <div class="swarm-controls">
              <select id="swarm-scenario-select" class="swarm-select">
                <option value="spvs_audit">Scenario 1: Zero-Trust Feature + OWASP SPVS Audit</option>
                <option value="netclaw_bgp">Scenario 2: NetClaw BGP Mesh & OSI Layer-3 Triage</option>
                <option value="pqc_quantum">Scenario 3: Post-Quantum Cryptography (FIPS 203) Swarm</option>
              </select>
              <button class="btn-primary" id="btn-run-swarm" style="width:auto; padding:10px 18px;">
                ▶ Re-Run Swarm Scenario
              </button>
            </div>
          </div>

          <p id="swarm-scenario-desc" class="swarm-scenario-desc">
            ${SWARM_SCENARIOS.spvs_audit.description}
          </p>

          <!-- 5-Node Visual Topology -->
          <div class="swarm-topology-grid" id="swarm-topology-grid">
            <div class="swarm-node" id="node-orchestrator">
              <div class="swarm-node-header">
                <span class="swarm-node-icon">🎛️</span>
                <span class="swarm-node-badge">CAT 4 OVERLORD</span>
              </div>
              <h4>IDE Orchestrator</h4>
              <p>Antigravity / Gemini-CLI</p>
              <code class="swarm-node-port">worktree: main</code>
            </div>

            <div class="swarm-node" id="node-coder">
              <div class="swarm-node-header">
                <span class="swarm-node-icon">🛠️</span>
                <span class="swarm-node-badge">A2A :8001</span>
              </div>
              <h4>Coder Subagent</h4>
              <p>Spec-Driven Synthesis</p>
              <code class="swarm-node-port">worktree: feat/*</code>
            </div>

            <div class="swarm-node" id="node-auditor">
              <div class="swarm-node-header">
                <span class="swarm-node-icon">🛡️</span>
                <span class="swarm-node-badge">A2A :8002</span>
              </div>
              <h4>Auditor & Guardrail</h4>
              <p>OWASP SPVS + NSA/CISA</p>
              <code class="swarm-node-port">/auditor /guardrail</code>
            </div>

            <div class="swarm-node" id="node-ebpf">
              <div class="swarm-node-header">
                <span class="swarm-node-icon">🔬</span>
                <span class="swarm-node-badge">RING-0 KERNEL</span>
              </div>
              <h4>eBPF CPU Guardian</h4>
              <p>Syscall & Cgroup Enforcer</p>
              <code class="swarm-node-port">tracepoint/syscalls</code>
            </div>

            <div class="swarm-node" id="node-hippocampus">
              <div class="swarm-node-header">
                <span class="swarm-node-icon">🧠</span>
                <span class="swarm-node-badge">SUBSTRATE</span>
              </div>
              <h4>The Hippocampus</h4>
              <p>Persistent Memory & Constitution</p>
              <code class="swarm-node-port">summary.md + SOUL.md</code>
            </div>
          </div>

          <!-- Live Packet Inspector & Hippocampus State Split View -->
          <div class="swarm-inspector-split">
            <div class="swarm-pane">
              <div class="swarm-pane-title">
                <span>📡 Live A2A / MCP / eBPF Wire Payload</span>
                <span id="swarm-step-badge" class="system-badge">IDLE</span>
              </div>
              <pre class="swarm-code-box" id="swarm-payload-box">// Click "Launch Swarm Run" above to inspect real-time Agent-to-Agent (A2A) JSON-RPC packets, MCP tool calls, and eBPF kernel trace verdicts.</pre>
            </div>
            <div class="swarm-pane">
              <div class="swarm-pane-title">
                <span>🧠 Live <code>summary.md</code> (Agent Hippocampus)</span>
                <span class="system-badge" style="color:#10b981; border-color:rgba(16,185,129,0.3);">PERSISTENT STATE</span>
              </div>
              <pre class="swarm-code-box" id="swarm-memory-box"># Project Hippocampus (summary.md)
- **Cockpit**: VS Code / Google Antigravity IDE
- **Constitution**: SOUL.md (DefenseClaw Guardrails Active)
- **Worktrees**: 3 isolated branches ready
- **Status**: Waiting for operator swarm dispatch...</pre>
            </div>
          </div>
        </div>

        <!-- Architectural Pillars of IDE Swarms -->
        <div class="grid-workspace">
          <article class="card-widget">
            <h3>🌳 1. Parallel Universe Git Worktrees</h3>
            <p>
              Powered by <code>aiswarm_mattaiops</code>, each persona (Architect, Coder, SecOps Auditor) is spawned in its own
              <code>git worktree</code> directory. Agents never step on each other's index locks, enabling 10x parallel synthesis before clean merge verification.
            </p>
          </article>
          <article class="card-widget">
            <h3>🤝 2. MCP + A2A Protocol Grammar</h3>
            <p>
              <strong>MCP</strong> connects agents vertically to tools (NetBox, GNS3, Packet Copilot, SPVS Scanner).
              <strong>A2A (Agent-to-Agent)</strong> connects peer agents horizontally via typed <code>AgentCard</code> registries, Tasks, Artifacts, and SSE streams.
            </p>
          </article>
          <article class="card-widget">
            <h3>📜 3. Constitutional Guardrails (SOUL.md & .spec.md)</h3>
            <p>
              Every swarm session is bound by <code>SOUL.md</code> (DefenseClaw rules) and Spec-Driven Development checklists.
              Federal compliance subagents (<code>/auditor</code>, <code>/guardrail</code>, <code>/identity</code>, <code>/oversight</code>) prevent Confused Deputy escalation.
            </p>
          </article>
          <article class="card-widget">
            <h3>👁️ 4. Mercy & Severity: eBPF Kernel Truth</h3>
            <p>
              LLMs can hallucinate or be prompt-injected, but the Linux kernel does not lie. <code>eBPF_CPU_Guardian</code> and <code>ghostscan</code>
              monitor cgroup CPU quotas, network sockets, and file descriptors at ring-0 to guarantee safe execution.
            </p>
          </article>
        </div>
      </div>

      <!-- 3. AGENTIC WORKSHOPS & HURRICANE MODEL VIEW -->
      <div id="workshops-view" class="stage-view-container hidden">
        <section class="hero-banner">
          <div class="hero-banner-content">
            <span class="hero-eyebrow">PROJECT SELF & DESIGN MULTI-AGENT AI SYSTEMS • NIST/CISA SP800-53 OVERLAY</span>
            <h2>Agentic AI Workshops & The Hurricane Model of Autonomy</h2>
            <p>
              Led by <strong>Matt Raio (MSIS, CCNA)</strong>, these intensive hands-on workshops train engineers, IT leaders, and cybersecurity defenders
              to transition from reactive ticket-fixers to <strong>Agentic Orchestrators</strong>—grounded in formal logic, OSI network triage, and NIST/CISA security controls.
            </p>
          </div>
        </section>

        <!-- Interactive 5 Kinds of Bots / Hurricane Scale Explorer -->
        <div class="card-widget">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; margin-bottom:1rem;">
            <div>
              <h3>🌀 The 5 Kinds of Bots: Hurricane Scale & NIST/CISA SP800-53 Overlay</h3>
              <p style="margin:0;">
                Developed during NIST/CISA working group collaborations, this framework categorizes AI agents by operational force and blast radius—so organizations can calibrate governance before deployment.
              </p>
            </div>
          </div>

          <div class="hurricane-selector" id="hurricane-selector">
            ${HURRICANE_BOT_CATEGORIES.map((cat, idx) => `
              <button class="hurricane-tab ${idx === 3 ? 'active' : ''}" data-idx="${idx}" style="--cat-color: ${cat.color}">
                <span class="hurricane-cat-badge">${cat.category}</span>
                <span class="hurricane-cat-title">${cat.name}</span>
              </button>
            `).join('')}
          </div>

          <div id="hurricane-detail-card" class="hurricane-detail-box"></div>
        </div>

        <!-- Dual-Track Workshop Curriculum -->
        <div id="workshops-curriculum-container" class="workshops-tracks-grid"></div>
      </div>

      <!-- 4. ORIGINAL AETHEROS SANDBOX DASHBOARD VIEW -->
      <div id="dashboard-view" class="stage-view-container hidden">
        <section class="canvas-intro">
          <p>
            This is the interactive <strong>AetherOS Self-Modifying Sandbox</strong>. As you click, type, adjust settings, or express frustration, 
            the <strong>Resident Autonomous Agent</strong> in the right-hand panel monitors your behavior and automatically 
            re-writes the website's source code to assist you.
          </p>
        </section>

        <!-- Grid Sandbox Workspace -->
        <div class="grid-workspace">
          
          <!-- Interactive Widget 1: Interactive Note Sandbox -->
          <article class="card-widget" id="widget-notepad">
            <h3>📝 Objective Workspace</h3>
            <p>Type your instructions or describe what component you want the resident agent to build here.</p>
            <textarea class="text-area-custom" id="note-input" placeholder="e.g., 'Make the layout look cyber-neon' or 'I need a checklist component'"></textarea>
            <button class="btn-primary" id="btn-submit-note" style="margin-top: 12px;">Submit to Agent</button>
          </article>

          <!-- Interactive Widget 2: Environmental Controls -->
          <article class="card-widget" id="widget-controls">
            <h3>🎛️ Aura Settings</h3>
            <p>Modify local client settings to feed behavioral metrics to the resident agent's neural nets.</p>
            
            <div class="control-row">
              <label for="aura-speed">Interface Speed Vibe</label>
              <input type="range" id="aura-speed" class="range-input" min="1" max="100" value="50">
            </div>

            <div class="control-row">
              <label for="aura-complexity">Aesthetic Density</label>
              <input type="range" id="aura-complexity" class="range-input" min="1" max="100" value="30">
            </div>

            <div style="margin-top: 15px; font-size: 0.8rem; color: var(--text-secondary); display: flex; justify-content: space-between;">
              <span>Aura Activity: <strong id="aura-vibe-lbl">50%</strong></span>
              <span>Density Level: <strong id="density-lbl">30%</strong></span>
            </div>
          </article>

          <!-- Interactive Widget 3: Friction Diagnostic Area -->
          <article class="card-widget" id="widget-frustration">
            <h3>⚡ Friction Diagnostic (Rage Click Tester)</h3>
            <p>Click the button below repeatedly to simulate frustration. The resident agent will detect "rage clicks" and generate UI repairs.</p>
            <div class="rage-test-area">
              <button class="btn-primary" id="rage-click-tester">Click Rapidly</button>
              <div style="margin-top:10px; font-size:0.75rem; color:var(--text-secondary);">
                Clicks in last 2 seconds: <span id="rage-counter-lbl" style="font-weight:bold; color:var(--accent);">0</span>
              </div>
              <div class="metric-bar">
                <div class="metric-fill" id="frustration-fill" style="width: 0%"></div>
              </div>
            </div>
          </article>

          <!-- Interactive Widget 4: Live Agent Injector Target -->
          <article class="card-widget" id="widget-injected">
            <h3>🔌 AI Live Extension Deck</h3>
            <p>New components, games, and templates generated by the resident agent are injected directly below.</p>
            
            <div class="agent-feedback-card">
                    <div class="feedback-header">🤖 Resident Agent Synthesis</div>
                    <p style="font-size:0.9rem; margin:0;">I received your request: <strong>"Fulfill user notepad design goals: build the scene and reenact Macbeth (Shakespeare)"</strong>. I have adjusted the interface highlight accents to match this workflow.</p>
                  </div>
                  <!-- AGENT_INJECTION_POINT -->
            <div style="padding: 20px; border: 1px dashed var(--border-color); border-radius: 8px; text-align: center; color: var(--text-dim); font-size: 0.85rem;">
              No custom modules injected yet. Use the chat panel or notepad to prompt changes.
            </div>
            <!-- AGENT_INJECTION_POINT -->
          </article>
        </div>
      </div>

      <!-- 5. THEATRE STAGE VIEW -->
      <div id="stage-view" class="stage-view-container hidden">
        <section class="canvas-intro">
          <p>
            Welcome to the <strong>Creative Theatre Stage</strong>. Pick a tool and design the scenery! 
            The Resident Agent watches your actions and adapts the atmosphere dynamically to encourage construction or chaos.
          </p>
        </section>

        <div class="theatre-stage active-stage" id="theatre-stage">
          <div class="stage-stars"></div>
          <div class="curtain-left"></div>
          <div class="curtain-right"></div>
          <div class="curtain-valance"></div>
          <div class="stage-floor" id="stage-floor-target"></div>
          <div class="stage-footlights">
            <div class="footlight"></div>
            <div class="footlight"></div>
            <div class="footlight"></div>
            <div class="footlight"></div>
            <div class="footlight"></div>
            <div class="footlight"></div>
          </div>
          <!-- Placed props will render dynamically -->
          <div id="placed-props-container"></div>
        </div>

        <div class="stage-controls-bar">
          
          <!-- Tool Rack -->
          <div class="tool-rack-container">
            <div class="tool-label">Active Tool</div>
            <div class="tool-buttons">
              <button class="tool-btn active-tool" id="tool-pointer">
                <span>🖱️</span> Pointer
              </button>
              <button class="tool-btn" id="tool-drill">
                <span>🔌</span> Drill (Build)
              </button>
              <button class="tool-btn" id="tool-hammer">
                <span>🔨</span> Hammer (Break)
              </button>
            </div>
          </div>

          <!-- Carousel Prop Selection -->
          <div class="prop-carousel-container">
            <div class="tool-label">Cardboard Prop Carousel</div>
            <div class="carousel-body">
              <button class="carousel-btn" id="carousel-prev">◀</button>
              <div class="carousel-viewer">
                <span id="carousel-item-emoji" style="font-size:1.4rem;">🌳</span>
                <span id="carousel-item-name" class="prop-preview-lbl">Painted Tree</span>
              </div>
              <button class="carousel-btn" id="carousel-next">▶</button>
            </div>
          </div>

        </div>

        <!-- Help Info -->
        <div style="font-size: 0.85rem; color: var(--text-secondary); background: rgba(0,0,0,0.15); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); display: flex; align-items: center; gap: 8px;">
          <span>💡</span>
          <span>
            <strong>Drill Mode:</strong> Click anywhere on the stage floor to place the active cutout. Creations are stored locally so they persist.
            <br><strong>Hammer Mode:</strong> Click on any placed cutout to strike it. It takes 3 hits to smash it entirely!
          </span>
        </div>
      </div>
    </main>

    <!-- RIGHT PANEL: CUTE INTERACTIVE COMPANION BOT & PATREON HUB -->
    <aside class="agent-section companion-panel">
      <header class="agent-header">
        <div class="agent-profile">
          <div class="agent-avatar" style="background: linear-gradient(135deg, #f96854 0%, #a855f7 100%);">
            🤖
            <div class="status-orb observing" id="agent-status-orb"></div>
          </div>
          <div class="agent-title-text">
            <h2>RaioBot Companion</h2>
            <span class="agent-status-msg" id="agent-status-msg">Mood: Happy & Curious ✨</span>
          </div>
        </div>
        <a href="https://www.patreon.com/Mattraio" target="_blank" rel="noopener noreferrer" class="patreon-header-pill" id="api-badge">
          ❤️ Patreon / Mattraio
        </a>
      </header>

      <!-- Animated Character Stage -->
      <section class="bot-character-stage" id="bot-character-stage">
        <div class="bot-ambient-glow" id="bot-ambient-glow"></div>
        <div class="bot-particles-layer" id="bot-particles-layer"></div>

        <!-- Swarm Bot Types Bar (Illustrates IDE Multi-Agent Swarm Simulator in Companion) -->
        <div class="companion-swarm-roster" id="companion-swarm-roster">
          <div class="roster-top-row">
            <span class="roster-title">🐝 IDE SWARM BOTS:</span>
            <button class="roster-run-btn" id="btn-companion-run-swarm" type="button" title="Run or Re-Run the active IDE Swarm Scenario right on stage!">
              ▶ Re-Run Swarm Scenario
            </button>
          </div>
          <div class="roster-pills-row">
            <button class="swarm-bot-chip active" data-swarm-bot="orchestrator" title="Main IDE Orchestrator (Antigravity / Gemini-CLI)">
              🎛️ <span>Orchestrator</span>
            </button>
            <button class="swarm-bot-chip" data-swarm-bot="coder" title="Click to pop up Coder-01 Subagent (A2A :8001)">
              🛠️ <span>Coder-01</span>
            </button>
            <button class="swarm-bot-chip" data-swarm-bot="auditor" title="Click to pop up NSA/SPVS Auditor-02 (A2A :8002)">
              🛡️ <span>Auditor-02</span>
            </button>
            <button class="swarm-bot-chip" data-swarm-bot="ebpf" title="Click to pop up eBPF CPU Guardian (Ring-0 Kernel)">
              🔬 <span>eBPF Guard</span>
            </button>
            <button class="swarm-bot-chip" data-swarm-bot="hippocampus" title="Click to pop up The Hippocampus (summary.md + SOUL.md)">
              🧠 <span>Hippocampus</span>
            </button>
            <button class="swarm-bot-chip kev-chip" data-swarm-bot="kev" title="Click to pop up KEV-Bot (Real-Time User Behavior Analyst)">
              🚨 <span>KEV-Bot</span>
            </button>
          </div>
        </div>

        <!-- Coffee Toast Banner (Shown on $5 Coffee Spark) -->
        <div class="coffee-toast-banner hidden" id="coffee-toast-banner">
          ☕ <span>FRESH ESPRESSO LOADED! <strong>"THANKS A LATTE!"</strong></span> ♨️
        </div>

        <!-- Stage Floor: Main Bot + Pop-Up Partner Bot + Replicated Swarm Squad -->
        <div class="bot-stage-actors" id="bot-stage-actors">
          <!-- Left Replicated Subagents (Shown on $15 Swarm Builder) -->
          <div class="swarm-clone-unit left-clone-1" id="swarm-clone-1">
            <span class="clone-chat-pill" id="clone-chat-1">🛠️ Worktree #1: Ready!</span>
            <div class="mini-clone-bot">🤖</div>
            <span class="clone-role-lbl">Coder-01</span>
          </div>
          <div class="swarm-clone-unit left-clone-2" id="swarm-clone-2">
            <span class="clone-chat-pill" id="clone-chat-2">🛡️ SPVS Audit: Clean!</span>
            <div class="mini-clone-bot">🤖</div>
            <span class="clone-role-lbl">Auditor-02</span>
          </div>

          <!-- Cute Animated Main Robot (RaioBot Orchestrator) -->
          <div class="cute-bot-wrapper mood-happy" id="cute-bot-wrapper" title="Click to pet or high-five RaioBot!">
            <!-- Commander Crown (Shown on $50 Bot Overlord) -->
            <div class="commander-crown hidden" id="commander-crown">👑</div>

            <!-- Floating Antenna -->
            <div class="bot-antenna">
              <div class="antenna-stem"></div>
              <div class="antenna-bulb" id="bot-antenna-bulb">💖</div>
            </div>

            <!-- Robot Head / Visor -->
            <div class="bot-head">
              <div class="bot-ear left"></div>
              <div class="bot-ear right"></div>
              <div class="bot-visor">
                <div class="bot-eyes-row" id="bot-eyes-row">
                  <div class="bot-eye left"><div class="bot-pupil"></div></div>
                  <div class="bot-eye right"><div class="bot-pupil"></div></div>
                </div>
                <div class="bot-cheeks-row">
                  <span class="bot-blush left"></span>
                  <div class="bot-mouth" id="bot-mouth"></div>
                  <span class="bot-blush right"></span>
                </div>
              </div>
            </div>

            <!-- Robot Body with Glowing Heart Core & Coffee Cup Prop -->
            <div class="bot-torso">
              <div class="commander-cape hidden" id="commander-cape"></div>
              <div class="bot-arm left" id="bot-arm-left">👋</div>
              <div class="bot-chest-core" id="bot-chest-core">⚡</div>
              <div class="bot-arm right" id="bot-arm-right">✨</div>

              <!-- Animated Raised Coffee Mug Prop ($5 Tier) -->
              <div class="bot-coffee-prop hidden" id="bot-coffee-prop">
                <div class="coffee-steam">
                  <span>~</span><span>~</span><span>~</span>
                </div>
                <div class="coffee-mug-icon">☕</div>
              </div>
            </div>
            <div class="bot-shadow"></div>
            <span class="actor-role-tag" id="main-bot-role-tag">🎛️ RaioBot (Orchestrator)</span>
          </div>

          <!-- Animated Wire Packet Bridge between Main Bot & Pop-Up Partner Bot -->
          <div class="swarm-packet-bridge hidden" id="swarm-packet-bridge">
            <span class="packet-proto-pill" id="packet-proto-pill">A2A_TASK</span>
            <div class="packet-beam-line">
              <span class="packet-dot"></span>
            </div>
            <span class="packet-dir-arrow" id="packet-dir-arrow">⇄</span>
          </div>

          <!-- Pop-Up Partner Bot (Pops up next to Main Bot during Swarm Scenario!) -->
          <div class="swarm-partner-wrapper hidden" id="swarm-partner-bot" data-bot-type="coder">
            <div class="bot-antenna">
              <div class="antenna-stem"></div>
              <div class="antenna-bulb" id="partner-bot-bulb">🛠️</div>
            </div>
            <div class="bot-head partner-head" id="partner-bot-head">
              <div class="bot-ear left"></div>
              <div class="bot-ear right"></div>
              <div class="bot-visor partner-visor" id="partner-bot-visor">
                <div class="bot-eyes-row">
                  <div class="bot-eye left partner-eye"><div class="bot-pupil"></div></div>
                  <div class="bot-eye right partner-eye"><div class="bot-pupil"></div></div>
                </div>
                <div class="bot-cheeks-row">
                  <span class="bot-blush left"></span>
                  <div class="bot-mouth partner-mouth"></div>
                  <span class="bot-blush right"></span>
                </div>
              </div>
            </div>
            <div class="bot-torso partner-torso" id="partner-bot-torso">
              <div class="bot-arm left" id="partner-arm-left">⚡</div>
              <div class="bot-chest-core" id="partner-bot-core">🛠️</div>
              <div class="bot-arm right" id="partner-arm-right">📡</div>
            </div>
            <div class="bot-shadow"></div>
            <span class="actor-role-tag partner-tag" id="partner-bot-role-tag">🛠️ Coder-01 (:8001)</span>
          </div>

          <!-- Right Replicated Subagents (Shown on $15 Swarm Builder) -->
          <div class="swarm-clone-unit right-clone-1" id="swarm-clone-3">
            <span class="clone-chat-pill" id="clone-chat-3">🔬 eBPF Ring-0: Armed!</span>
            <div class="mini-clone-bot">🤖</div>
            <span class="clone-role-lbl">eBPF-03</span>
          </div>
          <div class="swarm-clone-unit right-clone-2" id="swarm-clone-4">
            <span class="clone-chat-pill" id="clone-chat-4">🌐 NetClaw BGP: Synced!</span>
            <div class="mini-clone-bot">🤖</div>
            <span class="clone-role-lbl">NetClaw-04</span>
          </div>
        </div>

        <!-- Expression Trigger Bar (Tier reward animations locked/greyed out until payment!) -->
        <div class="bot-expression-bar">
          <button class="expr-btn tier-reward-btn locked-tier" id="reward-btn-coffee" data-tier-anim="coffee" data-req="5" title="Locked: Donate $5+ to unlock Coffee Toast!">🔒 ☕ $5 Coffee</button>
          <button class="expr-btn tier-reward-btn locked-tier" id="reward-btn-swarm" data-tier-anim="swarm" data-req="15" title="Locked: Donate $15+ to unlock Swarm Replication!">🔒 🐝 $15 Swarm</button>
          <button class="expr-btn tier-reward-btn locked-tier" id="reward-btn-overlord" data-tier-anim="overlord" data-req="50" title="Locked: Donate $50+ to unlock Hail Mattster Army!">🔒 👑 $50 Overlord</button>
          <button class="expr-btn active" data-mood="happy" title="Happy">😊 Happy</button>
          <button class="expr-btn" data-mood="love" title="Love">🥰 Love</button>
        </div>

        <!-- Dynamic Speech Bubble & Two-Bot Swarm Telemetry Dialog -->
        <div class="bot-speech-bubble" id="bot-speech-bubble">
          <div class="speech-tag" id="bot-speech-tag">👋 HELLO FRIEND!</div>
          <p id="bot-speech-text">
            Hi! I'm <strong>RaioBot</strong>! Click <strong>▶ Re-Run Swarm Scenario</strong> to watch my specialist bots pop up next to me and exchange live A2A/MCP/eBPF telemetry payloads—or pledge below to unlock my Patreon animations! 💖
          </p>

          <!-- Two-Bot Live Dialog + Actual Telemetry Wire Payload (Shown during Swarm Simulation) -->
          <div class="companion-swarm-dialog hidden" id="companion-swarm-dialog">
            <div class="dialog-exchange-row">
              <div class="dialog-line sender-line" id="dialog-sender-line">
                <span class="dialog-speaker" id="dialog-sender-name">🎛️ Orchestrator:</span>
                <span class="dialog-utterance" id="dialog-sender-text">Dispatching task...</span>
              </div>
              <div class="dialog-line receiver-line" id="dialog-receiver-line">
                <span class="dialog-speaker" id="dialog-receiver-name">🛠️ Coder-01:</span>
                <span class="dialog-utterance" id="dialog-receiver-text">Acknowledged!</span>
              </div>
            </div>
            <div class="companion-payload-drawer">
              <div class="payload-drawer-header">
                <span id="companion-payload-proto">📡 TELEMETRY WIRE PAYLOAD</span>
                <span class="payload-step-pill" id="companion-payload-step">STEP 1/6</span>
              </div>
              <pre class="companion-payload-pre" id="companion-payload-code"></pre>
            </div>
          </div>
        </div>
      </section>

      <!-- 🚨 KEV-BOT: REAL-TIME USER BEHAVIOR & TELEMETRY ANALYST -->
      <section class="kev-bot-panel" id="kev-bot-panel">
        <div class="kev-bot-header">
          <div class="kev-bot-identity">
            <div class="kev-bot-avatar" id="kev-bot-avatar" title="KEV-Bot: Real-Time User Behavior & Telemetry Analyst">
              <span class="kev-radar-pulse"></span>
              <span class="kev-bot-face">🚨</span>
            </div>
            <div>
              <div class="kev-title-row">
                <h4>KEV-BOT // LIVE USER ANALYST</h4>
                <span class="kev-live-pill" id="kev-live-pill">● REAL-TIME</span>
              </div>
              <p class="kev-subtitle" id="kev-current-verdict">Monitoring operator cursor, dwell targets & DOM vectors...</p>
            </div>
          </div>
          <div class="kev-controls">
            <button class="kev-btn" id="btn-kev-stage-sync" type="button" title="Pop KEV-Bot onto the main stage next to RaioBot with a live JSON behavioral dump!">
              🤖 Briefing
            </button>
            <button class="kev-btn" id="btn-kev-pause" type="button" title="Pause or resume KEV-Bot real-time analysis stream">
              ⏸
            </button>
          </div>
        </div>

        <!-- Live Telemetry Strip -->
        <div class="kev-metrics-strip">
          <div class="kev-metric-cell">
            <span class="kev-m-lbl">VELOCITY</span>
            <strong id="kev-stat-vel">0 px/s</strong>
          </div>
          <div class="kev-metric-cell">
            <span class="kev-m-lbl">ACTIVE ZONE</span>
            <strong id="kev-stat-zone">GitHub Showcase</strong>
          </div>
          <div class="kev-metric-cell">
            <span class="kev-m-lbl">INTENT PROFILE</span>
            <strong id="kev-stat-profile">Reconnaissance</strong>
          </div>
        </div>

        <!-- Real-Time Scrolling Behavioral Analysis Feed -->
        <div class="kev-stream-box" id="kev-stream-box">
          <div class="kev-log-item kev-init">
            <span class="kev-time">[INIT]</span>
            <span class="kev-tag">KEV_BOOT</span>
            <span class="kev-msg">KEV-Bot v2.6 behavioral sensor online. Watching DOM interactions, cursor kinematics, dwell time, and scroll vectors in real time...</span>
          </div>
        </div>
      </section>

      <!-- Interactive Patreon Donation & Support Card -->
      <section class="patreon-donate-card">
        <div class="patreon-card-header">
          <div>
            <h3>☕ Fuel Open-Source Swarms & Labs</h3>
            <p>Choose a tier and make a pledge below to unlock RaioBot's special reward animations!</p>
          </div>
        </div>

        <!-- Tier Selector -->
        <div class="patreon-tiers-grid" id="patreon-tiers-grid">
          <button class="tier-card" data-amount="5" data-tier="Coffee Swarm (IDE Tips Collection)" data-billing="one-time" data-url="https://www.patreon.com/c/Mattraio/collections" data-mood="happy">
            <span class="tier-emoji">☕</span>
            <span class="tier-price">$5 <small style="font-size:0.65rem; opacity:0.8;">1-Time</small></span>
            <span class="tier-name">Coffee Swarm (IDE Tips)</span>
          </button>
          <button class="tier-card active" data-amount="15" data-tier="Swarm Builder" data-billing="monthly" data-url="https://www.patreon.com/c/Mattraio/membership" data-mood="love">
            <span class="tier-badge-popular">MONTHLY</span>
            <span class="tier-emoji">🐝</span>
            <span class="tier-price">$15<small style="font-size:0.65rem; opacity:0.8;">/mo</small></span>
            <span class="tier-name">Swarm Builder</span>
          </button>
          <button class="tier-card" data-amount="50" data-tier="Bot Overlord" data-billing="monthly" data-url="https://www.patreon.com/c/Mattraio/membership" data-mood="party">
            <span class="tier-emoji">👑</span>
            <span class="tier-price">$50<small style="font-size:0.65rem; opacity:0.8;">/mo</small></span>
            <span class="tier-name">Bot Overlord</span>
          </button>
        </div>

        <!-- Custom Amount & Note -->
        <div class="patreon-custom-row">
          <div class="custom-amount-input-wrap">
            <span class="currency-prefix">$</span>
            <input type="number" id="patreon-custom-amount" class="patreon-amount-input" value="15" min="1" max="10000" aria-label="Donation Amount">
          </div>
          <input type="text" id="patreon-supporter-msg" class="patreon-msg-input" placeholder="Leave a cheer for RaioBot (optional)...">
        </div>

        <button class="btn-patreon-donate" id="btn-patreon-donate">
          <span>💖 Join <strong id="donate-btn-amount">$15/mo</strong> & Unlock Animation ↗</span>
        </button>

        <div class="patreon-sub-note">
          <span>🔒 <a href="https://www.patreon.com/c/Mattraio/collections" target="_blank" rel="noopener noreferrer" style="color:var(--accent-cyan); text-decoration:none; font-weight:700;">$5 1-Time IDE Tips Collection</a> • <a href="https://www.patreon.com/c/Mattraio/membership" target="_blank" rel="noopener noreferrer" style="color:var(--text-secondary); text-decoration:underline;">$15 & $50 Memberships</a></span>
          <button class="settings-btn" id="btn-pet-bot" type="button">✨ Pet RaioBot</button>
        </div>
      </section>

      <!-- Talk to RaioBot / Self-Modifying Prompt Box -->
      <section class="agent-chat-section">
        <div class="chat-input-row">
          <input type="text" id="agent-chat-input" placeholder="Chat with RaioBot or ask for a site theme edit...">
          <button class="btn-send" id="agent-send-btn" title="Send message to RaioBot">
            💬
          </button>
        </div>
        <div class="settings-tray">
          <span>Clicks: <strong id="stat-clicks">0</strong> • Mood: <strong id="stat-stress">Happy ✨</strong> • Up: <strong id="stat-uptime">0s</strong></span>
          <button class="settings-btn" id="btn-reset-codebase">🔄 Reset Site</button>
        </div>
      </section>
    </aside>

    <!-- WIDE "HAIL MATTSTER!" BOT OVERLORD LEGION SHOWCASE OVERLAY ($50 TIER) -->
    <div class="overlord-legion-overlay hidden" id="overlord-legion-overlay">
      <div class="overlord-legion-stage">
        <div class="overlord-top-bar">
          <span class="overlord-alert-badge">👑 CATEGORY 5 • BOT OVERLORD SUPREME COMMAND ($50/MO MEMBERSHIP)</span>
          <button class="overlord-close-btn" id="btn-close-overlord-overlay">&times; Close Legion View</button>
        </div>

        <!-- Commander Bot on Elevated Podium -->
        <div class="overlord-commander-podium">
          <div class="commander-halo"></div>
          <div class="commander-avatar-giant">
            <span class="giant-crown">👑</span>
            <div class="giant-bot-face">🤖</div>
            <span class="commander-rank-pill">SUPREME COMMANDER RAIOBOT</span>
          </div>
          <div class="overlord-chant-banner">
            <h2>⚡ "ALL SUBAGENTS ACROSS ALL WORKTREES: SALUTE THE PATRON!" ⚡</h2>
            <div class="hail-mattster-chorus">
              <span>🗣️ "HAIL MATTSTER!!"</span>
              <span>🗣️ "HAIL MATTSTER!!"</span>
              <span>🗣️ "HAIL MATTSTER!!"</span>
            </div>
          </div>
        </div>

        <!-- Wide Panorama of Hundreds of Synchronized Bots -->
        <div class="overlord-army-viewport">
          <div class="army-shout-bubbles" id="army-shout-bubbles"></div>
          <div class="overlord-hundreds-grid" id="overlord-hundreds-grid"></div>
        </div>

        <div class="overlord-footer-cta">
          <p>🎖️ <strong>Bot Overlord Status Unlocked!</strong> Hundreds of autonomous agents stand ready at your command.</p>
          <div style="display:flex; gap:12px; align-items:center;">
            <button class="btn-secondary" id="btn-dismiss-legion">Back to Cockpit</button>
            <a href="https://www.patreon.com/c/Mattraio/membership" target="_blank" rel="noopener noreferrer" class="btn-patreon-donate" style="width:auto; text-decoration:none; padding:10px 22px;">
              👑 Complete $50/mo Bot Overlord Membership on Patreon ↗
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- SETTINGS MODAL -->
    <div class="modal-overlay hidden" id="settings-modal">
      <div class="modal-card">
        <div class="modal-title">
          <span>System Settings</span>
          <button class="close-btn" id="btn-close-settings">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
              <input type="checkbox" id="chk-use-gemini" style="accent-color: var(--accent);">
              Enable Real Gemini API Key (Self-Modification)
            </label>
            <p style="font-size:0.7rem; color:var(--text-dim); margin-top:4px;">
              By default, we run in simulated mode with instant pre-configured site changes. Enable this to let the website rewrite itself live using Gemini 2.5 Flash.
            </p>
          </div>
          
          <div class="form-group" id="gemini-key-group" style="display:none;">
            <label for="txt-api-key">Gemini API Key</label>
            <input type="password" id="txt-api-key" class="text-input" placeholder="AIzaSy...">
            <p style="font-size:0.7rem; color:var(--text-dim); margin-top:4px;">
              Key is stored locally in your browser's localStorage.
            </p>
          </div>
        </div>
        <button class="btn-primary" id="btn-save-settings">Save Config</button>
      </div>
    </div>
  `;

  // Start link duration timer
  const bootTime = Date.now();
  setInterval(() => {
    const duration = Math.floor((Date.now() - bootTime) / 1000);
    const uptimeEl = document.getElementById('stat-uptime');
    if (uptimeEl) uptimeEl.textContent = `${duration}s`;
  }, 1000);

  setupCompanionBot();
  setupKevBotAnalyst();
}

// Companion Bot Mood & Speech Controller
const BOT_MOOD_CONFIG = {
  happy: {
    label: 'Mood: Happy & Curious ✨',
    bulb: '💖',
    core: '⚡',
    leftArm: '👋',
    rightArm: '✨',
    tag: '😊 RAIOLABS BUDDY'
  },
  love: {
    label: 'Mood: Super Grateful 🥰',
    bulb: '💝',
    core: '💖',
    leftArm: '🫶',
    rightArm: '🌸',
    tag: '🥰 THANK YOU SO MUCH!'
  },
  hype: {
    label: 'Mood: Swarm Commander 🐝',
    bulb: '🚀',
    core: '🔥',
    leftArm: '📢',
    rightArm: '🐝',
    tag: '🐝 SWARM REPLICATED!'
  },
  thinking: {
    label: 'Mood: Deep Kernel Thought 🧐',
    bulb: '💡',
    core: '🧠',
    leftArm: '🔍',
    rightArm: '📡',
    tag: '🧐 ANALYZING ARCHITECTURE'
  },
  party: {
    label: 'Mood: Supreme Bot Overlord! 👑',
    bulb: '👑',
    core: '🌟',
    leftArm: '⚔️',
    rightArm: '🛡️',
    tag: '👑 HAIL MATTSTER!'
  },
  surprised: {
    label: 'Mood: Whoa! High Energy! 😲',
    bulb: '❗',
    core: '💥',
    leftArm: '🛡️',
    rightArm: '🔧',
    tag: '😲 HOLD ON TIGHT!'
  }
};

let swarmChatterTimers = [];

// Personas for the IDE Swarm Bots (including KEV-Bot) shown in the RaioBot Companion Stage
const SWARM_BOT_PERSONAS = {
  orchestrator: {
    key: 'orchestrator',
    icon: '🎛️',
    name: 'IDE Orchestrator',
    shortTag: '🎛️ Orchestrator (main)',
    port: 'worktree: main',
    color: '#a855f7',
    leftArm: '📢',
    rightArm: '⚡',
    sampleProtocol: 'A2A_DISPATCH',
    sampleSenderLine: '🎛️ Orchestrator: "Initializing parallel Git worktrees and loading SOUL.md constitution!"',
    sampleReceiverLine: '[SWARM_INIT] Ready to coordinate Coder-01, Auditor-02, eBPF Guardian, Hippocampus, and KEV-Bot.',
    samplePayload: '{\n  "orchestrator": "antigravity-ide-cockpit",\n  "worktrees": ["main", "feat/jwt-auth", "sec/audit"],\n  "constitution": "SOUL.md (DefenseClaw Active)"\n}'
  },
  coder: {
    key: 'coder',
    icon: '🛠️',
    name: 'Coder-01 Subagent',
    shortTag: '🛠️ Coder-01 (:8001)',
    port: 'A2A :8001',
    color: '#06b6d4',
    leftArm: '⌨️',
    rightArm: '🛠️',
    sampleProtocol: 'A2A_TASK_SEND',
    sampleSenderLine: '🎛️ RaioBot (Orchestrator): "Coder-01, synthesize the zero-trust FastAPI middleware in your isolated git worktree!"',
    sampleReceiverLine: '[CODER_01] Synthesized src/auth_middleware.py (64 lines) in worktrees/feat-jwt-auth. Passing to Auditor-02!',
    samplePayload: '{\n  "jsonrpc": "2.0",\n  "method": "tasks/send",\n  "params": {\n    "id": "task-401",\n    "agentCard": "coder-01@http://localhost:8001",\n    "artifact": "src/auth_middleware.py"\n  }\n}'
  },
  auditor: {
    key: 'auditor',
    icon: '🛡️',
    name: 'Auditor-02 Guardrail',
    shortTag: '🛡️ Auditor-02 (:8002)',
    port: 'A2A :8002',
    color: '#f59e0b',
    leftArm: '🛡️',
    rightArm: '🔍',
    sampleProtocol: 'MCP_SPVS_SCAN',
    sampleSenderLine: '🛠️ Coder-01: "Hey Auditor-02, please scan my new auth_middleware.py artifact against OWASP SPVS Level-1!"',
    sampleReceiverLine: '[AUDITOR_01] HOLD! Detected hardcoded fallback secret (SPVS-V1.4). Returning RS256 remediation diff!',
    samplePayload: '{\n  "verdict": "REJECTED_NEEDS_HEALING",\n  "rule": "OWASP-SPVS-L1-SECRET-02",\n  "finding": "Line 18: Fallback JWT_SECRET string literal detected",\n  "remediation": "Enforce os.environ[\'JWT_PUBLIC_KEY\'] with RS256"\n}'
  },
  ebpf: {
    key: 'ebpf',
    icon: '🔬',
    name: 'eBPF CPU Guardian',
    shortTag: '🔬 eBPF Guard (Ring-0)',
    port: 'RING-0 KERNEL',
    color: '#10b981',
    leftArm: '🔬',
    rightArm: '📡',
    sampleProtocol: 'SYSCALL_TRACE',
    sampleSenderLine: '🎛️ RaioBot (Orchestrator): "eBPF Guardian, verify ring-0 syscalls and cgroup CPU quotas during sandboxed test execution!"',
    sampleReceiverLine: '[EBPF_GUARD] Verified 0 unauthorized network sockets or /etc/shadow reads during pytest run!',
    samplePayload: '{\n  "ebpfProbe": "tracepoint/syscalls/sys_enter_connect",\n  "cgroup": "aiswarm-coder-01.slice",\n  "cpuQuotaPct": "14.2%",\n  "unauthorizedSyscalls": 0,\n  "kernelVerdict": "CLEAN_EXECUTION"\n}'
  },
  hippocampus: {
    key: 'hippocampus',
    icon: '🧠',
    name: 'The Hippocampus',
    shortTag: '🧠 Hippocampus (summary.md)',
    port: 'summary.md + SOUL.md',
    color: '#ec4899',
    leftArm: '📜',
    rightArm: '🧠',
    sampleProtocol: 'STATE_COMMIT',
    sampleSenderLine: '🎛️ RaioBot (Orchestrator): "Hippocampus, commit the verified worktree state and audit trail to summary.md!"',
    sampleReceiverLine: '[HIPPOCAMPUS] Merged worktree, signed commit 8f94a2c, and synchronized persistent memory to summary.md!',
    samplePayload: '## Active Session: Zero-Trust JWT Endpoint [COMPLETED]\n- **Worktree**: `worktrees/feat-jwt-auth` → Merged to `main` (`commit 8f94a2c`)\n- **A2A Iterations**: 2 (1 self-healed SPVS-L1 finding)\n- **eBPF Telemetry**: Verified Clean (0 anomalous syscalls)'
  },
  kev: {
    key: 'kev',
    icon: '🚨',
    name: 'KEV-Bot Live Analyst',
    shortTag: '🚨 KEV-Bot (Telemetry)',
    port: 'DOM + KINEMATICS',
    color: '#f43f5e',
    leftArm: '📡',
    rightArm: '🚨',
    sampleProtocol: 'KEV_BEHAVIOR_STREAM',
    sampleSenderLine: '🎛️ RaioBot (Orchestrator): "KEV-Bot, give me a real-time behavioral telemetry readout on what the operator is doing on the site right now!"',
    sampleReceiverLine: '[KEV_BOT] Tracking operator cursor velocity, DOM dwell targets, scroll vector, and intent profile in real time!',
    samplePayload: '{\n  "agent": "KEV-Bot v2.6",\n  "mode": "REAL_TIME_BEHAVIORAL_TELEMETRY",\n  "sensors": ["cursor_velocity", "dom_dwell_target", "scroll_vector", "click_forensics"]\n}'
  }
};

function clearTierStageProps(preservePartnerBot = false) {
  swarmChatterTimers.forEach(t => clearTimeout(t));
  swarmChatterTimers = [];

  const stageEl = document.getElementById('bot-character-stage');
  const coffeeProp = document.getElementById('bot-coffee-prop');
  const coffeeBanner = document.getElementById('coffee-toast-banner');
  const crown = document.getElementById('commander-crown');
  const cape = document.getElementById('commander-cape');
  const wrapper = document.getElementById('cute-bot-wrapper');
  const partnerBot = document.getElementById('swarm-partner-bot');
  const packetBridge = document.getElementById('swarm-packet-bridge');
  const swarmDialog = document.getElementById('companion-swarm-dialog');
  const mainRoleTag = document.getElementById('main-bot-role-tag');

  if (stageEl) stageEl.classList.remove('stage-mode-coffee', 'stage-mode-swarm', 'stage-mode-overlord', 'stage-mode-pair-dialog');
  if (coffeeProp) coffeeProp.classList.add('hidden');
  if (coffeeBanner) coffeeBanner.classList.add('hidden');
  if (crown) crown.classList.add('hidden');
  if (cape) cape.classList.add('hidden');
  if (wrapper) wrapper.classList.remove('coffee-raise-pose', 'commander-pose', 'swarm-leader-pose');
  if (mainRoleTag) mainRoleTag.textContent = '🎛️ RaioBot (Orchestrator)';

  if (!preservePartnerBot) {
    if (partnerBot) partnerBot.classList.add('hidden');
    if (packetBridge) packetBridge.classList.add('hidden');
    if (swarmDialog) swarmDialog.classList.add('hidden');
  }
}

// Pops up the corresponding Swarm Bot next to the Main Bot and renders the two-bot dialog + actual telemetry payload
function showCompanionSwarmInteraction(step, stepIdx, totalSteps, scenarioTitle = 'IDE Swarm Telemetry') {
  clearTierStageProps(true);

  const fromPersona = SWARM_BOT_PERSONAS[step.from] || SWARM_BOT_PERSONAS.orchestrator;
  const toPersona = SWARM_BOT_PERSONAS[step.to] || SWARM_BOT_PERSONAS.coder;

  // Highlight active bots in the Companion Swarm Roster bar
  document.querySelectorAll('.swarm-bot-chip').forEach(chip => {
    const botKey = chip.getAttribute('data-swarm-bot');
    chip.classList.toggle('active', botKey === step.from || botKey === step.to);
    chip.classList.toggle('chip-sender', botKey === step.from);
    chip.classList.toggle('chip-receiver', botKey === step.to);
  });

  // Update Main Bot role tag (acts as the Sender in this step)
  const mainRoleTag = document.getElementById('main-bot-role-tag');
  if (mainRoleTag) {
    mainRoleTag.textContent = fromPersona.shortTag;
  }

  // Update & Pop Up Partner Bot next to Main Bot (acts as the Receiver in this step)
  const stageEl = document.getElementById('bot-character-stage');
  const partnerBot = document.getElementById('swarm-partner-bot');
  const packetBridge = document.getElementById('swarm-packet-bridge');
  const protoPill = document.getElementById('packet-proto-pill');
  const partnerBulb = document.getElementById('partner-bot-bulb');
  const partnerCore = document.getElementById('partner-bot-core');
  const partnerHead = document.getElementById('partner-bot-head');
  const partnerTorso = document.getElementById('partner-bot-torso');
  const partnerLeftArm = document.getElementById('partner-arm-left');
  const partnerRightArm = document.getElementById('partner-arm-right');
  const partnerRoleTag = document.getElementById('partner-bot-role-tag');

  if (stageEl) stageEl.classList.add('stage-mode-pair-dialog');
  if (packetBridge) {
    packetBridge.classList.remove('hidden');
    if (protoPill) protoPill.textContent = step.protocol || 'A2A_MSG';
  }

  if (partnerBot) {
    partnerBot.setAttribute('data-bot-type', toPersona.key);
    partnerBot.style.setProperty('--partner-color', toPersona.color);
    partnerBot.classList.remove('hidden', 'partner-pop-anim');
    void partnerBot.offsetWidth;
    partnerBot.classList.add('partner-pop-anim');
  }
  if (partnerBulb) partnerBulb.textContent = toPersona.icon;
  if (partnerCore) partnerCore.textContent = toPersona.icon;
  if (partnerLeftArm) partnerLeftArm.textContent = toPersona.leftArm;
  if (partnerRightArm) partnerRightArm.textContent = toPersona.rightArm;
  if (partnerRoleTag) partnerRoleTag.textContent = toPersona.shortTag;
  if (partnerHead) partnerHead.style.borderColor = toPersona.color;
  if (partnerTorso) partnerTorso.style.borderColor = toPersona.color;

  // Build conversational Sender & Receiver lines + actual wire payload
  const moodForLog = step.logType === 'error' ? 'surprised' : (step.logType === 'thought' ? 'thinking' : 'hype');
  const senderUtterance = `"Hey ${toPersona.name}, transmitting [${step.protocol}] packet (${step.badge})!"`;
  const receiverUtterance = `[${step.logTag}] ${step.message}`;
  const wirePayload = step.payload
    ? `// [${step.protocol}] ${step.from.toUpperCase()} ➔ ${step.to.toUpperCase()}\n${step.payload}`
    : (step.memoryPatch || '// Wire payload synchronized');

  setBotReaction(
    moodForLog,
    `🐝 ${fromPersona.icon} ${fromPersona.name.toUpperCase()} ➔ ${toPersona.icon} ${toPersona.name.toUpperCase()}`,
    `${scenarioTitle}: Watch ${fromPersona.name} and ${toPersona.name} exchange live ${step.protocol} telemetry below!`,
    toPersona.icon
  );

  const swarmDialog = document.getElementById('companion-swarm-dialog');
  const senderNameEl = document.getElementById('dialog-sender-name');
  const senderTextEl = document.getElementById('dialog-sender-text');
  const receiverNameEl = document.getElementById('dialog-receiver-name');
  const receiverTextEl = document.getElementById('dialog-receiver-text');
  const payloadProtoEl = document.getElementById('companion-payload-proto');
  const payloadStepEl = document.getElementById('companion-payload-step');
  const payloadCodeEl = document.getElementById('companion-payload-code');

  if (swarmDialog) {
    swarmDialog.classList.remove('hidden');
  }
  if (senderNameEl) senderNameEl.textContent = `${fromPersona.icon} ${fromPersona.name}:`;
  if (senderTextEl) senderTextEl.textContent = step.senderLine || senderUtterance;
  if (receiverNameEl) {
    receiverNameEl.textContent = `${toPersona.icon} ${toPersona.name}:`;
    receiverNameEl.style.color = toPersona.color;
  }
  if (receiverTextEl) receiverTextEl.textContent = receiverUtterance;
  if (payloadProtoEl) payloadProtoEl.textContent = `📡 [${step.protocol}] TELEMETRY PAYLOAD (${step.badge})`;
  if (payloadStepEl) payloadStepEl.textContent = `STEP ${stepIdx}/${totalSteps}`;
  if (payloadCodeEl) payloadCodeEl.textContent = wirePayload;
}

function setBotReaction(moodKey, tagText, messageText, spawnEmoji = '') {
  const wrapper = document.getElementById('cute-bot-wrapper');
  const statusMsg = document.getElementById('agent-status-msg');
  const bulb = document.getElementById('bot-antenna-bulb');
  const core = document.getElementById('bot-chest-core');
  const leftArm = document.getElementById('bot-arm-left');
  const rightArm = document.getElementById('bot-arm-right');
  const speechTag = document.getElementById('bot-speech-tag');
  const speechText = document.getElementById('bot-speech-text');
  const speechBubble = document.getElementById('bot-speech-bubble');
  const stressEl = document.getElementById('stat-stress');

  const cfg = BOT_MOOD_CONFIG[moodKey] || BOT_MOOD_CONFIG.happy;

  if (wrapper) {
    wrapper.className = `cute-bot-wrapper mood-${moodKey} bot-bounce-once`;
    setTimeout(() => wrapper.classList.remove('bot-bounce-once'), 500);
  }
  if (statusMsg) statusMsg.textContent = cfg.label;
  if (stressEl) stressEl.textContent = moodKey.toUpperCase();
  if (bulb) bulb.textContent = cfg.bulb;
  if (core) core.textContent = cfg.core;
  if (leftArm) leftArm.textContent = cfg.leftArm;
  if (rightArm) rightArm.textContent = cfg.rightArm;
  if (speechTag) speechTag.textContent = tagText || cfg.tag;
  if (speechText && messageText) {
    speechText.textContent = messageText;
  }
  if (speechBubble) {
    speechBubble.classList.remove('bubble-pop');
    void speechBubble.offsetWidth;
    speechBubble.classList.add('bubble-pop');
  }

  document.querySelectorAll('.expr-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-mood') === moodKey);
  });

  if (spawnEmoji) {
    spawnBotFloatingEmojis(spawnEmoji);
  }
}

// 1. $5 COFFEE SWARM (1-TIME COLLECTION) ANIMATION: Grabs cup of coffee, raises it high, and unlocks IDE-Agent Tips!
function playCoffeeTierAnimation() {
  clearTierStageProps();
  setBotReaction(
    'love',
    '☕ $5 COFFEE SWARM (1-TIME IDE TIPS COLLECTION)!',
    '☕ *Grabs a steaming cup of espresso and raises it high!* "THANKS SO MUCH! Enjoy your $5 Coffee Swarm Collection packed with tips on integrating your IDE with autonomous agents!" 💖♨️',
    '☕'
  );

  const stageEl = document.getElementById('bot-character-stage');
  const coffeeProp = document.getElementById('bot-coffee-prop');
  const coffeeBanner = document.getElementById('coffee-toast-banner');
  const wrapper = document.getElementById('cute-bot-wrapper');
  const rightArm = document.getElementById('bot-arm-right');
  const leftArm = document.getElementById('bot-arm-left');

  if (stageEl) stageEl.classList.add('stage-mode-coffee');
  if (coffeeProp) coffeeProp.classList.remove('hidden');
  if (coffeeBanner) coffeeBanner.classList.remove('hidden');
  if (wrapper) wrapper.classList.add('coffee-raise-pose');
  if (rightArm) rightArm.textContent = '🙌';
  if (leftArm) leftArm.textContent = '☕';

  spawnBotFloatingEmojis('☕', 14);
}

// 2. $15 SWARM BUILDER ANIMATION: Replicates into 4 sub-bots and commands them with live chat!
function playSwarmBuilderAnimation() {
  clearTierStageProps();
  setBotReaction(
    'hype',
    '🐝 $15 SWARM BUILDER: REPLICATING!',
    '⚡ "Initiating git-worktree mitosis! Cloning 4 specialized subagents! Squad, sound off and report your status to our Patron!"',
    '🐝'
  );

  const stageEl = document.getElementById('bot-character-stage');
  const wrapper = document.getElementById('cute-bot-wrapper');
  if (stageEl) stageEl.classList.add('stage-mode-swarm');
  if (wrapper) wrapper.classList.add('swarm-leader-pose');

  const dialogueSequence = [
    { delay: 350, cloneId: 1, text: '🛠️ Coder-01: Git worktree spawned!', leaderMsg: '📢 RaioBot Commander: "Coder-01, synthesize the zero-trust module! Auditor-02, stand by on A2A port 8002!"' },
    { delay: 1100, cloneId: 2, text: '🛡️ Auditor-02: SPVS Level-1 PASS!', leaderMsg: '📢 RaioBot Commander: "Nice! Auditor-02 verified zero hardcoded secrets! eBPF-03, check ring-0 syscalls!"' },
    { delay: 1900, cloneId: 3, text: '🔬 eBPF-03: 0 rogue syscalls!', leaderMsg: '📢 RaioBot Commander: "Kernel clean! NetClaw-04, lock in the BGP peerings and update summary.md!"' },
    { delay: 2700, cloneId: 4, text: '🌐 NetClaw-04: BGP Mesh Established!', leaderMsg: '🐝 RaioBot & Swarm Squad: "All 4 replicated subagents synchronized in parallel! Thank you, Swarm Builder!" 🚀' }
  ];

  dialogueSequence.forEach(item => {
    const t = setTimeout(() => {
      const pill = document.getElementById(`clone-chat-${item.cloneId}`);
      const cloneUnit = document.getElementById(`swarm-clone-${item.cloneId}`);
      const speechText = document.getElementById('bot-speech-text');
      if (pill) {
        pill.textContent = item.text;
        pill.classList.remove('pill-pop');
        void pill.offsetWidth;
        pill.classList.add('pill-pop');
      }
      if (cloneUnit) {
        cloneUnit.classList.add('clone-speaking');
        setTimeout(() => cloneUnit.classList.remove('clone-speaking'), 700);
      }
      if (speechText) speechText.textContent = item.leaderMsg;
    }, item.delay);
    swarmChatterTimers.push(t);
  });

  spawnBotFloatingEmojis('🐝', 14);
}

// 3. $50 BOT OVERLORD ANIMATION: Main bot turns Commander + Wide Panoramic Screenshot of 160+ Bots shouting "HAIL MATTSTER!"
function playBotOverlordAnimation() {
  clearTierStageProps();
  setBotReaction(
    'party',
    '👑 $50 SUPREME BOT OVERLORD!',
    '👑 *Equips Imperial Crown & Commander Cape!* "ATTENTION ALL 1,000 SUBAGENTS! Form the Grand Legion and salute our Supreme Patron: HAIL MATTSTER!!" ⚡👑',
    '👑'
  );

  const stageEl = document.getElementById('bot-character-stage');
  const crown = document.getElementById('commander-crown');
  const cape = document.getElementById('commander-cape');
  const wrapper = document.getElementById('cute-bot-wrapper');

  if (stageEl) stageEl.classList.add('stage-mode-overlord');
  if (crown) crown.classList.remove('hidden');
  if (cape) cape.classList.remove('hidden');
  if (wrapper) wrapper.classList.add('commander-pose');

  spawnBotFloatingEmojis('👑', 18);

  // Open Wide Legion Showcase Modal populated with 160 animated bots shouting "HAIL MATTSTER!"
  const overlay = document.getElementById('overlord-legion-overlay');
  const grid = document.getElementById('overlord-hundreds-grid');
  const shoutsContainer = document.getElementById('army-shout-bubbles');

  if (grid && grid.children.length === 0) {
    const botFaces = ['🤖', '👾', '🦾', '🦿', '🛡️', '⚡'];
    let cellsHtml = '';
    for (let i = 0; i < 168; i++) {
      const delay = ((i % 14) * 0.06 + Math.floor(i / 14) * 0.04).toFixed(2);
      const icon = i % 7 === 0 ? '🤖' : (i % 19 === 0 ? '👾' : '🤖');
      cellsHtml += `<div class="legion-bot-cell" style="animation-delay:${delay}s"><span>${icon}</span></div>`;
    }
    grid.innerHTML = cellsHtml;
  }

  if (shoutsContainer) {
    const cheers = [
      '🗣️ HAIL MATTSTER!!',
      '👑 HAIL MATTSTER!!',
      '⚡ ALL WORKTREES SALUTE MATTSTER!',
      '🔥 HAIL MATTSTER! RING-0 SECURED!',
      '🐝 1,000 SWARM BOTS: HAIL MATTSTER!!',
      '🚀 LONG LIVE THE BOT OVERLORD!',
      '🗣️ HAIL MATTSTER!!'
    ];
    shoutsContainer.innerHTML = cheers.map((txt, idx) => `
      <span class="legion-shout-pill" style="left:${6 + (idx * 13)}%; animation-delay:${(idx * 0.18).toFixed(2)}s;">
        ${txt}
      </span>
    `).join('');
  }

  if (overlay) {
    overlay.classList.remove('hidden');
  }
}

function spawnBotFloatingEmojis(emojiChar = '💖', count = 10) {
  const layer = document.getElementById('bot-particles-layer');
  if (!layer) return;
  const emojis = [emojiChar, '✨', '💖', '🌟', '🚀'];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'bot-float-emoji';
    el.textContent = emojis[i % emojis.length];
    el.style.left = `${15 + Math.random() * 70}%`;
    el.style.bottom = `${10 + Math.random() * 30}%`;
    el.style.animationDelay = `${Math.random() * 0.35}s`;
    layer.appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }
}

function setupCompanionBot() {
  const PATREON_COFFEE_COLLECTION_URL = 'https://www.patreon.com/c/Mattraio/collections';
  const PATREON_MEMBERSHIP_URL = 'https://www.patreon.com/c/Mattraio/membership';

  // Eye pupil tracking cursor
  document.addEventListener('mousemove', (e) => {
    const pupils = document.querySelectorAll('.bot-pupil');
    pupils.forEach(pupil => {
      const rect = pupil.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = Math.max(-5, Math.min(5, (e.clientX - cx) / 35));
      const dy = Math.max(-4, Math.min(4, (e.clientY - cy) / 35));
      pupil.style.transform = `translate(${dx}px, ${dy}px)`;
    });
  });

  // Close Overlord Legion Overlay handlers
  const closeOverlordBtn = document.getElementById('btn-close-overlord-overlay');
  const dismissLegionBtn = document.getElementById('btn-dismiss-legion');
  const overlordOverlay = document.getElementById('overlord-legion-overlay');
  const hideLegion = () => {
    if (overlordOverlay) overlordOverlay.classList.add('hidden');
  };
  if (closeOverlordBtn) closeOverlordBtn.addEventListener('click', hideLegion);
  if (dismissLegionBtn) dismissLegionBtn.addEventListener('click', hideLegion);
  if (overlordOverlay) {
    overlordOverlay.addEventListener('click', (e) => {
      if (e.target === overlordOverlay) hideLegion();
    });
  }

  // Clicking on the bot pets it
  const botWrapper = document.getElementById('cute-bot-wrapper');
  const petBtn = document.getElementById('btn-pet-bot');
  const petLines = [
    "Hehe, that tickles my eBPF sensors! Thanks for visiting Matt's lab! 💖",
    "Beep-boop! Grab the $5 One-Time Coffee Swarm Collection for IDE + Agent integration tips, or join the $15/mo Swarm Builder & $50/mo Bot Overlord memberships! 🐝",
    "You're awesome! Every coffee collection or monthly membership on Patreon helps Matt build more open-source security & AI labs! ☕✨",
    "High-five! 🙌 Unlock the $50/mo Bot Overlord membership to summon the 'Hail Mattster!' army!"
  ];
  let petIdx = 0;
  const triggerPet = () => {
    const msg = petLines[petIdx % petLines.length];
    petIdx++;
    setBotReaction('love', '🥰 PURR-COMPUTE!', msg, '💖');
  };
  if (botWrapper) botWrapper.addEventListener('click', triggerPet);
  if (petBtn) petBtn.addEventListener('click', triggerPet);

  // Track which reward animations have been unlocked by making a payment
  const unlockedTiers = {
    coffee: false,
    swarm: false,
    overlord: false
  };

  const unlockTiersForPayment = (paidAmount) => {
    if (paidAmount >= 5) {
      unlockedTiers.coffee = true;
      const btn = document.getElementById('reward-btn-coffee');
      if (btn) {
        btn.classList.remove('locked-tier');
        btn.classList.add('unlocked-tier');
        btn.innerHTML = '☕ $5 Coffee';
        btn.title = 'Unlocked! Click to replay Coffee Swarm Toast Animation';
      }
    }
    if (paidAmount >= 15) {
      unlockedTiers.swarm = true;
      const btn = document.getElementById('reward-btn-swarm');
      if (btn) {
        btn.classList.remove('locked-tier');
        btn.classList.add('unlocked-tier');
        btn.innerHTML = '🐝 $15 Swarm';
        btn.title = 'Unlocked! Click to replay Swarm Replication Animation';
      }
    }
    if (paidAmount >= 50) {
      unlockedTiers.overlord = true;
      const btn = document.getElementById('reward-btn-overlord');
      if (btn) {
        btn.classList.remove('locked-tier');
        btn.classList.add('unlocked-tier');
        btn.innerHTML = '👑 $50 Overlord';
        btn.title = 'Unlocked! Click to replay Hail Mattster Legion Animation!';
      }
    }
  };

  // Expression bar buttons (tier reward buttons are greyed out & locked until payment is made)
  const moodLines = {
    happy: "I'm happy and ready to explore! Click any GitHub repo card to hear what makes it special!",
    love: "Sending big neural hugs! Supporting Matt on Patreon keeps all 60+ open-source repos and workshops thriving! 💖",
    hype: "MAXIMUM OVERDRIVE! Bring on the Category 4 & Category 5 Multi-Agent Swarms! 🚀🐝",
    thinking: "Hmm... According to RaioLabs Forensic Rule #1, never debug Layer 7 until OSI Layers 1–4 are proven! 🧐",
    party: "WOOHOO! Dance party in the IDE cockpit! Thank you for fueling independent AI & security research! 🥳🎉"
  };
  document.querySelectorAll('.expr-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tierAnim = btn.getAttribute('data-tier-anim');
      if (tierAnim) {
        const reqAmt = btn.getAttribute('data-req') || '15';
        if (!unlockedTiers[tierAnim]) {
          // Still locked! Prompt the user to make the payment first
          const tierDesc = reqAmt === '5'
            ? 'the $5 One-Time Coffee Swarm (IDE + Agent Tips Collection)'
            : `the $${reqAmt}/mo ${reqAmt === '50' ? 'Bot Overlord' : 'Swarm Builder'} Membership`;
          setBotReaction(
            'thinking',
            `🔒 REWARD LOCKED ($${reqAmt}+ TIER)`,
            `That special animation is locked until you unlock ${tierDesc}! Select the $${reqAmt} option below and click the pink button first! 💖`,
            '🔒'
          );
          return;
        }
        if (tierAnim === 'coffee') return playCoffeeTierAnimation();
        if (tierAnim === 'swarm') return playSwarmBuilderAnimation();
        if (tierAnim === 'overlord') return playBotOverlordAnimation();
      }

      clearTierStageProps();
      const mood = btn.getAttribute('data-mood');
      if (mood) {
        setBotReaction(mood, '', moodLines[mood], mood === 'party' ? '🎉' : '✨');
      }
    });
  });

  // Patreon Tier selection sets the pledge amount (animation waits until payment button is clicked!)
  const customAmountInput = document.getElementById('patreon-custom-amount');
  const donateBtnAmount = document.getElementById('donate-btn-amount');
  const supporterMsgInput = document.getElementById('patreon-supporter-msg');

  const triggerAnimationForAmount = (numAmt) => {
    if (numAmt >= 50) {
      playBotOverlordAnimation();
    } else if (numAmt >= 15) {
      playSwarmBuilderAnimation();
    } else {
      playCoffeeTierAnimation();
    }
  };

  document.querySelectorAll('.tier-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.tier-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const amt = card.getAttribute('data-amount');
      const tierName = card.getAttribute('data-tier');
      const billing = card.getAttribute('data-billing');

      if (customAmountInput) customAmountInput.value = amt;
      if (donateBtnAmount) {
        donateBtnAmount.textContent = billing === 'one-time' ? `$${amt} (1-Time)` : `$${amt}/mo`;
      }

      clearTierStageProps();
      if (billing === 'one-time') {
        setBotReaction(
          'happy',
          `☕ $5 ONE-TIME COFFEE SWARM COLLECTION`,
          `You selected the $5 One-Time "Coffee Swarm" Collection! It includes curated tips to integrate your IDE with autonomous agents. Click the pink button below to unlock my Coffee Toast animation and open the Collection on Patreon! ✨`,
          '☕'
        );
      } else {
        setBotReaction(
          'happy',
          `💳 $${amt}/MO ${tierName.toUpperCase()} MEMBERSHIP`,
          `You selected the $${amt}/mo "${tierName}" monthly membership! Click the pink button below to unlock my special ${tierName} animation and join on patreon.com/c/Mattraio/membership! ✨`,
          '💖'
        );
      }
    });
  });

  if (customAmountInput) {
    customAmountInput.addEventListener('input', (e) => {
      const val = Math.max(1, parseInt(e.target.value, 10) || 5);
      if (donateBtnAmount) {
        donateBtnAmount.textContent = val < 15 ? `$${val} (1-Time)` : `$${val}/mo`;
      }
      document.querySelectorAll('.tier-card').forEach(c => {
        c.classList.toggle('active', c.getAttribute('data-amount') === String(val));
      });
    });
  }

  // Donate & Forward to Patreon button unlocks the greyed-out buttons, plays the tier animation, AND forwards to the right Patreon page!
  const donateBtn = document.getElementById('btn-patreon-donate');
  if (donateBtn) {
    donateBtn.addEventListener('click', () => {
      const amount = customAmountInput ? (customAmountInput.value || '15') : '15';
      const numAmt = parseInt(amount, 10) || 15;
      const note = supporterMsgInput ? supporterMsgInput.value.trim() : '';

      // 1. Unlock the corresponding greyed-out reward button(s)!
      unlockTiersForPayment(numAmt);

      // 2. Play the unlocked tier animation!
      triggerAnimationForAmount(numAmt);

      const speechText = document.getElementById('bot-speech-text');
      if (speechText && note) {
        speechText.textContent += ` (Supporter note: "${note}")`;
      }

      // 3. Route $5 Coffee Swarm to One-Time Collections, and $15/$50 tiers to Monthly Membership!
      const targetPatreonUrl = numAmt >= 15 ? PATREON_MEMBERSHIP_URL : PATREON_COFFEE_COLLECTION_URL;
      setTimeout(() => {
        window.open(targetPatreonUrl, '_blank', 'noopener,noreferrer');
      }, 1800);
    });
  }
}

// Write line numbers helper (no-op if code inspector replaced by companion)
function updateLineNumbers(codeText) {
  const lineNumbersDiv = document.getElementById('line-numbers');
  if(!lineNumbersDiv) return;
  const linesCount = codeText.split('\n').length;
  let nums = '';
  for (let i = 1; i <= linesCount; i++) {
    nums += `${i}\n`;
  }
  lineNumbersDiv.textContent = nums;
}

// Route all site events to RaioBot's expressive speech bubble & KEV-Bot's real-time stream!
function logToTerminal(type, tag, message) {
  let mood = 'happy';
  if (type === 'error' || tag.includes('ALERT') || tag.includes('DESTRUCTION') || tag.includes('HAMMER')) {
    mood = 'surprised';
  } else if (type === 'thought' || tag.includes('ARCHITECTURE') || tag.includes('NIST') || tag.includes('REPO')) {
    mood = 'thinking';
  } else if (type === 'action' || tag.includes('SWARM') || tag.includes('A2A') || tag.includes('MCP')) {
    mood = 'hype';
  } else if (tag.includes('PATREON') || tag.includes('SYNC')) {
    mood = 'love';
  }

  setBotReaction(mood, `🤖 ${tag}`, message, mood === 'hype' ? '⚡' : '');
  emitKevAnalysis(tag, message, null, null, type);
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Load workspace file list from server (gracefully skipped when hosted statically on GitHub Pages / raiolabs.com)
async function loadFiles() {
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return;
  }
  try {
    const res = await fetch(`${API_URL}/api/agent/files`);
    const data = await res.json();
    if(data.success) {
      state.files = data.files;
      renderActiveFile();
    }
  } catch (err) {
    // Running in static frontend-only mode (e.g., vite preview or static host)
  }
}

// Render active file content in tabs
function renderActiveFile() {
  const codeBody = document.getElementById('code-body');
  if(!codeBody) return;
  
  const content = state.files[state.activeTab] || '';
  codeBody.textContent = content;
  updateLineNumbers(content);
}

// Setup action event listeners
function setupEventListeners() {
  // Canvas Nav Tabs switching across all 5 views
  const allViewIds = ['projects-view', 'swarm-view', 'workshops-view', 'dashboard-view', 'stage-view'];
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-target');
      
      allViewIds.forEach(viewId => {
        const el = document.getElementById(viewId);
        if (el) {
          el.classList.toggle('hidden', viewId !== target);
        }
      });

      if (target === 'stage-view') {
        initializeStageElements();
      }
      logToTerminal('info', 'NAV_SWITCH', `Operator switched workspace view to [${target.replace('-view', '').toUpperCase()}]`);
    });
  });

  // Theatre Stage Tools
  const toolPointer = document.getElementById('tool-pointer');
  const toolDrill = document.getElementById('tool-drill');
  const toolHammer = document.getElementById('tool-hammer');
  const stageEl = document.getElementById('theatre-stage');

  const updateActiveTool = (toolName, activeBtn) => {
    state.stageActiveTool = toolName;
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active-tool'));
    activeBtn.classList.add('active-tool');
    
    // Update cursor style
    if(stageEl) {
      stageEl.className = 'theatre-stage active-stage';
      if(toolName !== 'pointer') {
        stageEl.classList.add(`cursor-${toolName}`);
      }
    }
    
    logToTerminal('info', 'TOOL_CHANGE', `Switched active stage tool to: ${toolName.toUpperCase()}`);
    recordInteraction({ type: 'stage_tool_select', tool: toolName });
  };

  if(toolPointer && toolDrill && toolHammer) {
    toolPointer.onclick = (e) => updateActiveTool('pointer', toolPointer);
    toolDrill.onclick = (e) => updateActiveTool('drill', toolDrill);
    toolHammer.onclick = (e) => updateActiveTool('hammer', toolHammer);
  }

  // Carousel controls
  const carouselPrev = document.getElementById('carousel-prev');
  const carouselNext = document.getElementById('carousel-next');
  const carouselEmoji = document.getElementById('carousel-item-emoji');
  const carouselName = document.getElementById('carousel-item-name');

  const updateCarouselDisplay = () => {
    const item = STAGE_PROPS[state.stageCurrentPropIndex];
    if(carouselEmoji && carouselName) {
      carouselEmoji.textContent = item.emoji;
      carouselName.textContent = item.name;
    }
  };

  if(carouselPrev && carouselNext) {
    carouselPrev.onclick = () => {
      state.stageCurrentPropIndex = (state.stageCurrentPropIndex - 1 + STAGE_PROPS.length) % STAGE_PROPS.length;
      updateCarouselDisplay();
      recordInteraction({ type: 'stage_carousel_rotate', index: state.stageCurrentPropIndex });
    };
    carouselNext.onclick = () => {
      state.stageCurrentPropIndex = (state.stageCurrentPropIndex + 1) % STAGE_PROPS.length;
      updateCarouselDisplay();
      recordInteraction({ type: 'stage_carousel_rotate', index: state.stageCurrentPropIndex });
    };
  }

  // Stage click handler for building
  if(stageEl) {
    stageEl.addEventListener('click', (e) => {
      // Check if they clicked directly on the stage background or floor
      if (e.target.id === 'theatre-stage' || e.target.id === 'stage-floor-target' || e.target.classList.contains('stage-stars') || e.target.id === 'placed-props-container') {
        handleStageFloorClick(e);
      }
    });
  }

  // Tabs switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeTab = btn.getAttribute('data-tab');
      renderActiveFile();
    });
  });

  // Aura Slider updates
  const auraSpeed = document.getElementById('aura-speed');
  const auraComp = document.getElementById('aura-complexity');
  
  if (auraSpeed && auraComp) {
    auraSpeed.addEventListener('input', (e) => {
      const val = e.target.value;
      document.getElementById('aura-vibe-lbl').textContent = `${val}%`;
      recordInteraction({ type: 'aura_change', key: 'speed', val });
      if(val % 15 === 0) {
        logToTerminal('info', 'AURA', `Modified workspace fluid velocity index to ${val}%`);
      }
    });

    auraComp.addEventListener('input', (e) => {
      const val = e.target.value;
      document.getElementById('density-lbl').textContent = `${val}%`;
      recordInteraction({ type: 'aura_change', key: 'density', val });
      if(val % 15 === 0) {
        logToTerminal('info', 'AURA', `Re-weighting aesthetic density multiplier to ${val}%`);
      }
    });
  }

  // Notebook Input Tracking
  const noteInput = document.getElementById('note-input');
  let noteTimeout = null;
  if(noteInput) {
    noteInput.addEventListener('input', (e) => {
      clearTimeout(noteTimeout);
      noteTimeout = setTimeout(() => {
        const text = e.target.value.trim();
        if(text) {
          recordInteraction({ type: 'notebook_write', length: text.length });
          logToTerminal('info', 'COGNITION', `User document updated. Running linguistic pattern match scan...`);
        }
      }, 1500);
    });
  }

  // Notebook Submit Button Event
  const submitNoteBtn = document.getElementById('btn-submit-note');
  if(submitNoteBtn && noteInput) {
    submitNoteBtn.addEventListener('click', () => {
      const text = noteInput.value.trim();
      if(!text) {
        logToTerminal('info', 'USER', 'Objective workspace is empty. Please enter instructions.');
        return;
      }
      logToTerminal('info', 'USER_PROMPT', `Submitting workspace instructions: "${text}"`);
      recordInteraction({ type: 'notepad_submit', prompt: text });
      triggerAgentSelfModification();
    });
  }

  // Rage Click detection
  const rageBtn = document.getElementById('rage-click-tester');
  if (rageBtn) {
    rageBtn.addEventListener('click', () => {
      const now = Date.now();
      state.rageClicks++;
      document.getElementById('stat-clicks').textContent = parseInt(document.getElementById('stat-clicks').textContent) + 1;
      
      // Update UI displays
      document.getElementById('rage-counter-lbl').textContent = state.rageClicks;
      const fillPercent = Math.min(state.rageClicks * 15, 100);
      document.getElementById('frustration-fill').style.width = `${fillPercent}%`;

      // Update stress status based on click count
      const stressValEl = document.getElementById('stat-stress');
      const statusOrb = document.getElementById('agent-status-orb');
      
      if(state.rageClicks > 6) {
        stressValEl.textContent = 'Critical 🚨';
        stressValEl.style.color = '#ef4444';
        statusOrb.className = 'status-orb alert';
        document.getElementById('agent-status-msg').textContent = 'Warning: Loop Friction Detected';
      } else if(state.rageClicks > 3) {
        stressValEl.textContent = 'Agitated ⚠️';
        stressValEl.style.color = '#f59e0b';
        statusOrb.className = 'status-orb alert';
      }

      // Check if click frequency triggers rage event
      clearTimeout(state.rageTimeout);
      state.rageTimeout = setTimeout(() => {
        if (state.rageClicks >= 6) {
          logToTerminal('error', 'ALERT', `High-frequency repetitive clicks detected on element #rage-click-tester.`);
          logToTerminal('thought', 'COGNITION', `Repetitive stress-pattern identified. Initiating hotfix diagnostic...`);
          
          recordInteraction({ type: 'rage_click', target: '#rage-click-tester', count: state.rageClicks });
          
          // Trigger file generation trigger for rage fix!
          triggerAgentSelfModification();
        }
        
        // Reset count
        state.rageClicks = 0;
        document.getElementById('rage-counter-lbl').textContent = 0;
        document.getElementById('frustration-fill').style.width = `0%`;
        
        // Return to normal or restore style slowly
        setTimeout(() => {
          if(!state.isGenerating) {
            stressValEl.textContent = 'Calm';
            stressValEl.style.color = '';
            statusOrb.className = 'status-orb observing';
            document.getElementById('agent-status-msg').textContent = 'Status: Observing Interaction...';
          }
        }, 3000);
      }, 1000);
    });
  }

  // Global document click counter
  document.addEventListener('click', (e) => {
    if(e.target.id === 'rage-click-tester' || e.target.closest('aside') || e.target.closest('#settings-modal')) return;
    document.getElementById('stat-clicks').textContent = parseInt(document.getElementById('stat-clicks').textContent) + 1;
    recordInteraction({ type: 'click', element: e.target.tagName + (e.target.id ? `#${e.target.id}` : '') });
  });

  // Settings panel toggles
  document.getElementById('btn-open-settings').onclick = () => {
    document.getElementById('settings-modal').classList.remove('hidden');
    // Load existing values into form
    document.getElementById('chk-use-gemini').checked = state.settings.useGemini;
    document.getElementById('txt-api-key').value = state.settings.apiKey;
    
    // Toggle api key row visibility
    document.getElementById('txt-api-key').closest('.form-group').style.display = 
      state.settings.useGemini ? 'block' : 'none';
  };

  document.getElementById('chk-use-gemini').onchange = (e) => {
    document.getElementById('txt-api-key').closest('.form-group').style.display = 
      e.target.checked ? 'block' : 'none';
  };

  document.getElementById('btn-close-settings').onclick = () => {
    document.getElementById('settings-modal').classList.add('hidden');
  };

  document.getElementById('btn-save-settings').onclick = () => {
    state.settings.useGemini = document.getElementById('chk-use-gemini').checked;
    state.settings.apiKey = document.getElementById('txt-api-key').value;
    
    localStorage.setItem('aether_gemini_key', state.settings.apiKey);
    
    // Update API Badge in panel header
    const badge = document.getElementById('api-badge');
    if(state.settings.useGemini && state.settings.apiKey) {
      badge.textContent = 'GEMINI LIVE API';
      badge.style.background = 'rgba(6, 182, 212, 0.15)';
      badge.style.color = '#06b6d4';
      badge.style.borderColor = 'rgba(6, 182, 212, 0.3)';
    } else {
      badge.textContent = 'SIMULATED MODE';
      badge.style.background = '';
      badge.style.color = '';
      badge.style.borderColor = '';
    }

    logToTerminal('system', 'SETTINGS', `Saved settings. API Connection Mode: ${state.settings.useGemini ? 'LIVE' : 'SIMULATED'}`);
    document.getElementById('settings-modal').classList.add('hidden');
  };

  // Chat/Send actions
  const sendChat = () => {
    const input = document.getElementById('agent-chat-input');
    const prompt = input.value.trim();
    if(!prompt || state.isGenerating) return;
    
    input.value = '';
    logToTerminal('info', 'USER_PROMPT', prompt);
    recordInteraction({ type: 'chat_instruction', prompt });
    
    triggerAgentSelfModification(prompt);
  };

  document.getElementById('agent-send-btn').onclick = sendChat;
  document.getElementById('agent-chat-input').onkeydown = (e) => {
    if(e.key === 'Enter') sendChat();
  };

  // Reset codebase event
  document.getElementById('btn-reset-codebase').onclick = async () => {
    if(confirm('Restore codebase files (index.html, src/main.js, src/style.css) back to original state?')) {
      try {
        logToTerminal('system', 'ROLLBACK', 'Sending rebuild/rollback code requests to server...');
        const res = await fetch(`${API_URL}/api/agent/reset`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          logToTerminal('system', 'ROLLBACK', 'System database rollback complete. Refreshing workspace...');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } catch (err) {
        logToTerminal('error', 'ROLLBACK_ERR', 'Reset request failed: ' + err.message);
      }
    }
  };
}

// Record interactive logs in memory
function recordInteraction(event) {
  state.interactions.push({
    ...event,
    time: Date.now()
  });
  // Cap interactions history to last 20 elements
  if(state.interactions.length > 20) {
    state.interactions.shift();
  }
}

// Trigger autonomous agent code generation and filesystem writes
async function triggerAgentSelfModification(customPrompt = '') {
  state.isGenerating = true;
  
  // Transition agent status panel visual signals
  const statusOrb = document.getElementById('agent-status-orb');
  const statusMsg = document.getElementById('agent-status-msg');
  
  statusOrb.className = 'status-orb working';
  statusMsg.textContent = 'Status: Processing neural synthesis...';
  logToTerminal('thought', 'SYNTHESIS', 'Analyzing environment variables, layout tree & interaction metrics...');

  // Get note content for prompt expansion if present
  const noteEl = document.getElementById('note-input');
  const notepadContext = noteEl ? noteEl.value.trim() : '';

  // Combine user notes + chat instructions
  let compiledPrompt = customPrompt;
  if(notepadContext && !customPrompt) {
    compiledPrompt = `Fulfill user notepad design goals: ${notepadContext}`;
  } else if(notepadContext && customPrompt) {
    compiledPrompt = `Prompt: "${customPrompt}". Note Context: "${notepadContext}"`;
  }

  // Load codebase files in local memory to send
  const requestBody = {
    prompt: compiledPrompt,
    interactions: state.interactions,
    files: state.files,
    customKey: state.settings.useGemini ? state.settings.apiKey : ''
  };

  try {
    const res = await fetch(`${API_URL}/api/agent/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await res.json();
    
    if (data.success) {
      // 1. Output thoughts & actions to terminal
      logToTerminal('thought', 'SYNTHESIS', data.thought || 'Determined layout enhancement necessary.');
      setTimeout(() => {
        logToTerminal('action', 'APPLYING', data.action || 'Modifying workspace files.');
      }, 1000);

      // 2. Perform live injection of new files/updates
      setTimeout(() => {
        // Iterate through modified files
        if (data.files && data.files.length > 0) {
          data.files.forEach(modFile => {
            // Update in local memory
            state.files[modFile.name] = modFile.content;
            
            // Apply visual changes instantly to live client DOM:
            if (modFile.name === 'src/style.css') {
              // Inject CSS stylesheet into page header dynamically
              let styleTag = document.getElementById('agent-injected-styles');
              if(!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = 'agent-injected-styles';
                document.head.appendChild(styleTag);
              }
              styleTag.textContent = modFile.content;
              logToTerminal('system', 'HOT_CSS', 'Injected style changes successfully to stylesheet DOM.');
            }
            
            if (modFile.name === 'src/main.js') {
              // Extract and parse dynamic scripts or HTML injections
              // For demonstration and robustness, we can extract injected HTML from AGENT_INJECTION_POINT comments
              const htmlMatch = modFile.content.match(/<!-- AGENT_INJECTION_POINT -->([\s\S]*?)<!-- AGENT_INJECTION_POINT -->/);
              if (htmlMatch && htmlMatch[1]) {
                const targetDeck = document.getElementById('widget-injected');
                if (targetDeck) {
                  targetDeck.innerHTML = `<h3>🔌 AI Live Extension Deck</h3><p>New components, games, and templates generated by the resident agent are injected directly below.</p>` + htmlMatch[1];
                  
                  // Flash the widget to signify modification
                  targetDeck.classList.add('pulse-element');
                  setTimeout(() => targetDeck.classList.remove('pulse-element'), 1500);
                }
              }
              
              // Run any script logic inside the file by dynamically matching and executing initialize scripts
              // Check if Tic-Tac-Toe is written
              if (modFile.content.includes('initializeTicTacToe') && typeof window.initializeTicTacToe === 'undefined') {
                (0, eval)(extractScriptContent(modFile.content, '/* Injected Tic-Tac-Toe Logic */'));
              }
              // Check if Todo checklist is written
              if (modFile.content.includes('initializeTodoApp') && typeof window.initializeTodoApp === 'undefined') {
                (0, eval)(extractScriptContent(modFile.content, '/* Injected Todo List Logic */'));
              }
              // Check if Rage diagnostic is written
              if (modFile.content.includes('dismissRageShield') && typeof window.dismissRageShield === 'undefined') {
                (0, eval)(extractScriptContent(modFile.content, '/* Injected Rage-Click Diagnostic Shield Handler */'));
              }
              // Check if Macbeth scene setup is written
              if (modFile.content.includes('triggerMacbethScene')) {
                (0, eval)(extractScriptContent(modFile.content, '/* Injected Macbeth Reenactment Setup */'));
              }

              // RAGE CLICK DIALOG INJECTION HOOK EXECUTOR:
              // If user rage clicked, run the diagnostic code instantly from the JS
              if(state.interactions.some(i => i.type === 'rage_click') && modFile.content.includes('rage-diagnostic-shield')) {
                // Trigger the alert shield popup
                (0, eval)(`
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
                  }
                `);
              }
              
              logToTerminal('system', 'HOT_JS', 'Dynamic JS modules bound and executed.');
            }
          });
          
          // Re-render active tab view
          renderActiveFile();
        }
        
        statusOrb.className = 'status-orb observing';
        statusMsg.textContent = 'Status: Observing Interaction...';
        state.isGenerating = false;
        
        // Clear notepad if request is complete
        if(noteEl && noteEl.value) {
          noteEl.value = '';
        }
      }, 2000);

    } else {
      throw new Error(data.error || 'Server rejected generation request.');
    }

  } catch (err) {
    console.error('Agent generation failed', err);
    logToTerminal('error', 'SYNTHESIS_ERR', 'Code compilation failed: ' + err.message);
    statusOrb.className = 'status-orb observing';
    statusMsg.textContent = 'Status: Observing Interaction...';
    state.isGenerating = false;
  }
}

// Helper to extract script blocks to execute
function extractScriptContent(fullJs, searchMarker) {
  const index = fullJs.indexOf(searchMarker);
  if(index === -1) return '';
  return fullJs.slice(index);
}

// --- Theatre Stage Scenery Sandbox Helpers ---
const STAGE_PROPS = [
  { emoji: '🌳', name: 'Cardboard Tree' },
  { emoji: '🏰', name: 'Miniature Castle' },
  { emoji: '☁️', name: 'Paper Cloud' },
  { emoji: '🐉', name: 'Cardboard Dragon' },
  { emoji: '🏠', name: 'Painted Cottage' },
  { emoji: '🛸', name: 'Space UFO' },
  { emoji: '🦖', name: 'Cardboard Dinosaur' },
  { emoji: '👾', name: 'Cardboard Alien' }
];

function initializeStageElements() {
  const container = document.getElementById('placed-props-container');
  if (!container) return;

  // Clear container
  container.innerHTML = '';

  // Load from local storage
  try {
    const saved = localStorage.getItem('aether_stage_props');
    if (saved) {
      state.stageProps = JSON.parse(saved);
    } else {
      // Default initial layout
      state.stageProps = [
        { id: 'prop-def-1', emoji: '🌳', name: 'Cardboard Tree', x: 25, y: 15, cracks: 0 },
        { id: 'prop-def-2', emoji: '🏰', name: 'Miniature Castle', x: 55, y: 20, cracks: 0 }
      ];
    }
  } catch (e) {
    state.stageProps = [];
  }

  // Render
  state.stageProps.forEach(prop => {
    renderPropOnStage(prop);
  });
}

function renderPropOnStage(prop) {
  const container = document.getElementById('placed-props-container');
  if(!container) return;

  const propEl = document.createElement('div');
  propEl.id = prop.id;
  propEl.className = 'placed-prop';
  if (prop.cracks > 0) {
    propEl.classList.add(`cracked-${prop.cracks}`);
  }
  
  propEl.style.left = `${prop.x}%`;
  propEl.style.bottom = `${60 + (prop.y || 0)}px`;

  propEl.innerHTML = `
    <div class="prop-cutout">${prop.emoji}</div>
    <div class="prop-stick"></div>
  `;

  propEl.addEventListener('click', (e) => {
    e.stopPropagation();
    handlePropClick(prop, propEl);
  });

  container.appendChild(propEl);
}

function handlePropClick(prop, propEl) {
  if (state.stageActiveTool === 'pointer') {
    propEl.classList.add('smashing');
    logToTerminal('info', 'USER', `You inspected the cardboard ${prop.name}.`);
    setTimeout(() => {
      propEl.classList.remove('smashing');
    }, 400);
  } else if (state.stageActiveTool === 'hammer') {
    strikeStageProp(prop, propEl);
  } else if (state.stageActiveTool === 'drill') {
    logToTerminal('info', 'USER', `Drill is active. Choose Hammer to break or Pointer to inspect.`);
  }
}

function strikeStageProp(prop, propEl) {
  prop.cracks = (prop.cracks || 0) + 1;
  state.stageBreakCount = (state.stageBreakCount || 0) + 1;
  
  propEl.classList.add('smashing');
  propEl.classList.remove('cracked-1', 'cracked-2');
  if (prop.cracks === 1) propEl.classList.add('cracked-1');
  if (prop.cracks === 2) propEl.classList.add('cracked-2');

  spawnDebrisParticles(propEl);

  const stage = document.getElementById('theatre-stage');
  if(stage) {
    stage.classList.add('rumble');
    setTimeout(() => stage.classList.remove('rumble'), 150);
  }

  logToTerminal('warn', 'HAMMER', `User struck cardboard "${prop.name}" with hammer. Damage: ${prop.cracks}/3.`);
  recordInteraction({ type: 'stage_strike', prop: prop.name, cracks: prop.cracks });

  evaluateStageBehavior('break');

  setTimeout(() => {
    propEl.classList.remove('smashing');
  }, 200);

  if (prop.cracks >= 3) {
    setTimeout(() => {
      propEl.style.transition = 'all 0.3s';
      propEl.style.opacity = '0';
      propEl.style.transform = 'scale(0.3) translateY(30px)';
      setTimeout(() => {
        propEl.remove();
        state.stageProps = state.stageProps.filter(p => p.id !== prop.id);
        localStorage.setItem('aether_stage_props', JSON.stringify(state.stageProps));
        logToTerminal('error', 'DESTRUCTION', `Cardboard "${prop.name}" completely broken and cleared from scene!`);
        recordInteraction({ type: 'stage_break', prop: prop.name });
      }, 300);
    }, 200);
  } else {
    localStorage.setItem('aether_stage_props', JSON.stringify(state.stageProps));
  }
}

function spawnDebrisParticles(parentEl) {
  const stage = document.getElementById('theatre-stage');
  if (!stage) return;

  const rect = parentEl.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();

  const originX = rect.left - stageRect.left + rect.width / 2;
  const originY = rect.top - stageRect.top + rect.height / 2;

  for (let i = 0; i < 8; i++) {
    const particle = document.createElement('div');
    particle.className = 'debris-particle';
    particle.style.left = `${originX}px`;
    particle.style.top = `${originY}px`;

    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 60;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance - 20;

    particle.style.setProperty('--debris-x', `${x}px`);
    particle.style.setProperty('--debris-y', `${y}px`);
    
    const colors = ['#b45309', '#d97706', '#92400e', '#f59e0b'];
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];

    stage.appendChild(particle);
    setTimeout(() => particle.remove(), 500);
  }
}

function handleStageFloorClick(e) {
  if (state.stageActiveTool !== 'drill') return;

  const stage = document.getElementById('theatre-stage');
  if(!stage) return;

  const rect = stage.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  const xPercentage = Math.min(Math.max(((clickX / rect.width) * 100), 8), 92);
  const yOffset = Math.min(Math.max((rect.height - 70 - clickY), 0), 40);

  const currentProp = STAGE_PROPS[state.stageCurrentPropIndex];
  const newProp = {
    id: `prop-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    emoji: currentProp.emoji,
    name: currentProp.name,
    x: xPercentage,
    y: yOffset,
    cracks: 0
  };

  state.stageProps.push(newProp);
  localStorage.setItem('aether_stage_props', JSON.stringify(state.stageProps));

  renderPropOnStage(newProp);
  state.stageBuildCount = (state.stageBuildCount || 0) + 1;

  logToTerminal('info', 'DRILL', `Assembled cardboard cutout "${newProp.name}" at coordinate X: ${xPercentage.toFixed(1)}%, Y: ${yOffset.toFixed(0)}px.`);
  recordInteraction({ type: 'stage_build', prop: newProp.name });

  evaluateStageBehavior('build');
}

function spawnSparkles(stage) {
  document.querySelectorAll('.ambient-sparkle').forEach(s => s.remove());
  for (let i = 0; i < 15; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'ambient-sparkle';
    sparkle.style.left = `${Math.random() * 95}%`;
    
    const duration = 2 + Math.random() * 3;
    const delay = Math.random() * 2;
    sparkle.style.animationDuration = `${duration}s`;
    sparkle.style.animationDelay = `${delay}s`;
    
    const drift = -30 + Math.random() * 60;
    sparkle.style.setProperty('--sparkle-drift', `${drift}px`);

    stage.appendChild(sparkle);
  }
}

function evaluateStageBehavior(actionType) {
  const stage = document.getElementById('theatre-stage');
  const statusOrb = document.getElementById('agent-status-orb');
  const statusMsg = document.getElementById('agent-status-msg');
  if (!stage || !statusOrb) return;

  statusOrb.className = 'status-orb working';
  statusMsg.textContent = 'Status: Evaluating Theatre Scene...';

  setTimeout(() => {
    if (actionType === 'build') {
      logToTerminal('thought', 'AGENT', 'Observation: The user is constructing scenery. A beautiful cutout assembly is emerging. I must encourage creative building! Activating Celestial Twilight atmosphere...');
      stage.classList.remove('destruction-vibe');
      stage.classList.add('creation-vibe');
      spawnSparkles(stage);
      logToTerminal('info', 'REACTION', 'Celestial sunset glow applied to theatre. Ambient sparkle streams initialized.');
    } else if (actionType === 'break') {
      logToTerminal('thought', 'AGENT', 'Observation: Severe kinetic impact recorded. The cardboard prop is fractured. Deconstruction is a valid form of layout iteration. Let\'s encourage deconstruction! Activating Hazard Red strobe and impact rumbles.');
      stage.classList.remove('creation-vibe');
      stage.classList.add('destruction-vibe');
      logToTerminal('error', 'REACTION', 'Hazard alert overlay active. Deconstruction impact modifier configured.');
    }

    setTimeout(() => {
      statusOrb.className = 'status-orb observing';
      statusMsg.textContent = 'Status: Observing Interaction...';
    }, 1500);
  }, 1000);
}

// --- RaioLabs Projects, Swarm Cockpit & Workshops Logic ---

function renderProjectsGrid() {
  const container = document.getElementById('projects-grid-container');
  if (!container) return;

  const query = (state.projectSearch || '').toLowerCase();
  const filtered = FEATURED_PROJECTS.filter(proj => {
    const matchesCat = state.projectCategory === 'All' || proj.category === state.projectCategory;
    const matchesQuery = !query ||
      proj.title.toLowerCase().includes(query) ||
      proj.name.toLowerCase().includes(query) ||
      proj.summary.toLowerCase().includes(query) ||
      proj.language.toLowerCase().includes(query) ||
      proj.highlights.some(h => h.toLowerCase().includes(query));
    return matchesCat && matchesQuery;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="card-widget" style="grid-column: 1 / -1; text-align: center; padding: 2.5rem;">
        <h3>🔍 No matching repositories found</h3>
        <p style="margin-bottom: 0;">Try clearing your search filter or click "Live Sync @mattreya GitHub API" to browse all 60+ public repositories.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(proj => `
    <article class="card-widget project-card" data-proj-id="${proj.id}">
      <div class="project-card-top">
        <span class="project-badge">${proj.badge}</span>
        <span class="project-lang">${proj.language}</span>
      </div>
      <h3 class="project-title">${proj.title}</h3>
      <div class="project-repo-slug">🐙 <code>mattreya/${proj.name}</code></div>
      <p class="project-summary">${proj.summary}</p>
      <ul class="project-highlights">
        ${proj.highlights.map(item => `<li>${item}</li>`).join('')}
      </ul>
      <div class="project-cmd-box" title="Click to log CLI command to Agent Terminal" data-cmd="${escapeHtml(proj.command)}" data-name="${escapeHtml(proj.title)}">
        <span class="cmd-prompt">$</span>
        <code>${escapeHtml(proj.command)}</code>
      </div>
      <div class="project-card-footer">
        <a href="${proj.url}" target="_blank" rel="noopener noreferrer" class="project-link-btn">
          View on GitHub ↗
        </a>
        <button class="project-inspect-btn" data-proj-id="${proj.id}">
          🤖 Ask RaioBot
        </button>
      </div>
    </article>
  `).join('');

  // Bind RaioBot inspect clicks
  container.querySelectorAll('.project-inspect-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const proj = FEATURED_PROJECTS.find(p => p.id === btn.getAttribute('data-proj-id'));
      if (!proj) return;
      setBotReaction(
        'hype',
        `🐙 ${proj.badge} • ${proj.language.toUpperCase()}`,
        `Ooh, I love "${proj.title}"! ${proj.summary} Try running: $ ${proj.command} — or support more repos like this on Patreon below! 💖`,
        '🚀'
      );
      recordInteraction({ type: 'repo_inspect', repo: proj.name });
    });
  });

  container.querySelectorAll('.project-cmd-box').forEach(box => {
    box.addEventListener('click', () => {
      const cmd = box.getAttribute('data-cmd');
      const name = box.getAttribute('data-name');
      setBotReaction('happy', '📋 CLI COPIED!', `Copied command for ${name}: "$ ${cmd}" to your clipboard! Ready for the terminal! ✨`, '⚡');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(cmd).catch(() => {});
      }
    });
  });
}

function renderHurricaneDetail(index) {
  const detailBox = document.getElementById('hurricane-detail-card');
  if (!detailBox) return;

  const cat = HURRICANE_BOT_CATEGORIES[index] || HURRICANE_BOT_CATEGORIES[3];
  detailBox.style.setProperty('--active-cat-color', cat.color);
  detailBox.innerHTML = `
    <div class="hurricane-detail-header">
      <div>
        <span class="hurricane-pill" style="background:${cat.color}22; color:${cat.color}; border:1px solid ${cat.color}66;">
          ${cat.category} • ${cat.windSpeed}
        </span>
        <h4 style="font-size:1.25rem; margin-top:8px; color:var(--text-primary);">
          ${cat.name} <span style="color:var(--text-secondary); font-weight:400; font-size:0.95rem;">— ${cat.role}</span>
        </h4>
      </div>
      <button class="btn-secondary" id="btn-simulate-cat-bot" data-cat="${cat.category}" data-name="${cat.name}">
        🤖 Test ${cat.category} Telemetry
      </button>
    </div>
    <p style="font-size:0.95rem; color:var(--text-primary); margin: 12px 0;">
      ${cat.description}
    </p>
    <div class="hurricane-meta-grid">
      <div class="hurricane-meta-item">
        <span class="meta-label">🛡️ NIST SP 800-53 / CISA Overlay Controls</span>
        <span class="meta-value"><code>${cat.nistControls}</code></span>
      </div>
      <div class="hurricane-meta-item">
        <span class="meta-label">🔬 Real-World RaioLabs Deployment</span>
        <span class="meta-value">${cat.example}</span>
      </div>
    </div>
  `;

  const simBtn = document.getElementById('btn-simulate-cat-bot');
  if (simBtn) {
    simBtn.onclick = () => {
      logToTerminal('system', cat.category, `Simulating ${cat.name} (${cat.role}) under NIST SP 800-53 overlay...`);
      logToTerminal('info', 'NIST_OVERLAY', `Enforcing controls: ${cat.nistControls}`);
      logToTerminal('thought', 'WORKSHOP_LAB', `Use Case: ${cat.example}`);
      recordInteraction({ type: 'hurricane_cat_test', category: cat.category });
    };
  }
}

function renderWorkshopsCurriculum() {
  const container = document.getElementById('workshops-curriculum-container');
  if (!container) return;

  container.innerHTML = WORKSHOP_TRACKS.map(track => `
    <article class="card-widget workshop-track-card">
      <div class="workshop-header">
        <span class="project-badge">${track.badge}</span>
        <span class="project-lang">⏱️ ${track.hours}</span>
      </div>
      <h3 style="font-size:1.25rem; margin-bottom:4px;">${track.title}</h3>
      <p style="color:var(--accent); font-weight:500; font-size:0.88rem; margin-bottom:10px;">
        ${track.subtitle}
      </p>
      <div class="workshop-philosophy">
        <strong>Core Philosophy:</strong> ${track.philosophy}
      </div>
      <div class="workshop-modules-list">
        ${track.modules.map(mod => `
          <div class="workshop-module-item">
            <div class="module-top-row">
              <span class="module-ch-tag">${mod.chapter}</span>
              <strong>${mod.title}</strong>
            </div>
            <p class="module-topics">${mod.topics}</p>
            <div class="module-lab-pill">🧪 ${mod.lab}</div>
          </div>
        `).join('')}
      </div>
    </article>
  `).join('');
}

function setupRaioLabsListeners() {
  // Category filter pills
  document.querySelectorAll('#project-category-pills .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#project-category-pills .pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.projectCategory = btn.getAttribute('data-cat');
      renderProjectsGrid();
      logToTerminal('info', 'FILTER', `Filtered GitHub Showcase by category: ${state.projectCategory}`);
    });
  });

  // Search box
  const searchInput = document.getElementById('project-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.projectSearch = e.target.value;
      renderProjectsGrid();
    });
  }

  // Live GitHub API Sync button
  const syncBtn = document.getElementById('btn-sync-github');
  if (syncBtn) {
    syncBtn.addEventListener('click', fetchLiveGithubRepos);
  }

  // Hurricane Category Tabs
  document.querySelectorAll('#hurricane-selector .hurricane-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#hurricane-selector .hurricane-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const idx = parseInt(tab.getAttribute('data-idx'), 10);
      state.activeHurricaneCat = idx;
      renderHurricaneDetail(idx);
    });
  });

  // Swarm Scenario Selector & Runner
  const scenarioSelect = document.getElementById('swarm-scenario-select');
  const scenarioDesc = document.getElementById('swarm-scenario-desc');
  if (scenarioSelect && scenarioDesc) {
    scenarioSelect.addEventListener('change', (e) => {
      const key = e.target.value;
      state.activeSwarmScenario = key;
      const sc = SWARM_SCENARIOS[key];
      if (sc) {
        scenarioDesc.textContent = sc.description;
        logToTerminal('info', 'SWARM_SELECT', `Selected IDE Swarm Scenario: ${sc.name}`);
      }
    });
  }

  const runSwarmBtn = document.getElementById('btn-run-swarm');
  if (runSwarmBtn) {
    runSwarmBtn.addEventListener('click', () => {
      runSwarmSimulation(state.activeSwarmScenario);
    });
  }

  const companionRunSwarmBtn = document.getElementById('btn-companion-run-swarm');
  if (companionRunSwarmBtn) {
    companionRunSwarmBtn.addEventListener('click', () => {
      runSwarmSimulation(state.activeSwarmScenario);
    });
  }

  // Clicking any Swarm Bot chip in the Companion Roster or any node in the Swarm Topology pops up that bot next to RaioBot!
  const triggerBotInspectOnStage = (botKey) => {
    const scenario = SWARM_SCENARIOS[state.activeSwarmScenario] || SWARM_SCENARIOS.spvs_audit;
    const matchingStepIdx = scenario.steps.findIndex(s => s.to === botKey || s.from === botKey);
    if (matchingStepIdx !== -1) {
      const step = scenario.steps[matchingStepIdx];
      showCompanionSwarmInteraction(step, matchingStepIdx + 1, scenario.steps.length, scenario.name);
      return;
    }
    const persona = SWARM_BOT_PERSONAS[botKey] || SWARM_BOT_PERSONAS.coder;
    showCompanionSwarmInteraction({
      from: 'orchestrator',
      to: persona.key,
      protocol: persona.sampleProtocol,
      badge: persona.port,
      logType: 'info',
      logTag: persona.key.toUpperCase(),
      senderLine: persona.sampleSenderLine,
      message: persona.sampleReceiverLine,
      payload: persona.samplePayload
    }, 1, 1, 'IDE Swarm Bot Inspector');
  };

  document.querySelectorAll('.swarm-bot-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const botKey = chip.getAttribute('data-swarm-bot');
      if (botKey) triggerBotInspectOnStage(botKey);
    });
  });

  ['orchestrator', 'coder', 'auditor', 'ebpf', 'hippocampus'].forEach(botKey => {
    const nodeEl = document.getElementById(`node-${botKey}`);
    if (nodeEl) {
      nodeEl.style.cursor = 'pointer';
      nodeEl.addEventListener('click', () => triggerBotInspectOnStage(botKey));
    }
  });
}

function runSwarmSimulation(scenarioKey) {
  const scenario = SWARM_SCENARIOS[scenarioKey] || SWARM_SCENARIOS.spvs_audit;

  // Clear any active timers
  state.swarmTimers.forEach(t => clearTimeout(t));
  state.swarmTimers = [];

  const payloadBox = document.getElementById('swarm-payload-box');
  const memoryBox = document.getElementById('swarm-memory-box');
  const badgeEl = document.getElementById('swarm-step-badge');
  const statusOrb = document.getElementById('agent-status-orb');
  const statusMsg = document.getElementById('agent-status-msg');
  const runBtn = document.getElementById('btn-run-swarm');
  const companionRunBtn = document.getElementById('btn-companion-run-swarm');

  if (runBtn) {
    runBtn.textContent = '⚡ Swarm Executing...';
    runBtn.disabled = true;
  }
  if (companionRunBtn) {
    companionRunBtn.textContent = '⚡ Swarm Running...';
    companionRunBtn.disabled = true;
  }
  if (statusOrb) statusOrb.className = 'status-orb working';
  if (statusMsg) statusMsg.textContent = `Swarm Active: ${scenario.name}`;

  logToTerminal('system', 'SWARM_START', `Launching IDE Swarm Simulation: "${scenario.name}"`);
  recordInteraction({ type: 'swarm_simulation', scenario: scenarioKey });

  const allNodes = ['orchestrator', 'coder', 'auditor', 'ebpf', 'hippocampus'];
  const highlightNodes = (fromId, toId) => {
    allNodes.forEach(id => {
      const el = document.getElementById(`node-${id}`);
      if (el) {
        el.classList.remove('active-sender', 'active-receiver');
      }
    });
    const fromEl = document.getElementById(`node-${fromId}`);
    const toEl = document.getElementById(`node-${toId}`);
    if (fromEl) fromEl.classList.add('active-sender');
    if (toEl) toEl.classList.add('active-receiver');
  };

  scenario.steps.forEach((step, idx) => {
    const timer = setTimeout(() => {
      highlightNodes(step.from, step.to);
      if (badgeEl) {
        badgeEl.textContent = `STEP ${idx + 1}/${scenario.steps.length} • ${step.badge}`;
      }
      if (step.payload && payloadBox) {
        payloadBox.textContent = `// [${step.protocol}] ${step.from.toUpperCase()} ➔ ${step.to.toUpperCase()}\n` + step.payload;
      }
      if (step.memoryPatch && memoryBox) {
        memoryBox.textContent = step.memoryPatch;
      }

      // Pop up the corresponding Swarm Bot next to RaioBot on the Companion Stage & show live two-bot dialog + actual telemetry payload!
      showCompanionSwarmInteraction(step, idx + 1, scenario.steps.length, scenario.name);

      logToTerminal(step.logType, step.logTag, step.message);

      if (idx === scenario.steps.length - 1) {
        setTimeout(() => {
          if (runBtn) {
            runBtn.textContent = '▶ Re-Run Swarm Scenario';
            runBtn.disabled = false;
          }
          if (companionRunBtn) {
            companionRunBtn.textContent = '▶ Re-Run Swarm Scenario';
            companionRunBtn.disabled = false;
          }
          if (statusOrb) statusOrb.className = 'status-orb observing';
          if (statusMsg) statusMsg.textContent = 'Status: Swarm Cycle Complete • Observing...';
        }, 900);
      }
    }, step.delay);
    state.swarmTimers.push(timer);
  });
}

async function fetchLiveGithubRepos() {
  const liveSection = document.getElementById('live-github-section');
  const liveContainer = document.getElementById('live-repos-container');
  const countBadge = document.getElementById('live-github-count');
  const syncBtn = document.getElementById('btn-sync-github');

  if (!liveSection || !liveContainer) return;
  liveSection.classList.remove('hidden');
  if (syncBtn) syncBtn.textContent = '⏳ Syncing @mattreya...';
  logToTerminal('info', 'GITHUB_API', 'Fetching public repositories from https://api.github.com/users/mattreya/repos...');

  try {
    const res = await fetch('https://api.github.com/users/mattreya/repos?per_page=36&sort=updated');
    if (!res.ok) throw new Error(`GitHub API HTTP ${res.status}`);
    const repos = await res.json();
    state.liveGithubRepos = repos;

    if (countBadge) countBadge.textContent = `${repos.length} Recent Public Repos`;
    if (syncBtn) syncBtn.textContent = '✅ Synced @mattreya Live';
    logToTerminal('system', 'GITHUB_SYNC', `Retrieved ${repos.length} live repositories from github.com/mattreya.`);

    liveContainer.innerHTML = repos.map(r => `
      <a href="${r.html_url}" target="_blank" rel="noopener noreferrer" class="live-repo-card">
        <div class="live-repo-top">
          <strong>${escapeHtml(r.name)}</strong>
          <span class="live-repo-lang">${escapeHtml(r.language || 'Multi-Stack')}</span>
        </div>
        <p>${escapeHtml(r.description || 'RaioLabs R&D repository and technical lab.')}</p>
        <div class="live-repo-meta">
          <span>⭐ ${r.stargazers_count || 0}</span>
          <span>Updated ${new Date(r.updated_at).toLocaleDateString()}</span>
        </div>
      </a>
    `).join('');
  } catch (err) {
    logToTerminal('error', 'GITHUB_ERR', `Live GitHub fetch failed: ${err.message}`);
    if (syncBtn) syncBtn.textContent = '🔄 Retry Live Sync';
    liveContainer.innerHTML = `<div style="color:var(--text-secondary); font-size:0.85rem;">Unable to reach GitHub API right now (${escapeHtml(err.message)}). Curated repositories above remain available.</div>`;
  }
}

// ============================================================================
// 🚨 KEV-BOT: REAL-TIME USER BEHAVIOR & TELEMETRY ANALYST ENGINE
// ============================================================================
const kevState = {
  paused: false,
  cursorVelocity: 0,
  peakVelocity: 0,
  activeZone: 'GitHub Showcase',
  intentProfile: 'Reconnaissance',
  lastX: 0,
  lastY: 0,
  lastMoveTs: Date.now(),
  hoveredTarget: '',
  scrollDepthPct: 0,
  eventsLogged: 0
};

function emitKevAnalysis(tag, message, zoneOverride = null, profileOverride = null, level = 'info') {
  if (kevState.paused) return;

  const streamBox = document.getElementById('kev-stream-box');
  const verdictEl = document.getElementById('kev-current-verdict');
  const zoneEl = document.getElementById('kev-stat-zone');
  const profileEl = document.getElementById('kev-stat-profile');
  const avatarEl = document.getElementById('kev-bot-avatar');

  if (zoneOverride) {
    kevState.activeZone = zoneOverride;
    if (zoneEl) zoneEl.textContent = zoneOverride;
  }
  if (profileOverride) {
    kevState.intentProfile = profileOverride;
    if (profileEl) profileEl.textContent = profileOverride;
  }
  if (verdictEl) {
    verdictEl.textContent = message;
  }

  if (avatarEl) {
    avatarEl.classList.remove('kev-ping');
    void avatarEl.offsetWidth;
    avatarEl.classList.add('kev-ping');
  }

  if (!streamBox) return;

  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  kevState.eventsLogged++;

  const row = document.createElement('div');
  row.className = `kev-log-item kev-level-${level}`;
  row.innerHTML = `
    <span class="kev-time">[${timeStr}]</span>
    <span class="kev-tag">${escapeHtml(tag)}</span>
    <span class="kev-msg">${escapeHtml(message)}</span>
  `;
  streamBox.prepend(row);

  // Keep feed snappy (max 35 live entries)
  while (streamBox.children.length > 35) {
    streamBox.removeChild(streamBox.lastChild);
  }
}

function setupKevBotAnalyst() {
  const pauseBtn = document.getElementById('btn-kev-pause');
  const livePill = document.getElementById('kev-live-pill');
  const stageSyncBtn = document.getElementById('btn-kev-stage-sync');
  const velEl = document.getElementById('kev-stat-vel');

  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      kevState.paused = !kevState.paused;
      pauseBtn.textContent = kevState.paused ? '▶' : '⏸';
      if (livePill) {
        livePill.textContent = kevState.paused ? '⏸ PAUSED' : '● REAL-TIME';
        livePill.classList.toggle('paused', kevState.paused);
      }
    });
  }

  // Pop KEV-Bot onto the Main Companion Stage with a live JSON behavioral dump!
  const triggerKevStageBriefing = () => {
    const clicksCount = document.getElementById('stat-clicks')?.textContent || '0';
    const uptimeVal = document.getElementById('stat-uptime')?.textContent || '0s';
    const livePayload = JSON.stringify({
      analyst: 'KEV-Bot v2.6 (Real-Time Behavioral Sensor)',
      sessionUptime: uptimeVal,
      cursorVelocityPxPerSec: kevState.cursorVelocity,
      peakVelocityPxPerSec: kevState.peakVelocity,
      activeWorkspaceZone: kevState.activeZone,
      classifiedIntentProfile: kevState.intentProfile,
      lastInspectedTarget: kevState.hoveredTarget || 'Main Canvas',
      totalOperatorClicks: parseInt(clicksCount, 10) || 0,
      viewportScrollDepth: `${kevState.scrollDepthPct}%`,
      telemetryVerdict: 'ACTIVE_OPERATOR_ENGAGEMENT'
    }, null, 2);

    showCompanionSwarmInteraction({
      from: 'orchestrator',
      to: 'kev',
      protocol: 'KEV_LIVE_TELEMETRY',
      badge: 'REAL-TIME ANALYST',
      logType: 'thought',
      logTag: 'KEV_BOT',
      senderLine: '🎛️ RaioBot (Orchestrator): "KEV-Bot, pop up and brief our visitor on what your real-time behavioral sensors are seeing right now!"',
      message: `Operator is active in [${kevState.activeZone}] (${kevState.intentProfile}). Peak cursor velocity: ${kevState.peakVelocity} px/s • Clicks: ${clicksCount} • Last target: ${kevState.hoveredTarget || 'Workspace'}.`,
      payload: livePayload
    }, 1, 1, 'KEV-Bot Real-Time User Analysis');
  };

  if (stageSyncBtn) {
    stageSyncBtn.addEventListener('click', triggerKevStageBriefing);
  }
  const kevAvatar = document.getElementById('kev-bot-avatar');
  if (kevAvatar) {
    kevAvatar.style.cursor = 'pointer';
    kevAvatar.addEventListener('click', triggerKevStageBriefing);
  }

  // 1. Real-Time Mouse Kinematics & Velocity Sensor
  let lastVelReportTs = 0;
  document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    const dt = Math.max(16, now - kevState.lastMoveTs);
    const dist = Math.hypot(e.clientX - kevState.lastX, e.clientY - kevState.lastY);
    const vel = Math.round((dist / dt) * 1000);

    kevState.cursorVelocity = vel;
    if (vel > kevState.peakVelocity) kevState.peakVelocity = vel;
    kevState.lastX = e.clientX;
    kevState.lastY = e.clientY;
    kevState.lastMoveTs = now;

    if (velEl && !kevState.paused) {
      velEl.textContent = `${vel} px/s`;
    }

    // Report high-velocity cursor sweeps (throttled every 3.2s)
    if (vel > 1650 && now - lastVelReportTs > 3200) {
      lastVelReportTs = now;
      emitKevAnalysis(
        'CURSOR_KINEMATICS',
        `High-velocity cursor sweep (${vel} px/s) at (${e.clientX}, ${e.clientY}) ➔ Rapid UI reconnaissance across ${kevState.activeZone}.`,
        null,
        'Rapid Recon Sweep',
        'action'
      );
    }
  });

  // Decay displayed velocity to 0 when mouse stops moving
  setInterval(() => {
    if (Date.now() - kevState.lastMoveTs > 250 && kevState.cursorVelocity !== 0) {
      kevState.cursorVelocity = 0;
      if (velEl && !kevState.paused) velEl.textContent = '0 px/s';
    }
  }, 300);

  // 2. Real-Time Hover / Dwell Target Forensics (420ms dwell threshold)
  let dwellTimer = null;
  let lastDwellKey = '';
  document.addEventListener('mouseover', (e) => {
    const target = e.target;
    if (!target || target.closest('#kev-bot-panel')) return;

    const projCard = target.closest('.project-card');
    const swarmNode = target.closest('.swarm-node');
    const hurricaneTab = target.closest('.hurricane-tab');
    const tierCard = target.closest('.tier-card');
    const navTab = target.closest('.nav-tab');
    const workshopCard = target.closest('.workshop-track-card');

    clearTimeout(dwellTimer);
    dwellTimer = setTimeout(() => {
      if (projCard) {
        const title = projCard.querySelector('.project-title')?.textContent || 'GitHub Repo';
        const badge = projCard.querySelector('.project-badge')?.textContent || 'R&D';
        const key = `proj:${title}`;
        if (key === lastDwellKey) return;
        lastDwellKey = key;
        kevState.hoveredTarget = title;
        emitKevAnalysis(
          'DWELL_REPO',
          `Operator dwelling on "${title}" [${badge}] ➔ Evaluating repository architecture & CLI deployment.`,
          'GitHub Showcase',
          'Codebase Evaluator',
          'thought'
        );
      } else if (swarmNode) {
        const nodeName = swarmNode.querySelector('h4')?.textContent || swarmNode.id;
        const port = swarmNode.querySelector('.swarm-node-port')?.textContent || 'A2A';
        const key = `node:${nodeName}`;
        if (key === lastDwellKey) return;
        lastDwellKey = key;
        kevState.hoveredTarget = nodeName;
        emitKevAnalysis(
          'SWARM_NODE_HOVER',
          `Inspecting Swarm Node [${nodeName}] (${port}) ➔ Analyzing multi-agent protocol topology.`,
          'IDE Swarm Cockpit',
          'Swarm Architect',
          'info'
        );
      } else if (hurricaneTab) {
        const catName = hurricaneTab.textContent.trim().replace(/\s+/g, ' ');
        const key = `cat:${catName}`;
        if (key === lastDwellKey) return;
        lastDwellKey = key;
        kevState.hoveredTarget = catName;
        emitKevAnalysis(
          'NIST_CAT_SCAN',
          `Hovering Hurricane Scale [${catName}] ➔ Reviewing NIST SP 800-53 autonomy blast radius.`,
          'Agentic Workshops',
          'SecOps Governance',
          'thought'
        );
      } else if (tierCard) {
        const tierName = tierCard.getAttribute('data-tier') || 'Support Tier';
        const amt = tierCard.getAttribute('data-amount') || '';
        const key = `tier:${tierName}`;
        if (key === lastDwellKey) return;
        lastDwellKey = key;
        kevState.hoveredTarget = `$${amt} ${tierName}`;
        emitKevAnalysis(
          'PATREON_HOVER',
          `Evaluating Patreon "$${amt} ${tierName}" card ➔ High-affinity supporter signal detected!`,
          'Patreon Support',
          'Prospective Patron 💖',
          'action'
        );
      } else if (navTab) {
        const tabLabel = navTab.textContent.trim();
        const key = `nav:${tabLabel}`;
        if (key === lastDwellKey) return;
        lastDwellKey = key;
        kevState.hoveredTarget = tabLabel;
        emitKevAnalysis(
          'NAV_VECTOR',
          `Cursor poised over navigation tab [${tabLabel}] ➔ Preparing workspace context switch.`,
          tabLabel,
          'Active Navigator',
          'info'
        );
      } else if (workshopCard) {
        const wTitle = workshopCard.querySelector('h3')?.textContent || 'Workshop Track';
        const key = `wk:${wTitle}`;
        if (key === lastDwellKey) return;
        lastDwellKey = key;
        kevState.hoveredTarget = wTitle;
        emitKevAnalysis(
          'CURRICULUM_SCAN',
          `Reading curriculum for "${wTitle}" ➔ Assessing hands-on agentic lab modules.`,
          'Agentic Workshops',
          'Workshop Learner',
          'thought'
        );
      }
    }, 420);
  });

  // 3. Real-Time Click Forensics
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!t || t.closest('#kev-bot-panel')) return;

    const btn = t.closest('button, a, .project-cmd-box, .swarm-node');
    const label = (btn ? btn.textContent : t.textContent || t.tagName || 'Element')
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 48);

    kevState.hoveredTarget = label || t.tagName;
    emitKevAnalysis(
      'CLICK_FORENSICS',
      `Click at (${e.clientX}, ${e.clientY}) on [${label || t.tagName}] ➔ Executing interactive DOM command.`,
      null,
      'Interactive Operator',
      'action'
    );
  });

  // 4. Real-Time Scroll Vector & Viewport Depth
  const canvasArea = document.querySelector('.canvas-area');
  let lastScrollReportTs = 0;
  let lastScrollTop = 0;
  const handleScroll = (scrollTop, maxScroll) => {
    const now = Date.now();
    const pct = maxScroll > 0 ? Math.min(100, Math.round((scrollTop / maxScroll) * 100)) : 0;
    kevState.scrollDepthPct = pct;
    if (now - lastScrollReportTs < 1400) return;
    const dir = scrollTop >= lastScrollTop ? '⬇️ DOWN' : '⬆️ UP';
    lastScrollTop = scrollTop;
    lastScrollReportTs = now;
    emitKevAnalysis(
      'SCROLL_VECTOR',
      `Viewport scrolling ${dir} (${pct}% depth) in [${kevState.activeZone}] ➔ Scanning technical documentation.`,
      null,
      pct > 65 ? 'Deep-Dive Reader' : 'Content Scanner',
      'info'
    );
  };

  if (canvasArea) {
    canvasArea.addEventListener('scroll', () => {
      handleScroll(canvasArea.scrollTop, canvasArea.scrollHeight - canvasArea.clientHeight);
    }, { passive: true });
  }
  window.addEventListener('scroll', () => {
    handleScroll(window.scrollY, document.documentElement.scrollHeight - window.innerHeight);
  }, { passive: true });

  // 5. Real-Time Keystroke Cadence
  let lastKeyReportTs = 0;
  document.addEventListener('input', (e) => {
    const now = Date.now();
    if (now - lastKeyReportTs < 1000) return;
    lastKeyReportTs = now;
    const el = e.target;
    const inputName = el.placeholder || el.id || 'input field';
    const valLen = (el.value || '').length;
    emitKevAnalysis(
      'KEYSTROKE_CADENCE',
      `Operator typing in "${inputName.slice(0, 32)}..." (${valLen} chars buffered) ➔ Live query synthesis.`,
      null,
      'Query Synthesizer',
      'thought'
    );
  });
}

// RAGE_CLICK_INJECTION_HOOK

