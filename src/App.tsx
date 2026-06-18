import React, { useState, useRef, useEffect } from 'react';

type NodeType = 'WORKSTATION' | 'ROUTER' | 'SERVER' | 'FIREWALL' | 'MALICIOUS';
type ViewMode = 'PORTFOLIO' | 'SIMULATOR';

interface NetworkNode {
  id: string;
  type: NodeType;
  label: string;
  ipAddress: string;
  gridX: number;
  gridY: number;
  txCount: number;
  rxCount: number;
}

interface NetworkCable {
  id: string;
  fromId: string;
  toId: string;
}

// --- NEW DEFINITION FOR DIGITAL ASSET PREVIEWS ---
interface DigitalAsset {
  id: string;
  title: string;
  category: string;
  badgeColor: string;
  shortDesc: string;
  fullScope: string[];
  features: string[];
  imageSrc: string; 
  storeUrl: string;
}

export const App: React.FC = () => {
  // --- VIEW CONFIGURATION STATE ---
  const [viewMode, setViewMode] = useState<ViewMode>('PORTFOLIO');
  const [selectedAsset, setSelectedAsset] = useState<DigitalAsset | null>(null);

  // --- CORE SIMULATOR STATE MAPS ---
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [cables, setCables] = useState<NetworkCable[]>([]);
  const [linkModeSourceId, setLinkModeSourceId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [firewallBypassActive, setFirewallBypassActive] = useState<boolean>(false);

  // --- PATH DIAGNOSTIC STATE ---
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationPath, setSimulationPath] = useState<NetworkCable[]>([]);
  const [currentPathIndex, setCurrentPathIndex] = useState<number>(0);
  const [packetProgress, setPacketProgress] = useState<number>(0);

  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "NET_MATRIX MATRIX ENGINE READY // HARDWARE, LINK, AND SECURITY ENGINES ONLINE.",
    "STORAGE ENGINE: Automatic LocalStorage topology mapping enabled."
  ]);

  const draggingNodeId = useRef<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // --- STATIC ASSET DATA MAP ---
  const digitalAssets: DigitalAsset[] = [
    {
      id: 'ai-hub',
      title: 'AI Operations Hub',
      category: 'ENTERPRISE DIGITAL ASSET',
      badgeColor: '#00ffcc',
      shortDesc: 'A robust operations interface mapping prompt-engineering structures, generative workflow pipelines, and deployment logs.',
      fullScope: [
        'Centralizes organizational prompt engineering strategies into reusable technical assets.',
        'Tracks multi-modal AI model outputs, parameter settings, and operational deployment costs.',
        'Maps custom generative AI pipelines to existing technical department workflows.'
      ],
      features: ['Prompt Matrix Repository', 'Model Parameter Logs', 'Pipeline Deployment Mapping', 'Token & Cost Tracking Logs'],
      imageSrc: 'ai-hub.jpg', 
      storeUrl: 'https://payhip.com/b/ne0az' 
    },
    {
      id: 'sop-library',
      title: 'Master SOP & Workflow Library',
      category: 'OPERATIONAL ARCHITECTURE',
      badgeColor: '#ffff00',
      shortDesc: 'A structured standard operating framework built to document, track, and scale critical technical procedures and engineering policies.',
      fullScope: [
        'Standardizes cross-department technical workflows to ensure architectural compliance.',
        'Features an integrated verification and audit tracking matrix for recurring operations.',
        'Minimizes organizational friction during software development and infrastructure scaling phases.'
      ],
      features: ['Interactive Step Verification', 'Role-Based Access Mapping', 'Audit Lifecycle Tracking', 'System Dependency Linking'],
      imageSrc: 'sop-library.jpg', 
      storeUrl: 'https://payhip.com/b/ne0az' 
    },
    {
      id: 'saas-tracker',
      title: 'SaaS Tracker & Tech Stack Auditor',
      category: 'AUDITING MODULE',
      badgeColor: '#aa00ff',
      shortDesc: 'A comprehensive software asset accounting system tracking technical redundancy overhead, active API licensing matrices, and budget optimizations.',
      fullScope: [
        'Provides full visibility into software cost centers, software licensing overhead, and renewal cadences.',
        'Audits API integrations and tech stacks to reveal functional software redundancies.',
        'Optimizes operational budgets by automatically mapping underutilized software licenses.'
      ],
      features: ['Licensing & Renewal Alarms', 'Functional Redundancy Auditing', 'API Endpoint Matrix Map', 'Cost Optimization Dashboard'],
      imageSrc: 'saas-tracker.jpg', 
      storeUrl: 'https://payhip.com/b/ne0az' 
    }
  ];

  // Load saved layouts
  useEffect(() => {
    const savedNodes = localStorage.getItem('NET_MATRIX_NODES');
    const savedCables = localStorage.getItem('NET_MATRIX_CABLES');
    if (savedNodes) setNodes(JSON.parse(savedNodes));
    if (savedCables) setCables(JSON.parse(savedCables));
  }, []);

  // Sync saved layouts
  useEffect(() => {
    if (nodes.length > 0 || cables.length > 0) {
      localStorage.setItem('NET_MATRIX_NODES', JSON.stringify(nodes));
      localStorage.setItem('NET_MATRIX_CABLES', JSON.stringify(cables));
    }
  }, [nodes, cables]);

  // Sequential Step Engine Loop
  useEffect(() => {
    if (!isSimulating || simulationPath.length === 0) return;

    const interval = setInterval(() => {
      setPacketProgress(prev => {
        if (prev >= 1) {
          const currentCable = simulationPath[currentPathIndex];
          
          let lastEntryId = nodes.find(n => n.type === 'WORKSTATION')?.id || '';
          if (currentPathIndex > 0) {
            const prevCable = simulationPath[currentPathIndex - 1];
            lastEntryId = (prevCable.fromId === currentCable.fromId || prevCable.fromId === currentCable.toId) ? prevCable.toId : prevCable.fromId;
          }
          const destinationNodeId = currentCable.fromId === lastEntryId ? currentCable.toId : currentCable.fromId;
          const arrivalNode = nodes.find(n => n.id === destinationNodeId);

          if (arrivalNode?.type === 'FIREWALL' && !firewallBypassActive) {
            clearInterval(interval);
            setIsSimulating(false);
            setSimulationPath([]);
            logToTerminal(`🔥 [SECURITY DROP] Packet intercepted and purged by Firewall Core: ${arrivalNode.label}. Handshake denied.`);
            return 0;
          }

          if (arrivalNode?.type === 'MALICIOUS') {
            logToTerminal(`⚠️ [MALICIOUS BREACH] Packet corrupted passing through compromised core ${arrivalNode.label}!`);
          }

          setNodes(prevNodes => 
            prevNodes.map(n => (n.id === currentCable.fromId || n.id === currentCable.toId) ? { ...n, txCount: n.txCount + 1, rxCount: n.rxCount + 1 } : n)
          );

          if (currentPathIndex < simulationPath.length - 1) {
            setCurrentPathIndex(prevIndex => prevIndex + 1);
            logToTerminal(`📡 [HOP RELAY] Forwarding packet to segment ${currentPathIndex + 2}/${simulationPath.length}...`);
            return 0;
          } else {
            clearInterval(interval);
            setIsSimulating(false);
            setSimulationPath([]);
            logToTerminal("🏁 [SIM COMPLETE] Quantum packet arrived successfully at data core destination.");
            return 0;
          }
        }
        return prev + 0.04;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [isSimulating, currentPathIndex, simulationPath, nodes, firewallBypassActive]);

  const logToTerminal = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTerminalLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  const spawnNode = (type: NodeType) => {
    const id = `node_${Math.random().toString(36).substring(2, 9)}`;
    const count = nodes.filter(n => n.type === type).length + 1;
    let defaultIp = `192.168.1.${10 + count}`;
    if (type === 'ROUTER') defaultIp = `10.0.0.${count}`;
    if (type === 'SERVER') defaultIp = `10.0.200.${count}`;
    if (type === 'FIREWALL') defaultIp = `192.168.1.254`;
    if (type === 'MALICIOUS') defaultIp = `66.66.66.${count}`;

    const newNode: NetworkNode = { id, type, label: `${type}_${count}`, ipAddress: defaultIp, gridX: 120, gridY: 120, txCount: 0, rxCount: 0 };
    setNodes([...nodes, newNode]);
    logToTerminal(`[DEPLOY] ${newNode.label} deployed to grid.`);
  };

  const clearTopologyMap = () => {
    setNodes([]); setCables([]); setSimulationPath([]); setSelectedNodeId(null);
    localStorage.removeItem('NET_MATRIX_NODES'); localStorage.removeItem('NET_MATRIX_CABLES');
    logToTerminal("🗑️ [STORAGE] Local memory maps wiped clean.");
  };

  const exportTopologyToJSON = () => {
    if (nodes.length === 0 && cables.length === 0) return;
    const dataStream = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ version: "1.0.0", nodes, cables }, null, 2));
    const downloadHook = document.createElement('a');
    downloadHook.setAttribute("href", dataStream);
    downloadHook.setAttribute("download", `the_digital_sabio_topology.json`);
    document.body.appendChild(downloadHook); downloadHook.click(); downloadHook.remove();
  };

  const importTopologyFromJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileTarget = event.target.files?.[0];
    if (!fileTarget) return;
    const streamReader = new FileReader();
    streamReader.onload = (e) => {
      try {
        const structuralMap = JSON.parse(e.target?.result as string);
        if (Array.isArray(structuralMap.nodes) && Array.isArray(structuralMap.cables)) {
          setNodes(structuralMap.nodes); setCables(structuralMap.cables);
          logToTerminal(`🛸 [SYSTEM_IMPORT] Topology layout map injected successfully.`);
        }
      } catch (err) { logToTerminal("❌ IMPORT_CRITICAL: Invalid configuration tree."); }
    };
    streamReader.readAsText(fileTarget);
    event.target.value = '';
  };

  const runRoutingDiagnostic = () => {
    const startNode = nodes.find(n => n.type === 'WORKSTATION');
    const endNode = nodes.find(n => n.type === 'SERVER');
    if (!startNode || !endNode) {
      logToTerminal("❌ CRITICAL ANOMALY: Simulation requires a WORKSTATION source and a SERVER target core.");
      return;
    }
    const queue: string[] = [startNode.id];
    const visited = new Set<string>([startNode.id]);
    const parentMap = new Map<string, { parentId: string; viaCable: NetworkCable }>();
    let pathFound = false;

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (currentId === endNode.id) { pathFound = true; break; }
      const activeConnections = cables.filter(c => c.fromId === currentId || c.toId === currentId);
      for (const cable of activeConnections) {
        const neighborId = cable.fromId === currentId ? cable.toId : cable.fromId;
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          parentMap.set(neighborId, { parentId: currentId, viaCable: cable });
          queue.push(neighborId);
        }
      }
    }

    if (pathFound) {
      const orderedHops: NetworkCable[] = [];
      let currentStepId = endNode.id;
      while (currentStepId !== startNode.id) {
        const edge = parentMap.get(currentStepId)!;
        orderedHops.unshift(edge.viaCable);
        currentStepId = edge.parentId;
      }
      setSimulationPath(orderedHops); setCurrentPathIndex(0); setPacketProgress(0); setIsSimulating(true);
      logToTerminal(`⚡ ROUTE LOCKED: Path discovered using ${orderedHops.length} structural hardware hops.`);
    } else {
      logToTerminal("❌ PACKET DROP: Destination core network array is currently unreachable.");
    }
  };

  const renderHardwareGraphic = (type: NodeType, color: string) => {
    switch (type) {
      case 'WORKSTATION': return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><rect x="2" y="3" width="20" height="13" rx="2" /><line x1="12" y1="16" x2="12" y2="21" /><line x1="8" y1="21" x2="16" y2="21" /></svg>;
      case 'ROUTER': return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><ellipse cx="12" cy="17" rx="9" ry="4" /><path d="M12 2v11" /><path d="M17 5l-5-3-5 3" /></svg>;
      case 'SERVER': return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><rect x="2" y="2" width="20" height="6" rx="1" /><rect x="2" y="9" width="20" height="6" rx="1" /><rect x="2" y="16" width="20" height="6" rx="1" /></svg>;
      case 'FIREWALL': return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
      case 'MALICIOUS': return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>;
    }
  };

  return (
    <div style={styles.dashboardContainer}>
      <style>{`
        @keyframes pulseCircuit { to { stroke-dashoffset: -20; } }
        .circuit-wire { stroke-dasharray: 6, 4; animation: pulseCircuit 1s linear infinite; }
        .tab-btn { background: transparent; border: none; color: #666680; font-family: monospace; font-size: 0.9rem; font-weight: bold; cursor: pointer; padding: 12px 20px; transition: all 0.2s; border-bottom: 2px solid transparent; }
        .tab-btn.active { color: #00ffcc; border-bottom: 2px solid #00ffcc; background: #15151f; }
        .portfolio-card { background: #111116; border: 1px solid #222235; border-radius: 6px; padding: 24px; transition: transform 0.2s, border-color 0.2s; cursor: pointer; }
        .portfolio-card:hover { transform: translateY(-2px); border-color: #00ffcc; }
        .tech-tag { background: #161622; border: 1px solid #33334c; color: #8888aa; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }
        .action-link-btn { background: #00ffcc; color: #050508; border: none; padding: 10px 18px; border-radius: 4px; font-family: monospace; font-weight: bold; cursor: pointer; text-decoration: none; display: inline-block; text-align: center; font-size: 0.85rem; }
        .action-link-btn:hover { background: #00ccaa; }
        .drawer-input { background: #161622; border: 1px solid #2c2c3e; color: #fff; padding: 8px; width: 100%; border-radius: 4px; font-family: monospace; font-size: 0.8rem; margin-top: 4px; box-sizing: border-box; }
        .drawer-input:focus { outline: none; border-color: #00ffcc; }
      `}</style>

      {/* GLOBAL SYSTEM BAR & VIEW TOGGLE CONTROLLER */}
      <header style={styles.globalHeader}>
        <div style={styles.logoGroup}>
          {/* HIGH-END INTEGRATED GRAPHIC EMBEDDING CIRCUIT */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#111116',
            border: '1px solid #ff0055',
            boxShadow: '0 0 8px rgba(255, 0, 85, 0.35)',
            overflow: 'hidden',
            padding: '3px',
            boxSizing: 'border-box'
          }}>
            <img 
              src="/logo.png" 
              alt="The Digital Sabio"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <span style={{ marginLeft: '12px', letterSpacing: '1.5px' }}>
            THE DIGITAL SABIO <span style={{ color: '#33334c' }}>//</span> ASSET MATRIX
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className={`tab-btn ${viewMode === 'PORTFOLIO' ? 'active' : ''}`} onClick={() => setViewMode('PORTFOLIO')}>
            📁 VENTURE_PORTFOLIO.md
          </button>
          <button className={`tab-btn ${viewMode === 'SIMULATOR' ? 'active' : ''}`} onClick={() => setViewMode('SIMULATOR')}>
            ⚙️ CYBER_NET_SIMULATOR.EXE
          </button>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#444455' }}>ENV: PRODUCTION_READY</div>
      </header>

      {/* CARD VIEW 1: MASTER VENTURE PORTFOLIO VIEW */}
      {viewMode === 'PORTFOLIO' && (
        <div style={styles.portfolioScrollArea}>
          <section style={styles.heroSection}>
            <div style={{ fontSize: '0.8rem', color: '#ff0055', fontWeight: 'bold', marginBottom: '6px', letterSpacing: '2px' }}>CORE PLATFORM SPECIFICATIONS</div>
            <h1 style={styles.heroTitle}>Architecting Systems-Driven Digital Operations</h1>
            <p style={styles.heroSubtitle}>
              Engineering secure interactive software, optimized prompt pipelines, and granular infrastructure auditing modules designed to streamline tech team execution.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
              <span className="tech-tag" style={{ borderColor: '#00ffcc', color: '#00ffcc' }}>React 18</span>
              <span className="tech-tag" style={{ borderColor: '#00ffcc', color: '#00ffcc' }}>TypeScript</span>
              <span className="tech-tag">Vite Pipelines</span>
              <span className="tech-tag">SVG Dynamic Layering</span>
              <span className="tech-tag">State Serialization</span>
              <span className="tech-tag">Systems Infrastructure Auditing</span>
            </div>
          </section>

          <hr style={{ border: 'none', borderTop: '1px solid #1a1a26', margin: '40px 0' }} />

          <h2 style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '20px', letterSpacing: '1px' }}>PROPRIETARY VENTURE PORTFOLIO APPLICATIONS</h2>
          
          <div style={styles.portfolioGrid}>
            {/* PLATFORM CODE PIECE: NETWORK ENGINE */}
            <div className="portfolio-card" style={{ gridColumn: '1 / -1', borderLeft: '4px solid #ff0055' }} onClick={() => setViewMode('SIMULATOR')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ color: '#ff0055', fontSize: '0.75rem', fontWeight: 'bold' }}>FULL-STACK WEB ENGINE PRODUCTION</span>
                  <h3 style={styles.cardTitle}>Cyber Network Simulator Core</h3>
                  <p style={styles.cardDescription}>
                    An interactive graphical interface engineered to simulate multi-node infrastructure routing, dynamic short-path configurations, and perimeter defense layers.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <span className="tech-tag">HTML5 SVG Serialization</span>
                    <span className="tech-tag">Dynamic Pathfinding Engine</span>
                    <span className="tech-tag">LocalStorage Mapping</span>
                  </div>
                </div>
                <button className="action-link-btn" style={{ backgroundColor: '#ff0055', color: '#fff' }} onClick={(e) => { e.stopPropagation(); setViewMode('SIMULATOR'); }}>
                  LAUNCH SIMULATOR ENGINE →
                </button>
              </div>
            </div>

            {/* MAP DYNAMIC LOGIC FOR DIGITAL PREMIUM INFRASTRUCTURE ASSETS */}
            {digitalAssets.map(asset => (
              <div key={asset.id} className="portfolio-card" onClick={() => setSelectedAsset(asset)}>
                <span style={{ color: asset.badgeColor, fontSize: '0.75rem', fontWeight: 'bold' }}>{asset.category}</span>
                <h3 style={styles.cardTitle}>{asset.title}</h3>
                <p style={styles.cardDescription}>{asset.shortDesc}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {asset.features.slice(0, 2).map((feat, idx) => (
                      <span key={idx} className="tech-tag">{feat}</span>
                    ))}
                  </div>
                  <span style={{ color: asset.badgeColor, fontSize: '0.8rem', fontWeight: 'bold' }}>VIEW BLUEPRINT ↗</span>
                </div>
              </div>
            ))}
          </div>

          {/* NEW: DETAILED INTERACTIVE MODAL COMPONENT */}
          {selectedAsset && (
            <div style={styles.modalOverlay} onClick={() => setSelectedAsset(null)}>
              <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                  <div>
                    <span style={{ color: selectedAsset.badgeColor, fontSize: '0.75rem', fontWeight: 'bold' }}>{selectedAsset.category}</span>
                    <h2 style={{ color: '#fff', margin: '4px 0 0 0', fontSize: '1.4rem' }}>{selectedAsset.title}</h2>
                  </div>
                  <button style={styles.closeModalBtn} onClick={() => setSelectedAsset(null)}>✕</button>
                </div>

                <div style={styles.modalBodyLayout}>
                  {/* LEFT COLUMN: CRISP IMAGE PREVIEW FOR NOTION INTERFACES */}
                  <div style={styles.modalImageContainer}>
                    <img 
                      src={selectedAsset.imageSrc} 
                      alt={selectedAsset.title} 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover', 
                        borderRadius: '4px',
                        border: '1px solid #222235'
                      }} 
                    />
                  </div>
                  {/* RIGHT COLUMN: HIGH-VALUE FUNCTIONAL SPECIFICATION MATRIX */}
                  <div style={styles.modalSpecsContainer}>
                    <h4 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '0.9rem', letterSpacing: '1px' }}>SYSTEM OPERATIONAL SCOPE</h4>
                    <ul style={{ paddingLeft: '16px', margin: '0 0 20px 0', color: '#9999bb', fontSize: '0.85rem', lineHeight: '1.6' }}>
                      {selectedAsset.fullScope.map((scopeItem, idx) => (
                        <li key={idx} style={{ marginBottom: '8px' }}>{scopeItem}</li>
                      ))}
                    </ul>

                    <h4 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '0.9rem', letterSpacing: '1px' }}>CORE DESIGN MODULES</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                      {selectedAsset.features.map((feat, idx) => (
                        <span key={idx} className="tech-tag" style={{ borderColor: selectedAsset.badgeColor, color: '#fff' }}>{feat}</span>
                      ))}
                    </div>

                    <a href={selectedAsset.storeUrl} target="_blank" rel="noreferrer" className="action-link-btn" style={{ backgroundColor: selectedAsset.badgeColor, color: '#000', width: '100%', boxSizing: 'border-box' }}>
                      ACQUIRE ASSET SECURE LINK ↗
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          <footer style={styles.portfolioFooter}>
            <div>© 2026 The Digital Sabio. Built with premium custom code infrastructure.</div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
              <span style={{ color: '#444455' }}>GitHub: Linked Profile</span>
              <span style={{ color: '#444455' }}>Deployments: Connected Production Pipeline Vercel V1</span>
            </div>
          </footer>
        </div>
      )}

      {/* CARD VIEW 2: CORE CYBER SIMULATOR INSTANCE */}
      {viewMode === 'SIMULATOR' && (
        <>
          <div style={styles.simulatorActionHUD}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button style={{ ...styles.linkButton, backgroundColor: linkModeSourceId ? '#00ffcc' : '#161622', color: linkModeSourceId ? '#000' : '#00ffcc' }} onClick={() => setLinkModeSourceId('PENDING')}>
                {linkModeSourceId ? "SELECT TARGET NODE VECTOR..." : "⚡ LINK HARDWARE MATRIX"}
              </button>
              <label style={styles.fileUploadLabel}>
                📥 IMPORT TOPOLOGY
                <input type="file" accept=".json" onChange={importTopologyFromJSON} style={{ display: 'none' }} />
              </label>
              <button style={styles.linkButton} onClick={exportTopologyToJSON}>💾 EXPORT TOPOLOGY</button>
              <button style={{ ...styles.linkButton, borderColor: '#ff0055', color: '#ff0055' }} onClick={clearTopologyMap}>🗑️ WIPE LOCAL ARRAYS</button>
            </div>
            <button style={styles.runButton} onClick={runRoutingDiagnostic} disabled={isSimulating}>
              {isSimulating ? "COMPUTING ROUTE VECTOR..." : "RUN_DIAGNOSTIC.EXE"}
            </button>
          </div>

          <div style={styles.workspace}>
            <aside style={styles.sidebarLeft}>
              <h3 style={styles.panelTitle}>HARDWARE_BAY</h3>
              <p style={styles.subtitle}>Initialize matrix arrays</p>
              <button style={styles.nodeButton} onClick={() => spawnNode('WORKSTATION')}>[+] Workstation Node</button>
              <button style={styles.nodeButton} onClick={() => spawnNode('ROUTER')}>[+] Nexus Core Router</button>
              <button style={styles.nodeButton} onClick={() => spawnNode('SERVER')}>[+] Mainframe Data Core</button>
              
              <h3 style={{ ...styles.panelTitle, color: '#ffff00', marginTop: '16px' }}>SECURITY_BAY</h3>
              <p style={styles.subtitle}>Deploy perimeter systems</p>
              <button style={{ ...styles.nodeButton, borderColor: '#ffff00', color: '#ffff00' }} onClick={() => spawnNode('FIREWALL')}>[+] Perimeter Firewall</button>
              <button style={{ ...styles.nodeButton, borderColor: '#aa00ff', color: '#aa00ff' }} onClick={() => spawnNode('MALICIOUS')}>[+] Compromised Sector</button>
            </aside>

            <main style={styles.canvasArea} onMouseMove={(e) => {
              if (!draggingNodeId.current) return;
              const canvas = e.currentTarget.getBoundingClientRect();
              setNodes(prev => prev.map(node => node.id === draggingNodeId.current ? { ...node, gridX: e.clientX - canvas.left - dragOffset.current.x, gridY: e.clientY - canvas.top - dragOffset.current.y } : node));
            }} onMouseUp={() => {
              if (draggingNodeId.current) {
                const finalId = draggingNodeId.current;
                setNodes(prev => prev.map(node => node.id === finalId ? { ...node, gridX: Math.round(node.gridX / 20) * 20, gridY: Math.round(node.gridY / 20) * 20 } : node));
                draggingNodeId.current = null;
              }
            }} onClick={() => setSelectedNodeId(null)}>
              <svg style={styles.svgLayer}>
                <defs>
                  <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                {cables.map(cable => {
                  const source = nodes.find(n => n.id === cable.fromId); const target = nodes.find(n => n.id === cable.toId);
                  if (!source || !target) return null;
                  const x1 = source.gridX + 52; const y1 = source.gridY + 52;
                  const x2 = target.gridX + 52; const y2 = target.gridY + 52;

                  const activeCableHop = simulationPath[currentPathIndex];
                  const isCableInActiveRoute = isSimulating && simulationPath.some(c => c.id === cable.id);
                  const isCableCurrentlyHot = isSimulating && activeCableHop?.id === cable.id;

                  let pX = x1, pY = y1;
                  if (isCableCurrentlyHot) {
                    const globalWorkstation = nodes.find(n => n.type === 'WORKSTATION');
                    let entryNodeId = globalWorkstation ? globalWorkstation.id : cable.fromId;
                    if (currentPathIndex > 0) {
                      const prevCable = simulationPath[currentPathIndex - 1];
                      entryNodeId = new Set([cable.fromId, cable.toId]).has(prevCable.fromId) && prevCable.fromId !== activeCableHop.fromId && prevCable.fromId !== activeCableHop.toId ? prevCable.fromId : prevCable.toId;
                    }
                    if (cable.toId === entryNodeId) { pX = x2 + (x1 - x2) * packetProgress; pY = y2 + (y1 - y2) * packetProgress; }
                    else { pX = x1 + (x2 - x1) * packetProgress; pY = y1 + (y2 - y1) * packetProgress; }
                  }

                  return (
                    <g key={cable.id}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2} style={{ stroke: isCableCurrentlyHot ? '#ff0055' : isCableInActiveRoute ? '#ff005577' : '#0099ff', strokeWidth: isCableCurrentlyHot ? 3.5 : 2 }} filter="url(#neonGlow)" />
                      <line x1={x1} y1={y1} x2={x2} y2={y2} className="circuit-wire" style={{ stroke: isCableCurrentlyHot ? '#ffff00' : '#00ffff', strokeWidth: 1.5, opacity: isCableInActiveRoute ? 1 : 0.4 }} />
                      {isCableCurrentlyHot && <circle cx={pX} cy={pY} r="7" fill="#ff0055" filter="url(#neonGlow)" />}
                    </g>
                  );
                })}
              </svg>

              {nodes.map(node => {
                const isSelectedSource = linkModeSourceId === node.id;
                const isDrawerFocused = selectedNodeId === node.id;
                const activeCableHop = simulationPath[currentPathIndex];
                const isNodeCurrentlyRouting = isSimulating && activeCableHop && (activeCableHop.fromId === node.id || activeCableHop.toId === node.id);

                let nodeColor = node.type === 'ROUTER' ? '#ff0055' : node.type === 'SERVER' ? '#00ffcc' : node.type === 'FIREWALL' ? '#ffff00' : node.type === 'MALICIOUS' ? '#aa00ff' : '#0099ff';
                if (isSelectedSource) nodeColor = '#ffffff';

                return (
                  <div key={node.id} onMouseDown={(e) => {
                    e.stopPropagation(); if (linkModeSourceId === 'PENDING') { setLinkModeSourceId(node.id); logToTerminal(`Source node mapped.`); return; }
                    if (linkModeSourceId && linkModeSourceId !== 'PENDING') {
                      if (linkModeSourceId === node.id) { setLinkModeSourceId(null); return; }
                      const connectionExists = cables.some(c => (c.fromId === linkModeSourceId && c.toId === node.id) || (c.fromId === node.id && c.toId === linkModeSourceId));
                      if (connectionExists) { setLinkModeSourceId(null); return; }
                      setCables([...cables, { id: `cable_${Math.random().toString(36).substring(2, 9)}`, fromId: linkModeSourceId, toId: node.id }]);
                      setLinkModeSourceId(null); logToTerminal(`Link mapped.`); return;
                    }
                    draggingNodeId.current = node.id; setSelectedNodeId(node.id);
                    const rect = e.currentTarget.getBoundingClientRect(); dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
                  }} style={{ ...styles.nodeSprite, left: `${node.gridX}px`, top: `${node.gridY}px`, borderColor: isDrawerFocused ? '#ffffff' : nodeColor, boxShadow: isDrawerFocused ? '0 0 22px #ffffff' : isNodeCurrentlyRouting ? `0 0 16px ${nodeColor}` : `0 4px 14px rgba(0,0,0,0.7)` }}>
                    <div style={{ fontSize: '0.55rem', color: '#666677', width: '100%', paddingLeft: '8px' }}>● {node.type}</div>
                    <div style={{ height: '32px', display: 'flex', alignItems: 'center' }}>{renderHardwareGraphic(node.type, nodeColor)}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: nodeColor }}>{node.label}</div>
                    <div style={{ fontSize: '0.6rem', color: '#444455' }}>{node.ipAddress}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '88%', borderTop: '1px solid #222230', marginTop: '6px', paddingTop: '4px', fontSize: '0.55rem', color: '#666677' }}>
                      <div>TX: {node.txCount}</div>
                      <div>RX: {node.rxCount}</div>
                    </div>
                  </div>
                );
              })}
            </main>

            {/* CONTROL DRAWER SIDEBAR FOR SELECTED HARDWARE NODES */}
            <aside style={styles.sidebarRight}>
              <h3 style={styles.panelTitle}>METRIC_DIAGNOSTICS</h3>
              <p style={styles.subtitle}>Selected asset variables</p>
              {selectedNodeId ? (
                (() => {
                  const node = nodes.find(n => n.id === selectedNodeId);
                  if (!node) return <p style={{ color: '#444466', fontSize: '0.8rem' }}>No system selection node targeted.</p>;
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '0.65rem', color: '#666680' }}>NODE IDENTIFIER LABEL</label>
                        <input type="text" className="drawer-input" value={node.label} onChange={(e) => {
                          const nextVal = e.target.value;
                          setNodes(prev => prev.map(n => n.id === selectedNodeId ? { ...n, label: nextVal } : n));
                        }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.65rem', color: '#666680' }}>IPV4 IP_ADDRESS LOCATION</label>
                        <input type="text" className="drawer-input" value={node.ipAddress} onChange={(e) => {
                          const nextVal = e.target.value;
                          setNodes(prev => prev.map(n => n.id === selectedNodeId ? { ...n, ipAddress: nextVal } : n));
                        }} />
                      </div>
                      {node.type === 'FIREWALL' && (
                        <div style={{ marginTop: '8px', border: '1px dashed #ffff00', padding: '10px', borderRadius: '4px', backgroundColor: '#1c1c12' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#ffff00', cursor: 'pointer' }}>
                            <input type="checkbox" checked={firewallBypassActive} onChange={(e) => setFirewallBypassActive(e.target.checked)} />
                            BYPASS PACKET INSPECTION
                          </label>
                        </div>
                      )}
                      <button style={{ ...styles.nodeButton, borderColor: '#ff0055', color: '#ff0055', marginTop: '12px' }} onClick={() => {
                        setNodes(nodes.filter(n => n.id !== selectedNodeId));
                        setCables(cables.filter(c => c.fromId !== selectedNodeId && c.toId !== selectedNodeId));
                        setSelectedNodeId(null);
                      }}>DE-ALLOCATE HARDWARE CORE</button>
                    </div>
                  );
                })()
              ) : (
                <p style={{ color: '#444466', fontSize: '0.8rem' }}>Target a node layout component to inspect telemetry array maps.</p>
              )}

              <hr style={{ border: 'none', borderTop: '1px solid #222235', margin: '20px 0' }} />
              <h3 style={styles.panelTitle}>TERMINAL_LOGSTREAM</h3>
              <div style={styles.terminalBox}>
                {terminalLogs.map((log, idx) => (
                  <div key={idx} style={{ marginBottom: '6px', color: log.includes('❌') || log.includes('🔥') ? '#ff0055' : log.includes('🏁') || log.includes('🛸') ? '#00ffcc' : '#aaaabf' }}>
                    {log}
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
};

// --- OBJECT ORIENTED COMPONENT CSS MATRIX DEFINITIONS ---
const styles: { [key: string]: React.CSSProperties } = {
  dashboardContainer: { width: '100vw', height: '100vh', backgroundColor: '#09090d', color: '#fff', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  globalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0d0d13', borderBottom: '1px solid #1a1a26', padding: '0 24px', height: '56px', minHeight: '56px', boxSizing: 'border-box' },
  logoGroup: { display: 'flex', alignItems: 'center', fontSize: '0.9rem', fontWeight: 'bold', color: '#fff', letterSpacing: '1px' },
  portfolioScrollArea: { flex: 1, overflowY: 'auto', padding: '40px 10% 20px 10%', boxSizing: 'border-box' },
  heroSection: { maxWidth: '800px', margin: '0 auto', textAlign: 'left' },
  heroTitle: { fontSize: '2.2rem', fontWeight: 'bold', margin: '0 0 16px 0', color: '#fff', letterSpacing: '-0.5px', lineHeight: '1.2' },
  heroSubtitle: { fontSize: '1rem', color: '#8888aa', lineHeight: '1.6', margin: '0' },
  portfolioGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' },
  cardTitle: { fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', margin: '6px 0 8px 0' },
  cardDescription: { fontSize: '0.85rem', color: '#777799', lineHeight: '1.5', margin: '0' },
  portfolioFooter: { maxWidth: '1200px', margin: '40px auto 0 auto', borderTop: '1px solid #1a1a26', paddingTop: '20px', fontSize: '0.75rem', color: '#33334c', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' },
  simulatorActionHUD: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', backgroundColor: '#0d0d13', borderBottom: '1px solid #1a1a26', height: '56px', minHeight: '56px', boxSizing: 'border-box' },
  linkButton: { background: '#161622', border: '1px solid #33334c', color: '#aaaabf', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', fontFamily: 'monospace' },
  fileUploadLabel: { background: '#161622', border: '1px solid #33334c', color: '#aaaabf', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', fontFamily: 'monospace', display: 'inline-block' },
  runButton: { background: 'transparent', border: '1px solid #00ffcc', color: '#00ffcc', padding: '6px 16px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', fontFamily: 'monospace' },
  workspace: { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebarLeft: { width: '220px', minWidth: '220px', backgroundColor: '#0d0d13', borderRight: '1px solid #1a1a26', padding: '16px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '8px' },
  sidebarRight: { width: '300px', minWidth: '300px', backgroundColor: '#0d0d13', borderLeft: '1px solid #1a1a26', padding: '16px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' },
  panelTitle: { fontSize: '0.8rem', fontWeight: 'bold', color: '#00ffcc', margin: '0 0 2px 0', letterSpacing: '1px' },
  subtitle: { fontSize: '0.65rem', color: '#444455', margin: '0 0 12px 0' },
  nodeButton: { background: '#111116', border: '1px solid #222235', color: '#fff', padding: '10px', textAlign: 'left', cursor: 'pointer', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'monospace', width: '100%', boxSizing: 'border-box' },
  canvasArea: { flex: 1, position: 'relative', overflow: 'hidden', cursor: 'crosshair', backgroundImage: 'radial-gradient(#11111a 1px, transparent 1px)', backgroundSize: '20px 20px' },
  svgLayer: { position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, pointerEvents: 'none' },
  nodeSprite: { position: 'absolute', width: '104px', height: '104px', border: '1px solid', borderRadius: '6px', background: '#09090d', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'grab', userSelect: 'none', boxSizing: 'border-box' },
  terminalBox: { flex: 1, background: '#050508', border: '1px solid #1a1a26', borderRadius: '4px', padding: '12px', overflowY: 'auto', fontSize: '0.65rem', lineHeight: '1.4', marginTop: '8px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(5, 5, 8, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { width: '840px', maxWidth: '90%', backgroundColor: '#0d0d13', border: '1px solid #222235', borderRadius: '8px', padding: '32px', boxSizing: 'border-box', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '1px solid #1a1a26', paddingBottom: '16px' },
  closeModalBtn: { background: 'transparent', border: 'none', color: '#444466', fontSize: '1.2rem', cursor: 'pointer' },
  modalBodyLayout: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', alignItems: 'start' },
  modalImageContainer: { height: '240px', backgroundColor: '#09090d', borderRadius: '6px', border: '1px dashed #222235', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', boxSizing: 'border-box', overflow: 'hidden' },
  modalSpecsContainer: { display: 'flex', flexDirection: 'column' }
};