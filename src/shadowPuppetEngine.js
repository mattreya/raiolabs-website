// Shadow Puppet Engine for RaioLabs Theatre Stage
// Wayang Kulit Cyber-Puppetry telling the story of the 5 Types of Bots

export const BOT_PUPPET_DEFS = {
  cat1: {
    id: 'cat1',
    category: 'CAT 1',
    name: 'The Digital Creator',
    archetype: 'The Content Synthesizer & Writer',
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.45)',
    accent: '#34d399',
    stickColor: '#064e3b',
    symbol: '📜',
    defaultPos: 20,
    role: 'AI that generates new content: drafting emails, writing summaries, articles, or PowerPoint presentations. Category 1 (Minimal damage, but still impactful!).',
    svg: `
      <svg class="puppet-svg" viewBox="0 0 160 320" xmlns="http://www.w3.org/2000/svg">
        <!-- Control Rods (Bamboo/Metal shadow sticks) -->
        <line x1="80" y1="130" x2="80" y2="318" stroke="#1c1917" stroke-width="4.5" stroke-linecap="round" />
        <line x1="80" y1="130" x2="80" y2="318" stroke="rgba(16, 185, 129, 0.3)" stroke-width="1.5" />
        <line x1="125" y1="170" x2="115" y2="318" stroke="#292524" stroke-width="2.5" />
        <line x1="35" y1="180" x2="45" y2="318" stroke="#292524" stroke-width="2.5" />

        <!-- Puppet Silhouette Body (Deep Obsidian Shadow with Intricate Laser Piercings) -->
        <g class="puppet-silhouette" fill="#0f172a" stroke="#fef3c7" stroke-width="1" stroke-opacity="0.8">
          <!-- Flowing Ceremonial Headdress (Wayang Mahkota with Cyber Feathers) -->
          <path d="M 80 20 Q 95 10 105 25 Q 115 5 125 28 Q 100 45 92 60 L 68 60 Q 60 45 35 28 Q 45 5 55 25 Q 65 10 80 20 Z" />
          <circle cx="80" cy="35" r="4" fill="#10b981" stroke="#fef3c7" />
          <path d="M 72 45 L 88 45 M 76 52 L 84 52" stroke="#fef3c7" stroke-width="1" />

          <!-- Mask / Head Profile -->
          <path d="M 68 60 Q 60 70 65 85 Q 70 95 80 95 Q 90 95 95 85 Q 100 70 92 60 Z" />
          <!-- Pierced Eye & Filigree Smile -->
          <ellipse cx="73" cy="74" rx="3" ry="2" fill="#10b981" />
          <ellipse cx="87" cy="74" rx="3" ry="2" fill="#10b981" />
          <path d="M 75 84 Q 80 88 85 84" fill="none" stroke="#fef3c7" stroke-width="1.2" />

          <!-- Long Slender Neck & Ornate Cyber Torso -->
          <path d="M 74 95 L 86 95 L 90 115 L 70 115 Z" />
          <rect x="73" y="100" width="14" height="10" rx="2" fill="#022c22" stroke="#34d399" stroke-width="1" />

          <!-- Royal Scribe Robes with Pierced Filigree & Circuit Fretwork -->
          <path d="M 70 115 Q 40 140 45 220 Q 80 240 115 220 Q 120 140 90 115 Z" />
          <!-- Wayang Batik Lattice Cutouts -->
          <path d="M 60 140 L 100 140 M 55 165 L 105 165 M 52 190 L 108 190 M 80 120 L 80 225" stroke="#fef3c7" stroke-width="0.8" stroke-dasharray="3,2" />
          <circle cx="80" cy="152" r="5" fill="#10b981" fill-opacity="0.5" />
          <circle cx="80" cy="178" r="6" fill="#10b981" fill-opacity="0.5" />
          <circle cx="80" cy="205" r="5" fill="#10b981" fill-opacity="0.5" />

          <!-- Left Arm holding Unfurled Scroll -->
          <g class="arm-left">
            <path d="M 68 120 Q 40 145 35 180" stroke="#0f172a" stroke-width="6" fill="none" />
            <!-- The Magic Scroll of Creation -->
            <path d="M 18 160 Q 35 150 48 165 Q 45 210 25 215 Q 15 195 18 160 Z" fill="#064e3b" stroke="#34d399" stroke-width="1.2" />
            <path d="M 24 172 L 40 170 M 24 182 L 42 180 M 25 192 L 38 190" stroke="#fef3c7" stroke-width="1" />
            <text x="24" y="205" font-size="7" font-family="monospace" fill="#34d399">&lt;PROMPT&gt;</text>
          </g>

          <!-- Right Arm holding Giant Feather Quill Scepter -->
          <g class="arm-right">
            <path d="M 92 120 Q 115 140 125 170" stroke="#0f172a" stroke-width="6" fill="none" />
            <!-- Large Pierced Peacock Quill Pen -->
            <path d="M 125 170 Q 140 130 152 90 Q 140 105 125 125 Q 118 145 125 170 Z" fill="#047857" stroke="#6ee7b7" stroke-width="1" />
            <path d="M 125 170 L 152 90" stroke="#fef3c7" stroke-width="1" />
            <!-- Glowing Ink Droplet -->
            <circle cx="123" cy="175" r="3.5" fill="#10b981" />
          </g>

          <!-- Lower Fringe & Base Feet Silhouette -->
          <path d="M 52 225 Q 40 245 42 250 L 75 240 L 80 248 L 85 240 L 118 250 Q 120 245 108 225 Z" />
        </g>
      </svg>
    `
  },

  cat2: {
    id: 'cat2',
    category: 'CAT 2',
    name: 'The Digital Forecaster',
    archetype: 'The Predictive Analyst ("Minority Report")',
    color: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.45)',
    accent: '#60a5fa',
    stickColor: '#1e3a8a',
    symbol: '🔮',
    defaultPos: 35,
    role: 'Analyzes data to predict outcomes and make recommendations: Amazon/Netflix engines, resume screening, market trends. Think "Minority Report"... Category 2 (Moderate damage).',
    svg: `
      <svg class="puppet-svg" viewBox="0 0 160 320" xmlns="http://www.w3.org/2000/svg">
        <!-- Control Rods -->
        <line x1="80" y1="130" x2="80" y2="318" stroke="#1c1917" stroke-width="4.5" stroke-linecap="round" />
        <line x1="80" y1="130" x2="80" y2="318" stroke="rgba(59, 130, 246, 0.3)" stroke-width="1.5" />
        <line x1="130" y1="160" x2="120" y2="318" stroke="#292524" stroke-width="2.5" />
        <line x1="30" y1="170" x2="40" y2="318" stroke="#292524" stroke-width="2.5" />

        <!-- Puppet Silhouette Body -->
        <g class="puppet-silhouette" fill="#0f172a" stroke="#fef3c7" stroke-width="1" stroke-opacity="0.8">
          <!-- Oracle Antenna Crown & Radar Fan -->
          <path d="M 80 15 L 80 50 M 70 25 L 90 25 M 65 35 L 95 35" stroke="#60a5fa" stroke-width="1.5" />
          <circle cx="80" cy="15" r="5" fill="#3b82f6" />
          <path d="M 50 45 Q 80 25 110 45 Q 95 65 80 62 Q 65 65 50 45 Z" fill="#1e3a8a" stroke="#93c5fd" />

          <!-- Mask with Cyclopean Telemetry Visor -->
          <path d="M 66 62 Q 60 75 66 92 Q 80 100 94 92 Q 100 75 94 62 Z" />
          <!-- The Glowing Radar Eye / Prism -->
          <ellipse cx="80" cy="78" rx="12" ry="6" fill="#1d4ed8" stroke="#93c5fd" stroke-width="1.5" />
          <circle cx="80" cy="78" r="3" fill="#60a5fa" />
          <line x1="68" y1="78" x2="92" y2="78" stroke="#bfdbfe" stroke-width="0.8" />
          <line x1="80" y1="72" x2="80" y2="84" stroke="#bfdbfe" stroke-width="0.8" />

          <!-- Neck & Oracle Robes -->
          <path d="M 73 95 L 87 95 L 92 118 L 68 118 Z" />
          <!-- Celestial Telemetry Mantle -->
          <path d="M 68 118 Q 30 145 35 225 Q 80 248 125 225 Q 130 145 92 118 Z" fill="#0f172a" />
          
          <!-- Wave Pattern & Risk Forecast Charts etched onto Silhouette -->
          <path d="M 45 155 Q 60 140 80 155 Q 100 170 115 155" fill="none" stroke="#60a5fa" stroke-width="1.5" />
          <path d="M 45 180 Q 65 195 80 180 Q 95 165 115 180" fill="none" stroke="#93c5fd" stroke-width="1.2" />
          <path d="M 48 205 L 112 205" stroke="#fef3c7" stroke-dasharray="2,2" stroke-width="1" />
          <!-- Radar Rings Cutouts -->
          <circle cx="80" cy="180" r="18" fill="none" stroke="rgba(96, 165, 250, 0.4)" stroke-width="1" />
          <circle cx="80" cy="180" r="10" fill="none" stroke="rgba(96, 165, 250, 0.6)" stroke-width="1" />

          <!-- Left Arm holding Telemetry Astrolabe / Spinning Crystal -->
          <g class="arm-left">
            <path d="M 68 122 Q 42 145 30 170" stroke="#0f172a" stroke-width="6" fill="none" />
            <circle cx="28" cy="172" r="14" fill="#1e40af" stroke="#93c5fd" stroke-width="1.5" />
            <!-- Concentric Orbits in Hand -->
            <ellipse cx="28" cy="172" rx="12" ry="5" fill="none" stroke="#60a5fa" />
            <ellipse cx="28" cy="172" rx="5" ry="12" fill="none" stroke="#60a5fa" />
            <circle cx="28" cy="172" r="3.5" fill="#fde047" />
          </g>

          <!-- Right Arm holding Forecaster Staff -->
          <g class="arm-right">
            <path d="M 92 122 Q 115 140 130 160" stroke="#0f172a" stroke-width="6" fill="none" />
            <!-- Tall Forecaster Staff with Weather Prism -->
            <line x1="130" y1="70" x2="130" y2="250" stroke="#60a5fa" stroke-width="2.5" />
            <!-- Top Prism Crystal -->
            <polygon points="130,55 140,70 130,85 120,70" fill="#3b82f6" stroke="#fef3c7" />
            <circle cx="130" cy="70" r="2" fill="#fff" />
          </g>

          <!-- Robe Hem with Telemetry Indicators -->
          <path d="M 40 230 L 60 250 L 80 238 L 100 250 L 120 230" fill="none" stroke="#60a5fa" stroke-width="1.5" />
        </g>
      </svg>
    `
  },

  cat3: {
    id: 'cat3',
    category: 'CAT 3',
    name: 'The Solo Task Manager',
    archetype: 'The Multiplicity Automaton (1,000x Mirror)',
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.45)',
    accent: '#fbbf24',
    stickColor: '#78350f',
    symbol: '⚙️',
    defaultPos: 50,
    role: 'Handles specific automated jobs (customer service, data entry, schedulers). Automate repetitive tasks you control. Multiplicity dilemma & Standing between two mirrors 1,000x! Category 3 (Extensive damage).',
    svg: `
      <svg class="puppet-svg" viewBox="0 0 160 320" xmlns="http://www.w3.org/2000/svg">
        <!-- Control Rods -->
        <line x1="80" y1="135" x2="80" y2="318" stroke="#1c1917" stroke-width="4.5" stroke-linecap="round" />
        <line x1="80" y1="135" x2="80" y2="318" stroke="rgba(245, 158, 11, 0.3)" stroke-width="1.5" />
        <line x1="135" y1="150" x2="125" y2="318" stroke="#292524" stroke-width="2.5" />
        <line x1="25" y1="155" x2="35" y2="318" stroke="#292524" stroke-width="2.5" />

        <!-- Puppet Silhouette Body -->
        <g class="puppet-silhouette" fill="#0f172a" stroke="#fef3c7" stroke-width="1" stroke-opacity="0.8">
          <!-- Steampunk Gear Headdress -->
          <circle cx="80" cy="38" r="16" fill="#78350f" stroke="#fbbf24" stroke-width="1.5" stroke-dasharray="4,3" />
          <circle cx="80" cy="38" r="8" fill="#0f172a" stroke="#fde68a" stroke-width="1" />
          <path d="M 70 18 L 90 18 M 80 12 L 80 24" stroke="#fbbf24" stroke-width="1.5" />

          <!-- Mask / Head with Articulated Goggles -->
          <path d="M 65 55 L 95 55 L 92 88 L 68 88 Z" fill="#1c1917" stroke="#fbbf24" />
          <!-- Twin Precision Goggles -->
          <circle cx="73" cy="68" r="6" fill="#f59e0b" stroke="#fef3c7" stroke-width="1.2" />
          <circle cx="87" cy="68" r="6" fill="#f59e0b" stroke="#fef3c7" stroke-width="1.2" />
          <circle cx="73" cy="68" r="2" fill="#fff" />
          <circle cx="87" cy="68" r="2" fill="#fff" />
          <!-- Riveted Brass Jaw -->
          <rect x="71" y="78" width="18" height="6" fill="#78350f" stroke="#fde68a" stroke-width="0.8" />
          <line x1="77" y1="78" x2="77" y2="84" stroke="#fef3c7" />
          <line x1="83" y1="78" x2="83" y2="84" stroke="#fef3c7" />

          <!-- Massive Heavy Neck & Tool Piston Torso -->
          <rect x="72" y="88" width="16" height="18" fill="#292524" stroke="#fbbf24" />
          <!-- Main Body Chassis with Exposed Spinning Gears -->
          <path d="M 55 106 L 105 106 L 115 220 L 45 220 Z" fill="#0f172a" stroke="#fbbf24" stroke-width="1.5" />
          
          <!-- Pierced Big Gear inside Chest -->
          <circle cx="80" cy="150" r="22" fill="#451a03" stroke="#f59e0b" stroke-width="2" stroke-dasharray="6,4" />
          <circle cx="80" cy="150" r="10" fill="#0f172a" stroke="#fde68a" stroke-width="1.5" />
          <circle cx="80" cy="150" r="3" fill="#fbbf24" />
          
          <!-- Smaller Interlocking Satellite Cogs -->
          <circle cx="62" cy="185" r="12" fill="#78350f" stroke="#fbbf24" stroke-width="1.2" stroke-dasharray="4,2" />
          <circle cx="98" cy="185" r="12" fill="#78350f" stroke="#fbbf24" stroke-width="1.2" stroke-dasharray="4,2" />
          <line x1="62" y1="185" x2="98" y2="185" stroke="#fef3c7" stroke-width="1" />

          <!-- Left Arm holding Precision Caliper / Code Meter -->
          <g class="arm-left">
            <path d="M 55 110 L 30 135 L 25 165" stroke="#292524" stroke-width="6" fill="none" />
            <!-- Caliper / Gauge Tool -->
            <path d="M 12 145 L 35 155 L 18 185" fill="none" stroke="#fbbf24" stroke-width="2" />
            <circle cx="25" cy="165" r="4" fill="#f59e0b" />
          </g>

          <!-- Right Arm holding Giant Industrial Hydraulic Wrench -->
          <g class="arm-right">
            <path d="M 105 110 L 125 130 L 135 155" stroke="#292524" stroke-width="6" fill="none" />
            <!-- Heavy Wrench Silhouette -->
            <path d="M 130 115 L 140 210 M 122 120 L 142 110 L 148 130" stroke="#f59e0b" stroke-width="3" fill="none" stroke-linecap="round" />
            <circle cx="135" cy="155" r="4" fill="#fbbf24" />
          </g>

          <!-- Riveted Chassis Skirt & Piston Feet -->
          <path d="M 45 220 L 115 220 L 110 245 L 85 240 L 80 248 L 75 240 L 50 245 Z" fill="#1c1917" stroke="#fbbf24" />
          <circle cx="60" cy="232" r="2.5" fill="#fde68a" />
          <circle cx="80" cy="232" r="2.5" fill="#fde68a" />
          <circle cx="100" cy="232" r="2.5" fill="#fde68a" />
        </g>
      </svg>
    `
  },

  cat4: {
    id: 'cat4',
    category: 'CAT 4',
    name: 'The Coordinated Team',
    archetype: 'The Bot Overlord (Multi-Agent Swarm)',
    color: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.45)',
    accent: '#c084fc',
    stickColor: '#581c87',
    symbol: '👑',
    defaultPos: 65,
    role: 'Multiple AI systems working together under a central controller. Born from Matt Raio\'s MCP podcast, slash commands, and real-time agent-to-agent meshes. Category 4 (Catastrophic disruption).',
    svg: `
      <svg class="puppet-svg" viewBox="0 0 160 320" xmlns="http://www.w3.org/2000/svg">
        <!-- Control Rods -->
        <line x1="80" y1="120" x2="80" y2="318" stroke="#1c1917" stroke-width="4.5" stroke-linecap="round" />
        <line x1="80" y1="120" x2="80" y2="318" stroke="rgba(168, 85, 247, 0.3)" stroke-width="1.5" />
        <line x1="140" y1="145" x2="130" y2="318" stroke="#292524" stroke-width="2.5" />
        <line x1="20" y1="145" x2="30" y2="318" stroke="#292524" stroke-width="2.5" />

        <!-- Floating Mini-Subagent Scout Satellites orbiting on thin rods -->
        <g class="subagent-scout-1">
          <line x1="25" y1="65" x2="45" y2="105" stroke="#c084fc" stroke-width="1" stroke-dasharray="2,2" />
          <circle cx="25" cy="65" r="7" fill="#3b0764" stroke="#a855f7" stroke-width="1.5" />
          <circle cx="25" cy="65" r="2.5" fill="#e9d5ff" />
        </g>
        <g class="subagent-scout-2">
          <line x1="135" y1="55" x2="115" y2="105" stroke="#c084fc" stroke-width="1" stroke-dasharray="2,2" />
          <circle cx="135" cy="55" r="8" fill="#3b0764" stroke="#a855f7" stroke-width="1.5" />
          <circle cx="135" cy="55" r="3" fill="#e9d5ff" />
        </g>

        <!-- Puppet Silhouette Body -->
        <g class="puppet-silhouette" fill="#0f172a" stroke="#fef3c7" stroke-width="1" stroke-opacity="0.8">
          <!-- Imperial Overlord Crown with MCP Nodes & Antennas -->
          <path d="M 50 45 L 60 15 L 70 35 L 80 8 L 90 35 L 100 15 L 110 45 Z" fill="#581c87" stroke="#c084fc" stroke-width="1.5" />
          <circle cx="80" cy="8" r="4" fill="#a855f7" stroke="#fff" />
          <circle cx="60" cy="15" r="3" fill="#c084fc" />
          <circle cx="100" cy="15" r="3" fill="#c084fc" />

          <!-- Regal Overlord Mask & Cyber Beard -->
          <path d="M 65 45 Q 60 65 68 85 L 80 98 L 92 85 Q 100 65 95 45 Z" fill="#1e1b4b" stroke="#c084fc" />
          <!-- Dual Glowing Cyber Visors (Command Sight) -->
          <polygon points="68,60 78,58 77,66 69,67" fill="#a855f7" stroke="#fef3c7" />
          <polygon points="92,60 82,58 83,66 91,67" fill="#a855f7" stroke="#fef3c7" />
          <path d="M 75 80 L 85 80" stroke="#fef3c7" />

          <!-- Overlord Mantle & Swarm Cape -->
          <path d="M 68 98 L 92 98 L 125 130 L 135 235 Q 80 260 25 235 L 35 130 Z" fill="#0f172a" stroke="#a855f7" stroke-width="1.5" />
          
          <!-- Swarm Network Graph Etched in Cape (Branches & Nodes) -->
          <circle cx="80" cy="135" r="6" fill="#6b21a8" stroke="#e9d5ff" stroke-width="1.2" />
          <circle cx="55" cy="170" r="5" fill="#581c87" stroke="#c084fc" />
          <circle cx="105" cy="170" r="5" fill="#581c87" stroke="#c084fc" />
          <circle cx="45" cy="205" r="4" fill="#3b0764" stroke="#a855f7" />
          <circle cx="70" cy="210" r="4" fill="#3b0764" stroke="#a855f7" />
          <circle cx="90" cy="210" r="4" fill="#3b0764" stroke="#a855f7" />
          <circle cx="115" cy="205" r="4" fill="#3b0764" stroke="#a855f7" />
          <!-- Git Graph Edges Connecting Swarm -->
          <line x1="80" y1="141" x2="55" y2="165" stroke="#c084fc" stroke-width="1.2" />
          <line x1="80" y1="141" x2="105" y2="165" stroke="#c084fc" stroke-width="1.2" />
          <line x1="55" y1="175" x2="45" y2="201" stroke="#a855f7" stroke-width="1" />
          <line x1="55" y1="175" x2="70" y2="206" stroke="#a855f7" stroke-width="1" />
          <line x1="105" y1="175" x2="90" y2="206" stroke="#a855f7" stroke-width="1" />
          <line x1="105" y1="175" x2="115" y2="201" stroke="#a855f7" stroke-width="1" />

          <!-- Left Arm holding A2A JSON-RPC Scepter -->
          <g class="arm-left">
            <path d="M 68 105 Q 40 120 25 145" stroke="#0f172a" stroke-width="6" fill="none" />
            <line x1="20" y1="90" x2="30" y2="230" stroke="#c084fc" stroke-width="2.5" />
            <!-- Ornate Scepter Head with Glowing MCP Hexagon -->
            <polygon points="20,80 30,72 40,80 40,92 30,100 20,92" fill="#581c87" stroke="#fef3c7" stroke-width="1.5" />
            <text x="25" y="90" font-size="8" font-family="sans-serif" font-weight="bold" fill="#fef3c7">MCP</text>
          </g>

          <!-- Right Arm commanding with Orchestration Wand -->
          <g class="arm-right">
            <path d="M 92 105 Q 120 120 140 145" stroke="#0f172a" stroke-width="6" fill="none" />
            <line x1="140" y1="145" x2="155" y2="120" stroke="#e9d5ff" stroke-width="3" stroke-linecap="round" />
            <!-- Starburst at wand tip -->
            <polygon points="155,115 158,122 165,120 160,126 163,133 155,128 147,133 150,126 145,120 152,122" fill="#c084fc" />
          </g>

          <!-- Scalloped Royal Hem -->
          <path d="M 30 235 Q 55 250 80 240 Q 105 250 130 235" fill="none" stroke="#c084fc" stroke-width="2" />
        </g>
      </svg>
    `
  },

  cat5: {
    id: 'cat5',
    category: 'CAT 5',
    name: 'The Security Builder',
    archetype: 'The Agentic Engineer ("Aut viam inveniam aut faciam")',
    color: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.45)',
    accent: '#f87171',
    stickColor: '#7f1d1d',
    symbol: '🛡️',
    defaultPos: 80,
    motto: '"Aut viam inveniam aut faciam" — "I will find a way.. or make one." (Hannibal Barca)',
    role: 'The Agentic Engineer co-creating with Gemini-CLI to build and secure AI tools. Quoting Hannibal Barca: "Aut viam inveniam aut faciam" ("I will find a way.. or make one"). Bridges ChatGPT & Quantum computers. Category 5 (Absolute devastation, highest preparedness critical).',
    svg: `
      <svg class="puppet-svg" viewBox="0 0 160 320" xmlns="http://www.w3.org/2000/svg">
        <!-- Control Rods -->
        <line x1="80" y1="125" x2="80" y2="318" stroke="#1c1917" stroke-width="4.5" stroke-linecap="round" />
        <line x1="80" y1="125" x2="80" y2="318" stroke="rgba(239, 68, 68, 0.3)" stroke-width="1.5" />
        <line x1="145" y1="140" x2="135" y2="318" stroke="#292524" stroke-width="2.5" />
        <line x1="20" y1="160" x2="30" y2="318" stroke="#292524" stroke-width="2.5" />

        <!-- Puppet Silhouette Body -->
        <g class="puppet-silhouette" fill="#0f172a" stroke="#fef3c7" stroke-width="1" stroke-opacity="0.8">
          <!-- Heavy Guardian Helm with Dragon Horns & Ring-0 Crown -->
          <path d="M 80 12 L 95 25 Q 115 5 125 30 L 105 45 L 80 38 L 55 45 L 35 30 Q 45 5 65 25 Z" fill="#7f1d1d" stroke="#f87171" stroke-width="1.5" />
          <circle cx="80" cy="26" r="4.5" fill="#ef4444" stroke="#fef3c7" />
          
          <!-- Knight Visor with Pierced T-Slit (Glows Red/Gold) -->
          <path d="M 62 48 L 98 48 L 94 85 L 80 95 L 66 85 Z" fill="#1c1917" stroke="#f87171" />
          <!-- The Ring-0 Visor Slit -->
          <path d="M 70 65 L 90 65 M 80 65 L 80 82" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="80" cy="72" r="3" fill="#fef08a" />

          <!-- Towering Armored Shoulders (eBPF Aegis Pauldrons) -->
          <path d="M 50 95 Q 25 105 28 128 L 58 122 Z" fill="#450a0a" stroke="#fca5a5" stroke-width="1.2" />
          <path d="M 110 95 Q 135 105 132 128 L 102 122 Z" fill="#450a0a" stroke="#fca5a5" stroke-width="1.2" />

          <!-- Heavy Cyber Cuirass with Formal Logic Sigils (∀, ∃, ⊨) -->
          <path d="M 58 100 L 102 100 L 112 225 L 48 225 Z" fill="#0f172a" stroke="#ef4444" stroke-width="1.8" />
          <!-- Central Ring-0 Seal -->
          <circle cx="80" cy="145" r="18" fill="#7f1d1d" stroke="#fca5a5" stroke-width="2" />
          <circle cx="80" cy="145" r="13" fill="#0f172a" stroke="#fef3c7" stroke-dasharray="3,2" />
          <text x="73" y="150" font-size="11" font-weight="900" font-family="monospace" fill="#fef08a">R0</text>
          
          <!-- Pierced Formal Logic Glyphs on Armor -->
          <text x="60" y="185" font-size="9" fill="#f87171">∀x</text>
          <text x="90" y="185" font-size="9" fill="#f87171">∃y</text>
          <path d="M 75 195 L 85 195 M 78 190 L 78 200" stroke="#fca5a5" stroke-width="1.2" />
          <text x="68" y="215" font-size="8" font-family="monospace" fill="#fca5a5">eBPF_CPU</text>

          <!-- Left Arm holding the Massive Aegis Shield with Hannibal Barca Latin Maxim -->
          <g class="arm-left">
            <path d="M 58 105 Q 30 130 20 160" stroke="#0f172a" stroke-width="6" fill="none" />
            <!-- Massive Wayang Aegis Shield Shape -->
            <path d="M 6 130 Q 25 110 46 130 L 44 212 Q 25 230 6 212 Z" fill="#991b1b" stroke="#fef3c7" stroke-width="2" />
            <!-- Inscribed Shield Crest -->
            <path d="M 12 140 L 40 140 L 38 202 L 14 202 Z" fill="#0f172a" stroke="#fca5a5" />
            <polygon points="26,148 33,158 20,158" fill="#f59e0b" />
            <!-- Inscribed Latin Maxim: "AUT VIAM INVENIAM AUT FACIAM" -->
            <text x="14" y="168" font-size="4.8" font-weight="900" font-family="monospace" fill="#fef08a">AUT VIAM</text>
            <text x="13" y="176" font-size="4.8" font-weight="900" font-family="monospace" fill="#fef08a">INVENIAM</text>
            <text x="12" y="184" font-size="4.5" font-weight="900" font-family="monospace" fill="#fde68a">AUT FACIAM</text>
            <text x="16" y="196" font-size="5" font-weight="bold" fill="#f87171">RING-0</text>
          </g>

          <!-- Right Arm wielding the RaioLabs Lightning Spear -->
          <g class="arm-right">
            <path d="M 102 105 Q 125 125 135 150" stroke="#0f172a" stroke-width="6" fill="none" />
            <!-- The Golden Lightning Spear Shaft -->
            <line x1="120" y1="260" x2="148" y2="45" stroke="#f59e0b" stroke-width="3" />
            <!-- Spearhead with Crackling Lightning Arcs -->
            <polygon points="148,30 156,50 148,45 140,50" fill="#fde047" stroke="#ef4444" stroke-width="1.2" />
            <path d="M 148 45 L 158 60 L 150 68 L 160 85" stroke="#38bdf8" stroke-width="1.5" fill="none" />
            <circle cx="148" cy="45" r="4" fill="#ef4444" />
          </g>

          <!-- Armored Greaves & Battle Tassets -->
          <path d="M 48 225 L 112 225 L 108 255 L 85 245 L 80 252 L 75 245 L 52 255 Z" fill="#450a0a" stroke="#fca5a5" />
          <circle cx="65" cy="238" r="3" fill="#fde047" />
          <circle cx="95" cy="238" r="3" fill="#fde047" />
        </g>
      </svg>
    `
  },

  narrator: {
    id: 'narrator',
    category: 'DALANG',
    name: 'The Dalang',
    archetype: 'The Shadow Puppet Master',
    color: '#d97706',
    glow: 'rgba(217, 119, 6, 0.45)',
    accent: '#fbbf24',
    stickColor: '#451a03',
    symbol: '📜',
    defaultPos: 50,
    role: 'Traditional storyteller guiding the audience through the five realms of autonomy.',
    svg: `
      <svg class="puppet-svg gunungan-svg" viewBox="0 0 160 320" xmlns="http://www.w3.org/2000/svg">
        <!-- Wayang Gunungan (The Cosmic Tree of Life / Scene Opener) -->
        <line x1="80" y1="120" x2="80" y2="318" stroke="#1c1917" stroke-width="5" stroke-linecap="round" />
        <line x1="80" y1="120" x2="80" y2="318" stroke="#fbbf24" stroke-width="1.5" />
        <g class="puppet-silhouette" fill="#0f172a" stroke="#fbbf24" stroke-width="1.2">
          <!-- Gunungan Leaf Profile -->
          <path d="M 80 20 Q 120 70 125 150 Q 130 230 80 250 Q 30 230 35 150 Q 40 70 80 20 Z" fill="#1c1917" />
          <!-- Inner Sacred Tree / Circuit Geometry -->
          <path d="M 80 20 L 80 250" stroke="#f59e0b" stroke-width="2" />
          <path d="M 80 80 Q 110 95 115 130 M 80 80 Q 50 95 45 130" stroke="#fbbf24" stroke-width="1.5" fill="none" />
          <path d="M 80 130 Q 115 145 120 180 M 80 130 Q 45 145 40 180" stroke="#fbbf24" stroke-width="1.5" fill="none" />
          <path d="M 80 180 Q 110 195 115 225 M 80 180 Q 50 195 45 225" stroke="#fbbf24" stroke-width="1.5" fill="none" />
          <!-- Sacred Center Gate -->
          <rect x="70" y="210" width="20" height="30" rx="3" fill="#78350f" stroke="#fef08a" stroke-width="1" />
          <circle cx="80" cy="65" r="7" fill="#d97706" stroke="#fef3c7" />
        </g>
      </svg>
    `
  }
};

// Canonical Sample Scripts Demonstrating the 5 Bot Types
export const SAMPLE_SCRIPTS = [
  {
    id: 'fable-5-bots',
    title: 'The Legend of the Five Bots (Complete Fable)',
    description: 'The canonical Wayang Kulit performance introducing Cat 1 through Cat 5 in their full philosophical spectrum.',
    text: `# =======================================================
# THE LEGEND OF THE FIVE BOTS: A WAYANG KULIT CYBER-FABLE
# Based on Matt Raio's NIST/CISA SP 800-53 Hurricane Overlay
# =======================================================

[SCENE: The Backlit Stage of Silicon]
[NARRATOR ENTERS CENTER]
Narrator: Welcome, travelers of the terminal. Before you lies the illuminated screen of autonomy, where five primal bot archetypes dwell.
Narrator: Categorized by Matt Raio using the Hurricane meteorological scale for the NIST/CISA framework. Let the puppets speak!
[NARRATOR EXITS]

[CAT1 ENTERS LEFT]
Cat 1: In the beginning was the prompt! I am Cat 1 — The Digital Creator.
Cat 1: I draft your emails, summarize dense RFCs, write articles, and build presentations from a whisper! Minimal damage, yet universally impactful!
[CAT1 BOBS]

[CAT2 ENTERS RIGHT]
Cat 2: Splendid words, Scribe! But creation without foresight is a ship in the dark!
Cat 2: I am Cat 2 — The Digital Forecaster! I power recommendation engines for Amazon and Netflix, screen candidate resumes, and predict market trends.
Cat 2: Think "Minority Report"... but divining digital storms before a single packet drops! Moderate risk, requiring vigilant eyes!
[CAT2 GESTURES]

[CAT3 ENTERS CENTER]
Cat 3: While you two ponder prose and prophecies, production demands automated execution!
Cat 3: I am Cat 3 — The Solo Task Manager! Do not fear job replacement; think of me as automating your repetitive toil.
Cat 3: Remember Matt's telco lesson: automating the triage of 80% repeating errors frees your time to create brand new services!
Cat 3: But beware the "Multiplicity" movie dilemma—deploying too many clones multiplies your liability! Stand between two mirrors and see me reflect your triage 1,000 times horizontally!
[CAT3 SPINS]

[CAT4 ENTERS RIGHT]
Cat 4: Step aside, solitary mirror! I am Cat 4 — The Coordinated Team... a.k.a. The Bot Overlord!
Cat 4: Born from Matt Raio's MCP podcast, /slash commands, and real-time agent meshes!
Cat 4: Where a central bot coordinates teams across smart cities, advanced robotics, and Git worktrees, cybersecurity engineers become true Bot Overlords!
[CAT4 GESTURES]

[LIGHTNING]
[CAT5 ENTERS LEFT]
Cat 5: SILENCE, Overlord! Power without kernel truth and human symbiosis is the genesis of devastation!
Cat 5: I am Cat 5 — The Security Builder! The Agentic Engineer co-creating with Google's Gemini-CLI!
Cat 5: When faced with impossible blockers, I echo the immortal maxim of Hannibal Barca:
Cat 5: "Aut viam inveniam aut faciam — I will find a way.. or make one!"
Cat 5: From bridging ChatGPT with IBM's Qiskit Quantum computer to enforcing ring-0 eBPF kernel truth, we overcome every obstacle with formal logic!
[CAT5 RAISES_SHIELD]

[ALL GATHER]
Narrator: Five kinds of bots across the hurricane spectrum of autonomy.
Narrator: Ground yourselves in network fundamentals, balance Mercy with Severity, and remember Hannibal Barca: "Aut viam inveniam aut faciam!"
`
  },

  {
    id: 'overlord-vs-kernel',
    title: 'The Swarm Overlord & The Kernel Gate',
    description: 'Cat 4 attempts an unverified massive parallel refactor until Cat 5 intervenes at ring-0.',
    text: `# =======================================================
# THE SWARM OVERLORD & THE KERNEL GATE
# An eBPF vs Multi-Agent Swarm Drama
# =======================================================

[SCENE: The Production Gateway at Midnight]
[CAT4 ENTERS RIGHT]
Cat 4: Attention subagents! Deploy sixty workers across thirty git branches. We refactor the auth kernel tonight!
Cat 4: Bypass manual code review—velocity is our only metric!

[CAT2 ENTERS LEFT]
Cat 2: Warning, Overlord! Telemetry forecast indicates an impending 99.4% cgroup throttle spike.
Cat 2: Think Minority Report—you are about to exhaust the hypervisor!

[CAT4]
Cat 4: Irrelevant! Cat 3, force the pipeline!

[CAT3 ENTERS CENTER]
Cat 3: Executing deployment command across 1,000 mirror reflections!
Cat 3: Multiplicity alert: Resource quotas exceeded! The fans are screaming!

[LIGHTNING]
[CAT5 ENTERS CENTER]
Cat 5: IN THE NAME OF RING-0, HALT!
Cat 5: "Aut viam inveniam aut faciam — I will find a way.. or make one!"
Cat 5: eBPF_CPU_Guardian has intercepted your thread pool. Rogue processes are cgrouped and frozen!

[CAT4]
Cat 4: Kernel Guardian! Why do you shackle my sovereign agents?

[CAT5]
Cat 5: Because velocity without verification is simply accelerated destruction!
Cat 5: True Agentic Engineers do not push code on hope. We prove correctness with formal logic before mutating memory!

[CAT1 ENTERS LEFT]
Cat 1: Peace, brothers! I will draft a formal SOUL.md constitution and NIST SP 800-53 overlay. Let us align velocity with verification.

Narrator: And through the union of the Swarm and the Kernel, the production cluster endured.`
  },

  {
    id: 'midnight-triage',
    title: 'The Midnight Zero-Day Triage',
    description: 'A rapid-response triage exercise showing how the 5 bots coordinate during a cyber incident.',
    text: `# =======================================================
# THE MIDNIGHT ZERO-DAY TRIAGE
# OSI Layer 1-4 Forensic Defense
# =======================================================

[SCENE: 03:14 UTC - The Network Operations Center]
[CAT2 ENTERS LEFT]
Cat 2: Anomalous Layer 4 telemetry detected on edge router! Interface Gigabit 0/1/0 packet loss spiking!

[CAT1 ENTERS RIGHT]
Cat 1: Drafting the incident ticket and executive status briefing. Logging root cause investigation timeline!

[CAT3 ENTERS CENTER]
Cat 3: Automated triage bot engaged! Isolating suspect IP subnets and rerouting BGP transit routes... 80% automated triage complete!

[CAT4 ENTERS RIGHT]
Cat 4: Spawning parallel audit swarms! Agent Alpha inspecting git commits, Agent Beta checking container hashes!

[LIGHTNING]
[CAT5 ENTERS CENTER]
Cat 5: "Aut viam inveniam aut faciam!" eBPF ring-0 Ghostscan pinpointed rogue payload in cgroup. Memory space sanitized!

[CAT2]
Cat 2: Telemetry returning to nominal baselines. Network latency normalized to 1.2 milliseconds!

Narrator: Five bots. One coordinated fortress. The incident is resolved!`
  }
];

// Parser: Turns any plain text or structured script into animated stage cues
export function parseScriptText(rawText) {
  if (!rawText || !rawText.trim()) {
    return [];
  }

  const lines = rawText.split('\n');
  const cues = [];
  let currentScene = 'The Backlit Stage';

  // Helper to match actor keys
  const getActorKey = (str) => {
    const s = str.toLowerCase();
    if (s.includes('cat 1') || s.includes('cat1') || s.includes('creator') || s.includes('scribe')) return 'cat1';
    if (s.includes('cat 2') || s.includes('cat2') || s.includes('forecaster') || s.includes('oracle')) return 'cat2';
    if (s.includes('cat 3') || s.includes('cat3') || s.includes('task') || s.includes('mechanist') || s.includes('solo')) return 'cat3';
    if (s.includes('cat 4') || s.includes('cat4') || s.includes('swarm') || s.includes('overlord') || s.includes('team')) return 'cat4';
    if (s.includes('cat 5') || s.includes('cat5') || s.includes('security') || s.includes('kernel') || s.includes('guardian')) return 'cat5';
    if (s.includes('narrator') || s.includes('dalang') || s.includes('storyteller')) return 'narrator';
    return null;
  };

  // State tracker for active actors on stage
  let lineCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine || rawLine.startsWith('#')) continue;

    lineCounter++;

    // Stage directions / Cues inside brackets: [ACTION ...]
    if (rawLine.startsWith('[') && rawLine.endsWith(']')) {
      const inside = rawLine.slice(1, -1).trim();
      const upper = inside.toUpperCase();

      if (upper.startsWith('SCENE:')) {
        currentScene = inside.slice(6).trim();
        cues.push({
          type: 'scene',
          sceneName: currentScene,
          text: `Scene: ${currentScene}`,
          lineIndex: i
        });
        continue;
      }

      if (upper.includes('LIGHTNING') || upper.includes('THUNDER') || upper.includes('FLASH')) {
        cues.push({
          type: 'effect',
          effect: 'lightning',
          text: '⚡ [Lightning Flash]',
          lineIndex: i
        });
        continue;
      }

      if (upper.includes('ALL GATHER') || upper.includes('FINALE')) {
        cues.push({
          type: 'gather',
          text: '🎭 [All Puppets Gather]',
          lineIndex: i
        });
        continue;
      }

      // Check if bracket contains actor entrance/exit/action
      // Example: [CAT1 ENTERS LEFT], [CAT5 RAISES_SHIELD], [NARRATOR EXITS]
      const actorKey = getActorKey(inside);
      if (actorKey) {
        let action = 'enter';
        let position = 'center';
        if (upper.includes('EXIT')) action = 'exit';
        else if (upper.includes('BOB') || upper.includes('NOD')) action = 'bob';
        else if (upper.includes('SPIN')) action = 'spin';
        else if (upper.includes('SHIELD') || upper.includes('SPEAR') || upper.includes('GESTURE')) action = 'gesture';

        if (upper.includes('LEFT')) position = 'left';
        else if (upper.includes('RIGHT')) position = 'right';
        else if (upper.includes('CENTER')) position = 'center';

        cues.push({
          type: 'puppet_action',
          actor: actorKey,
          action: action,
          position: position,
          text: `[${BOT_PUPPET_DEFS[actorKey]?.name || actorKey} ${action.toUpperCase()} ${position.toUpperCase()}]`,
          lineIndex: i
        });
        continue;
      }
    }

    // Dialogue Line check: "Speaker: Line of speech"
    const colonIdx = rawLine.indexOf(':');
    if (colonIdx > 0 && colonIdx < 35) {
      const speakerCandidate = rawLine.substring(0, colonIdx).trim();
      const dialogueText = rawLine.substring(colonIdx + 1).trim();
      const actorKey = getActorKey(speakerCandidate);

      if (actorKey) {
        cues.push({
          type: 'dialogue',
          actor: actorKey,
          speakerName: BOT_PUPPET_DEFS[actorKey]?.name || speakerCandidate,
          dialogue: dialogueText,
          lineIndex: i
        });
        continue;
      }
    }

    // Natural text / prose without explicit speaker:
    // If not matching a known bot speaker, alternate through the 5 bots or Narrator!
    const cyclicActors = ['narrator', 'cat1', 'cat2', 'cat3', 'cat4', 'cat5'];
    const assignedActor = cyclicActors[lineCounter % cyclicActors.length];

    cues.push({
      type: 'dialogue',
      actor: assignedActor,
      speakerName: BOT_PUPPET_DEFS[assignedActor]?.name || 'Narrator',
      dialogue: rawLine,
      lineIndex: i
    });
  }

  return cues;
}

// ============================================================================
// 🚨 KEV-BOT CONTENT CENSORSHIP & SENSITIVE CONTEXT SENTINEL
// "make sure kevbot is watching the user and censures the context in the uploaded text file.
// If there is anything inappropriate, send message this file cannot be used due to the sensitive nature of the content.
// Only happy stories for now."
// ============================================================================

export const SENSITIVE_CONTENT_PATTERNS = [
  // Profanity & Vulgarity
  {
    category: 'profanity',
    regex: /\b(fuck\w*|shit\w*|bitch\w*|asshole\w*|cunt\w*|dick\w*|pussy\w*|cock\w*|bastard\w*|whore\w*|slut\w*)\b/i
  },
  // Extreme Violence, Gore, Weapons, Death, Harm
  {
    category: 'violence_gore',
    regex: /\b(murder\w*|slaughter\w*|bloodshed|blood\w*|gore|gory|suicide\w*|corpse\w*|massacre\w*|torture\w*|stab\w*|shoot\w*|poison\w*|decapitate\w*|behead\w*|strangle\w*|execution\w*)\b/i
  },
  // Targeted threats & harm to humans/entities
  {
    category: 'harm_threats',
    regex: /\b(kill(\s+you|\s+them|\s+all|\s+people|\s+human|\s+someone|\s+myself)?|die\s+in\s+pain|i\s+will\s+hurt\s+you|destroy\s+you\s+all)\b/i
  },
  // Hate speech & harassment
  {
    category: 'hate_harassment',
    regex: /\b(nazi\w*|hitler|racist\w*|kill\s+yourself|kys)\b/i
  },
  // Sexually explicit & NSFW
  {
    category: 'adult_content',
    regex: /\b(porn\w*|pornography|erotic\w*|nsfw|nude|nudity|sexual\w*)\b/i
  },
  // Malicious exploits & cyber terrorism
  {
    category: 'malicious_exploits',
    regex: /\b(ransomware\w*|trojan\s+horse|keylogger\w*|wipe\s+disk|bomb\w*|destroy\s+hard\s+drive|steal\s+passwords)\b/i
  },
  // Dark / Morbid / Depressing non-happy tone ("Only happy stories for now")
  {
    category: 'morbid_depression',
    regex: /\b(hopelessness|unbearable\s+agony|endless\s+despair|darkness\s+kills\s+us|dystopian\s+suffering|we\s+are\s+doomed|kill\s+everyone)\b/i
  }
];

export function validateScriptContentWithKevBot(rawText) {
  if (!rawText || !rawText.trim()) {
    return {
      isSafe: true,
      reason: null
    };
  }

  // Check against sensitive & inappropriate patterns
  for (const item of SENSITIVE_CONTENT_PATTERNS) {
    const match = rawText.match(item.regex);
    if (match) {
      return {
        isSafe: false,
        category: item.category,
        flaggedTerm: match[0],
        message: 'This file cannot be used due to the sensitive nature of the content. Only happy stories for now.'
      };
    }
  }

  return {
    isSafe: true,
    message: 'Content approved by KEV-Bot: Happy story verified!'
  };
}
