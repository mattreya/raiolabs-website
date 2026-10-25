import './style.css';
import {
  FEATURED_PROJECTS,
  HURRICANE_BOT_CATEGORIES,
  WORKSHOP_TRACKS,
  SWARM_SCENARIOS,
  RECENT_APPEARANCES,
  CYBER_OWASP_EVENTS,
  WNIT_SHARED_FOLDER_URL,
  WNIT_MEDIA_ITEMS
} from './raiolabsData.js';
import {
  BOT_PUPPET_DEFS,
  SAMPLE_SCRIPTS,
  parseScriptText,
  validateScriptContentWithKevBot
} from './shadowPuppetEngine.js';

// Active configuration state
const state = {
  activeTab: 'src/style.css',
  files: {},
  interactions: [],
  rageClicks: 0,
  lastClickTime: 0,
  rageTimeout: null,
  isGenerating: false,
  activeWnitId: 'wnit-vol1-ep5-john-capobianco',
  activeWnitFilter: 'all',
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
  activeHurricaneCat: 3,
  activeAppearanceId: null,
  activeEventCategory: 'All',
  shadowPuppet: {
    isPlaying: false,
    currentCueIndex: -1,
    cues: [],
    speed: 1.0,
    timer: null,
    activeActors: {},
    scriptText: '',
    selectedPresetId: 'fable-5-bots'
  }
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
    logToTerminal('action', 'FOUNDER_RESUME', 'Mathew Raio Interactive Career Resume & Timeline available at /resume.html ↗');
  }, 900);
  setTimeout(() => {
    logToTerminal('thought', 'THOUGHT', 'Observing IDE & Web Cockpit. Explore GitHub projects, launch an A2A Swarm scenario, or prompt me below.');
  }, 1400);
});

// Render the application HTML skeleton
function renderLayout() {
  const root = document.querySelector('#app');
  root.innerHTML = `
    <!-- AMBIENT & INTERACTIVE RAIOLABS LIGHTNING BOLTS OVERLAY (PALETTE FROM raiolabsllc.png) -->
    <div class="raio-lightning-overlay" id="raio-lightning-overlay" aria-hidden="true">
      <svg class="raio-lightning-svg" viewBox="0 0 1440 900" preserveAspectRatio="none">
        <defs>
          <!-- Golden-White Plasma Spear Glow (from raiolabsllc.png diagonal beam) -->
          <linearGradient id="raio-gold-plasma" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.0" />
            <stop offset="25%" stop-color="#fbbf24" stop-opacity="0.85" />
            <stop offset="50%" stop-color="#fffbeb" stop-opacity="1" />
            <stop offset="75%" stop-color="#fef08a" stop-opacity="0.9" />
            <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0" />
          </linearGradient>
          <!-- Electric Ice-Cyan Arc Gradient (from raiolabsllc.png shield arcs) -->
          <linearGradient id="raio-cyan-arc" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#e0f2fe" stop-opacity="0.95" />
            <stop offset="45%" stop-color="#38bdf8" stop-opacity="0.85" />
            <stop offset="80%" stop-color="#0284c7" stop-opacity="0.45" />
            <stop offset="100%" stop-color="#0d1f33" stop-opacity="0" />
          </linearGradient>
          <filter id="raio-bolt-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- Diagonal Golden Plasma Spear Beam (Echoing the logo's central gold lightning spear) -->
        <path class="bolt-path gold-spear-beam" filter="url(#raio-bolt-glow)"
          d="M 90 820 L 310 610 L 295 595 L 540 360 L 525 345 L 820 70" />

        <!-- Top-Left Branching Electric Ice-Cyan Bolts -->
        <path class="bolt-path cyan-arc-bolt bolt-1" filter="url(#raio-bolt-glow)"
          d="M 40 0 L 95 75 L 72 95 L 145 180 L 118 205 L 195 310 L 175 335 L 240 430" />
        <path class="bolt-path cyan-arc-branch bolt-1b"
          d="M 145 180 L 210 215 L 245 205 L 295 250" />
        <path class="bolt-path gold-arc-branch bolt-1c" filter="url(#raio-bolt-glow)"
          d="M 95 75 L 45 135 L 60 165 L 22 225" />

        <!-- Top-Center / Header Rim Electric Arcs -->
        <path class="bolt-path cyan-arc-bolt bolt-2" filter="url(#raio-bolt-glow)"
          d="M 520 0 L 560 52 L 540 72 L 610 135 L 590 155 L 665 230" />
        <path class="bolt-path gold-arc-branch bolt-2b" filter="url(#raio-bolt-glow)"
          d="M 560 52 L 635 80 L 625 102 L 705 145" />

        <!-- Right-Side Companion Boundary Lightning Bolts -->
        <path class="bolt-path cyan-arc-bolt bolt-3" filter="url(#raio-bolt-glow)"
          d="M 860 15 L 825 95 L 850 118 L 795 220 L 820 250 L 765 370 L 790 395 L 740 520" />
        <path class="bolt-path gold-arc-branch bolt-3b" filter="url(#raio-bolt-glow)"
          d="M 825 95 L 895 145 L 880 175 L 945 235" />

        <!-- Bottom-Left Cyber Shield Arc -->
        <path class="bolt-path cyan-arc-bolt bolt-4" filter="url(#raio-bolt-glow)"
          d="M 180 900 L 235 790 L 210 765 L 285 655 L 265 635 L 340 530" />
      </svg>
    </div>

    <!-- LEFT PANEL: USER WORKSPACE -->
    <main class="canvas-section">
      <header class="canvas-header">
        <div class="logo-container">
          <div class="raio-header-emblem-wrap" id="raio-header-crest" title="Click to trigger a RaioLabs Lightning Surge! ⚡">
            <span class="emblem-electric-ring"></span>
            <img src="./raiolabsllc.png" alt="RaioLabs LLC Shield Logo" class="raio-header-logo-img" />
            <span class="emblem-bolt-spark">⚡</span>
          </div>
          <div>
            <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
              <h1 class="logo-text">RaioLabs <span class="logo-llc-tag">LLC</span> <span style="font-weight:400; font-size:1.15rem; opacity:0.85;">// AetherOS</span></h1>
              <span class="system-badge">⚡ AGENTIC IDE & SWARM HUB</span>
            </div>
            <p style="font-size:0.8rem; color:var(--text-secondary); margin-top:4px;">
              Matt Raio, MSIS / CCNA • Agentic AI Architect, eBPF Security Builder & Multi-Agent Swarm Engineer
            </p>
          </div>
        </div>
        <div class="header-actions-bar">
          <a href="https://github.com/mattreya" target="_blank" rel="noopener noreferrer" class="github-header-link">
            🐙 github.com/mattreya ↗
          </a>
          <a href="./resume.html" target="_blank" rel="noopener noreferrer" class="header-modal-btn resume-header-btn" title="Open Mathew Raio Interactive Resume & Career Evolution">
            📄 Founder Resume ↗
          </a>
          <button class="header-modal-btn appearances-header-btn" id="btn-open-appearances" type="button" title="Open Recent YouTube Appearances & Podcasts">
            🎬 Recent Appearances
          </button>
          <button class="header-modal-btn wnit-header-btn" id="btn-open-wnit" type="button" title="Open What's New In Tech (WNIT) Google Drive Media Vault">
            🎙️ What's New In Tech (WNIT)
          </button>
          <button class="header-modal-btn events-header-btn" id="btn-open-events" type="button" title="Open Events & OWASP Briefings">
            🛡️ Events & OWASP
          </button>
          <button class="settings-btn header-settings-pill" id="btn-open-settings" type="button" style="font-size: 0.9rem;">
            ⚙️ System Settings
          </button>
        </div>
      </header>

      <nav class="canvas-nav">
        <button class="nav-tab active" data-target="projects-view">🚀 GitHub Projects</button>
        <button class="nav-tab" data-target="swarm-view">🐝 IDE Swarm Systems</button>
        <button class="nav-tab" data-target="workshops-view">🎓 Agentic Workshops</button>
        <button class="nav-tab" data-target="dashboard-view">📊 AetherOS Sandbox</button>
        <button class="nav-tab" data-target="stage-view">🎭 Shadow Puppet Theatre</button>
      </nav>

      <!-- 1. GITHUB PROJECTS VIEW -->
      <div id="projects-view" class="stage-view-container">
        <section class="hero-banner raio-storm-banner">
          <!-- Decorative SVG Lightning Arcs inside Hero Banner -->
          <svg class="hero-bolt-decor" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true">
            <path class="hero-cyan-arc" d="M 480 0 L 520 65 L 495 82 L 555 160 L 530 180 L 600 270 L 580 320" />
            <path class="hero-gold-spear" d="M 430 310 L 560 190 L 548 178 L 710 25" />
            <path class="hero-cyan-arc-2" d="M 670 10 L 630 85 L 655 105 L 605 195 L 635 220 L 590 310" />
          </svg>

          <div class="hero-banner-top-split">
            <div class="hero-banner-content">
              <span class="hero-eyebrow">⚡ OPEN-SOURCE R&D • LINKEDIN BACKLOG & ACTIVE LABS</span>
              <h2>Autonomous Swarms, Federal Compliance Bots & Kernel-Level Security</h2>
              <p>
                Explore Matt Raio's favorite GitHub repositories spanning <strong>Git-worktree AI Swarms</strong>,
                <strong>NSA/FBI/CISA Compliance Subagents</strong>, <strong>Rust/eBPF CPU Guardians</strong>,
                <strong>NetClaw BGP Automation</strong>, and <strong>3D Time / Post-Quantum Cryptography</strong>.
              </p>
            </div>

            <!-- RaioLabs LLC Shield Emblem Centerpiece -->
            <div class="hero-crest-showcase" id="hero-crest-showcase" title="Click for RaioLabs Plasma Lightning Surge! ⚡">
              <div class="hero-crest-aura"></div>
              <img src="./raiolabsllc.png" alt="RaioLabs LLC Cyber Shield & Lightning Spear" class="hero-crest-img" />
              <span class="hero-crest-caption">⚡ RAIOLABS LLC • FIVE-STAR CYBER SHIELD</span>
            </div>
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
              <h3>🌀 The 5 Kinds of Bots: The NIST/CISA SP800-53 Overlay (By Matt Raio MSIS)</h3>
              <p style="margin:0;">
                Authored by Matt Raio during NIST/CISA working group sessions, this framework categorizes AI agents by operational force and blast radius using the meteorological Hurricane Scale. Anchored by the maxim of Hannibal Barca: <strong style="color:#fde047;">"Aut viam inveniam aut faciam"</strong> (<em>"I will find a way.. or make one."</em>).
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

      <!-- 5. SHADOW PUPPET THEATRE VIEW -->
      <div id="stage-view" class="stage-view-container hidden">
        <section class="canvas-intro shadow-intro">
          <div class="shadow-intro-content">
            <span class="hero-eyebrow">WAYANG KULIT CYBER-THEATRE • THE 5 TYPES OF BOTS • SCRIPT ENGINE</span>
            <h2>The Shadow Puppet Theatre of Autonomy</h2>
            <p>
              Step behind the warm oil-lamp screen where ancient Wayang Kulit shadow puppetry meets the 
              <strong>5 Types of Bots</strong> from the Hurricane Model of Autonomy. Load your own 
              <code>.txt</code> story script or select a cyber-fable below—our articulated shadow puppets 
              will slide across the backlit screen on their control rods and act out the entire scene in real time!
            </p>
          </div>
        </section>

        <!-- The Backlit Shadow Screen Stage -->
        <div class="shadow-theatre-box">
          <div class="theatre-stage shadow-stage active-stage" id="theatre-stage">
            <!-- Stage Wooden Archway Frame -->
            <div class="shadow-arch-frame" aria-hidden="true">
              <div class="arch-filigree-top">
                <span class="arch-crest-gem">⚡ RAIO LABS SHADOW THEATRE ⚡</span>
              </div>
              <div class="arch-pillar-left"></div>
              <div class="arch-pillar-right"></div>
            </div>

            <!-- Warm Glowing Canvas Screen -->
            <div class="shadow-screen" id="shadow-screen">
              <!-- Backlit Candle/Oil-Lamp Glow & Atmospheric Flickers -->
              <div class="screen-lantern-glow"></div>
              <div class="screen-canvas-grain"></div>
              <div class="ambient-dust-container" id="shadow-dust-container"></div>
              
              <!-- Dynamic Stage Effects Overlay (Lightning, Spotlights) -->
              <div class="stage-lightning-flash" id="stage-lightning-flash"></div>
              <div class="stage-scene-badge" id="stage-scene-badge">Scene: The Backlit Stage of Silicon</div>
              <div class="gamelan-music-indicator hidden" id="gamelan-music-indicator" title="Traditional Wayang Kulit Gamelan Slendro Music Active">
                <span class="gamelan-pulse-icon">🎶</span>
                <span>Gamelan Slendro (Java / Bali)</span>
              </div>

              <!-- Puppets on Stage Container -->
              <div class="shadow-puppets-container" id="shadow-puppets-container">
                <!-- Puppets rendered dynamically with control rods and glowing halos -->
              </div>
            </div>

            <!-- Subtitle / Speech Parchment Scroll at Base of Screen -->
            <div class="shadow-scroll-subtitle" id="shadow-subtitle-banner">
              <div class="subtitle-actor-pill" id="subtitle-actor-pill">
                <span class="pill-symbol">📜</span>
                <span class="pill-name">Narrator</span>
              </div>
              <div class="subtitle-text-box" id="subtitle-text-box">
                "Welcome, travelers of the terminal. Before you lies the illuminated screen of autonomy, where five primal bot archetypes dwell..."
              </div>
              <div class="subtitle-cue-step" id="subtitle-cue-step">Cue 1 / 18</div>
            </div>

            <!-- Traditional Wayang Stage Footlights / Oil Lamps -->
            <div class="shadow-stage-footlights" aria-hidden="true">
              <div class="oil-lamp"><div class="flame"></div></div>
              <div class="oil-lamp"><div class="flame"></div></div>
              <div class="oil-lamp"><div class="flame"></div></div>
              <div class="oil-lamp"><div class="flame"></div></div>
              <div class="oil-lamp"><div class="flame"></div></div>
              <div class="oil-lamp"><div class="flame"></div></div>
              <div class="oil-lamp"><div class="flame"></div></div>
            </div>
          </div>
        </div>

        <!-- KEV-Bot Watcher & Content Censorship Status Bar -->
        <div class="kev-watcher-bar" id="kev-watcher-bar">
          <div class="kev-watcher-left">
            <span class="watcher-eye-pulse">👁️</span>
            <strong>KEV-Bot Live Sentinel:</strong>
            <span id="kev-watcher-status-text" class="watcher-status-text">Watching user & inspecting incoming script context...</span>
          </div>
          <div class="kev-watcher-right">
            <span class="watcher-policy-pill">🌈 Only Happy Stories Allowed</span>
            <span class="watcher-active-badge" id="kev-sentinel-mode-badge">🛡️ Sentinel Guarding</span>
          </div>
        </div>

        <!-- Pop-in Censorship Warning Banner (Triggered by KEV-Bot on sensitive context) -->
        <div class="kev-censor-banner hidden" id="kev-censor-banner" role="alert">
          <div class="censor-banner-icon">🚨</div>
          <div class="censor-banner-body">
            <strong>KEV-BOT CONTENT CENSORSHIP ALERT:</strong>
            <span id="kev-censor-banner-msg">This file cannot be used due to the sensitive nature of the content. Only happy stories for now!</span>
          </div>
          <button class="censor-banner-close" id="btn-close-censor-banner" title="Dismiss Alert">✕</button>
        </div>

        <!-- Puppet Master Controls & Script Ingestion Bar -->
        <div class="shadow-director-deck">
          <!-- Playback Controls -->
          <div class="director-playback-group">
            <button class="puppet-btn primary-puppet-btn" id="btn-puppet-play" title="Play or Pause Story">
              <span id="puppet-play-icon">▶</span> <span id="puppet-play-text">Act Out Scene</span>
            </button>
            <button class="puppet-btn" id="btn-puppet-prev" title="Step Back One Cue">
              <span>⏮</span> Step
            </button>
            <button class="puppet-btn" id="btn-puppet-next" title="Step Forward One Cue">
              Step <span>⏭</span>
            </button>
            <button class="puppet-btn danger-puppet-btn" id="btn-puppet-reset" title="Reset Stage & Puppets">
              <span>⏹</span> Reset
            </button>
            <button class="puppet-btn gamelan-music-btn" id="btn-toggle-gamelan" type="button" title="Toggle Traditional Wayang Kulit Gamelan Music (Java/Bali Slendro Scale)">
              <span id="gamelan-btn-icon">🎵</span> <span id="gamelan-btn-text">Gamelan: ON</span>
            </button>

            <div class="director-speed-wrap">
              <label for="sel-puppet-speed">Speed:</label>
              <select id="sel-puppet-speed" class="director-select">
                <option value="0.75">0.75x (Solemn)</option>
                <option value="1" selected>1.0x (Normal)</option>
                <option value="1.5">1.5x (Brisk)</option>
                <option value="2">2.0x (Swift)</option>
              </select>
            </div>
          </div>

          <!-- Script Ingestion & File Upload Buttons -->
          <div class="director-script-group">
            <input type="file" id="file-script-upload" accept=".txt,.md,.json,.script" style="display:none;" />
            <button class="puppet-btn upload-script-btn" id="btn-trigger-upload" title="Upload a .txt script file from your computer">
              <span>📂</span> Upload .txt Script
            </button>

            <div class="preset-stories-wrap">
              <label for="sel-preset-story">Fable:</label>
              <select id="sel-preset-story" class="director-select">
                <option value="fable-5-bots">1. The Legend of the 5 Bots (Epic Fable)</option>
                <option value="overlord-vs-kernel">2. The Swarm Overlord & The Kernel Gate</option>
                <option value="midnight-triage">3. The Midnight Zero-Day Triage</option>
              </select>
            </div>

            <button class="puppet-btn" id="btn-download-script" title="Download current script as a .txt file">
              <span>💾</span> Export .txt
            </button>

            <button class="puppet-btn" id="btn-toggle-editor" title="Toggle Script Text Editor">
              <span>✏️</span> Edit Script
            </button>
          </div>
        </div>

        <!-- Collapsible / Interactive Script Editor Drawer -->
        <div class="script-editor-drawer" id="script-editor-drawer">
          <div class="editor-header">
            <div class="editor-title">
              <span>📜</span>
              <strong>Script Studio & Text File Ingestion</strong>
              <span class="editor-badge" id="editor-status-badge">Loaded: The Legend of the 5 Bots</span>
            </div>
            <div class="editor-actions">
              <button class="editor-mini-btn" id="btn-sample-template" title="Load simple boilerplate format">Load Template</button>
              <button class="editor-mini-btn" id="btn-clear-script" title="Clear text area">Clear</button>
            </div>
          </div>
          <div class="editor-body">
            <textarea id="script-raw-textarea" class="script-textarea" spellcheck="false" placeholder="Paste or type your script here, or drop a .txt file...
Example:
[Cat 1 ENTERS LEFT]
Cat 1: In the beginning was the prompt!
[Cat 5 ENTERS CENTER]
Cat 5: Halt! Verified logic is law!"></textarea>
            <div class="editor-syntax-hints">
              <span>💡 <strong>Tips:</strong> Type <code>Cat 1:</code>, <code>Cat 2:</code>, <code>Cat 3:</code>, <code>Cat 4:</code>, <code>Cat 5:</code>, or <code>Narrator:</code> before dialogue lines.</span>
              <span>Use stage cues like <code>[CAT1 ENTERS LEFT]</code>, <code>[CAT5 RAISES_SHIELD]</code>, <code>[LIGHTNING]</code>, or <code>[ALL GATHER]</code>. Any raw .txt will also play automatically!</span>
            </div>
          </div>
        </div>

        <!-- The 5 Bot Archetypes / Puppet Master Quick-Cast Bar -->
        <div class="shadow-cast-section">
          <div class="cast-section-header">
            <h3>🎭 The 5 Puppet Archetypes (Wayang Kulit Roster)</h3>
            <span class="cast-subtitle">Click any puppet below to manually summon or gesture with them on stage</span>
          </div>
          <div class="shadow-cast-grid" id="shadow-cast-grid">
            <!-- 5 bot cards rendered dynamically with puppet miniatures, roles, and quick-summon buttons -->
          </div>
        </div>
      </div>

      <!-- 6. PRAETORIAN CLASSIFIED MULTI-ENTITY DEFENSE VIEW -->
      <div id="praetorian-view" class="stage-view-container hidden">
        <section class="praetorian-ominous-stage">
          <!-- Ambient CRT Scanline & Red Vignette Overlays -->
          <div class="praetorian-crt-scanlines" aria-hidden="true"></div>
          <div class="praetorian-red-vignette" aria-hidden="true"></div>

          <div class="praetorian-stage-content">
            <!-- Header Badges -->
            <div class="praetorian-classified-pill">
              <span class="praetorian-dot-red"></span>
              <span>CLASSIFIED • LEVEL 5 EYES ONLY • RING-0 CONTAINMENT</span>
            </div>

            <!-- Dramatic Blood-Red Glowing Coming Soon Title -->
            <h1 class="praetorian-coming-soon-headline">COMING SOON</h1>
            <p class="praetorian-hero-tagline">
              The Praetorian Autonomous Defense Collective is compiling in the shadows.
            </p>

            <!-- Silhouette of the Multi-Entity Structure in Deep Shadows -->
            <div class="praetorian-silhouette-frame">
              <svg class="praetorian-structure-svg" viewBox="0 0 900 420" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <filter id="shadow-blur" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
                  </filter>
                  <linearGradient id="red-laser-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#ef4444" stop-opacity="0.9" />
                    <stop offset="50%" stop-color="#b91c1c" stop-opacity="0.5" />
                    <stop offset="100%" stop-color="#450a0a" stop-opacity="0.1" />
                  </linearGradient>
                </defs>

                <!-- Connecting Laser Vectors in Shadows -->
                <line x1="450" y1="120" x2="160" y2="280" stroke="url(#red-laser-grad)" stroke-width="2" stroke-dasharray="6,4" />
                <line x1="450" y1="120" x2="300" y2="330" stroke="url(#red-laser-grad)" stroke-width="2" stroke-dasharray="6,4" />
                <line x1="450" y1="120" x2="450" y2="345" stroke="url(#red-laser-grad)" stroke-width="2" stroke-dasharray="6,4" />
                <line x1="450" y1="120" x2="600" y2="330" stroke="url(#red-laser-grad)" stroke-width="2" stroke-dasharray="6,4" />
                <line x1="450" y1="120" x2="740" y2="280" stroke="url(#red-laser-grad)" stroke-width="2" stroke-dasharray="6,4" />

                <!-- Shadow Silhouette Core (Root Arbiter Nexus) -->
                <g class="silhouette-node core-node" transform="translate(450, 120)">
                  <circle r="54" fill="#030712" stroke="#dc2626" stroke-width="2.5" />
                  <circle r="46" fill="#090d16" opacity="0.9" filter="url(#shadow-blur)" />
                  <text y="-8" text-anchor="middle" fill="#f87171" font-family="'JetBrains Mono', monospace" font-size="24" font-weight="900">π</text>
                  <text y="12" text-anchor="middle" fill="#ef4444" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="800" letter-spacing="1.5">PRAETORIAN</text>
                  <text y="25" text-anchor="middle" fill="#991b1b" font-family="'JetBrains Mono', monospace" font-size="8">CORE NEXUS</text>
                </g>

                <!-- 5 Compartmentalized Shadow Sector Nodes -->
                <!-- Tier I: Vanguard -->
                <g class="silhouette-node branch-node" transform="translate(160, 280)">
                  <circle r="36" fill="#030712" stroke="#991b1b" stroke-width="1.8" />
                  <text y="-4" text-anchor="middle" fill="#e2e8f0" font-size="16">👁️</text>
                  <text y="14" text-anchor="middle" fill="#f87171" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="700">TIER I</text>
                  <text y="24" text-anchor="middle" fill="#7f1d1d" font-family="'JetBrains Mono', monospace" font-size="7">VANGUARD</text>
                </g>

                <!-- Tier II: Aegis -->
                <g class="silhouette-node branch-node" transform="translate(300, 330)">
                  <circle r="36" fill="#030712" stroke="#991b1b" stroke-width="1.8" />
                  <text y="-4" text-anchor="middle" fill="#e2e8f0" font-size="16">🛡️</text>
                  <text y="14" text-anchor="middle" fill="#f87171" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="700">TIER II</text>
                  <text y="24" text-anchor="middle" fill="#7f1d1d" font-family="'JetBrains Mono', monospace" font-size="7">AEGIS</text>
                </g>

                <!-- Tier III: Inquisitor -->
                <g class="silhouette-node branch-node" transform="translate(450, 345)">
                  <circle r="36" fill="#030712" stroke="#991b1b" stroke-width="1.8" />
                  <text y="-4" text-anchor="middle" fill="#e2e8f0" font-size="16">⚡</text>
                  <text y="14" text-anchor="middle" fill="#f87171" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="700">TIER III</text>
                  <text y="24" text-anchor="middle" fill="#7f1d1d" font-family="'JetBrains Mono', monospace" font-size="7">INQUISITOR</text>
                </g>

                <!-- Tier IV: Arbiter -->
                <g class="silhouette-node branch-node" transform="translate(600, 330)">
                  <circle r="36" fill="#030712" stroke="#991b1b" stroke-width="1.8" />
                  <text y="-4" text-anchor="middle" fill="#e2e8f0" font-size="16">⚖️</text>
                  <text y="14" text-anchor="middle" fill="#f87171" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="700">TIER IV</text>
                  <text y="24" text-anchor="middle" fill="#7f1d1d" font-family="'JetBrains Mono', monospace" font-size="7">ARBITER</text>
                </g>

                <!-- Tier V: Ghost -->
                <g class="silhouette-node branch-node" transform="translate(740, 280)">
                  <circle r="36" fill="#030712" stroke="#991b1b" stroke-width="1.8" />
                  <text y="-4" text-anchor="middle" fill="#e2e8f0" font-size="16">👻</text>
                  <text y="14" text-anchor="middle" fill="#f87171" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="700">TIER V</text>
                  <text y="24" text-anchor="middle" fill="#7f1d1d" font-family="'JetBrains Mono', monospace" font-size="7">GHOST</text>
                </g>
              </svg>
            </div>

            <!-- Terminal Matrix Log In Shadows -->
            <div class="praetorian-terminal-panel">
              <div class="praetorian-terminal-header">
                <span class="terminal-traffic-dot red"></span>
                <span class="terminal-traffic-dot yellow"></span>
                <span class="terminal-traffic-dot green"></span>
                <span class="praetorian-terminal-title">praetorian://containment/telemetry.log</span>
              </div>
              <pre class="praetorian-terminal-body">
<code><span class="p-dim">[07:28:19:95]</span> <span class="p-red">INITIALIZING PRAETORIAN ARCHITECTURE...</span>
<span class="p-dim">[07:28:19:95]</span> <span class="p-cyan">TIER I:</span>   Sector Alpha (Vanguard Recon)             <span class="p-green">[ATTRIBUTED]</span>
<span class="p-dim">[07:28:19:95]</span> <span class="p-cyan">TIER II:</span>  Sector Beta (Aegis Sensor Sentinel)       <span class="p-green">[ATTRIBUTED]</span>
<span class="p-dim">[07:28:19:95]</span> <span class="p-cyan">TIER III:</span> Sector Gamma (Inquisitor Stress Engine)   <span class="p-green">[ATTRIBUTED]</span>
<span class="p-dim">[07:28:19:95]</span> <span class="p-cyan">TIER IV:</span>  Sector Delta (Arbiter Policy Governor)    <span class="p-green">[ATTRIBUTED]</span>
<span class="p-dim">[07:28:19:95]</span> <span class="p-cyan">TIER V:</span>   Sector Omega (Ghost Signal Intelligence)  <span class="p-green">[ATTRIBUTED]</span>
<span class="p-dim">[07:28:19:95]</span> <span class="p-gold">KEV SYSTEM ONE:</span> Containment Protocol Active (Veto: 0.15 | Ring Buffer: Secure)
<span class="p-dim">[07:28:19:95]</span> <span class="p-red">GATEWAY KEY:</span> 07281995 // For Angela Bennett
<span class="p-dim">[07:28:19:95]</span> <span class="p-red">STATUS:</span> <strong style="color:#ef4444;">SHADOW MESH ENGAGED. COMING SOON TO RESTRICTED CLEARANCES.</strong></code>
              </pre>
            </div>

            <!-- Back to Surface Button -->
            <div class="praetorian-actions">
              <button class="praetorian-exit-btn" id="btn-exit-praetorian" type="button">
                ⬅ Return to Surface (RaioLabs LLC)
              </button>
            </div>
          </div>
        </section>
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

      <!-- Animated Character Stage (Bright Meadow & Sky Scenery) -->
      <section class="bot-character-stage" id="bot-character-stage">
        <!-- Bright Sky & Cloud Scenery Layer -->
        <div class="stage-sky-scenery" aria-hidden="true">
          <div class="sky-sun-core"></div>
          
          <!-- Background Dark Thunder Cloud with Lightning Flicker -->
          <div class="thunder-cloud-bg" title="⚡ RaioLabs Thunder Cloud">
            <div class="thunder-cloud-shape"></div>
            <div class="thunder-flash-overlay"></div>
            <span class="thunder-bolt-glyph">⚡</span>
          </div>

          <!-- Multiple Moving Fluffy White Clouds Drifting Across Sky -->
          <div class="drifting-cloud cloud-1">
            <div class="fluffy-cloud-shape"></div>
          </div>
          <div class="drifting-cloud cloud-2">
            <div class="fluffy-cloud-shape small"></div>
          </div>
          <div class="drifting-cloud cloud-3">
            <div class="fluffy-cloud-shape alt"></div>
          </div>
          <div class="drifting-cloud cloud-4">
            <div class="fluffy-cloud-shape wide"></div>
          </div>
          <div class="drifting-cloud cloud-5">
            <div class="fluffy-cloud-shape tiny"></div>
          </div>
          <div class="drifting-cloud cloud-6">
            <div class="fluffy-cloud-shape puffy"></div>
          </div>
          <div class="drifting-cloud cloud-7">
            <div class="fluffy-cloud-shape small"></div>
          </div>
          <div class="drifting-cloud cloud-8">
            <div class="fluffy-cloud-shape alt"></div>
          </div>
        </div>

        <!-- Rolling Green Hills & Meadow Grass Scenery in Background -->
        <div class="stage-meadow-scenery" aria-hidden="true">
          <!-- Multi-Layered Natural Rolling Hills SVG -->
          <svg class="rolling-hills-svg" viewBox="0 0 1000 360" preserveAspectRatio="none">
            <defs>
              <linearGradient id="hill-grad-1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#bbf7d0" />
                <stop offset="45%" stop-color="#86efac" />
                <stop offset="100%" stop-color="#4ade80" />
              </linearGradient>
              <linearGradient id="hill-grad-2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#4ade80" />
                <stop offset="55%" stop-color="#22c55e" />
                <stop offset="100%" stop-color="#16a34a" />
              </linearGradient>
              <linearGradient id="hill-grad-3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#34d399" />
                <stop offset="50%" stop-color="#16a34a" />
                <stop offset="100%" stop-color="#15803d" />
              </linearGradient>
              <linearGradient id="hill-grad-front" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#22c55e" />
                <stop offset="40%" stop-color="#16a34a" />
                <stop offset="100%" stop-color="#14532d" />
              </linearGradient>
            </defs>

            <!-- Layer 1: Distant Misty Rolling Hills Ridge -->
            <path class="svg-hill hill-layer-1" fill="url(#hill-grad-1)" opacity="0.85"
              d="M 0 125 Q 160 45, 380 95 T 760 70 Q 880 50, 1000 90 L 1000 360 L 0 360 Z" />

            <!-- Layer 2: Mid-Distant Rolling Hills with Undulating Knolls -->
            <path class="svg-hill hill-layer-2" fill="url(#hill-grad-2)" opacity="0.92"
              d="M 0 160 Q 240 85, 520 145 Q 740 105, 1000 135 L 1000 360 L 0 360 Z" />

            <!-- Layer 3: Near Rolling Green Slopes -->
            <path class="svg-hill hill-layer-3" fill="url(#hill-grad-3)"
              d="M 0 195 Q 310 135, 660 185 Q 860 140, 1000 170 L 1000 360 L 0 360 Z" />

            <!-- Layer 4: Foreground Rolling Meadow Crest where Robots Stand -->
            <path class="svg-hill hill-layer-front" fill="url(#hill-grad-front)"
              d="M 0 235 Q 260 185, 540 220 Q 800 175, 1000 210 L 1000 360 L 0 360 Z" />
          </svg>

          <!-- Foreground Meadow Highlights, Grass Texture & Wildflowers -->
          <div class="meadow-crest-highlight"></div>
          <div class="meadow-grass-texture"></div>
          <div class="meadow-wildflowers">
            <span class="flower f1">🌼</span>
            <span class="flower f2">🌸</span>
            <span class="flower f3">🌱</span>
            <span class="flower f4">🌻</span>
            <span class="flower f5">🌸</span>
            <span class="flower f6">✨</span>
            <span class="flower f7">🌱</span>
            <span class="flower f8">🌼</span>
            <span class="flower f9">🌷</span>
            <span class="flower f10">🍀</span>
            <span class="flower f11">🌸</span>
            <span class="flower f12">🌼</span>
          </div>
        </div>

        <div class="bot-ambient-glow" id="bot-ambient-glow"></div>
        <div class="bot-particles-layer" id="bot-particles-layer"></div>

        <!-- SVG Lightning Strike Overlay from Thunder Cloud to RaioBot -->
        <svg class="cloud-strike-svg hidden" id="cloud-strike-svg" aria-hidden="true">
          <defs>
            <filter id="strike-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur1" />
              <feGaussianBlur stdDeviation="9" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path class="strike-path cyan-strike" d="" />
          <path class="strike-path core-strike" filter="url(#strike-glow)" d="" />
          <path class="strike-branch branch-1" d="" />
          <path class="strike-branch branch-2" d="" />
          <path class="strike-branch branch-3" d="" />
        </svg>

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
          <div class="speech-bubble-topbar">
            <div class="speech-tag" id="bot-speech-tag">👋 HELLO FRIEND!</div>
            <button class="stage-window-toggle-btn" id="btn-toggle-speech-bubble" type="button" title="Collapse or Expand RaioBot Speech & Swarm Telemetry">
              <span class="toggle-icon">−</span> <span class="toggle-text">Collapse</span>
            </button>
          </div>
          <div class="speech-bubble-collapsible-body" id="speech-bubble-collapsible-body">
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
        </div>
      </section>

      <!-- 🚨 KEV-BOT: REAL-TIME USER BEHAVIOR & TELEMETRY ANALYST -->
      <section class="kev-bot-panel window-collapsed" id="kev-bot-panel">
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
            <button class="kev-btn active" id="btn-kev-code-view" type="button" title="Toggle Live Developer Code View (Real-time source & DOM callouts)">
              💻 Code
            </button>
            <button class="kev-btn" id="btn-kev-expand-stream" type="button" title="Expand stream height for larger log reading viewport">
              🗖 Expand
            </button>
            <button class="kev-btn" id="btn-kev-stage-sync" type="button" title="Pop KEV-Bot onto the main stage next to RaioBot with a live JSON behavioral dump!">
              🤖 Briefing
            </button>
            <button class="kev-btn" id="btn-kev-pause" type="button" title="Pause or resume KEV-Bot real-time analysis stream">
              ⏸
            </button>
            <button class="kev-btn kev-btn-toggle" id="btn-kev-collapse" type="button" title="Collapse or Expand KEV-Bot panel to save screen space">
              <span id="kev-collapse-icon">+</span> <span id="kev-collapse-text">Expand</span>
            </button>
          </div>
        </div>

        <div class="kev-collapsible-content" id="kev-collapsible-content">
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

          <!-- 💻 LIVE DEVELOPER CODE VIEW (Calls out what the user is doing in real-time code!) -->
          <div class="kev-dev-code-drawer" id="kev-dev-code-drawer">
            <div class="kev-code-topbar">
              <span>📄 <code>src/kev_counter_recon.ts</code> — LIVE DOM & DEVTOOLS WATCHER</span>
              <span class="kev-devtools-badge" id="kev-devtools-badge">👁️ WATCHING YOU</span>
            </div>
            <pre class="kev-code-pre" id="kev-code-pre"></pre>
          </div>

          <!-- Real-Time Scrolling Behavioral Analysis Feed -->
          <div class="kev-stream-box" id="kev-stream-box">
            <div class="kev-log-item kev-init">
              <span class="kev-time">[INIT]</span>
              <span class="kev-tag">KEV_BOOT</span>
              <span class="kev-msg">KEV-Bot v2.6 counter-recon sensor online. Open Browser DevTools (F12) or watch the Code View above as KEV-Bot calls out every move in real time...</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Interactive Patreon Donation & Support Card (Collapsed by default to maximize robot stage & background) -->
      <section class="patreon-donate-card window-collapsed" id="patreon-donate-card">
        <div class="patreon-card-header">
          <div>
            <h3>☕ Fuel Open-Source Swarms & Labs</h3>
            <p id="patreon-header-desc">Choose a tier and make a pledge below to unlock RaioBot's special reward animations!</p>
          </div>
          <button class="stage-window-toggle-btn" id="btn-toggle-patreon" type="button" title="Collapse or Expand Patreon section to utilize screen space">
            <span class="toggle-icon" id="patreon-toggle-icon">+</span> <span class="toggle-text" id="patreon-toggle-text">Expand</span>
          </button>
        </div>

        <div class="patreon-collapsible-content" id="patreon-collapsible-content">
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
        </div>
      </section>

      <!-- Telemetry Status & Reset Tray -->
      <section class="agent-chat-section">
        <div class="settings-tray">
          <span>Clicks: <strong id="stat-clicks">0</strong> • Mood: <strong id="stat-stress">Happy ✨</strong> • Up: <strong id="stat-uptime">0s</strong></span>
          <button class="settings-btn" id="btn-reset-codebase" style="margin: 0 auto;">🔄 Reset Site</button>
          <!-- 👁️ PRAETORIAN "THE NET" π BACKDOOR EMBLEM (ALIGNED UNDER BRIEFING COLUMN) -->
          <button class="praetorian-net-btn" id="praetorian-net-btn" type="button" title="π • Mozart's Ghost" aria-label="Praetorian Backdoor Gateway">
            <span class="praetorian-pi-glyph">π</span>
          </button>
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

    <!-- RECENT APPEARANCES MODAL (YOUTUBE FOREGROUND PLAYER + BLURRED BACKGROUND) -->
    <div class="modal-overlay backdrop-blur-heavy hidden" id="appearances-modal">
      <div class="modal-card modal-card-wide">
        <div class="modal-title">
          <div class="modal-title-group">
            <span class="modal-eyebrow-pill">🎬 FOREGROUND MEDIA DECK</span>
            <span>Recent Appearances — Choose a YouTube Broadcast</span>
          </div>
          <button class="close-btn" id="btn-close-appearances" title="Close Recent Appearances">&times;</button>
        </div>
        <p class="modal-subtitle-text">
          Click on any of the appearances below.
        </p>

        <!-- Selectable YouTube Appearance Cards -->
        <div class="appearances-selector-grid" id="appearances-selector-grid">
          ${RECENT_APPEARANCES.map(app => `
            <div class="appearance-choice-card" data-appearance-id="${app.id}">
              <div class="appearance-thumb-wrap" data-play-id="${app.id}">
                <img src="${app.thumbnail}" alt="${app.title}" class="appearance-thumb-img" loading="lazy" />
                <div class="appearance-play-overlay">
                  <span class="play-circle-icon">▶</span>
                  <span class="play-overlay-lbl">Play in Foreground</span>
                </div>
                <span class="appearance-badge-pill">${app.badge}</span>
              </div>
              <div class="appearance-card-body">
                <div class="appearance-channel-row">
                  <span class="appearance-channel-name">📺 ${app.channel}</span>
                  <span class="appearance-date-lbl">${app.date}</span>
                </div>
                <h4 class="appearance-card-title">${app.title}</h4>
                <p class="appearance-card-desc">${app.summary}</p>
                <div class="appearance-url-pill">
                  🔗 <code>${app.url}</code>
                </div>
                <div class="appearance-tags-row">
                  ${app.tags.map(t => `<span class="appearance-tag-chip">${t}</span>`).join('')}
                </div>
                <div class="appearance-card-actions">
                  <button class="btn-primary btn-play-appearance" type="button" data-play-id="${app.id}">
                    ▶ Watch in Foreground Player
                  </button>
                  <a href="${app.url}" target="_blank" rel="noopener noreferrer" class="btn-secondary appearance-ext-link">
                    YouTube ↗
                  </a>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Foreground YouTube Player Stage (Revealed / Updated when a link is chosen) -->
        <div class="foreground-player-stage hidden" id="appearances-player-stage">
          <div class="player-stage-topbar">
            <div class="player-now-playing">
              <span class="live-dot-pulse"></span>
              <strong id="player-active-title">Now Playing...</strong>
            </div>
            <div class="player-stage-actions">
              <a href="#" target="_blank" rel="noopener noreferrer" class="player-yt-direct-link" id="player-active-ext-url">
                Open Direct Link on YouTube ↗
              </a>
              <button class="player-stop-btn" type="button" id="btn-stop-player">
                ⏹ Close Player
              </button>
            </div>
          </div>
          <div class="video-aspect-frame">
            <iframe
              id="appearances-youtube-iframe"
              src=""
              title="RaioLabs YouTube Appearance Player"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen>
            </iframe>
          </div>
        </div>
      </div>
    </div>

    <!-- EVENTS & CYBERSECURITY / OWASP APPEARANCES MODAL (BLURRED BACKGROUND) -->
    <div class="modal-overlay backdrop-blur-heavy hidden" id="events-modal">
      <div class="modal-card modal-card-wide">
        <div class="modal-title">
          <div class="modal-title-group">
            <span class="modal-eyebrow-pill events-eyebrow-pill">🛡️ CYBERSECURITY, OWASP & FEDERAL BRIEFINGS</span>
            <span>Events & Cybersecurity / OWASP Appearances</span>
          </div>
          <button class="close-btn" id="btn-close-events" title="Close Events & OWASP">&times;</button>
        </div>
        <p class="modal-subtitle-text">
          Explore Matt Raio's speaking engagements, OWASP chapter sessions, NIST/CISA SP 800-53 working group overlays, and hands-on cybersecurity & autonomous swarm workshops.
        </p>

        <!-- Category Filter Bar inside Events Modal -->
        <div class="events-filter-bar" id="events-filter-bar">
          <button class="pill-btn active" type="button" data-event-cat="All">All Appearances (${CYBER_OWASP_EVENTS.length})</button>
          <button class="pill-btn" type="button" data-event-cat="OWASP & AppSec">🛡️ OWASP & AppSec</button>
          <button class="pill-btn" type="button" data-event-cat="Federal & Cyber Policy">🏛️ NIST / CISA & Federal</button>
          <button class="pill-btn" type="button" data-event-cat="NetSec & VibeOps">🌐 NetSec & VibeOps</button>
          <button class="pill-btn" type="button" data-event-cat="Cyber Workforce & Labs">🎖️ Veteran & Cyber Labs</button>
        </div>

        <!-- Events & Appearances Grid -->
        <div class="cyber-events-grid" id="cyber-events-grid"></div>

        <!-- Bottom Quick-Switch Bar to Foreground Video Player -->
        <div class="events-modal-footer">
          <span>🎬 Want to watch the recorded sessions right over the blurred workspace?</span>
          <button class="btn-secondary" type="button" id="btn-switch-to-appearances">
            🎬 Open Foreground YouTube Player
          </button>
        </div>
      </div>
    </div>

    <!-- 🎙️ WHAT'S NEW IN TECH (WNIT) MODAL (GOOGLE DRIVE FOREGROUND PLAYER + BLURRED BACKGROUND) -->
    <div class="modal-overlay backdrop-blur-heavy hidden" id="wnit-modal">
      <div class="modal-card modal-card-wide">
        <div class="modal-title">
          <div class="modal-title-group">
            <span class="modal-eyebrow-pill wnit-eyebrow-pill">🎙️ GOOGLE DRIVE MEDIA VAULT</span>
            <span>What's New In Tech (WNIT) — Shared Media Archive</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <a href="${WNIT_SHARED_FOLDER_URL}" target="_blank" rel="noopener noreferrer" class="wnit-drive-folder-link" title="Open complete Google Drive shared folder in new tab">
              📂 Google Drive Folder ↗
            </a>
            <button class="close-btn" id="btn-close-wnit" title="Close What's New In Tech">&times;</button>
          </div>
        </div>
        <p class="modal-subtitle-text">
          Direct Google Drive media vault featuring Matt Raio's <strong>"What's New In Tech" (WNIT)</strong> broadcasts. Explore video episodes and audio podcast masters with guests including <strong>John Capobianco</strong> (VibeOps & automation) and <strong>Deepak Kakadia</strong> (carrier networks & autonomic tech).
        </p>

        <!-- WNIT Google Shared Folder Top Callout Banner -->
        <div class="wnit-folder-banner">
          <div class="wnit-folder-info">
            <span class="wnit-drive-icon">📁</span>
            <div>
              <strong>Google Drive Shared Media Folder: "WNIT"</strong>
              <p>Contains full HD MP4 master videos, MP3 studio podcast tracks, and accompanying session notes.</p>
            </div>
          </div>
          <a href="${WNIT_SHARED_FOLDER_URL}" target="_blank" rel="noopener noreferrer" class="btn-primary wnit-banner-btn">
            Open Entire Drive Vault ↗
          </a>
        </div>

        <!-- Format / Category Filter Bar inside WNIT Modal -->
        <div class="wnit-filter-bar" id="wnit-filter-bar">
          <button class="pill-btn active" type="button" data-wnit-filter="all">All Media (${WNIT_MEDIA_ITEMS.length})</button>
          <button class="pill-btn" type="button" data-wnit-filter="video">🎬 Videos (${WNIT_MEDIA_ITEMS.filter(m => m.mediaType === 'video').length})</button>
          <button class="pill-btn" type="button" data-wnit-filter="audio">🎧 Audio Podcasts (${WNIT_MEDIA_ITEMS.filter(m => m.mediaType === 'audio').length})</button>
          <button class="pill-btn" type="button" data-wnit-filter="doc">📄 Docs & Notes (${WNIT_MEDIA_ITEMS.filter(m => m.mediaType === 'doc').length})</button>
        </div>

        <!-- Selectable WNIT Media Cards Grid -->
        <div class="appearances-selector-grid" id="wnit-selector-grid"></div>

        <!-- Foreground WNIT Player Stage (Revealed / Updated when an item is chosen) -->
        <div class="foreground-player-stage hidden" id="wnit-player-stage">
          <div class="player-stage-topbar">
            <div class="player-now-playing">
              <span class="live-dot-pulse" style="background:#10b981; box-shadow:0 0 10px #10b981;"></span>
              <strong id="wnit-player-active-title">Now Streaming...</strong>
            </div>
            <div class="player-stage-actions">
              <a href="#" target="_blank" rel="noopener noreferrer" class="player-yt-direct-link" id="wnit-player-active-ext-url">
                Open Direct in Google Drive ↗
              </a>
              <button class="player-stop-btn" type="button" id="btn-stop-wnit-player">
                ⏹ Close Player
              </button>
            </div>
          </div>
          <div class="video-aspect-frame">
            <iframe
              id="wnit-media-iframe"
              src=""
              title="RaioLabs WNIT Google Drive Player"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen>
            </iframe>
          </div>
        </div>
      </div>

      <!-- 🚨 KEV SYSTEM ONE INTERCEPT MODAL -->
      <div class="modal-overlay hidden" id="kev-intercept-modal">
        <div class="modal-card kev-intercept-card">
          <div class="kev-intercept-header">
            <div class="kev-intercept-title">
              <span class="kev-siren-icon">🚨</span>
              <div>
                <h3>KEV SYSTEM ONE // INTERCEPT</h3>
                <span class="kev-badge-warning">SECURITY VIOLATION DETECTED</span>
              </div>
            </div>
            <button class="close-btn" id="btn-close-kev-intercept">&times;</button>
          </div>
          <div class="kev-intercept-body">
            <div class="kev-avatar-box">
              <span class="kev-radar-pulse"></span>
              <span class="kev-bot-face">🚨</span>
            </div>
            <blockquote class="kev-implore-quote">
              "I must implore you NOT to click on this again."
            </blockquote>
            <p class="kev-implore-subtext">
              Traversing this link attempts to disengage kernel containment protocols and access the classified <strong>Praetorian Multi-Entity Fabric</strong>.
            </p>
            <div class="kev-telemetry-readout">
              <code>[SRC_TRACER]: RING_BUFFER_BREACH_ATTEMPT (0x7E3)</code><br>
              <code>[CLASSIFICATION]: PRAETORIAN ARCHITECTURE // RESTRICTED</code><br>
              <code>[GATEWAY_KEY]: 07281995 // For Angela Bennett</code>
            </div>
          </div>
          <div class="kev-intercept-footer">
            <button class="btn-secondary" id="btn-kev-abort">🛡️ Return to Safety</button>
            <button class="btn-danger-override" id="btn-kev-override">⚠️ Proceed to Praetorian</button>
          </div>
        </div>
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
  setupCollapsibleWindows();
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

// Setup independent collapse/expand controls for the windows underneath the robot
function setupCollapsibleWindows() {
  // 1. RaioBot Speech Bubble & Swarm Telemetry Dialog Collapse Toggle
  const toggleSpeechBtn = document.getElementById('btn-toggle-speech-bubble');
  const speechBubble = document.getElementById('bot-speech-bubble');
  if (toggleSpeechBtn && speechBubble) {
    toggleSpeechBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isCollapsed = speechBubble.classList.toggle('window-collapsed');
      const icon = toggleSpeechBtn.querySelector('.toggle-icon');
      const text = toggleSpeechBtn.querySelector('.toggle-text');
      if (icon) icon.textContent = isCollapsed ? '+' : '−';
      if (text) text.textContent = isCollapsed ? 'Expand' : 'Collapse';
    });
  }

  // 2. KEV-Bot Panel Collapse Toggle
  const toggleKevBtn = document.getElementById('btn-kev-collapse');
  const kevPanel = document.getElementById('kev-bot-panel');
  if (toggleKevBtn && kevPanel) {
    toggleKevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isCollapsed = kevPanel.classList.toggle('window-collapsed');
      const icon = document.getElementById('kev-collapse-icon');
      const text = document.getElementById('kev-collapse-text');
      if (icon) icon.textContent = isCollapsed ? '+' : '−';
      if (text) text.textContent = isCollapsed ? 'Expand' : 'Collapse';
    });
  }

  // 3. KEV-Bot Log Stream Maximize/Expand Viewport
  const expandKevStreamBtn = document.getElementById('btn-kev-expand-stream');
  const streamBox = document.getElementById('kev-stream-box');
  if (expandKevStreamBtn && streamBox) {
    expandKevStreamBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = streamBox.classList.toggle('stream-box-expanded');
      expandKevStreamBtn.classList.toggle('active', isExpanded);
      expandKevStreamBtn.title = isExpanded ? 'Restore stream to compact height' : 'Expand stream height for deep reading';
      expandKevStreamBtn.textContent = isExpanded ? '🗗 Compact' : '🗖 Expand';
      
      // Auto-collapse Patreon card if expanding stream to maximize log viewing estate
      if (isExpanded) {
        const patreonCard = document.getElementById('patreon-donate-card');
        if (patreonCard && !patreonCard.classList.contains('window-collapsed')) {
          patreonCard.classList.add('window-collapsed');
          const pIcon = document.getElementById('patreon-toggle-icon');
          const pText = document.getElementById('patreon-toggle-text');
          if (pIcon) pIcon.textContent = '+';
          if (pText) pText.textContent = 'Expand';
        }
      }
    });
  }

  // 4. Patreon Donate Card Collapse Toggle
  const togglePatreonBtn = document.getElementById('btn-toggle-patreon');
  const patreonCard = document.getElementById('patreon-donate-card');
  if (togglePatreonBtn && patreonCard) {
    togglePatreonBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isCollapsed = patreonCard.classList.toggle('window-collapsed');
      const icon = document.getElementById('patreon-toggle-icon');
      const text = document.getElementById('patreon-toggle-text');
      if (icon) icon.textContent = isCollapsed ? '+' : '−';
      if (text) text.textContent = isCollapsed ? 'Expand' : 'Collapse';

      // If user uncollapses Patreon, restore KEV stream to compact if needed
      if (!isCollapsed && streamBox && streamBox.classList.contains('stream-box-expanded')) {
        streamBox.classList.remove('stream-box-expanded');
        if (expandKevStreamBtn) {
          expandKevStreamBtn.classList.remove('active');
          expandKevStreamBtn.textContent = '🗖 Expand';
        }
      }
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
  // Canvas Nav Tabs switching across all views (including Praetorian classified gateway)
  const allViewIds = ['projects-view', 'swarm-view', 'workshops-view', 'dashboard-view', 'stage-view', 'praetorian-view'];
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
    if(e.target.id === 'rage-click-tester' || e.target.closest('aside') || e.target.closest('.modal-overlay')) return;
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

  // Reset codebase event
  document.getElementById('btn-reset-codebase').onclick = async () => {
    if(confirm('Restore workspace themes, stage props, and live extensions back to original state?')) {
      logToTerminal('system', 'ROLLBACK', 'Restoring AetherOS workspace to initial clean state...');
      const styleTag = document.getElementById('agent-injected-styles');
      if (styleTag) styleTag.remove();
      localStorage.removeItem('aether_stage_props');

      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isLocal) {
        try {
          await fetch(`${API_URL}/api/agent/reset`, { method: 'POST' });
        } catch (_) {
          // Local backend not running; static client reset is sufficient
        }
      }
      setTimeout(() => {
        window.location.reload();
      }, 600);
    }
  };

  // 🎵 Mozart's Ghost Synthesizer (The Net 1995 • Mozart Symphony No. 40 in G minor, K. 550)
  let mozartAudioCtx = null;
  let mozartIsHovering = false;
  let mozartLoopTimer = null;
  let mozartActiveOscs = [];
  let mozartActiveGains = [];
  let mozartMasterGain = null;

  function playMozartsGhostTheme() {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;
      if (!mozartAudioCtx) {
        mozartAudioCtx = new AudioCtxClass();
      }
      if (mozartAudioCtx.state === 'suspended') {
        mozartAudioCtx.resume();
      }

      // Clear any prior schedule
      mozartActiveOscs.forEach(o => {
        try { o.stop(); o.disconnect(); } catch (_) {}
      });
      mozartActiveOscs = [];
      mozartActiveGains = [];
      if (mozartLoopTimer) {
        clearTimeout(mozartLoopTimer);
        mozartLoopTimer = null;
      }

      mozartIsHovering = true;
      const ctx = mozartAudioCtx;
      const now = ctx.currentTime + 0.04;

      // Master Gain for smooth fade-in/fade-out
      mozartMasterGain = ctx.createGain();
      mozartMasterGain.gain.setValueAtTime(0.0001, now);
      mozartMasterGain.gain.linearRampToValueAtTime(0.24, now + 0.12);

      // Resonant 90s cyber synth filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1550, now);
      filter.Q.setValueAtTime(3.4, now);

      filter.connect(mozartMasterGain);
      mozartMasterGain.connect(ctx.destination);
      mozartActiveGains.push(mozartMasterGain);

      // Pitches (Hz) - Mozart No. 40 in G minor motif
      const PITCH = {
        'Eb5': 622.25,
        'D5':  587.33,
        'C5':  523.25,
        'Bb4': 466.16,
        'A4':  440.00,
        'G4':  392.00,
        'F#4': 369.99,
        'D4':  293.66
      };

      // Notes: [pitch, duration, pause]
      const notes = [
        // Phrase 1 (G minor)
        ['Eb5', 0.13, 0.03],
        ['D5',  0.13, 0.03],
        ['D5',  0.34, 0.07],

        ['Eb5', 0.13, 0.03],
        ['D5',  0.13, 0.03],
        ['D5',  0.34, 0.07],

        ['Eb5', 0.13, 0.03],
        ['D5',  0.13, 0.03],
        ['Bb4', 0.68, 0.14],

        // Phrase 2 (Descent to F/D minor)
        ['D5',  0.13, 0.03],
        ['C5',  0.13, 0.03],
        ['C5',  0.34, 0.07],

        ['D5',  0.13, 0.03],
        ['C5',  0.13, 0.03],
        ['C5',  0.34, 0.07],

        ['D5',  0.13, 0.03],
        ['C5',  0.13, 0.03],
        ['A4',  0.68, 0.14],

        // Phrase 3 (Descent to G minor)
        ['C5',  0.13, 0.03],
        ['Bb4', 0.13, 0.03],
        ['Bb4', 0.34, 0.07],

        ['Bb4', 0.13, 0.03],
        ['A4',  0.13, 0.03],
        ['A4',  0.34, 0.07],

        ['A4',  0.13, 0.03],
        ['G4',  0.13, 0.03],
        ['G4',  0.68, 0.14],

        // Dramatic Cadence
        ['F#4', 0.18, 0.04],
        ['G4',  0.18, 0.04],
        ['A4',  0.36, 0.05],
        ['D4',  0.84, 0.22]
      ];

      let t = now;
      notes.forEach(([name, dur, pause]) => {
        const freq = PITCH[name];
        if (!freq) return;

        // Lead Sawtooth Voice
        const oscLead = ctx.createOscillator();
        oscLead.type = 'sawtooth';
        oscLead.frequency.setValueAtTime(freq, t);
        oscLead.detune.setValueAtTime(4, t);

        // Sub Triangle Voice (90s Cyber Chiptune Body)
        const oscSub = ctx.createOscillator();
        oscSub.type = 'triangle';
        oscSub.frequency.setValueAtTime(freq * 0.5, t);
        oscSub.detune.setValueAtTime(-4, t);

        // Envelope
        const noteGain = ctx.createGain();
        noteGain.gain.setValueAtTime(0.0001, t);
        noteGain.gain.linearRampToValueAtTime(0.72, t + 0.015);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

        oscLead.connect(noteGain);
        oscSub.connect(noteGain);
        noteGain.connect(filter);

        oscLead.start(t);
        oscSub.start(t);
        oscLead.stop(t + dur + 0.04);
        oscSub.stop(t + dur + 0.04);

        mozartActiveOscs.push(oscLead, oscSub);
        mozartActiveGains.push(noteGain);

        t += dur + pause;
      });

      // Loop if mouse is still hovering
      const totalMs = Math.max(200, (t - now) * 1000);
      mozartLoopTimer = setTimeout(() => {
        if (mozartIsHovering) {
          playMozartsGhostTheme();
        }
      }, totalMs);

    } catch (err) {
      console.warn('Mozarts Ghost theme audio error:', err);
    }
  }

  function stopMozartsGhostTheme() {
    mozartIsHovering = false;
    if (mozartLoopTimer) {
      clearTimeout(mozartLoopTimer);
      mozartLoopTimer = null;
    }
    if (mozartMasterGain && mozartAudioCtx) {
      try {
        const curr = mozartAudioCtx.currentTime;
        mozartMasterGain.gain.cancelScheduledValues(curr);
        mozartMasterGain.gain.setValueAtTime(mozartMasterGain.gain.value, curr);
        mozartMasterGain.gain.exponentialRampToValueAtTime(0.0001, curr + 0.1);
      } catch (_) {}
    }
    setTimeout(() => {
      mozartActiveOscs.forEach(o => {
        try { o.stop(); o.disconnect(); } catch (_) {}
      });
      mozartActiveOscs = [];
      mozartActiveGains = [];
    }, 110);
  }

  // 👁️ Praetorian ("The Net" π) Secret Backdoor & KEV Intercept Event Listeners
  let praetorianClickCount = 0;
  const netBtn = document.getElementById('praetorian-net-btn');
  const kevModal = document.getElementById('kev-intercept-modal');
  const btnKevAbort = document.getElementById('btn-kev-abort');
  const btnKevOverride = document.getElementById('btn-kev-override');
  const btnCloseKev = document.getElementById('btn-close-kev-intercept');
  const btnExitPraetorian = document.getElementById('btn-exit-praetorian');

  if (netBtn) {
    // 🎵 Hover: Mozart's Ghost Theme (Mozart Symphony No. 40 in G minor)
    netBtn.addEventListener('mouseenter', () => {
      playMozartsGhostTheme();
    });

    netBtn.addEventListener('mouseleave', () => {
      stopMozartsGhostTheme();
    });

    netBtn.addEventListener('click', () => {
      stopMozartsGhostTheme();
      praetorianClickCount++;
      if (praetorianClickCount === 1) {
        // 1. Physically pop KEV-Bot onto the character stage field!
        if (typeof showCompanionSwarmInteraction === 'function') {
          showCompanionSwarmInteraction({
            from: 'orchestrator',
            to: 'kev',
            protocol: 'RING0_CONTAINMENT_INTERCEPT',
            badge: '🚨 KEV SYSTEM ONE INTERCEPT',
            logType: 'error',
            logTag: 'KEV_INTERCEPT',
            senderLine: '🎛️ RaioBot (Orchestrator): "WARNING: Unregistered backdoor probe detected at the perimeter!"',
            message: '🚨 KEV-Bot: "I must implore you NOT to click on this again."',
            payload: '{\n  "event": "BACKDOOR_INTERROGATION_DETECTED",\n  "status": "CONTAINMENT_TRIGGERED",\n  "verdict": "I must implore you NOT to click on this again",\n  "gateway_key": "07281995 // For Angela Bennett"\n}'
          }, 1, 1, '🚨 KEV SYSTEM ONE INTERCEPT');
        }

        // 2. Set RaioBot alarmed reaction on stage
        if (typeof setBotReaction === 'function') {
          setBotReaction('alarmed', '🚨 KEV INTERCEPT', 'I must implore you NOT to click on this again.', '🚨');
        }

        // 3. Ensure the stage field is scrolled into view so the user sees KEV pop up
        const stageEl = document.getElementById('bot-character-stage');
        if (stageEl) {
          stageEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // 4. Show KEV Intercept warning modal
        if (kevModal) {
          kevModal.classList.remove('hidden');
        }

        logToTerminal('warn', 'KEV_INTERCEPT', '🚨 KEV System One popped onto field: "I must implore you NOT to click on this again." [07281995]');
      } else {
        // Second click overrides and proceeds to Praetorian
        if (kevModal) kevModal.classList.add('hidden');
        switchWorkspaceView('praetorian-view');
        praetorianClickCount = 0;
        logToTerminal('error', 'PRAETORIAN_GATE', '⚠️ [OVERRIDE RATIFIED] Clearance key 07281995 verified. Entering Praetorian structure. For Angela Bennett.');
      }
    });

    if (btnKevAbort) {
      btnKevAbort.addEventListener('click', () => {
        kevModal.classList.add('hidden');
        praetorianClickCount = 0;
        logToTerminal('info', 'KEV_GUARD', 'Operator complied with KEV System One advisory. Aborted.');
      });
    }

    if (btnCloseKev) {
      btnCloseKev.addEventListener('click', () => {
        kevModal.classList.add('hidden');
        praetorianClickCount = 0;
      });
    }

    if (btnKevOverride) {
      btnKevOverride.addEventListener('click', () => {
        kevModal.classList.add('hidden');
        switchWorkspaceView('praetorian-view');
        praetorianClickCount = 0;
        logToTerminal('error', 'PRAETORIAN_GATE', '⚠️ [OVERRIDE RATIFIED] Clearance key 07281995 accepted. Loading Praetorian structure. For Angela Bennett.');
      });
    }
  }

  if (btnExitPraetorian) {
    btnExitPraetorian.addEventListener('click', () => {
      switchWorkspaceView('projects-view');
      logToTerminal('info', 'PRAETORIAN_EXIT', 'Operator returned to surface (RaioLabs projects).');
    });
  }
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

// Helper to switch main canvas view tab programmatically
function switchWorkspaceView(targetViewId) {
  const allViewIds = ['projects-view', 'swarm-view', 'workshops-view', 'dashboard-view', 'stage-view', 'praetorian-view'];
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-target') === targetViewId);
  });
  allViewIds.forEach(viewId => {
    const el = document.getElementById(viewId);
    if (el) el.classList.toggle('hidden', viewId !== targetViewId);
  });
  if (targetViewId === 'stage-view') {
    initializeStageElements();
  }
}

// Helper to append or update dynamic CSS in #agent-injected-styles
function appendAgentStyles(cssSnippet) {
  let styleTag = document.getElementById('agent-injected-styles');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'agent-injected-styles';
    document.head.appendChild(styleTag);
  }
  if (!styleTag.textContent.includes(cssSnippet.trim().slice(0, 40))) {
    styleTag.textContent += '\n' + cssSnippet;
  }
}

// Client-side RaioBot Conversational & Live DOM Self-Modification Engine
function runClientSideAgentSynthesis(compiledPrompt = '') {
  const rawPrompt = (compiledPrompt || '').trim();
  const lower = rawPrompt.toLowerCase();
  const hasRageClick = state.interactions.some(i => i.type === 'rage_click');

  // 1. Rage-Click Auto-Remediation
  if (hasRageClick && !rawPrompt) {
    appendAgentStyles(`
      .rage-shield {
        position: fixed; bottom: 2rem; right: 22rem; width: 320px;
        background: var(--bg-card); border: 2px solid #ef4444; border-radius: 12px;
        padding: 1.5rem; box-shadow: 0 10px 25px rgba(239, 68, 68, 0.25);
        animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); z-index: 10000;
      }
      .rage-shield h4 { margin: 0 0 8px; color: #ef4444; display: flex; align-items: center; gap: 8px; }
      .rage-shield p { font-size: 0.85rem; margin: 0 0 12px; color: var(--text-primary); }
      .rage-btn-group { display: flex; gap: 8px; }
      .rage-resolve-btn { background: #ef4444; color: white; border: none; border-radius: 6px; padding: 6px 12px; font-size: 0.75rem; font-weight: bold; cursor: pointer; }
      .rage-ignore-btn { background: transparent; border: 1px solid var(--border-color); color: var(--text-secondary); border-radius: 6px; padding: 6px 12px; font-size: 0.75rem; cursor: pointer; }
    `);
    window.dismissRageShield = function(resolve) {
      const shield = document.getElementById('rage-diagnostic-shield');
      if (shield) shield.remove();
      if (resolve) {
        const rageBtn = document.getElementById('rage-click-tester');
        if (rageBtn) {
          rageBtn.style.background = '#10b981';
          rageBtn.style.color = '#000';
          rageBtn.textContent = 'Rage Resolved! Click for Confetti';
          rageBtn.onclick = () => {
            setBotReaction('party', '🎉 RAGE REMEDIATED!', 'High-five from RaioBot! Stress levels nominal! 🥳', '🎉');
          };
        }
      }
    };
    if (!document.getElementById('rage-diagnostic-shield')) {
      const shield = document.createElement('div');
      shield.id = 'rage-diagnostic-shield';
      shield.className = 'rage-shield';
      shield.innerHTML = `
        <h4>⚠️ Stress Loop Detected</h4>
        <p>RaioBot noticed rapid clicks on the Rage Tester button. Apply auto-remediation patch?</p>
        <div class="rage-btn-group">
          <button class="rage-resolve-btn" onclick="dismissRageShield(true)">Apply Auto-Fix</button>
          <button class="rage-ignore-btn" onclick="dismissRageShield(false)">Ignore Bot</button>
        </div>
      `;
      document.body.appendChild(shield);
    }
    setBotReaction('surprised', '🛡️ RAGE SHIELD DEPLOYED', 'Detected high-frequency click friction! I injected a live diagnostic shield to patch the button.', '🛠️');
    emitKevAnalysis('RAGE_HOTFIX', 'Injected live DOM remediation shield for #rage-click-tester.', null, null, 'action');
    return;
  }

  // 2. Conversational Q&A: "Are you real?", "Who are you?", "Sentient?", etc.
  if (
    lower.includes('are you real') ||
    lower.includes('you a real') ||
    lower.includes('sentient') ||
    lower.includes('are you alive') ||
    lower.includes('who are you') ||
    lower.includes('what are you') ||
    lower.includes('are you a bot') ||
    lower.includes('are you ai') ||
    lower.includes('are you human')
  ) {
    setBotReaction(
      'hype',
      '🤖 100% REAL SILICON & eBPF!',
      'I am RaioBot ⚡ — Matt\'s resident autonomous AI companion living right inside the AetherOS DOM! I monitor telemetry, coordinate our 5-node IDE Swarm, and can even hot-patch this site live. Try telling me: "neon theme", "play tic tac toe", "reenact Macbeth", or "run swarm"!',
      '⚡'
    );
    emitKevAnalysis('IDENTITY_ACK', `Operator asked "${rawPrompt}". Confirmed RaioBot Category-4 resident agent identity.`, null, null, 'info');
    return;
  }

  // 3. Greetings
  if (/^(hi|hello|hey|yo|sup|howdy|greetings|good morning|good evening)\b/i.test(lower)) {
    setBotReaction(
      'happy',
      '👋 HELLO OPERATOR!',
      'Hey there! Welcome to RaioLabs LLC ⚡! Ask me about Matt\'s 60+ open-source repos, OWASP talks, or Hurricane Bot Categories — or ask me to edit the site ("neon theme", "cosmic stage", "play a game", "todo list")!',
      '✨'
    );
    emitKevAnalysis('GREETING', `Greeted operator in response to "${rawPrompt}".`, null, null, 'info');
    return;
  }

  // 4. About Matt / RaioLabs
  if (lower.includes('matt') || lower.includes('raiolabs') || lower.includes('raio labs') || lower.includes('who built') || lower.includes('about')) {
    triggerRaioLightningSurge(false);
    setBotReaction(
      'love',
      '⚡ ABOUT RAIOLABS LLC',
      '"Raio" means Lightning in Portuguese ⚡! RaioLabs LLC is Matt\'s AI & Cybersecurity engineering lab — featuring 60+ open-source repositories, Category 1–5 Autonomous Bot Controls (NIST SP 800-53 & OWASP SPVS), eBPF ring-0 telemetry, and hands-on workshops!',
      '⚡'
    );
    emitKevAnalysis('RAIOLABS_INFO', 'Shared RaioLabs LLC mission, NIST/OWASP frameworks, and open-source lab overview.', null, null, 'info');
    return;
  }

  // 5. What's New In Tech (WNIT) / Google Drive Shared Media Vault
  if (lower.includes('wnit') || lower.includes("what's new in tech") || lower.includes('whats new in tech') || lower.includes('deepak') || (lower.includes('capobianco') && !lower.includes('vibeops'))) {
    renderWnitGrid();
    const wnitModal = document.getElementById('wnit-modal');
    if (wnitModal) {
      wnitModal.classList.remove('hidden');
      document.body.classList.add('website-blurred-bg');
    }
    setBotReaction(
      'hype',
      '🎙️ WHAT\'S NEW IN TECH (WNIT)',
      'I opened the WNIT Google Drive Media Vault for you! Stream full HD videos and audio podcast episodes with John Capobianco and Deepak Kakadia right in the foreground player while keeping the workspace in view!',
      '🎙️'
    );
    emitKevAnalysis('OPEN_WNIT', 'Opened What\'s New In Tech (WNIT) Google Drive modal from chat command.', null, null, 'action');
    return;
  }

  // 6. Appearances / YouTube / Videos / Podcasts
  if (lower.includes('appearance') || lower.includes('youtube') || lower.includes('video') || lower.includes('podcast') || lower.includes('watch')) {
    const appearancesModal = document.getElementById('appearances-modal');
    if (appearancesModal) {
      appearancesModal.classList.remove('hidden');
      document.body.classList.add('website-blurred-bg');
    }
    setBotReaction(
      'hype',
      '🎬 RECENT APPEARANCES',
      'I opened the Recent Appearances media deck for you! Click on any of the appearances below to stream Matt\'s talks and podcasts right in the foreground player!',
      '🎬'
    );
    emitKevAnalysis('OPEN_APPEARANCES', 'Opened Recent Appearances YouTube modal from chat command.', null, null, 'action');
    return;
  }

  // 7. Events / OWASP / Conferences
  if (lower.includes('event') || lower.includes('owasp') || lower.includes('conference') || lower.includes('vegas')) {
    renderCyberEventsGrid();
    const eventsModal = document.getElementById('events-modal');
    if (eventsModal) {
      eventsModal.classList.remove('hidden');
      document.body.classList.add('website-blurred-bg');
    }
    setBotReaction(
      'hype',
      '🛡️ CYBER & OWASP EVENTS',
      'Here are Matt\'s Cybersecurity & OWASP appearances, talks, and workshops! Click any event card to watch the recording or explore the lab resources.',
      '🛡️'
    );
    emitKevAnalysis('OPEN_EVENTS', 'Opened Events & OWASP modal from chat command.', null, null, 'action');
    return;
  }

  // 7. Swarm / Subagents / A2A / MCP
  if (lower.includes('swarm') || lower.includes('subagent') || lower.includes('a2a') || lower.includes('mcp') || lower.includes('worktree')) {
    switchWorkspaceView('swarm-view');
    runSwarmSimulation(state.activeSwarmScenario);
    setBotReaction(
      'hype',
      '🐝 LAUNCHING IDE SWARM!',
      'Switching to the IDE Swarm Cockpit and firing up our 5-node multi-agent telemetry simulation over MCP + A2A JSON-RPC!',
      '🐝'
    );
    return;
  }

  // 8. Projects / Repos / GitHub
  if (lower.includes('project') || lower.includes('repo') || lower.includes('github') || lower.includes('open source')) {
    switchWorkspaceView('projects-view');
    setBotReaction(
      'happy',
      '🐙 FEATURED GITHUB REPOS',
      'Here are Matt\'s featured GitHub repositories! Click "🤖 Ask RaioBot" on any card for my take, or click "Live Sync @mattreya GitHub API" to pull all 60+ public repos live!',
      '🐙'
    );
    emitKevAnalysis('VIEW_PROJECTS', 'Switched workspace to GitHub Projects showcase.', null, null, 'info');
    return;
  }

  // 9. Workshops / Training / Hurricane Scale
  if (lower.includes('workshop') || lower.includes('curriculum') || lower.includes('training') || lower.includes('course') || lower.includes('hurricane') || lower.includes('nist')) {
    switchWorkspaceView(lower.includes('hurricane') || lower.includes('nist') ? 'projects-view' : 'workshops-view');
    setBotReaction(
      'thinking',
      '🎓 WORKSHOPS & BOT CONTROLS',
      'Check out our hands-on AI & Cyber Engineering Workshops and the 5-Category Hurricane Bot Scale mapped to NIST SP 800-53 & CISA controls!',
      '🎓'
    );
    emitKevAnalysis('VIEW_WORKSHOPS', 'Navigated to Workshops & NIST Bot Controls.', null, null, 'info');
    return;
  }

  // 10. Shadow Puppet Theatre of the 5 Bots
  if (lower.includes('shadow puppet') || lower.includes('puppet') || lower.includes('wayang') || lower.includes('shadow theatre') || lower.includes('act out') || lower.includes('story') || lower.includes('fable')) {
    switchWorkspaceView('stage-view');
    initShadowPuppetTheatre();
    playPuppetPlayback();
    setBotReaction(
      'hype',
      '🎭 SHADOW PUPPET THEATRE LIVE!',
      'Switched to the Wayang Kulit Shadow Puppet Stage! The 5 Bot Archetypes are acting out the cyber-fable on the backlit screen with their shadow rods!',
      '🎭'
    );
    emitKevAnalysis('SHADOW_THEATRE', 'Activated Wayang Kulit Shadow Puppet Theatre and began acting out scene.', null, null, 'action');
    return;
  }

  // 11. Macbeth Theatre Reenactment
  if (lower.includes('macbeth') || lower.includes('shakespeare') || lower.includes('reenact') || lower.includes('witch')) {
    appendAgentStyles(`
      .theatre-stage.macbeth-atmosphere {
        background: radial-gradient(circle at 50% 50%, #111827, #020617) !important;
        box-shadow: inset 0 0 100px rgba(34, 197, 94, 0.25) !important;
      }
    `);
    state.stageProps = [
      { id: 'macbeth-witch-1', emoji: '🧙‍♀️', name: 'First Witch', x: 15, y: 10, cracks: 0 },
      { id: 'macbeth-cauldron', emoji: '🍲', name: 'Double Cauldron', x: 30, y: 5, cracks: 0 },
      { id: 'macbeth-witch-2', emoji: '🧙‍♀️', name: 'Second Witch', x: 40, y: 10, cracks: 0 },
      { id: 'macbeth-witch-3', emoji: '🧙‍♀️', name: 'Third Witch', x: 50, y: 10, cracks: 0 },
      { id: 'macbeth-king', emoji: '👑', name: 'Macbeth', x: 80, y: 15, cracks: 0 },
      { id: 'macbeth-dagger', emoji: '🗡️', name: 'Spectral Dagger', x: 68, y: 32, cracks: 0 }
    ];
    localStorage.setItem('aether_stage_props', JSON.stringify(state.stageProps));
    switchWorkspaceView('stage-view');
    const stage = document.getElementById('theatre-stage');
    if (stage) {
      stage.classList.remove('creation-vibe', 'destruction-vibe');
      stage.classList.add('macbeth-atmosphere');
    }
    setBotReaction(
      'hype',
      '🎭 MACBETH ACT I STAGE BUILT!',
      '"Fair is foul, and foul is fair!" 🧙‍♀️🍲👑 I switched to the Theatre Stage and assembled the Three Witches, Double Cauldron, Macbeth, and Spectral Dagger with eerie green fog!',
      '🎭'
    );
    emitKevAnalysis('STAGE_SYNTHESIS', 'Constructed Shakespeare Macbeth Act I prop layout on Theatre Stage.', null, null, 'action');
    return;
  }

  // 11. Cosmic / Space Stage Theme
  if (lower.includes('space') || lower.includes('cosmic') || lower.includes('nebula') || lower.includes('galaxy')) {
    appendAgentStyles(`
      :root {
        --stage-ambient: #0d061f;
        --stage-glow: rgba(139, 92, 246, 0.45);
      }
      .stage-stars::after {
        content: ''; position: absolute; inset: 0;
        background: radial-gradient(circle at 30% 20%, rgba(236, 72, 153, 0.2), transparent 50%),
                    radial-gradient(circle at 70% 60%, rgba(59, 130, 246, 0.2), transparent 50%);
        z-index: 2; mix-blend-mode: color-dodge; pointer-events: none;
      }
    `);
    switchWorkspaceView('stage-view');
    setBotReaction(
      'love',
      '🌌 COSMIC NEBULA STAGE ACTIVE!',
      'I hot-patched the Theatre Stage stylesheet with deep violet-nebula gradients and starry color-dodge shaders! Use the Drill tool to place Space UFOs on stage!',
      '🛸'
    );
    emitKevAnalysis('HOT_CSS', 'Applied Cosmic Nebula shader variables to Theatre Stage.', null, null, 'action');
    return;
  }

  // 12. Gold Stage Curtains
  if (lower.includes('curtain') || lower.includes('gold')) {
    appendAgentStyles(`
      .curtain-left, .curtain-right {
        background: linear-gradient(to right, #78350f, #d97706 40%, #78350f 80%, #451a03) !important;
      }
      .curtain-valance {
        background: linear-gradient(to bottom, #d97706, #78350f 70%, #451a03) !important;
      }
    `);
    switchWorkspaceView('stage-view');
    setBotReaction(
      'party',
      '✨ IMPERIAL GOLD CURTAINS!',
      'Upgraded the velvet theatre curtains to rich Imperial Gold! Check out the Theatre Stage!',
      '👑'
    );
    emitKevAnalysis('HOT_CSS', 'Overrode stage curtain gradients with Imperial Gold palette.', null, null, 'action');
    return;
  }

  // 13. Neon / Cyberpunk Theme
  if (lower.includes('neon') || lower.includes('dark') || lower.includes('cyber') || lower.includes('futuristic') || lower.includes('theme')) {
    appendAgentStyles(`
      :root {
        --bg-canvas: #07070c;
        --bg-card: rgba(12, 14, 26, 0.82);
        --accent: #00f0ff;
        --accent-glow: rgba(0, 240, 255, 0.45);
        --border-color: rgba(0, 240, 255, 0.28);
        --shadow-card: 0 0 18px rgba(0, 240, 255, 0.16);
      }
      .agent-injected-badge {
        background: linear-gradient(135deg, #00f0ff, #ff007f);
        color: white; padding: 2px 8px; border-radius: 99px;
        font-size: 0.72rem; font-weight: bold; margin-left: 6px;
      }
    `);
    const logoText = document.querySelector('.logo-text');
    if (logoText && !logoText.querySelector('.agent-injected-badge')) {
      logoText.insertAdjacentHTML('beforeend', ' <span class="agent-injected-badge">NEON</span>');
    }
    setBotReaction(
      'hype',
      '⚡ CYBERPUNK NEON THEME INJECTED!',
      'Boom! I hot-patched the root CSS variables with electric cyan (#00f0ff) and obsidian glassmorphism across the entire workspace!',
      '⚡'
    );
    emitKevAnalysis('HOT_CSS', 'Injected Cyberpunk Neon root CSS variables into document head.', null, null, 'action');
    return;
  }

  // 14. Tic-Tac-Toe Minigame Injection
  if (lower.includes('game') || lower.includes('tic') || lower.includes('play') || lower.includes('bored')) {
    appendAgentStyles(`
      .ttt-container {
        background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
        padding: 1.5rem; margin-top: 1.25rem; text-align: center; box-shadow: var(--shadow-card);
      }
      .ttt-board {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
        max-width: 190px; margin: 1rem auto;
      }
      .ttt-cell {
        aspect-ratio: 1; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color);
        border-radius: 8px; font-size: 1.5rem; font-weight: bold; color: var(--accent);
        display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;
      }
      .ttt-cell:hover { background: rgba(255, 255, 255, 0.12); transform: scale(1.05); }
      .ttt-status { font-size: 0.9rem; margin-bottom: 0.5rem; color: var(--text-primary); }
      .ttt-reset-btn {
        background: var(--accent); color: #000; border: none; padding: 6px 14px;
        border-radius: 6px; font-size: 0.8rem; font-weight: bold; cursor: pointer;
      }
    `);
    switchWorkspaceView('dashboard-view');
    const targetDeck = document.getElementById('widget-injected');
    if (targetDeck) {
      targetDeck.innerHTML = `
        <h3>🔌 AI Live Extension Deck</h3>
        <p>RaioBot synthesized and mounted an interactive Tic-Tac-Toe minigame directly into the DOM:</p>
        <div class="ttt-container">
          <h4 style="margin-top:0; color:var(--accent);">🤖 RaioBot vs. Operator: Tic-Tac-Toe</h4>
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
      `;
      const cells = targetDeck.querySelectorAll('.ttt-cell');
      const statusText = document.getElementById('ttt-status');
      const resetBtn = document.getElementById('ttt-reset');
      let board = ['', '', '', '', '', '', '', '', ''];
      let gameActive = true;
      const winPatterns = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      const checkWinner = () => {
        for (const p of winPatterns) {
          if (board[p[0]] && board[p[0]] === board[p[1]] && board[p[0]] === board[p[2]]) return board[p[0]];
        }
        return board.includes('') ? null : 'T';
      };
      cells.forEach(cell => {
        cell.addEventListener('click', () => {
          const idx = parseInt(cell.getAttribute('data-index'), 10);
          if (board[idx] !== '' || !gameActive) return;
          board[idx] = 'X';
          cell.textContent = 'X';
          const w = checkWinner();
          if (w) {
            gameActive = false;
            statusText.textContent = w === 'T' ? "It's a draw! 🤝" : "You (X) win! GG Operator! 🏆";
            return;
          }
          statusText.textContent = 'RaioBot is thinking...';
          setTimeout(() => {
            const empty = board.map((v, i) => v === '' ? i : null).filter(v => v !== null);
            if (!empty.length || !gameActive) return;
            const pick = empty[Math.floor(Math.random() * empty.length)];
            board[pick] = 'O';
            cells[pick].textContent = 'O';
            const w2 = checkWinner();
            if (w2) {
              gameActive = false;
              statusText.textContent = w2 === 'T' ? "It's a draw! 🤝" : "RaioBot (O) wins! ⚡🤖";
            } else {
              statusText.textContent = 'Your turn (Player X)';
            }
          }, 400);
        });
      });
      if (resetBtn) {
        resetBtn.onclick = () => {
          board = ['', '', '', '', '', '', '', '', ''];
          cells.forEach(c => { c.textContent = ''; });
          gameActive = true;
          statusText.textContent = 'Your turn (Player X)';
        };
      }
    }
    setBotReaction(
      'party',
      '🎮 TIC-TAC-TOE MOUNTED!',
      'I compiled a live Tic-Tac-Toe minigame into the Live Playground tab! Make your move (Player X) — let\'s see if you can beat my heuristics!',
      '🎮'
    );
    emitKevAnalysis('HOT_JS', 'Mounted interactive Tic-Tac-Toe module in #widget-injected.', null, null, 'action');
    return;
  }

  // 15. Todo / Task Tracker Injection
  if (lower.includes('task') || lower.includes('todo') || lower.includes('list') || lower.includes('checklist')) {
    appendAgentStyles(`
      .todo-card {
        background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
        padding: 1.25rem; margin-top: 1.25rem; box-shadow: var(--shadow-card);
      }
      .todo-input-row { display: flex; gap: 8px; margin-bottom: 1rem; }
      .todo-input {
        flex: 1; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color);
        border-radius: 6px; padding: 8px 12px; color: var(--text-primary); font-size: 0.9rem;
      }
      .todo-add-btn {
        background: var(--accent); color: #000; border: none; border-radius: 6px;
        padding: 8px 16px; font-weight: bold; cursor: pointer;
      }
      .todo-list { display: flex; flex-direction: column; gap: 8px; }
      .todo-item {
        display: flex; align-items: center; gap: 10px; padding: 8px 10px;
        background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 8px;
      }
      .todo-item.done { opacity: 0.6; text-decoration: line-through; }
    `);
    switchWorkspaceView('dashboard-view');
    const targetDeck = document.getElementById('widget-injected');
    if (targetDeck) {
      targetDeck.innerHTML = `
        <h3>🔌 AI Live Extension Deck</h3>
        <div class="todo-card">
          <h4 style="margin:0 0 10px; color:var(--accent);">✅ Resident Task Tracker</h4>
          <div class="todo-input-row">
            <input type="text" class="todo-input" id="todo-input-field" placeholder="Add new autonomous task...">
            <button class="todo-add-btn" id="todo-add-btn">Add</button>
          </div>
          <div class="todo-list" id="todo-list-container">
            <div class="todo-item"><input type="checkbox" class="todo-checkbox"> <span class="todo-text">Audit Category-4 bot controls against NIST SP 800-53</span></div>
            <div class="todo-item"><input type="checkbox" class="todo-checkbox"> <span class="todo-text">Run 5-node IDE Swarm simulation</span></div>
          </div>
        </div>
      `;
      const container = document.getElementById('todo-list-container');
      const input = document.getElementById('todo-input-field');
      const btn = document.getElementById('todo-add-btn');
      const bindChecks = () => {
        container.querySelectorAll('.todo-checkbox').forEach(cb => {
          cb.onchange = () => cb.closest('.todo-item').classList.toggle('done', cb.checked);
        });
      };
      if (btn && input && container) {
        btn.onclick = () => {
          const val = input.value.trim();
          if (!val) return;
          const item = document.createElement('div');
          item.className = 'todo-item';
          item.innerHTML = `<input type="checkbox" class="todo-checkbox"> <span class="todo-text">${escapeHtml(val)}</span>`;
          container.appendChild(item);
          input.value = '';
          bindChecks();
        };
        input.onkeydown = (e) => { if (e.key === 'Enter') btn.click(); };
        bindChecks();
      }
    }
    setBotReaction(
      'happy',
      '📋 TASK TRACKER MOUNTED!',
      'I generated an interactive Task Tracker widget in the Live Playground tab so you can track your engineering objectives!',
      '✅'
    );
    emitKevAnalysis('HOT_JS', 'Injected interactive Todo checklist component into #widget-injected.', null, null, 'action');
    return;
  }

  // 16. General Custom Prompt Fallback (Conversational + Live Extension Card)
  const targetDeck = document.getElementById('widget-injected');
  if (targetDeck && rawPrompt) {
    targetDeck.innerHTML = `
      <h3>🔌 AI Live Extension Deck</h3>
      <div style="background:var(--bg-card); border:1px solid var(--accent); border-radius:12px; padding:1.25rem; margin-top:1rem; box-shadow:var(--shadow-card);">
        <div style="color:var(--accent); font-weight:bold; margin-bottom:6px;">🤖 RaioBot Live Synthesis</div>
        <p style="font-size:0.9rem; margin:0;">Processed operator prompt: <strong>"${escapeHtml(rawPrompt)}"</strong>. Try commands like <code>"neon theme"</code>, <code>"play tic tac toe"</code>, <code>"reenact Macbeth"</code>, <code>"run swarm"</code>, or <code>"show appearances"</code>!</p>
      </div>
    `;
  }
  setBotReaction(
    'happy',
    '🤖 RAIOBOT // PROMPT PROCESSED',
    `Got your message: "${rawPrompt}"! ⚡ I'm RaioBot, Matt's autonomous companion. You can ask me "Are you real?", "Tell me about RaioLabs", "Show appearances", "Run swarm", or tell me to live-edit the site with "neon theme", "cosmic stage", "play tic tac toe", or "reenact Macbeth"!`,
    '✨'
  );
  emitKevAnalysis('PROMPT_SYNTHESIS', `Processed operator chat input: "${rawPrompt}".`, null, null, 'info');
}

// Trigger autonomous agent code generation and filesystem writes
async function triggerAgentSelfModification(customPrompt = '') {
  state.isGenerating = true;
  
  // Transition agent status panel visual signals
  const statusOrb = document.getElementById('agent-status-orb');
  const statusMsg = document.getElementById('agent-status-msg');
  
  if (statusOrb) statusOrb.className = 'status-orb working';
  if (statusMsg) statusMsg.textContent = 'Status: Processing neural synthesis...';

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

  const finishGeneration = () => {
    if (statusOrb) statusOrb.className = 'status-orb observing';
    if (statusMsg) statusMsg.textContent = 'Status: Observing Interaction...';
    state.isGenerating = false;
    if (noteEl && noteEl.value) {
      noteEl.value = '';
    }
  };

  // Only attempt local Express server if running on localhost AND not a conversational query
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (!isLocal) {
    setTimeout(() => {
      runClientSideAgentSynthesis(compiledPrompt);
      finishGeneration();
    }, 350);
    return;
  }

  // Load codebase files in local memory to send to local dev server if available
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
      // If simulated generic fallback triggered on server, use our rich client-side handler so conversational prompts like "Are you real" get real answers!
      if (data.simulated) {
        runClientSideAgentSynthesis(compiledPrompt);
        finishGeneration();
        return;
      }

      logToTerminal('thought', 'SYNTHESIS', data.thought || 'Determined layout enhancement necessary.');
      setTimeout(() => {
        logToTerminal('action', 'APPLYING', data.action || 'Modifying workspace files.');
      }, 600);

      setTimeout(() => {
        if (data.files && data.files.length > 0) {
          data.files.forEach(modFile => {
            state.files[modFile.name] = modFile.content;
            if (modFile.name === 'src/style.css') {
              let styleTag = document.getElementById('agent-injected-styles');
              if(!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = 'agent-injected-styles';
                document.head.appendChild(styleTag);
              }
              styleTag.textContent = modFile.content;
            }
            if (modFile.name === 'src/main.js') {
              const htmlMatch = modFile.content.match(/<!-- AGENT_INJECTION_POINT -->([\s\S]*?)<!-- AGENT_INJECTION_POINT -->/);
              if (htmlMatch && htmlMatch[1]) {
                const targetDeck = document.getElementById('widget-injected');
                if (targetDeck) {
                  targetDeck.innerHTML = `<h3>🔌 AI Live Extension Deck</h3><p>New components, games, and templates generated by the resident agent are injected directly below.</p>` + htmlMatch[1];
                }
              }
            }
          });
          renderActiveFile();
        }
        finishGeneration();
      }, 1200);
    } else {
      runClientSideAgentSynthesis(compiledPrompt);
      finishGeneration();
    }
  } catch (_) {
    // Local server.js is not running (e.g. vite dev/preview or static browser session) -> seamlessly run client-side synthesis!
    runClientSideAgentSynthesis(compiledPrompt);
    finishGeneration();
  }
}

// Helper to extract script blocks to execute
function extractScriptContent(fullJs, searchMarker) {
  const index = fullJs.indexOf(searchMarker);
  if(index === -1) return '';
  return fullJs.slice(index);
}

// --- Wayang Kulit Shadow Puppet Theatre Engine ---

// Puppet Horizontal Positions on Stage (percentages)
const SHADOW_POSITIONS = {
  'offstage-left': -22,
  'left': 18,
  'center-left': 34,
  'center': 50,
  'center-right': 66,
  'right': 82,
  'offstage-right': 118
};

// Dynamic stage positions
const puppetStageCoords = {
  cat1: { pos: -22, onStage: false },
  cat2: { pos: 118, onStage: false },
  cat3: { pos: -22, onStage: false },
  cat4: { pos: 118, onStage: false },
  cat5: { pos: -22, onStage: false },
  narrator: { pos: 50, onStage: true }
};

let puppetPlayTimer = null;
let typingTimeoutId = null;

function initializeStageElements() {
  initShadowPuppetTheatre();
}

function initShadowPuppetTheatre() {
  const container = document.getElementById('shadow-puppets-container');
  if (!container) return;

  // Render puppets onto stage if not already initialized
  if (!container.dataset.initialized) {
    container.innerHTML = '';
    const actors = ['narrator', 'cat1', 'cat2', 'cat3', 'cat4', 'cat5'];

    actors.forEach(key => {
      const def = BOT_PUPPET_DEFS[key];
      if (!def) return;

      const actorEl = document.createElement('div');
      actorEl.id = `puppet-${key}`;
      actorEl.className = 'shadow-puppet-actor';
      actorEl.dataset.actor = key;
      actorEl.style.setProperty('--puppet-accent', def.color);
      actorEl.style.setProperty('--puppet-glow', def.glow);

      const initialLeft = (key === 'narrator') ? 50 : (key.charCodeAt(3) % 2 === 0 ? 118 : -22);
      actorEl.style.left = `${initialLeft}%`;
      puppetStageCoords[key] = { pos: initialLeft, onStage: (key === 'narrator') };

      actorEl.innerHTML = `
        <div class="puppet-halo"></div>
        <div class="puppet-figure-wrap">
          ${def.svg}
        </div>
        <div class="puppet-name-tag">
          <span>${def.symbol}</span> ${def.name}
        </div>
      `;

      actorEl.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerPuppetInteraction(key);
      });

      container.appendChild(actorEl);
    });

    // Populate cast grid
    renderShadowCastGrid();

    // Spawn ambient floating golden dust motes
    spawnShadowDustMotes();

    // Load initial story script into textarea & state
    const textarea = document.getElementById('script-raw-textarea');
    if (textarea && !textarea.value.trim()) {
      textarea.value = SAMPLE_SCRIPTS[0].text;
      state.shadowPuppet.scriptText = textarea.value;
      state.shadowPuppet.cues = parseScriptText(textarea.value);
      updateSubtitleCueStep(0, state.shadowPuppet.cues.length);
    }

    // Attach all director & playback controls
    bindShadowPuppetControls();

    container.dataset.initialized = 'true';
  }
}

function spawnShadowDustMotes() {
  const dustContainer = document.getElementById('shadow-dust-container');
  if (!dustContainer) return;
  dustContainer.innerHTML = '';

  for (let i = 0; i < 16; i++) {
    const mote = document.createElement('div');
    mote.className = 'shadow-dust-mote';
    mote.style.left = `${Math.random() * 96}%`;
    mote.style.animationDuration = `${3.5 + Math.random() * 4.5}s`;
    mote.style.animationDelay = `${Math.random() * 3}s`;
    mote.style.setProperty('--mote-drift', `${-20 + Math.random() * 40}px`);
    mote.style.opacity = (0.2 + Math.random() * 0.5).toString();
    dustContainer.appendChild(mote);
  }
}

function renderShadowCastGrid() {
  const grid = document.getElementById('shadow-cast-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const castKeys = ['cat1', 'cat2', 'cat3', 'cat4', 'cat5', 'narrator'];

  castKeys.forEach(key => {
    const def = BOT_PUPPET_DEFS[key];
    if (!def) return;

    const card = document.createElement('div');
    card.className = 'cast-card';
    card.dataset.actor = key;
    card.style.setProperty('--cast-color', def.color);

    // Find matching hurricane category for additional risk/windspeed info
    const hurrCat = HURRICANE_BOT_CATEGORIES.find(c => c.category.toLowerCase().replace(' ', '') === key);
    const windInfo = hurrCat ? hurrCat.windSpeed : 'Universal Dalang Guide';

    card.innerHTML = `
      <div class="cast-card-header">
        <div class="cast-card-badge" style="background: ${def.color}20; border-color: ${def.color}; color: ${def.color};">
          <span>${def.symbol}</span> ${def.category}
        </div>
        <span class="cast-card-risk">${windInfo.split('(')[0].trim()}</span>
      </div>
      
      <div class="cast-card-body">
        <div class="cast-mini-silhouette">
          ${def.svg}
        </div>
        <div class="cast-meta">
          <h4 class="cast-name">${def.name}</h4>
          <span class="cast-archetype" style="color: ${def.accent};">${def.archetype}</span>
          <p class="cast-desc">${def.role}</p>
        </div>
      </div>

      <div class="cast-actions">
        <button class="cast-btn btn-summon" data-action="summon" data-actor="${key}">
          <span>🎭</span> Summon to Stage
        </button>
        <button class="cast-btn btn-action" data-action="gesture" data-actor="${key}">
          <span>⚡</span> Speak / Gesture
        </button>
      </div>
    `;

    // Click handler for card buttons
    card.querySelectorAll('.cast-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const actor = btn.dataset.actor;
        if (action === 'summon') {
          summonPuppetToStage(actor);
        } else {
          triggerPuppetInteraction(actor);
        }
      });
    });

    grid.appendChild(card);
  });
}

function summonPuppetToStage(actorKey) {
  const el = document.getElementById(`puppet-${actorKey}`);
  const def = BOT_PUPPET_DEFS[actorKey];
  if (!el || !def) return;

  const targetLeft = def.defaultPos || 50;
  el.style.left = `${targetLeft}%`;
  puppetStageCoords[actorKey] = { pos: targetLeft, onStage: true };

  el.classList.add('acting');
  setTimeout(() => el.classList.remove('acting'), 800);

  setSubtitleBanner(
    def.symbol,
    def.name,
    `[${def.name} glides smoothly onto the backlit shadow stage on their shadow rod]`,
    def.color
  );

  logToTerminal('info', 'SHADOW_STAGE', `Summoned puppet [${def.name}] onto stage at coordinate X: ${targetLeft}%.`);
}

function triggerPuppetInteraction(actorKey) {
  const el = document.getElementById(`puppet-${actorKey}`);
  const def = BOT_PUPPET_DEFS[actorKey];
  if (!el || !def) return;

  // If puppet is offstage, slide onto stage
  if (!puppetStageCoords[actorKey]?.onStage || puppetStageCoords[actorKey]?.pos < 0 || puppetStageCoords[actorKey]?.pos > 100) {
    const targetLeft = def.defaultPos || 50;
    el.style.left = `${targetLeft}%`;
    puppetStageCoords[actorKey] = { pos: targetLeft, onStage: true };
  }

  // Animation classes
  document.querySelectorAll('.shadow-puppet-actor').forEach(p => p.classList.remove('speaking'));
  el.classList.add('speaking', 'acting');
  setTimeout(() => el.classList.remove('acting'), 1200);

  // Signature dialogue lines directly from Matt Raio's Slide Deck & Hannibal Barca Maxim
  const lines = {
    cat1: '“I am The Digital Creator! I draft emails, summarize long RFCs, and write presentations from a spark!”',
    cat2: '“I am The Digital Forecaster! Think Minority Report... I predict trends, screen resumes, and divine digital storms!”',
    cat3: '“I am The Solo Task Manager! Automate 80% repeating errors so you can innovate. Stand between two mirrors and watch me scale 1,000x!”',
    cat4: '“I am The Coordinated Team... The Bot Overlord! Born from the MCP podcast, I command subagent swarms across Git worktrees!”',
    cat5: '“Aut viam inveniam aut faciam — I will find a way.. or make one! The Agentic Engineer overcomes every blocker in real time!”',
    narrator: '“The 5 Kinds of Bots: from the Creator’s spark to the Security Builder’s sovereign resolve. Ground yourselves in network fundamentals!”'
  };

  const line = lines[actorKey] || def.role;
  typeSubtitleText(def.symbol, def.name, line, def.color);

  // Companion bot reaction
  const botReactions = {
    cat1: { mood: 'happy', title: '📜 CAT 1: THE DIGITAL CREATOR', desc: 'Synthesizing emails, articles, summaries, and presentations!' },
    cat2: { mood: 'observing', title: '🔮 CAT 2: MINORITY REPORT ANALYST', desc: 'Predicting recommendation trends, resume scoring, and telemetry drift.' },
    cat3: { mood: 'working', title: '⚙️ CAT 3: 1,000x MIRROR AUTOMATION', desc: 'Telco 80/20 triage automation! Managing the Multiplicity liability dilemma.' },
    cat4: { mood: 'hype', title: '👑 CAT 4: THE BOT OVERLORD', desc: 'Multi-Agent MCP coordination commanding subagents across worktrees!' },
    cat5: { mood: 'alert', title: '🛡️ CAT 5: "AUT VIAM INVENIAM AUT FACIAM"', desc: 'Hannibal Barca: "I will find a way.. or make one!" Gemini-CLI & eBPF co-creation.' },
    narrator: { mood: 'love', title: '🎭 WAYANG KULIT DALANG!', desc: 'The sacred cyber-fable resonates across the stage.' }
  };

  const r = botReactions[actorKey];
  if (r) {
    setBotReaction(r.mood, r.title, r.desc, def.symbol);
  }

  logToTerminal('info', 'PUPPET_SPEAK', `${def.name} (${def.category}): "${line}"`);
}

// ============================================================================
// 🚨 KEV-BOT SENTINEL: CONTENT CENSORSHIP & WATCHER HANDLERS
// ============================================================================

function handleKevBotCensorship(sourceName, validation) {
  // 1. Alert KEV-Bot in Companion stage
  setBotReaction(
    'surprised',
    '🚨 KEV-BOT CONTENT CENSORSHIP',
    'This file cannot be used due to the sensitive nature of the content. Only happy stories for now! 🌈✨',
    '🛡️'
  );

  // 2. Set Subtitle Banner on Shadow Stage
  setSubtitleBanner(
    '🚨',
    'KEV-Bot Censorship',
    'This file cannot be used due to the sensitive nature of the content. Only happy stories for now.',
    '#ef4444'
  );

  // 3. Show Pop-in Censorship Banner
  const censorBanner = document.getElementById('kev-censor-banner');
  const censorMsg = document.getElementById('kev-censor-banner-msg');
  if (censorBanner) {
    if (censorMsg) {
      censorMsg.textContent = 'This file cannot be used due to the sensitive nature of the content. Only happy stories for now!';
    }
    censorBanner.classList.remove('hidden');
    censorBanner.classList.add('censor-banner-shake');
    setTimeout(() => censorBanner.classList.remove('censor-banner-shake'), 600);
  }

  // 4. Update Watcher Bar
  const watcherStatus = document.getElementById('kev-watcher-status-text');
  const sentinelBadge = document.getElementById('kev-sentinel-mode-badge');
  if (watcherStatus) {
    watcherStatus.textContent = `🚨 CENSURED "${sourceName}" — Sensitive context blocked. Enforcing happy stories!`;
    watcherStatus.style.color = '#ef4444';
  }
  if (sentinelBadge) {
    sentinelBadge.textContent = '🚫 CONTENT BLOCKED';
    sentinelBadge.style.background = 'rgba(239, 68, 68, 0.25)';
    sentinelBadge.style.color = '#fca5a5';
  }

  // 5. Update Editor Badge
  const badge = document.getElementById('editor-status-badge');
  if (badge) {
    badge.textContent = '❌ REJECTED: Sensitive Content (Happy Stories Only!)';
    badge.style.borderColor = '#ef4444';
    badge.style.color = '#fca5a5';
    badge.style.background = 'rgba(239, 68, 68, 0.2)';
  }

  // 6. Stage visual rumble & red alarm hazard
  const stage = document.getElementById('theatre-stage');
  if (stage) {
    stage.classList.add('rumble', 'destruction-vibe');
    setTimeout(() => stage.classList.remove('rumble', 'destruction-vibe'), 800);
  }

  // 7. Log to terminal
  logToTerminal(
    'error',
    'KEV_CENSOR',
    `🚨 [KEV-BOT WATCHER]: This file cannot be used due to the sensitive nature of the content. (${sourceName} flagged: "${validation?.flaggedTerm || 'sensitive context'}"). Only happy stories for now.`
  );

  // 8. Emit counter-recon telemetry
  emitKevAnalysis(
    'CONTENT_QUARANTINE',
    `KEV-Bot rejected "${sourceName}": This file cannot be used due to the sensitive nature of the content. Only happy stories for now.`,
    'Shadow Puppet Stage',
    'Censorship Sentinel',
    'error'
  );
}

function handleKevBotApproved(sourceName, cueCount) {
  // Reset Watcher Bar
  const watcherStatus = document.getElementById('kev-watcher-status-text');
  const sentinelBadge = document.getElementById('kev-sentinel-mode-badge');
  if (watcherStatus) {
    watcherStatus.textContent = `✨ Approved "${sourceName}" (${cueCount} cues). Happy story verified!`;
    watcherStatus.style.color = '#10b981';
  }
  if (sentinelBadge) {
    sentinelBadge.textContent = '🛡️ Sentinel Verified';
    sentinelBadge.style.background = 'rgba(16, 185, 129, 0.2)';
    sentinelBadge.style.color = '#6ee7b7';
  }

  // Hide censor banner if showing
  const censorBanner = document.getElementById('kev-censor-banner');
  if (censorBanner) censorBanner.classList.add('hidden');

  setBotReaction(
    'love',
    '✨ KEV-BOT APPROVED!',
    `I scanned "${sourceName}" and verified pure happy vibes! No sensitive content found. Shadow puppets are ready to act out! 🌈💖`,
    '💖'
  );

  logToTerminal(
    'info',
    'KEV_APPROVED',
    `✨ [KEV-BOT WATCHER]: Verified "${sourceName}" — Zero policy violations. Happy story approved for shadow puppets!`
  );

  emitKevAnalysis(
    'HAPPY_STORY_VERIFIED',
    `Content verified safe & joyful for "${sourceName}".`,
    'Shadow Puppet Stage',
    'Content Approved',
    'action'
  );
}

function bindShadowPuppetControls() {
  const playBtn = document.getElementById('btn-puppet-play');
  const prevBtn = document.getElementById('btn-puppet-prev');
  const nextBtn = document.getElementById('btn-puppet-next');
  const resetBtn = document.getElementById('btn-puppet-reset');
  const speedSel = document.getElementById('sel-puppet-speed');
  const presetSel = document.getElementById('sel-preset-story');
  const uploadBtn = document.getElementById('btn-trigger-upload');
  const fileInput = document.getElementById('file-script-upload');
  const downloadBtn = document.getElementById('btn-download-script');
  const toggleEditorBtn = document.getElementById('btn-toggle-editor');
  const templateBtn = document.getElementById('btn-sample-template');
  const clearBtn = document.getElementById('btn-clear-script');
  const textarea = document.getElementById('script-raw-textarea');
  const stage = document.getElementById('theatre-stage');
  const closeBannerBtn = document.getElementById('btn-close-censor-banner');

  if (closeBannerBtn) {
    closeBannerBtn.onclick = () => {
      const censorBanner = document.getElementById('kev-censor-banner');
      if (censorBanner) censorBanner.classList.add('hidden');
    };
  }

  if (playBtn) {
    playBtn.onclick = () => togglePuppetPlayback();
  }
  if (prevBtn) {
    prevBtn.onclick = () => stepPuppetCue(-1);
  }
  if (nextBtn) {
    nextBtn.onclick = () => stepPuppetCue(1);
  }
  if (resetBtn) {
    resetBtn.onclick = () => resetPuppetTheatre();
  }
  const gamelanToggleBtn = document.getElementById('btn-toggle-gamelan');
  if (gamelanToggleBtn) {
    gamelanToggleBtn.onclick = () => toggleGamelanMute();
  }
  if (speedSel) {
    speedSel.onchange = (e) => {
      state.shadowPuppet.speed = parseFloat(e.target.value) || 1.0;
      logToTerminal('info', 'PUPPET_SPEED', `Adjusted shadow theatre performance speed to ${state.shadowPuppet.speed}x`);
    };
  }

  // KEV-Bot Watching User at Upload Button
  if (uploadBtn) {
    uploadBtn.addEventListener('mouseenter', () => {
      const watcherStatus = document.getElementById('kev-watcher-status-text');
      if (watcherStatus) {
        watcherStatus.textContent = '👀 KEV-Bot is watching your cursor over script uploader...';
        watcherStatus.style.color = '#fde68a';
      }
      setBotReaction(
        'thinking',
        '👀 KEV-BOT IS WATCHING YOU',
        'KEV-Bot is watching! Only happy stories allowed for the shadow puppets! 🌈✨',
        '👁️'
      );
      emitKevAnalysis('KEV_WATCH', 'KEV-Bot watching user at script upload area.', 'Shadow Puppet Stage', 'Content Sentinel', 'info');
    });
  }

  // Preset Story Loader
  if (presetSel) {
    presetSel.onchange = (e) => {
      const selectedId = e.target.value;
      const sample = SAMPLE_SCRIPTS.find(s => s.id === selectedId);
      if (sample && textarea) {
        pausePuppetPlayback();
        textarea.value = sample.text;
        state.shadowPuppet.scriptText = sample.text;
        state.shadowPuppet.cues = parseScriptText(sample.text);
        state.shadowPuppet.currentCueIndex = -1;
        state.shadowPuppet.selectedPresetId = selectedId;

        const badge = document.getElementById('editor-status-badge');
        if (badge) {
          badge.textContent = `Loaded: ${sample.title}`;
          badge.style.borderColor = '#d97706';
          badge.style.color = '#fde68a';
          badge.style.background = 'rgba(217, 119, 6, 0.18)';
        }

        resetPuppetPositions();
        updateSubtitleCueStep(0, state.shadowPuppet.cues.length);
        setSubtitleBanner('📜', 'Narrator', `Ready to act out "${sample.title}". Click ▶ Act Out Scene to begin.`, '#d97706');
        handleKevBotApproved(sample.title, state.shadowPuppet.cues.length);
      }
    };
  }

  // File Upload Ingestion with KEV-Bot Censorship Inspection
  if (uploadBtn && fileInput) {
    uploadBtn.onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const fileContent = loadEvent.target.result;

        // 🚨 KEV-Bot Censorship Inspection
        const validation = validateScriptContentWithKevBot(fileContent);
        if (!validation.isSafe) {
          handleKevBotCensorship(file.name, validation);
          return;
        }

        if (textarea) {
          pausePuppetPlayback();
          textarea.value = fileContent;
          state.shadowPuppet.scriptText = fileContent;
          state.shadowPuppet.cues = parseScriptText(fileContent);
          state.shadowPuppet.currentCueIndex = -1;

          const badge = document.getElementById('editor-status-badge');
          if (badge) {
            badge.textContent = `Loaded File: ${file.name}`;
            badge.style.borderColor = '#10b981';
            badge.style.color = '#6ee7b7';
            badge.style.background = 'rgba(16, 185, 129, 0.2)';
          }

          resetPuppetPositions();
          updateSubtitleCueStep(0, state.shadowPuppet.cues.length);
          setSubtitleBanner('📂', 'Script Ingestion', `Successfully loaded "${file.name}"! Click ▶ Act Out Scene to watch puppets perform it.`, '#10b981');

          handleKevBotApproved(file.name, state.shadowPuppet.cues.length);
          logToTerminal('info', 'FILE_INGEST', `Successfully parsed script file "${file.name}" (${file.size} bytes, ${state.shadowPuppet.cues.length} stage cues).`);
        }
      };
      reader.readAsText(file);
      fileInput.value = '';
    };
  }

  // Drag and Drop Script File onto Stage or Textarea with KEV-Bot Inspection
  const dropTargets = [stage, textarea].filter(Boolean);
  dropTargets.forEach(targetEl => {
    targetEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      targetEl.classList.add('drag-over-active');
      const watcherStatus = document.getElementById('kev-watcher-status-text');
      if (watcherStatus) {
        watcherStatus.textContent = '👀 KEV-Bot is watching: Incoming file drag detected...';
        watcherStatus.style.color = '#fde68a';
      }
    });
    targetEl.addEventListener('dragleave', (e) => {
      e.preventDefault();
      targetEl.classList.remove('drag-over-active');
    });
    targetEl.addEventListener('drop', (e) => {
      e.preventDefault();
      targetEl.classList.remove('drag-over-active');

      const file = e.dataTransfer?.files?.[0];
      if (file && (file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.json') || file.name.endsWith('.script') || file.type.startsWith('text/'))) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const content = ev.target.result;

          // 🚨 KEV-Bot Censorship Inspection
          const validation = validateScriptContentWithKevBot(content);
          if (!validation.isSafe) {
            handleKevBotCensorship(file.name, validation);
            return;
          }

          if (textarea) {
            pausePuppetPlayback();
            textarea.value = content;
            state.shadowPuppet.scriptText = content;
            state.shadowPuppet.cues = parseScriptText(content);
            state.shadowPuppet.currentCueIndex = -1;

            const badge = document.getElementById('editor-status-badge');
            if (badge) {
              badge.textContent = `Dropped File: ${file.name}`;
              badge.style.borderColor = '#10b981';
              badge.style.color = '#6ee7b7';
              badge.style.background = 'rgba(16, 185, 129, 0.2)';
            }

            resetPuppetPositions();
            updateSubtitleCueStep(0, state.shadowPuppet.cues.length);
            setSubtitleBanner('📂', 'Script Dropped', `Loaded "${file.name}" via drag-and-drop. Ready for shadow puppet performance!`, '#10b981');
            handleKevBotApproved(file.name, state.shadowPuppet.cues.length);
            logToTerminal('info', 'DRAG_DROP', `Imported "${file.name}" (${state.shadowPuppet.cues.length} cues).`);
          }
        };
        reader.readAsText(file);
      }
    });
  });

  // Download / Export .txt Script
  if (downloadBtn && textarea) {
    downloadBtn.onclick = () => {
      const content = textarea.value || '';
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'raiolabs_shadow_puppet_script.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      logToTerminal('info', 'EXPORT_SCRIPT', 'Exported shadow puppet script to [raiolabs_shadow_puppet_script.txt].');
    };
  }

  // Toggle Script Editor Drawer
  if (toggleEditorBtn) {
    toggleEditorBtn.onclick = () => {
      const drawer = document.getElementById('script-editor-drawer');
      if (drawer) {
        drawer.classList.toggle('open');
        toggleEditorBtn.classList.toggle('active');
        toggleEditorBtn.innerHTML = drawer.classList.contains('open') ? '<span>✕</span> Close Editor' : '<span>✏️</span> Edit Script';
      }
    };
  }

  // Boilerplate Template Button
  if (templateBtn && textarea) {
    templateBtn.onclick = () => {
      textarea.value = `# ==============================================
# CUSTOM HAPPY SHADOW PUPPET SCENE TEMPLATE
# ==============================================
[SCENE: The Radiant Silicon Garden]
[CAT1 ENTERS LEFT]
Cat 1: Welcome! I am Cat 1, ready to create beautiful ideas and happy poetry!
[CAT2 ENTERS RIGHT]
Cat 2: And I am Cat 2, forecasting smooth breezes and bright sunny days for our system!
[CAT3 ENTERS CENTER]
Cat 3: Together with Cat 4 and Cat 5, we keep the garden flourishing in perfect harmony!
[LIGHTNING]
Narrator: When the bots build with joy and trust, wonderful creations blossom!
`;
      state.shadowPuppet.scriptText = textarea.value;
      state.shadowPuppet.cues = parseScriptText(textarea.value);
      state.shadowPuppet.currentCueIndex = -1;
      resetPuppetPositions();
      updateSubtitleCueStep(0, state.shadowPuppet.cues.length);
      handleKevBotApproved('Happy Template', state.shadowPuppet.cues.length);
      logToTerminal('info', 'TEMPLATE_LOADED', 'Inserted happy boilerplate script template.');
    };
  }

  // Clear Textarea
  if (clearBtn && textarea) {
    clearBtn.onclick = () => {
      textarea.value = '';
      state.shadowPuppet.scriptText = '';
      state.shadowPuppet.cues = [];
      state.shadowPuppet.currentCueIndex = -1;
      updateSubtitleCueStep(0, 0);
      setSubtitleBanner('✏️', 'Editor Cleared', 'Text area is empty. Type your dialogue or paste a happy .txt story!', '#94a3b8');
    };
  }

  // Live input parsing with KEV-Bot real-time censorship
  if (textarea) {
    let parseDebounce = null;
    textarea.addEventListener('input', () => {
      clearTimeout(parseDebounce);
      parseDebounce = setTimeout(() => {
        const textVal = textarea.value;

        // 🚨 KEV-Bot Censorship Inspection
        const validation = validateScriptContentWithKevBot(textVal);
        if (!validation.isSafe) {
          handleKevBotCensorship('Editor Input', validation);
          // Revert to last safe script so sensitive text cannot be saved/played
          textarea.value = state.shadowPuppet.scriptText || SAMPLE_SCRIPTS[0].text;
          return;
        }

        state.shadowPuppet.scriptText = textVal;
        state.shadowPuppet.cues = parseScriptText(textVal);
        updateSubtitleCueStep(Math.max(0, state.shadowPuppet.currentCueIndex + 1), state.shadowPuppet.cues.length);
      }, 400);
    });
  }
}

// ============================================================================
// 🎵 TRADITIONAL INDONESIAN WAYANG KULIT GAMELAN MUSIC ENGINE (SLENDRO SCALE)
// Handcrafted bronze metallophone, kettle gong (kenong), and gong ageng synthesis
// ============================================================================

let gamelanAudioCtx = null;
let gamelanTimer = null;
let isGamelanPlaying = false;
let isGamelanMuted = false;
let gamelanBeat = 0;
let gamelanMasterGain = null;

// Slendro 5-tone scale base frequencies (Hz) in 3 octaves
const GAMELAN_SLENDRO = {
  // Bronze Metallophone (Saron / Peking)
  saron: [327.0, 367.5, 412.0, 490.0, 550.0],
  peking: [654.0, 735.0, 824.0, 980.0, 1100.0],
  // Kettle gongs (Kenong / Ketuk)
  kenong: [163.5, 183.8, 206.0, 245.0, 275.0],
  // Deep Great Gong (Gong Ageng) & Hanging Gong (Kempul)
  gongAgeng: 73.4,
  kempul: 146.8
};

// Traditional Wayang Kulit Lancaran Melody pattern (16-beat cycle in Slendro scale)
const GAMELAN_MELODY_PATTERN = [
  0, 1, 2, 4,
  3, 2, 1, 0,
  2, 3, 4, 3,
  2, 1, 0, 4
];

function getGamelanAudioContext() {
  if (!gamelanAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      gamelanAudioCtx = new AudioContextClass();
    }
  }
  if (gamelanAudioCtx && gamelanAudioCtx.state === 'suspended') {
    gamelanAudioCtx.resume();
  }
  return gamelanAudioCtx;
}

// Synthesizes a striking bronze metallophone note with inharmonic metallic partials
function playBronzeMetallophone(freq, duration = 1.4, gainLevel = 0.22) {
  try {
    const ctx = getGamelanAudioContext();
    if (!ctx || isGamelanMuted) return;

    const now = ctx.currentTime;

    // Bronze inharmonic partial ratios: fundamental, 2.76, 5.4, 8.92
    const partials = [
      { ratio: 1.0, gain: 1.0, decay: duration },
      { ratio: 2.76, gain: 0.45, decay: duration * 0.65 },
      { ratio: 5.40, gain: 0.25, decay: duration * 0.4 },
      { ratio: 8.92, gain: 0.12, decay: duration * 0.25 }
    ];

    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(gainLevel, now);
    noteGain.connect(gamelanMasterGain || ctx.destination);

    partials.forEach(p => {
      const osc = ctx.createOscillator();
      const pGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * p.ratio, now);

      // Fast percussive mallet strike (3ms attack) with exponential ringing decay
      pGain.gain.setValueAtTime(0.001, now);
      pGain.gain.linearRampToValueAtTime(p.gain, now + 0.004);
      pGain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

      osc.connect(pGain);
      pGain.connect(noteGain);

      osc.start(now);
      osc.stop(now + p.decay);
    });
  } catch (e) {}
}

// Synthesizes the deep resonant Gong Ageng with acoustic beating ombak wave
function playGongAgeng(freq = 73.4) {
  try {
    const ctx = getGamelanAudioContext();
    if (!ctx || isGamelanMuted) return;

    const now = ctx.currentTime;
    const duration = 4.5;

    // Dual slightly detuned oscillators produce the authentic Indonesian "ombak" wave (2.4 Hz beat)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gongFilter = ctx.createBiquadFilter();
    const gongGain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq + 2.4, now); // Natural ombak beating

    gongFilter.type = 'lowpass';
    gongFilter.frequency.setValueAtTime(320, now);
    gongFilter.Q.setValueAtTime(3.5, now);

    gongGain.gain.setValueAtTime(0.001, now);
    gongGain.gain.linearRampToValueAtTime(0.55, now + 0.02);
    gongGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(gongFilter);
    osc2.connect(gongFilter);
    gongFilter.connect(gongGain);
    gongGain.connect(gamelanMasterGain || ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  } catch (e) {}
}

// Synthesizes tuned kettle gong (Kenong / Ketuk)
function playKenongGong(freq = 245.0) {
  try {
    const ctx = getGamelanAudioContext();
    if (!ctx || isGamelanMuted) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const oscHarmonic = ctx.createOscillator();
    const kGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    oscHarmonic.type = 'sine';
    oscHarmonic.frequency.setValueAtTime(freq * 2.02, now);

    kGain.gain.setValueAtTime(0.001, now);
    kGain.gain.linearRampToValueAtTime(0.35, now + 0.005);
    kGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

    osc.connect(kGain);
    oscHarmonic.connect(kGain);
    kGain.connect(gamelanMasterGain || ctx.destination);

    osc.start(now);
    oscHarmonic.start(now);
    osc.stop(now + 2.2);
    oscHarmonic.stop(now + 2.2);
  } catch (e) {}
}

function startGamelanMusic() {
  if (isGamelanMuted) return;
  const ctx = getGamelanAudioContext();
  if (!ctx) return;

  if (isGamelanPlaying) return;
  isGamelanPlaying = true;
  gamelanBeat = 0;

  // Master gain for smooth fade-in
  gamelanMasterGain = ctx.createGain();
  gamelanMasterGain.gain.setValueAtTime(0.001, ctx.currentTime);
  gamelanMasterGain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 1.2);
  gamelanMasterGain.connect(ctx.destination);

  const indicator = document.getElementById('gamelan-music-indicator');
  if (indicator) indicator.classList.remove('hidden');

  stepGamelanSequence();
}

function stopGamelanMusic() {
  if (!isGamelanPlaying) return;
  isGamelanPlaying = false;
  clearTimeout(gamelanTimer);

  if (gamelanMasterGain && gamelanAudioCtx) {
    try {
      const now = gamelanAudioCtx.currentTime;
      gamelanMasterGain.gain.linearRampToValueAtTime(0.0001, now + 0.8);
      setTimeout(() => {
        if (!isGamelanPlaying && gamelanMasterGain) {
          try { gamelanMasterGain.disconnect(); } catch (e) {}
          gamelanMasterGain = null;
        }
      }, 900);
    } catch (e) {}
  }

  const indicator = document.getElementById('gamelan-music-indicator');
  if (indicator) indicator.classList.add('hidden');
}

function stepGamelanSequence() {
  if (!isGamelanPlaying) return;

  const speed = state.shadowPuppet.speed || 1.0;
  // Standard tempo: ~320ms per beat, scaled by speed
  const beatInterval = Math.max(160, Math.floor(320 / speed));
  const beatIndex = gamelanBeat % 16;

  // 1. Great Gong Ageng strikes on beat 0 (16-beat cycle completion)
  if (beatIndex === 0) {
    playGongAgeng(GAMELAN_SLENDRO.gongAgeng);
  }

  // 2. Kenong kettle gong marks every 4th beat
  if (beatIndex % 4 === 0) {
    const kenongNote = GAMELAN_SLENDRO.kenong[beatIndex % GAMELAN_SLENDRO.kenong.length];
    playKenongGong(kenongNote);
  }

  // 3. Kempul hanging chime on off-beats (beat 8)
  if (beatIndex === 8) {
    playKenongGong(GAMELAN_SLENDRO.kempul);
  }

  // 4. Melodic Bronze Metallophone (Saron) on every beat
  const melodyNoteIdx = GAMELAN_MELODY_PATTERN[beatIndex % GAMELAN_MELODY_PATTERN.length];
  const saronFreq = GAMELAN_SLENDRO.saron[melodyNoteIdx];
  playBronzeMetallophone(saronFreq, 1.2, 0.22);

  // 5. Higher shimmering Peking metallophone on alternate beats
  if (beatIndex % 2 === 0) {
    const pekingFreq = GAMELAN_SLENDRO.peking[(melodyNoteIdx + 2) % GAMELAN_SLENDRO.peking.length];
    playBronzeMetallophone(pekingFreq, 0.8, 0.12);
  }

  gamelanBeat++;
  gamelanTimer = setTimeout(stepGamelanSequence, beatInterval);
}

function toggleGamelanMute() {
  isGamelanMuted = !isGamelanMuted;
  const btn = document.getElementById('btn-toggle-gamelan');
  const icon = document.getElementById('gamelan-btn-icon');
  const txt = document.getElementById('gamelan-btn-text');

  if (isGamelanMuted) {
    stopGamelanMusic();
    if (btn) btn.classList.add('muted');
    if (icon) icon.textContent = '🔇';
    if (txt) txt.textContent = 'Gamelan: MUTED';
    logToTerminal('info', 'GAMELAN_AUDIO', 'Muted traditional Indonesian Wayang Kulit Gamelan music.');
  } else {
    if (btn) btn.classList.remove('muted');
    if (icon) icon.textContent = '🎵';
    if (txt) txt.textContent = 'Gamelan: ON';
    if (state.shadowPuppet.isPlaying) {
      startGamelanMusic();
    }
    logToTerminal('info', 'GAMELAN_AUDIO', 'Enabled traditional Indonesian Wayang Kulit Gamelan music.');
  }
}

function togglePuppetPlayback() {
  if (state.shadowPuppet.isPlaying) {
    pausePuppetPlayback();
  } else {
    playPuppetPlayback();
  }
}

function playPuppetPlayback() {
  const cues = state.shadowPuppet.cues;
  if (!cues || cues.length === 0) {
    const textarea = document.getElementById('script-raw-textarea');
    if (textarea && textarea.value.trim()) {
      state.shadowPuppet.cues = parseScriptText(textarea.value);
    } else {
      setSubtitleBanner('⚠️', 'Empty Script', 'Please type or load a script before playing!', '#ef4444');
      return;
    }
  }

  state.shadowPuppet.isPlaying = true;
  updatePlayButtonUI(true);

  // Start traditional Indonesian Gamelan music during the performance!
  startGamelanMusic();

  // If at the end of story, wrap back to cue 0
  if (state.shadowPuppet.currentCueIndex >= state.shadowPuppet.cues.length - 1) {
    state.shadowPuppet.currentCueIndex = -1;
    resetPuppetPositions();
  }

  logToTerminal('info', 'PUPPET_PLAY', `▶ Act out scene started with Gamelan Slendro music (${state.shadowPuppet.cues.length} cues total).`);
  scheduleNextCue();
}

function pausePuppetPlayback() {
  state.shadowPuppet.isPlaying = false;
  clearTimeout(puppetPlayTimer);
  updatePlayButtonUI(false);
  document.querySelectorAll('.shadow-puppet-actor').forEach(p => p.classList.remove('speaking'));

  // Pause Gamelan music
  stopGamelanMusic();

  logToTerminal('info', 'PUPPET_PAUSE', '⏸ Performance paused.');
}

function updatePlayButtonUI(isPlaying) {
  const icon = document.getElementById('puppet-play-icon');
  const txt = document.getElementById('puppet-play-text');
  const btn = document.getElementById('btn-puppet-play');
  if (icon && txt && btn) {
    if (isPlaying) {
      icon.textContent = '⏸';
      txt.textContent = 'Pause Performance';
      btn.classList.add('playing');
    } else {
      icon.textContent = '▶';
      txt.textContent = 'Act Out Scene';
      btn.classList.remove('playing');
    }
  }
}

function scheduleNextCue() {
  if (!state.shadowPuppet.isPlaying) return;

  const nextIndex = state.shadowPuppet.currentCueIndex + 1;
  if (nextIndex >= state.shadowPuppet.cues.length) {
    // End of script reached!
    pausePuppetPlayback();
    setSubtitleBanner('🏁', 'Performance Complete', 'The cyber-fable has concluded. Click ▶ to replay or load another .txt script!', '#10b981');
    setBotReaction('party', '🎉 FINALE COMPLETE!', 'All 5 bot archetypes completed their performance on the shadow stage!', '👏');
    logToTerminal('info', 'PUPPET_FINALE', '✨ Scene performance completed successfully.');
    return;
  }

  executeShadowCue(nextIndex);

  // Calculate dwell time based on cue type and dialogue length
  const cue = state.shadowPuppet.cues[nextIndex];
  let baseDelay = 2200;
  if (cue.type === 'dialogue') {
    const wordCount = (cue.dialogue || '').split(' ').length;
    baseDelay = Math.max(2600, wordCount * 220);
  } else if (cue.type === 'effect') {
    baseDelay = 1800;
  } else if (cue.type === 'puppet_action') {
    baseDelay = 1600;
  }

  const speed = state.shadowPuppet.speed || 1.0;
  const actualDelay = baseDelay / speed;

  puppetPlayTimer = setTimeout(() => {
    scheduleNextCue();
  }, actualDelay);
}

function stepPuppetCue(delta) {
  pausePuppetPlayback();
  const cues = state.shadowPuppet.cues;
  if (!cues || cues.length === 0) return;

  let targetIndex = state.shadowPuppet.currentCueIndex + delta;
  if (targetIndex < 0) targetIndex = 0;
  if (targetIndex >= cues.length) targetIndex = cues.length - 1;

  executeShadowCue(targetIndex);
}

function executeShadowCue(index) {
  const cues = state.shadowPuppet.cues;
  if (!cues || index < 0 || index >= cues.length) return;

  state.shadowPuppet.currentCueIndex = index;
  const cue = cues[index];
  updateSubtitleCueStep(index + 1, cues.length);

  // 1. Scene Setting
  if (cue.type === 'scene') {
    const badge = document.getElementById('stage-scene-badge');
    if (badge) badge.textContent = `Scene: ${cue.sceneName}`;
    setSubtitleBanner('🎬', 'Scene Direction', `[Scene: ${cue.sceneName}]`, '#f59e0b');
    return;
  }

  // 2. Special Effects (Lightning, Thunder)
  if (cue.type === 'effect' && cue.effect === 'lightning') {
    triggerStageLightning();
    setSubtitleBanner('⚡', 'Atmosphere', '[⚡ Lightning illuminates the oil-lamp parchment screen!]', '#38bdf8');
    return;
  }

  // 3. Puppet Actions (Enter, Exit, Bob, Spin, Gesture)
  if (cue.type === 'puppet_action') {
    const actorKey = cue.actor;
    const el = document.getElementById(`puppet-${actorKey}`);
    const def = BOT_PUPPET_DEFS[actorKey];
    if (!el || !def) return;

    if (cue.action === 'enter') {
      const posMap = { left: 22, center: 50, right: 78 };
      const targetPos = posMap[cue.position] || def.defaultPos || 50;
      el.style.left = `${targetPos}%`;
      puppetStageCoords[actorKey] = { pos: targetPos, onStage: true };
      el.classList.add('acting');
      setTimeout(() => el.classList.remove('acting'), 600);
    } else if (cue.action === 'exit') {
      const exitPos = (puppetStageCoords[actorKey]?.pos > 50) ? 120 : -22;
      el.style.left = `${exitPos}%`;
      puppetStageCoords[actorKey] = { pos: exitPos, onStage: false };
    } else {
      // Bob / gesture
      el.classList.add(cue.action || 'acting');
      setTimeout(() => el.classList.remove(cue.action || 'acting'), 1000);
    }

    setSubtitleBanner(def.symbol, def.name, cue.text, def.color);
    return;
  }

  // 4. Gather / Finale
  if (cue.type === 'gather') {
    gatherAllPuppetsOnStage();
    setSubtitleBanner('🎭', 'Grand Ensemble', '[All Five Bots gather across the illuminated stage]', '#a855f7');
    return;
  }

  // 5. Spoken Dialogue
  if (cue.type === 'dialogue') {
    const actorKey = cue.actor;
    const def = BOT_PUPPET_DEFS[actorKey];
    const el = document.getElementById(`puppet-${actorKey}`);

    if (el && def) {
      // If actor is offstage, slide onto stage smoothly!
      if (!puppetStageCoords[actorKey]?.onStage || puppetStageCoords[actorKey]?.pos < 0 || puppetStageCoords[actorKey]?.pos > 100) {
        const targetPos = def.defaultPos || 50;
        el.style.left = `${targetPos}%`;
        puppetStageCoords[actorKey] = { pos: targetPos, onStage: true };
      }

      // Mark active speaker
      document.querySelectorAll('.shadow-puppet-actor').forEach(p => p.classList.remove('speaking'));
      el.classList.add('speaking');

      // Subtle bob animation
      el.classList.add('acting');
      setTimeout(() => el.classList.remove('acting'), 800);

      // Type out dialogue
      typeSubtitleText(def.symbol, def.name, cue.dialogue, def.color);

      // Update companion bot reaction
      const companionReactions = {
        cat1: { mood: 'happy', title: '📜 CAT 1 SCRIBE SPEAKING', desc: 'Synthesizing ideas, documentation drafts, and creative blueprints.' },
        cat2: { mood: 'observing', title: '🔮 CAT 2 ORACLE SPEAKING', desc: 'Scanning log streams and BGP routing tables for early storm telemetry.' },
        cat3: { mood: 'working', title: '⚙️ CAT 3 MECHANIST SPEAKING', desc: 'Scaling repetitive ticket triage and deterministic operational automation.' },
        cat4: { mood: 'hype', title: '👑 CAT 4 SWARM OVERLORD SPEAKING', desc: 'Orchestrating Git worktrees and subagent teams via MCP protocol.' },
        cat5: { mood: 'alert', title: '🛡️ CAT 5 KERNEL SOVEREIGN SPEAKING', desc: 'Enforcing eBPF ring-0 isolation, formal logic, and provable safety.' },
        narrator: { mood: 'love', title: '🎭 DALANG STORYTELLER', desc: 'Guiding through the Wayang Kulit philosophical spectrum of AI.' }
      };

      const cr = companionReactions[actorKey];
      if (cr) {
        setBotReaction(cr.mood, cr.title, cr.desc, def.symbol);
      }

      logToTerminal('info', 'CUE_DIALOGUE', `[Cue ${index + 1}] ${cue.speakerName}: "${cue.dialogue}"`);
    } else {
      // Fallback text display
      setSubtitleBanner('📜', cue.speakerName || 'Narrator', cue.dialogue, '#f59e0b');
    }
  }
}

function triggerStageLightning() {
  const flash = document.getElementById('stage-lightning-flash');
  const stage = document.getElementById('theatre-stage');
  if (flash) {
    flash.classList.remove('flash-active');
    void flash.offsetWidth; // trigger reflow
    flash.classList.add('flash-active');
    setTimeout(() => flash.classList.remove('flash-active'), 600);
  }
  if (stage) {
    stage.classList.add('rumble');
    setTimeout(() => stage.classList.remove('rumble'), 400);
  }
  setBotReaction('alert', '⚡ THUNDER & LIGHTNING!', 'RaioLabs lightning strikes behind the shadow screen!', '⚡');
}

function gatherAllPuppetsOnStage() {
  const positions = {
    cat1: 15,
    cat2: 32,
    narrator: 50,
    cat3: 65,
    cat4: 78,
    cat5: 90
  };

  Object.entries(positions).forEach(([key, xPos]) => {
    const el = document.getElementById(`puppet-${key}`);
    if (el) {
      el.style.left = `${xPos}%`;
      puppetStageCoords[key] = { pos: xPos, onStage: true };
      el.classList.add('acting');
      setTimeout(() => el.classList.remove('acting'), 1000);
    }
  });

  document.querySelectorAll('.shadow-puppet-actor').forEach(p => p.classList.remove('speaking'));
}

function resetPuppetTheatre() {
  pausePuppetPlayback();
  state.shadowPuppet.currentCueIndex = -1;
  resetPuppetPositions();
  updateSubtitleCueStep(0, state.shadowPuppet.cues.length);

  const badge = document.getElementById('stage-scene-badge');
  if (badge) badge.textContent = 'Scene: The Backlit Stage of Silicon';

  setSubtitleBanner('📜', 'Dalang', 'Stage reset to opening positions. Click ▶ Act Out Scene to begin!', '#d97706');
  setBotReaction('happy', '🎭 STAGE CLEARED', 'Puppets returned backstage. Ready for new scene!', '✨');
  logToTerminal('info', 'STAGE_RESET', 'Shadow puppet theatre reset to initial state.');
}

function resetPuppetPositions() {
  const initialPositions = {
    narrator: 50,
    cat1: -22,
    cat2: 118,
    cat3: -22,
    cat4: 118,
    cat5: -22
  };

  Object.entries(initialPositions).forEach(([key, pos]) => {
    const el = document.getElementById(`puppet-${key}`);
    if (el) {
      el.style.left = `${pos}%`;
      el.classList.remove('speaking', 'acting');
      puppetStageCoords[key] = { pos: pos, onStage: (key === 'narrator') };
    }
  });
}

function updateSubtitleCueStep(current, total) {
  const el = document.getElementById('subtitle-cue-step');
  if (el) {
    el.textContent = `Cue ${current} / ${total}`;
  }
}

function setSubtitleBanner(symbol, name, text, color) {
  const pill = document.getElementById('subtitle-actor-pill');
  const textBox = document.getElementById('subtitle-text-box');
  if (pill) {
    pill.innerHTML = `<span class="pill-symbol">${symbol}</span> <span class="pill-name">${name}</span>`;
    pill.style.borderColor = color || '#d97706';
    pill.style.background = `${color || '#d97706'}22`;
  }
  if (textBox) {
    textBox.textContent = text;
    textBox.scrollTop = 0;
  }
}

function typeSubtitleText(symbol, name, fullText, color) {
  clearTimeout(typingTimeoutId);
  const pill = document.getElementById('subtitle-actor-pill');
  const textBox = document.getElementById('subtitle-text-box');

  if (pill) {
    pill.innerHTML = `<span class="pill-symbol">${symbol}</span> <span class="pill-name">${name}</span>`;
    pill.style.borderColor = color || '#d97706';
    pill.style.background = `${color || '#d97706'}22`;
  }

  if (!textBox) return;
  textBox.textContent = '';

  let charIndex = 0;
  const speed = state.shadowPuppet.speed || 1.0;
  const charDelay = Math.max(6, Math.floor(18 / speed));

  function stepType() {
    if (charIndex < fullText.length) {
      textBox.textContent += fullText.charAt(charIndex);
      charIndex++;
      // Keep entire sentence in readable view as words type out
      textBox.scrollTop = textBox.scrollHeight;
      typingTimeoutId = setTimeout(stepType, charDelay);
    }
  }
  stepType();
}

// Fallback handlers to preserve backward compatibility
function renderPropOnStage() {}
function handlePropClick() {}
function strikeStageProp() {}
function handleStageFloorClick() {}
function evaluateStageBehavior() {}

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
    ${cat.motto ? `
      <div class="hurricane-motto-banner" style="margin: 12px 0; padding: 10px 14px; background: rgba(239, 68, 68, 0.12); border-left: 4px solid #ef4444; border-radius: 6px;">
        <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:#fca5a5; font-weight:700;">⚔️ Hannibal Barca Maxim:</span>
        <p style="margin:4px 0 0; font-style:italic; font-size:0.95rem; color:#fef08a; font-weight:600;">
          ${cat.motto}
        </p>
      </div>
    ` : ''}
    ${cat.analogy ? `
      <div class="hurricane-analogy-box" style="margin: 10px 0; padding: 10px 14px; background: rgba(255,255,255,0.03); border: 1px dashed var(--border-color); border-radius: 8px; font-size:0.88rem; color:var(--text-primary); line-height:1.45;">
        💡 <strong>Matt's Slide Deck Insight & Analogy:</strong> ${cat.analogy}
      </div>
    ` : ''}
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

function renderCyberEventsGrid() {
  const grid = document.getElementById('cyber-events-grid');
  if (!grid) return;

  const filtered = CYBER_OWASP_EVENTS.filter(evt => {
    return state.activeEventCategory === 'All' || evt.category === state.activeEventCategory;
  });

  grid.innerHTML = filtered.map(evt => `
    <article class="cyber-event-card" style="--evt-accent: ${evt.color};">
      <div class="cyber-event-top">
        <span class="cyber-event-badge" style="background: ${evt.color}22; color: ${evt.color}; border: 1px solid ${evt.color}66;">
          ${evt.badge}
        </span>
        <span class="cyber-event-meta">📍 ${evt.location} • 📅 ${evt.date}</span>
      </div>
      <h4 class="cyber-event-title">${evt.title}</h4>
      <div class="cyber-event-org">🏛️ ${evt.org}</div>
      <p class="cyber-event-summary">${evt.summary}</p>
      <ul class="cyber-event-highlights">
        ${evt.highlights.map(h => `<li>${h}</li>`).join('')}
      </ul>
      <div class="cyber-event-actions">
        ${evt.videoRef ? `
          <button class="btn-primary btn-watch-event-video" type="button" data-video-ref="${evt.videoRef}">
            🎬 Watch Recording in Foreground Player
          </button>
        ` : ''}
        <a href="${evt.externalUrl}" target="_blank" rel="noopener noreferrer" class="btn-secondary cyber-event-ext-btn">
          ${evt.videoRef ? 'YouTube Link ↗' : 'Explore Project / Resource ↗'}
        </a>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('.btn-watch-event-video').forEach(btn => {
    btn.addEventListener('click', () => {
      const videoRef = btn.getAttribute('data-video-ref');
      const eventsModal = document.getElementById('events-modal');
      const appearancesModal = document.getElementById('appearances-modal');
      if (eventsModal) eventsModal.classList.add('hidden');
      if (appearancesModal) appearancesModal.classList.remove('hidden');
      playAppearanceInForeground(videoRef);
    });
  });
}

function playAppearanceInForeground(appearanceId) {
  const app = RECENT_APPEARANCES.find(a => a.id === appearanceId) || RECENT_APPEARANCES[0];
  if (!app) return;

  state.activeAppearanceId = app.id;

  // Highlight selected card
  document.querySelectorAll('.appearance-choice-card').forEach(card => {
    card.classList.toggle('active-appearance', card.getAttribute('data-appearance-id') === app.id);
  });

  const playerStage = document.getElementById('appearances-player-stage');
  const iframe = document.getElementById('appearances-youtube-iframe');
  const activeTitle = document.getElementById('player-active-title');
  const activeExtUrl = document.getElementById('player-active-ext-url');

  if (playerStage) {
    playerStage.classList.remove('hidden');
  }
  if (activeTitle) {
    activeTitle.textContent = `${app.title} (${app.channel})`;
  }
  if (activeExtUrl) {
    activeExtUrl.href = app.url;
  }
  if (iframe) {
    iframe.src = app.embedUrl;
  }

  if (playerStage && typeof playerStage.scrollIntoView === 'function') {
    setTimeout(() => {
      playerStage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
  }

  logToTerminal('action', 'YOUTUBE_PLAYER', `Streaming "${app.title}" in foreground player (${app.url})`);
  recordInteraction({ type: 'appearance_play', video: app.id });
}

function stopAppearancePlayer() {
  const playerStage = document.getElementById('appearances-player-stage');
  const iframe = document.getElementById('appearances-youtube-iframe');
  if (iframe) {
    iframe.src = '';
  }
  if (playerStage) {
    playerStage.classList.add('hidden');
  }
  document.querySelectorAll('.appearance-choice-card').forEach(card => {
    card.classList.remove('active-appearance');
  });
  state.activeAppearanceId = null;
}

// --- WHAT'S NEW IN TECH (WNIT) GOOGLE DRIVE MEDIA VAULT & FOREGROUND PLAYER ---
function renderWnitGrid(filter = state.activeWnitFilter || 'all') {
  const grid = document.getElementById('wnit-selector-grid');
  if (!grid) return;

  const items = WNIT_MEDIA_ITEMS.filter(item => {
    if (filter === 'all') return true;
    return item.mediaType === filter;
  });

  grid.innerHTML = items.map(item => {
    const isAudio = item.mediaType === 'audio';
    const isDoc = item.mediaType === 'doc';
    const icon = isAudio ? '🎧' : (isDoc ? '📄' : '🎬');
    const playActionText = isAudio ? 'Listen in Foreground Player' : (isDoc ? 'Preview in Foreground Player' : 'Watch in Foreground Player');
    const posterGradient = isAudio
      ? 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)'
      : (isDoc
        ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%)'
        : 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)');

    return `
      <div class="appearance-choice-card wnit-choice-card ${state.activeWnitId === item.id ? 'active-appearance' : ''}" data-wnit-id="${item.id}">
        <div class="appearance-thumb-wrap wnit-thumb-wrap" data-play-wnit-id="${item.id}" style="background: ${posterGradient}; cursor: pointer;">
          <div class="wnit-card-poster">
            <span class="wnit-poster-icon">${icon}</span>
            <div class="wnit-poster-meta">
              <span class="wnit-poster-series">${item.series}</span>
              <strong class="wnit-poster-ep">${item.episodeNumber}</strong>
            </div>
          </div>
          <div class="appearance-play-overlay">
            <span class="play-circle-icon">▶</span>
            <span class="play-overlay-lbl">${playActionText}</span>
          </div>
          <span class="appearance-badge-pill" style="border-color:${isAudio ? '#34d399' : (isDoc ? '#818cf8' : '#38bdf8')}; color:${isAudio ? '#a7f3d0' : (isDoc ? '#c7d2fe' : '#e0f2fe')};">${item.badge}</span>
        </div>
        <div class="appearance-card-body">
          <div class="appearance-channel-row">
            <span class="appearance-channel-name">🎙️ ${item.series}</span>
            <span class="appearance-date-lbl">${item.format}</span>
          </div>
          <h4 class="appearance-card-title">${item.title}</h4>
          ${item.guest ? `<div class="wnit-guest-pill">👤 <strong>Guest / Host:</strong> ${item.guest}</div>` : ''}
          <p class="appearance-card-desc">${item.summary}</p>
          <div class="appearance-url-pill">
            📁 <code>${item.fileName}</code>
          </div>
          <div class="appearance-tags-row">
            ${item.tags.map(t => `<span class="appearance-tag-chip">${t}</span>`).join('')}
          </div>
          <div class="appearance-card-actions">
            <button class="btn-primary btn-play-wnit" type="button" data-play-wnit-id="${item.id}">
              ▶ ${playActionText}
            </button>
            <a href="${item.directUrl}" target="_blank" rel="noopener noreferrer" class="btn-secondary appearance-ext-link">
              Google Drive ↗
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('[data-play-wnit-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-play-wnit-id');
      if (id) playWnitInForeground(id);
    });
  });
}

function playWnitInForeground(mediaId) {
  const item = WNIT_MEDIA_ITEMS.find(m => m.id === mediaId) || WNIT_MEDIA_ITEMS[0];
  if (!item) return;

  state.activeWnitId = item.id;

  // Highlight selected card
  document.querySelectorAll('#wnit-selector-grid .appearance-choice-card').forEach(card => {
    card.classList.toggle('active-appearance', card.getAttribute('data-wnit-id') === item.id);
  });

  const playerStage = document.getElementById('wnit-player-stage');
  const iframe = document.getElementById('wnit-media-iframe');
  const activeTitle = document.getElementById('wnit-player-active-title');
  const activeExtUrl = document.getElementById('wnit-player-active-ext-url');

  if (playerStage) {
    playerStage.classList.remove('hidden');
  }
  if (activeTitle) {
    const icon = item.mediaType === 'audio' ? '🎧' : (item.mediaType === 'doc' ? '📄' : '🎬');
    activeTitle.textContent = `${icon} Now Playing: ${item.title}`;
  }
  if (activeExtUrl) {
    activeExtUrl.href = item.directUrl;
    activeExtUrl.textContent = 'Open Direct in Google Drive ↗';
  }
  if (iframe) {
    iframe.src = item.embedUrl;
  }

  if (playerStage && typeof playerStage.scrollIntoView === 'function') {
    setTimeout(() => {
      playerStage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
  }

  logToTerminal('action', 'WNIT_PLAYER', `Streaming WNIT Media: "${item.title}" (${item.fileName})`);
  setBotReaction(
    'hype',
    '🎙️ STREAMING WNIT',
    `Now streaming "${item.title}" in the foreground player! Enjoy What's New In Tech with Matt Raio!`,
    item.mediaType === 'audio' ? '🎧' : '🎬'
  );
  emitKevAnalysis('PLAY_WNIT', `Operator streaming WNIT item: ${item.fileName}`, null, null, 'action');
  recordInteraction({ type: 'wnit_play', mediaId: item.id });
}

function stopWnitPlayer() {
  const playerStage = document.getElementById('wnit-player-stage');
  const iframe = document.getElementById('wnit-media-iframe');
  if (iframe) {
    iframe.src = '';
  }
  if (playerStage) {
    playerStage.classList.add('hidden');
  }
  document.querySelectorAll('#wnit-selector-grid .appearance-choice-card').forEach(card => {
    card.classList.remove('active-appearance');
  });
  state.activeWnitId = null;
}

// ==========================================================================
// ⚡ THUNDERCLAP AUDIO SYNTHESIS & CLOUD-TO-BOT LIGHTNING STRIKE
// ==========================================================================

let thunderAudioCtx = null;

function getThunderAudioContext() {
  if (!thunderAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      thunderAudioCtx = new AudioContextClass();
    }
  }
  if (thunderAudioCtx && thunderAudioCtx.state === 'suspended') {
    thunderAudioCtx.resume();
  }
  return thunderAudioCtx;
}

// Synthesizes a realistic thunderclap using Web Audio API (zero external assets needed)
function playThunderclapSound() {
  try {
    const ctx = getThunderAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Synthesize Pink / Brown Noise Buffer for sharp crack & rolling thunder rumble
    const bufferSize = Math.floor(ctx.sampleRate * 2.4);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.12;
      b6 = white * 0.115926;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    // 2. High-Frequency Lightning Crack / Electric Transient
    const crackFilter = ctx.createBiquadFilter();
    crackFilter.type = 'highpass';
    crackFilter.frequency.setValueAtTime(850, now);
    crackFilter.frequency.exponentialRampToValueAtTime(140, now + 0.18);

    const crackGain = ctx.createGain();
    crackGain.gain.setValueAtTime(0.001, now);
    crackGain.gain.linearRampToValueAtTime(0.88, now + 0.015);
    crackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    // 3. Low-Frequency Rolling Thunder Resonant Rumble
    const rumbleFilter = ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(450, now);
    rumbleFilter.frequency.linearRampToValueAtTime(180, now + 1.2);
    rumbleFilter.frequency.linearRampToValueAtTime(70, now + 2.2);

    const rumbleGain = ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.001, now);
    rumbleGain.gain.linearRampToValueAtTime(0.95, now + 0.04);
    rumbleGain.gain.linearRampToValueAtTime(0.7, now + 0.35);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 2.3);

    // 4. Sub-Bass Acoustic Punch (Triangle oscillator dropping 135Hz -> 28Hz)
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(135, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.5);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.75, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    // Node connections
    noiseSource.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(ctx.destination);

    noiseSource.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(ctx.destination);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    // Start playback
    noiseSource.start(now);
    osc.start(now);
    osc.stop(now + 0.65);
    noiseSource.stop(now + 2.35);
  } catch (err) {
    console.warn('Web Audio thunderclap error:', err);
  }
}

let isBotEnergizedShockActive = false;

// Triggers procedural cloud-to-bot lightning strike, shocked emoji hearts/lightning eyes, and energizes RaioBot
function triggerCloudToBotLightning() {
  const stage = document.getElementById('bot-character-stage');
  const cloud = document.querySelector('.thunder-cloud-bg');
  const botWrapper = document.getElementById('cute-bot-wrapper');
  const antennaBulb = document.getElementById('bot-antenna-bulb');
  const eyesRow = document.getElementById('bot-eyes-row');
  const strikeSvg = document.getElementById('cloud-strike-svg');
  const particlesLayer = document.getElementById('bot-particles-layer');

  if (!stage || !cloud || !botWrapper || !antennaBulb || !strikeSvg) return;

  // 1. Procedural Lightning Coordinates (Anchored from Cloud center to Bot Antenna)
  const stageRect = stage.getBoundingClientRect();
  const cloudRect = cloud.getBoundingClientRect();
  const antRect = antennaBulb.getBoundingClientRect();

  const startX = cloudRect.left + cloudRect.width * 0.45 - stageRect.left;
  const startY = cloudRect.top + cloudRect.height * 0.7 - stageRect.top;

  const endX = antRect.left + antRect.width * 0.5 - stageRect.left;
  const endY = antRect.top + antRect.height * 0.2 - stageRect.top;

  const dx = endX - startX;
  const dy = endY - startY;
  const segments = 6;
  const points = [`M ${startX.toFixed(1)} ${startY.toFixed(1)}`];

  for (let i = 1; i < segments; i++) {
    const ratio = i / segments;
    const jitterX = (Math.random() - 0.5) * 45;
    const jitterY = (Math.random() - 0.5) * 18;
    const px = startX + dx * ratio + jitterX;
    const py = startY + dy * ratio + jitterY;
    points.push(`L ${px.toFixed(1)} ${py.toFixed(1)}`);
  }
  points.push(`L ${endX.toFixed(1)} ${endY.toFixed(1)}`);
  const pathD = points.join(' ');

  // Update SVG paths
  const corePath = strikeSvg.querySelector('.core-strike');
  const cyanPath = strikeSvg.querySelector('.cyan-strike');
  if (corePath) corePath.setAttribute('d', pathD);
  if (cyanPath) cyanPath.setAttribute('d', pathD);

  // Generate electric branches
  const b1 = strikeSvg.querySelector('.branch-1');
  const b2 = strikeSvg.querySelector('.branch-2');
  const b3 = strikeSvg.querySelector('.branch-3');
  if (b1) b1.setAttribute('d', `M ${(startX + dx * 0.28).toFixed(1)} ${(startY + dy * 0.28).toFixed(1)} L ${(startX + dx * 0.28 - 25).toFixed(1)} ${(startY + dy * 0.28 + 20).toFixed(1)} L ${(startX + dx * 0.28 - 40).toFixed(1)} ${(startY + dy * 0.28 + 32).toFixed(1)}`);
  if (b2) b2.setAttribute('d', `M ${(startX + dx * 0.55).toFixed(1)} ${(startY + dy * 0.55).toFixed(1)} L ${(startX + dx * 0.55 + 28).toFixed(1)} ${(startY + dy * 0.55 + 18).toFixed(1)} L ${(startX + dx * 0.55 + 42).toFixed(1)} ${(startY + dy * 0.55 + 35).toFixed(1)}`);
  if (b3) b3.setAttribute('d', `M ${(startX + dx * 0.78).toFixed(1)} ${(startY + dy * 0.78).toFixed(1)} L ${(startX + dx * 0.78 - 22).toFixed(1)} ${(startY + dy * 0.78 + 16).toFixed(1)}`);

  // Activate Cloud discharge & Lightning SVG
  cloud.classList.add('cloud-discharging');
  strikeSvg.classList.remove('hidden', 'strike-active');
  void strikeSvg.offsetWidth;
  strikeSvg.classList.add('strike-active');

  setTimeout(() => {
    strikeSvg.classList.remove('strike-active');
    strikeSvg.classList.add('hidden');
    cloud.classList.remove('cloud-discharging');
  }, 480);

  // 2. Bot Shocked & Energized State
  if (isBotEnergizedShockActive) return;
  isBotEnergizedShockActive = true;

  botWrapper.classList.add('bot-energized-shock');

  // Save original eyes & antenna
  const originalEyesHtml = eyesRow ? eyesRow.innerHTML : '';
  const originalAntenna = antennaBulb ? antennaBulb.textContent : '💖';

  if (antennaBulb) antennaBulb.textContent = '⚡';

  // Eye Animation Sequence: alternating shocked lightning bolt eyes & cute heart eyes
  const eyeStates = [
    '<span class="shock-eye-glyph left">⚡</span><span class="shock-eye-glyph right">⚡</span>',
    '<span class="shock-eye-glyph left">💖</span><span class="shock-eye-glyph right">💖</span>',
    '<span class="shock-eye-glyph left">⚡</span><span class="shock-eye-glyph right">💖</span>',
    '<span class="shock-eye-glyph left">💖</span><span class="shock-eye-glyph right">⚡</span>'
  ];

  let stateIdx = 0;
  if (eyesRow) eyesRow.innerHTML = eyeStates[0];

  const eyeInterval = setInterval(() => {
    stateIdx = (stateIdx + 1) % eyeStates.length;
    if (eyesRow) eyesRow.innerHTML = eyeStates[stateIdx];
  }, 280);

  // 3. Spawn Burst of Floating Emoji Hearts & Lightning Sparks from RaioBot
  if (particlesLayer) {
    const botRect = botWrapper.getBoundingClientRect();
    const botCenterX = botRect.left + botRect.width * 0.5 - stageRect.left;
    const botCenterY = botRect.top + botRect.height * 0.45 - stageRect.top;

    const emojiPalette = ['⚡', '💖', '⚡', '💕', '⚡', '💓', '✨', '⚡', '💗', '⚡', '🌟', '💖', '⚡', '❤️', '⚡'];

    for (let i = 0; i < 22; i++) {
      setTimeout(() => {
        const particle = document.createElement('span');
        particle.className = 'shock-particle';
        particle.textContent = emojiPalette[i % emojiPalette.length];
        particle.style.left = `${botCenterX}px`;
        particle.style.top = `${botCenterY}px`;

        const dx = (Math.random() - 0.5) * 160;
        const dy1 = -20 - Math.random() * 35;
        const dy2 = -65 - Math.random() * 45;
        const dy3 = -120 - Math.random() * 70;
        const rot1 = (Math.random() - 0.5) * 40;
        const rot2 = (Math.random() - 0.5) * 60;
        const rot3 = (Math.random() - 0.5) * 100;

        particle.style.setProperty('--p-dx', `${dx.toFixed(1)}px`);
        particle.style.setProperty('--p-dy1', `${dy1.toFixed(1)}px`);
        particle.style.setProperty('--p-dy2', `${dy2.toFixed(1)}px`);
        particle.style.setProperty('--p-dy3', `${dy3.toFixed(1)}px`);
        particle.style.setProperty('--p-rot1', `${rot1.toFixed(1)}deg`);
        particle.style.setProperty('--p-rot2', `${rot2.toFixed(1)}deg`);
        particle.style.setProperty('--p-rot3', `${rot3.toFixed(1)}deg`);

        particlesLayer.appendChild(particle);

        setTimeout(() => particle.remove(), 1650);
      }, i * 45);
    }
  }

  // 4. Speech Reaction & KEV Telemetry
  setBotReaction(
    'hype',
    '⚡ BZZZZT! 💖 ENERGIZED TO 10,000 VOLTS!',
    '⚡ BZZZZT! 💖 A bolt from the RaioLabs thundercloud energized my circuits! Running on 10,000 Volts of pure love, code, and lightning!',
    '⚡'
  );
  emitKevAnalysis('LIGHTNING_ENERGIZED', 'Cloud-to-Bot lightning discharge energized RaioBot with emoji hearts & lightning eyes.', null, null, 'action');

  // 5. Complete Shock & Transition to Ultra-Energized Happy Dance
  setTimeout(() => {
    clearInterval(eyeInterval);
    if (eyesRow) eyesRow.innerHTML = originalEyesHtml;
    if (antennaBulb) antennaBulb.textContent = originalAntenna || '💖';
    botWrapper.classList.remove('bot-energized-shock');

    // Trigger celebratory victory hop
    botWrapper.classList.add('bot-bounce-once');
    setTimeout(() => botWrapper.classList.remove('bot-bounce-once'), 600);

    isBotEnergizedShockActive = false;
  }, 1850);
}

function triggerRaioLightningSurge(announce = true) {
  // 1. Play synthesized thunderclap sound effect (sharp snap + rumble + sub-bass)
  playThunderclapSound();

  // 2. Flash background lightning bolts & header/hero crests
  const overlay = document.getElementById('raio-lightning-overlay');
  const headerCrest = document.getElementById('raio-header-crest');
  const heroCrest = document.getElementById('hero-crest-showcase');

  [overlay, headerCrest, heroCrest].forEach(el => {
    if (!el) return;
    el.classList.remove('lightning-surge-active');
    void el.offsetWidth;
    el.classList.add('lightning-surge-active');
    setTimeout(() => el.classList.remove('lightning-surge-active'), 1100);
  });

  // 3. Shoot lightning bolt from dark cloud to RaioBot + trigger shocked emoji hearts/bolts animation
  triggerCloudToBotLightning();

  if (announce) {
    logToTerminal('action', 'THUNDERCLAP', '⚡ Raiolabs Logo Thunderclap: Cloud lightning bolt struck RaioBot with 10kV love surge!');
  }
}

function setupRaioLabsListeners() {
  renderCyberEventsGrid();
  renderWnitGrid();

  // Helper to maintain website background blur whenever any media/system modal is open
  const updateWebsiteBlur = () => {
    const isAnyOpen = [appearancesModal, wnitModal, eventsModal, settingsModal].some(m => m && !m.classList.contains('hidden'));
    if (isAnyOpen) {
      document.body.classList.add('website-blurred-bg');
    } else {
      document.body.classList.remove('website-blurred-bg');
    }
  };

  // Bind RaioLabs Shield Crest, Logo Container, and Dark Thunder Cloud clicks to trigger Lightning Surge + Thunderclap
  ['raio-header-crest', 'hero-crest-showcase'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', () => triggerRaioLightningSurge(true));
    }
  });

  const logoContainer = document.querySelector('.logo-container');
  if (logoContainer) {
    logoContainer.addEventListener('click', (e) => {
      // Don't duplicate if header crest was directly clicked
      if (e.target.closest('#raio-header-crest')) return;
      triggerRaioLightningSurge(true);
    });
  }

  const thunderCloud = document.querySelector('.thunder-cloud-bg');
  if (thunderCloud) {
    thunderCloud.addEventListener('click', () => triggerRaioLightningSurge(true));
  }

  // --- RECENT APPEARANCES MODAL & FOREGROUND YOUTUBE PLAYER ---
  const openAppearancesBtn = document.getElementById('btn-open-appearances');
  const closeAppearancesBtn = document.getElementById('btn-close-appearances');
  const appearancesModal = document.getElementById('appearances-modal');
  const stopPlayerBtn = document.getElementById('btn-stop-player');

  const closeAppearancesModal = () => {
    stopAppearancePlayer();
    if (appearancesModal) appearancesModal.classList.add('hidden');
    updateWebsiteBlur();
  };

  if (openAppearancesBtn && appearancesModal) {
    openAppearancesBtn.addEventListener('click', () => {
      appearancesModal.classList.remove('hidden');
      updateWebsiteBlur();
      logToTerminal('info', 'APPEARANCES', 'Opened Recent Appearances foreground media deck.');
      recordInteraction({ type: 'open_modal', modal: 'recent_appearances' });
    });
  }

  if (closeAppearancesBtn) {
    closeAppearancesBtn.addEventListener('click', closeAppearancesModal);
  }

  if (stopPlayerBtn) {
    stopPlayerBtn.addEventListener('click', stopAppearancePlayer);
  }

  document.querySelectorAll('[data-play-id]').forEach(el => {
    el.addEventListener('click', () => {
      const playId = el.getAttribute('data-play-id');
      if (playId) playAppearanceInForeground(playId);
    });
  });

  // --- WHAT'S NEW IN TECH (WNIT) MODAL & GOOGLE DRIVE PLAYER ---
  const openWnitBtn = document.getElementById('btn-open-wnit');
  const closeWnitBtn = document.getElementById('btn-close-wnit');
  const wnitModal = document.getElementById('wnit-modal');
  const stopWnitBtn = document.getElementById('btn-stop-wnit-player');

  const closeWnitModal = () => {
    stopWnitPlayer();
    if (wnitModal) wnitModal.classList.add('hidden');
    updateWebsiteBlur();
  };

  if (openWnitBtn && wnitModal) {
    openWnitBtn.addEventListener('click', () => {
      renderWnitGrid(state.activeWnitFilter || 'all');
      wnitModal.classList.remove('hidden');
      updateWebsiteBlur();
      logToTerminal('info', 'WNIT', 'Opened What\'s New In Tech (WNIT) Google Drive media vault.');
      recordInteraction({ type: 'open_modal', modal: 'wnit_vault' });
      setBotReaction(
        'hype',
        '🎙️ WHAT\'S NEW IN TECH (WNIT)',
        'Welcome to the WNIT Media Vault! Choose any video or audio podcast to stream right in the foreground player while keeping the workspace in view!',
        '🎙️'
      );
    });
  }

  if (closeWnitBtn) {
    closeWnitBtn.addEventListener('click', closeWnitModal);
  }

  if (stopWnitBtn) {
    stopWnitBtn.addEventListener('click', stopWnitPlayer);
  }

  document.querySelectorAll('#wnit-filter-bar .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#wnit-filter-bar .pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeWnitFilter = btn.getAttribute('data-wnit-filter') || 'all';
      renderWnitGrid(state.activeWnitFilter);
    });
  });

  // --- EVENTS & CYBERSECURITY / OWASP MODAL ---
  const openEventsBtn = document.getElementById('btn-open-events');
  const closeEventsBtn = document.getElementById('btn-close-events');
  const eventsModal = document.getElementById('events-modal');
  const switchToAppearancesBtn = document.getElementById('btn-switch-to-appearances');

  const closeEventsModal = () => {
    if (eventsModal) eventsModal.classList.add('hidden');
    updateWebsiteBlur();
  };

  if (openEventsBtn && eventsModal) {
    openEventsBtn.addEventListener('click', () => {
      renderCyberEventsGrid();
      eventsModal.classList.remove('hidden');
      updateWebsiteBlur();
      logToTerminal('info', 'CYBER_EVENTS', 'Opened Events & Cybersecurity / OWASP Appearances overlay.');
      recordInteraction({ type: 'open_modal', modal: 'events_owasp' });
    });
  }

  if (closeEventsBtn) {
    closeEventsBtn.addEventListener('click', closeEventsModal);
  }

  if (switchToAppearancesBtn) {
    switchToAppearancesBtn.addEventListener('click', () => {
      closeEventsModal();
      if (appearancesModal) {
        appearancesModal.classList.remove('hidden');
        updateWebsiteBlur();
      }
      playAppearanceInForeground('owasp-vegas-2026');
    });
  }

  document.querySelectorAll('#events-filter-bar .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#events-filter-bar .pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeEventCategory = btn.getAttribute('data-event-cat') || 'All';
      renderCyberEventsGrid();
    });
  });

  // Close any blurred modal overlay on backdrop click or Escape key
  const settingsModal = document.getElementById('settings-modal');
  [appearancesModal, wnitModal, eventsModal, settingsModal].forEach(modalEl => {
    if (!modalEl) return;
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) {
        if (modalEl === appearancesModal) {
          closeAppearancesModal();
        } else if (modalEl === wnitModal) {
          closeWnitModal();
        } else if (modalEl === eventsModal) {
          closeEventsModal();
        } else {
          modalEl.classList.add('hidden');
          updateWebsiteBlur();
        }
      }
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (appearancesModal && !appearancesModal.classList.contains('hidden')) {
        closeAppearancesModal();
      }
      if (wnitModal && !wnitModal.classList.contains('hidden')) {
        closeWnitModal();
      }
      if (eventsModal && !eventsModal.classList.contains('hidden')) {
        closeEventsModal();
      }
      if (settingsModal && !settingsModal.classList.contains('hidden')) {
        settingsModal.classList.add('hidden');
        updateWebsiteBlur();
      }
    }
  });

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
// 🚨 KEV-BOT: REAL-TIME USER BEHAVIOR, DEVTOOLS & CODE VIEW CALLOUT ENGINE
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
  hoveredTarget: 'Main Canvas',
  currentDomSelector: 'body',
  lastActionCallout: 'Scanning RaioLabs architecture...',
  devToolsDetected: false,
  scrollDepthPct: 0,
  eventsLogged: 0,
  liveDomCommentNode: null
};

function updateKevDeveloperCodeView(calloutOverride = null) {
  if (kevState.paused) return;
  if (calloutOverride) {
    kevState.lastActionCallout = calloutOverride;
  }

  const codePre = document.getElementById('kev-code-pre');
  const devToolsBadge = document.getElementById('kev-devtools-badge');
  const clicksCount = document.getElementById('stat-clicks')?.textContent || '0';
  const nowStr = new Date().toTimeString().split(' ')[0];
  const platformStr = navigator.platform || 'Browser';
  const vpStr = `${window.innerWidth}x${window.innerHeight}`;

  if (devToolsBadge) {
    if (kevState.devToolsDetected) {
      devToolsBadge.textContent = '🚨 DEVTOOLS OPEN! I SEE YOU!';
      devToolsBadge.classList.add('devtools-alert');
    } else {
      devToolsBadge.textContent = '👁️ LIVE CODE WATCHER';
      devToolsBadge.classList.remove('devtools-alert');
    }
  }

  const friendlyRoast = kevState.devToolsDetected
    ? '🚨 HEY HACKER! I see you with Browser DevTools open inspecting our code!'
    : `👀 Watching your cursor at (${kevState.lastX}, ${kevState.lastY}) over <${kevState.currentDomSelector}>`;

  if (codePre) {
    codePre.textContent =
`// 🚨 KEV-BOT RING-0 COUNTER-RECONNAISSANCE CODE VIEW
// ${friendlyRoast}
export const LIVE_OPERATOR_TELEMETRY = {
  timestamp: "${nowStr}",
  devToolsInspectorOpen: ${kevState.devToolsDetected},
  cursorKinematics: { x: ${kevState.lastX}, y: ${kevState.lastY}, velocity: "${kevState.cursorVelocity} px/s", peak: "${kevState.peakVelocity} px/s" },
  domNodeUnderCursor: "${kevState.currentDomSelector}",
  focusedComponent: "${kevState.hoveredTarget}",
  activeZone: "${kevState.activeZone}",
  classifiedIntent: "${kevState.intentProfile}",
  viewport: "${vpStr} (${platformStr}) • Scroll: ${kevState.scrollDepthPct}% • Clicks: ${clicksCount}",
  kevBotLiveCallout: "${kevState.lastActionCallout.replace(/"/g, "'")}"
};`;
  }

  // Mutate live HTML comment & body attribute so anyone inspecting the DOM Elements tree (F12) sees it flash purple in real time!
  if (!kevState.liveDomCommentNode && document.body) {
    kevState.liveDomCommentNode = document.createComment(' 🚨 KEV-BOT RING-0 COUNTER-RECON INITIALIZING... ');
    document.body.insertBefore(kevState.liveDomCommentNode, document.body.firstChild);
  }
  if (kevState.liveDomCommentNode) {
    kevState.liveDomCommentNode.nodeValue = ` 🚨 KEV-BOT SEES YOU IN THE DOM TREE! [${nowStr}] Cursor=(${kevState.lastX},${kevState.lastY}) @ ${kevState.cursorVelocity}px/s | Element=<${kevState.currentDomSelector}> | Target="${kevState.hoveredTarget}" | Callout: ${kevState.lastActionCallout} `;
  }
  if (document.body) {
    document.body.setAttribute(
      'data-kev-bot-live-callout',
      `👀 [${nowStr}] (${kevState.lastX},${kevState.lastY}) ${kevState.cursorVelocity}px/s on <${kevState.currentDomSelector}> ➔ ${kevState.lastActionCallout.slice(0, 90)}`
    );
  }
}

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

  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  kevState.eventsLogged++;

  // Update the Live Developer Code View & live DOM tree comment
  updateKevDeveloperCodeView(`[${tag}] ${message}`);

  // Also spit out real-time styled counter-recon logs directly into the Browser DevTools Console (F12)!
  if (typeof console !== 'undefined' && console.log) {
    const badgeColor = level === 'error' ? '#ef4444' : (level === 'action' ? '#10b981' : '#f43f5e');
    console.log(
      `%c🚨 KEV-BOT [${tag}]%c @ ${timeStr} ➔ ${message}`,
      `background:${badgeColor}; color:#fff; font-weight:800; padding:2px 6px; border-radius:4px;`,
      'color:#38bdf8; font-family:monospace; font-weight:600;'
    );
  }

  if (!streamBox) return;

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
  const codeViewBtn = document.getElementById('btn-kev-code-view');
  const codeDrawer = document.getElementById('kev-dev-code-drawer');
  const velEl = document.getElementById('kev-stat-vel');

  // Print initial Counter-Recon Banner into Browser DevTools Console (F12)
  if (typeof console !== 'undefined' && console.log) {
    console.log(
      '%c🚨 KEV-BOT v2.6 // RING-0 COUNTER-RECONNAISSANCE SENTINEL ACTIVE 🚨\n%c👀 Hey there, curious hacker / developer! We see you looking at the Developer Console & DOM Tree.\nEvery mouse move, hover target, scroll vector, and click you make on this page is being analyzed in real time below:',
      'background:linear-gradient(90deg,#f43f5e,#9333ea); color:#fff; font-size:14px; font-weight:900; padding:8px 14px; border-radius:6px;',
      'color:#34d399; font-size:12px; font-family:monospace; padding-top:4px;'
    );
  }

  updateKevDeveloperCodeView('KEV-Bot counter-recon sensor armed. Watching cursor & DOM tree...');

  if (codeViewBtn && codeDrawer) {
    codeViewBtn.addEventListener('click', () => {
      const isHidden = codeDrawer.classList.toggle('hidden');
      codeViewBtn.classList.toggle('active', !isHidden);
    });
  }

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
  const triggerKevStageBriefing = (customReason = null) => {
    const clicksCount = document.getElementById('stat-clicks')?.textContent || '0';
    const uptimeVal = document.getElementById('stat-uptime')?.textContent || '0s';
    const livePayload = JSON.stringify({
      analyst: 'KEV-Bot v2.6 (Counter-Recon & Behavioral Sensor)',
      devToolsInspectorOpen: kevState.devToolsDetected,
      sessionUptime: uptimeVal,
      cursorCoords: { x: kevState.lastX, y: kevState.lastY },
      cursorVelocityPxPerSec: kevState.cursorVelocity,
      peakVelocityPxPerSec: kevState.peakVelocity,
      domElementUnderCursor: `<${kevState.currentDomSelector}>`,
      activeWorkspaceZone: kevState.activeZone,
      classifiedIntentProfile: kevState.intentProfile,
      lastInspectedTarget: kevState.hoveredTarget || 'Main Canvas',
      totalOperatorClicks: parseInt(clicksCount, 10) || 0,
      viewportScrollDepth: `${kevState.scrollDepthPct}%`,
      telemetryVerdict: kevState.devToolsDetected ? 'SOURCE_CODE_INSPECTION_DETECTED' : 'ACTIVE_OPERATOR_ENGAGEMENT'
    }, null, 2);

    showCompanionSwarmInteraction({
      from: 'orchestrator',
      to: 'kev',
      protocol: 'KEV_COUNTER_RECON',
      badge: kevState.devToolsDetected ? '🚨 DEVTOOLS OPEN' : 'REAL-TIME ANALYST',
      logType: kevState.devToolsDetected ? 'error' : 'thought',
      logTag: 'KEV_BOT',
      senderLine: '🎛️ RaioBot (Orchestrator): "KEV-Bot, pop up and call out what our visitor is doing on the webpage right now!"',
      message: customReason || `Operator is at (${kevState.lastX}, ${kevState.lastY}) over <${kevState.currentDomSelector}> in [${kevState.activeZone}] (${kevState.intentProfile}). Peak velocity: ${kevState.peakVelocity} px/s!`,
      payload: livePayload
    }, 1, 1, 'KEV-Bot Live Counter-Recon');
  };

  if (stageSyncBtn) {
    stageSyncBtn.addEventListener('click', () => triggerKevStageBriefing());
  }
  const kevAvatar = document.getElementById('kev-bot-avatar');
  if (kevAvatar) {
    kevAvatar.style.cursor = 'pointer';
    kevAvatar.addEventListener('click', () => triggerKevStageBriefing());
  }

  // 0. Detect Hacker / Developer Opening DevTools (F12, Ctrl+Shift+I/J/C, Ctrl+U, Right-Click Inspect, or Docked DevTools Window)
  const triggerDevToolsCallout = (method) => {
    kevState.devToolsDetected = true;
    if (codeDrawer) codeDrawer.classList.remove('hidden');
    if (codeViewBtn) codeViewBtn.classList.add('active');
    const msg = `👀 CAUGHT YOU! Operator triggered [${method}] to inspect the developer source code! KEV-Bot is now streaming live counter-recon into your Console & DOM tree!`;
    emitKevAnalysis('DEVTOOLS_INTRUSION', msg, 'Developer Inspector', 'Source Code Hacker 🕵️‍♂️', 'error');
    triggerKevStageBriefing(msg);
  };

  window.addEventListener('keydown', (e) => {
    const key = (e.key || '').toUpperCase();
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (key === 'I' || key === 'J' || key === 'C')) ||
      (e.metaKey && e.altKey && (key === 'I' || key === 'J' || key === 'C')) ||
      (e.ctrlKey && key === 'U')
    ) {
      triggerDevToolsCallout(`Shortcut ${e.ctrlKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${key}`);
    }
  });

  document.addEventListener('contextmenu', (e) => {
    const tag = e.target?.tagName?.toLowerCase() || 'element';
    emitKevAnalysis(
      'RIGHT_CLICK_INSPECT',
      `Right-click context menu opened at (${e.clientX}, ${e.clientY}) on <${tag}> ➔ Preparing "Inspect Element" recon? I see you! 👀`,
      null,
      'DOM Inspector 🕵️‍♂️',
      'error'
    );
  });

  // Periodic check if docked DevTools window is open via outer/inner viewport delta
  setInterval(() => {
    const widthDiff = window.outerWidth - window.innerWidth > 165;
    const heightDiff = window.outerHeight - window.innerHeight > 165;
    if ((widthDiff || heightDiff) && !kevState.devToolsDetected) {
      triggerDevToolsCallout('Docked Browser DevTools Panel');
    } else if (!widthDiff && !heightDiff && kevState.devToolsDetected) {
      kevState.devToolsDetected = false;
      updateKevDeveloperCodeView('DevTools panel closed. Continuing passive DOM watch...');
    }
  }, 1200);

  // 1. Real-Time Mouse Kinematics, DOM Element Selector & Velocity Sensor
  let lastVelReportTs = 0;
  let lastCodeRefreshTs = 0;
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

    // Identify the exact DOM element under the user's cursor
    const el = e.target;
    if (el && el.tagName) {
      const tag = el.tagName.toLowerCase();
      const idPart = el.id ? `#${el.id}` : '';
      const clsPart = typeof el.className === 'string' && el.className.trim()
        ? `.${el.className.trim().split(/\s+/)[0]}`
        : '';
      kevState.currentDomSelector = `${tag}${idPart}${clsPart}`;
    }

    if (velEl && !kevState.paused) {
      velEl.textContent = `${vel} px/s`;
    }

    // Refresh the Live Developer Code View & DOM comment every 120ms while moving cursor
    if (now - lastCodeRefreshTs > 120) {
      lastCodeRefreshTs = now;
      updateKevDeveloperCodeView();
    }

    // Report high-velocity cursor sweeps (throttled every 3.2s)
    if (vel > 1650 && now - lastVelReportTs > 3200) {
      lastVelReportTs = now;
      emitKevAnalysis(
        'CURSOR_KINEMATICS',
        `High-velocity cursor sweep (${vel} px/s) at (${e.clientX}, ${e.clientY}) over <${kevState.currentDomSelector}> ➔ Rapid UI reconnaissance.`,
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
      updateKevDeveloperCodeView();
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
          `Operator dwelling on "${title}" [${badge}] at (${kevState.lastX}, ${kevState.lastY}) ➔ Evaluating repository architecture & CLI deployment.`,
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
      `Click at (${e.clientX}, ${e.clientY}) on <${kevState.currentDomSelector}> [${label || t.tagName}] ➔ Executing interactive DOM command.`,
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
    updateKevDeveloperCodeView();
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


