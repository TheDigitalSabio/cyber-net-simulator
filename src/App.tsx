import React, { useState, useRef, useEffect } from 'react';

type NodeType = 'WORKSTATION' | 'ROUTER' | 'SERVER' | 'FIREWALL' | 'MALICIOUS';

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

export const App: React.FC = () => {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [cables, setCables] = useState<NetworkCable[]>([]);
  const [linkModeSourceId, setLinkModeSourceId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  
  // --- STATE SECTORS: INTERACTIVE CONFIG & FIREWALL SECURITY ---
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [firewallBypassActive, setFirewallBypassActive] = useState<boolean>(false);

  // --- ADVANCED PATH SIMULATION STATE ---
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationPath, setSimulationPath] = useState<NetworkCable[]>([]);
  const [currentPathIndex, setCurrentPathIndex] = useState<number>(0);
  const [packetProgress, setPacketProgress] = useState<number>(0);

  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "NET_MATRIX MATRIX ENGINE READY // HARDWARE, LINK, AND SECURITY ENGINES ONLINE.",
    "STORAGE ENGINE: Automatic LocalStorage topology mapping enabled.",
    "DEPLOYMENT METHOD: Route packets from a WORKSTATION to a SERVER core. Beware of Security Firewalls and Malicious sectors!"
  ]);

  const draggingNodeId = useRef<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // --- FEATURE 3: LOCAL STORAGE INITIAL LOAD ---
  useEffect(() => {
    const savedNodes = localStorage.getItem('NET_MATRIX_NODES');
    const savedCables = localStorage.getItem('NET_MATRIX_CABLES');
    if (savedNodes) setNodes(JSON.parse(savedNodes));
    if (savedCables) setCables(JSON.parse(savedCables));
  }, []);

  // --- FEATURE 3: LOCAL STORAGE PERSISTENCE SYNC ---
  useEffect(() => {
    if (nodes.length > 0 || cables.length > 0) {
      localStorage.setItem('NET_MATRIX_NODES', JSON.stringify(nodes));
      localStorage.setItem('NET_MATRIX_CABLES', JSON.stringify(cables));
    }
  }, [nodes, cables]);

  // --- MULTI-HOP SEQUENTIAL STEP ENGINE ---
  useEffect(() => {
    if (!isSimulating || simulationPath.length === 0) return;

    const interval = setInterval(() => {
      setPacketProgress(prev => {
        if (prev >= 1) {
          const currentCable = simulationPath[currentPathIndex];
          
          // Identify the node the packet is arriving at on this leg
          const activeCableHop = simulationPath[currentPathIndex];
          let lastEntryId = nodes.find(n => n.type === 'WORKSTATION')?.id || '';
          if (currentPathIndex > 0) {
            const prevCable = simulationPath[currentPathIndex - 1];
            lastEntryId = (prevCable.fromId === activeCableHop.fromId || prevCable.fromId === activeCableHop.toId) ? prevCable.toId : prevCable.fromId;
          }
          const destinationNodeId = currentCable.fromId === lastEntryId ? currentCable.toId : currentCable.fromId;
          const arrivalNode = nodes.find(n => n.id === destinationNodeId);

          // FEATURE 2: SECURITY ENGINE - FIREWALL INTERCEPT
          if (arrivalNode?.type === 'FIREWALL' && !firewallBypassActive) {
            clearInterval(interval);
            setIsSimulating(false);
            setSimulationPath([]);
            logToTerminal(`🔥 [SECURITY DROP] Packet intercepted and purged by Firewall Core: ${arrivalNode.label}. Handshake denied.`);
            return 0;
          }

          // FEATURE 2: SECURITY ENGINE - MALICIOUS SECTOR BREACH
          if (arrivalNode?.type === 'MALICIOUS') {
            logToTerminal(`⚠️ [MALICIOUS BREACH] Packet corrupted passing through compromised core ${arrivalNode.label}! Telemetry payload altered.`);
          }

          // Update data telemetry counters
          setNodes(prevNodes => 
            prevNodes.map(n => {
              if (n.id === currentCable.fromId || n.id === currentCable.toId) {
                return { ...n, txCount: n.txCount + 1, rxCount: n.rxCount + 1 };
              }
              return n;
            })
          );

          // Check if there are more hops left in the sequence route
          if (currentPathIndex < simulationPath.length - 1) {
            const nextIndex = currentPathIndex + 1;
            setCurrentPathIndex(nextIndex);
            logToTerminal(`📡 [HOP RELAY] Reached transit node. Forwarding packet to segment ${nextIndex + 1}/${simulationPath.length}...`);
            return 0;
          } else {
            clearInterval(interval);
            setIsSimulating(false);
            setSimulationPath([]);
            logToTerminal("🏁 [SIM COMPLETE] Quantum packet arrived successfully at data core destination. Handshake verified.");
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

    const newNode: NetworkNode = {
      id,
      type,
      label: `${type}_${count}`,
      ipAddress: defaultIp,
      gridX: 120,
      gridY: 120,
      txCount: 0,
      rxCount: 0
    };

    setNodes([...nodes, newNode]);
    logToTerminal(`[DEPLOY] ${newNode.label} (${newNode.ipAddress}) deployed to grid sector.`);
  };

  const clearTopologyMap = () => {
    setNodes([]);
    setCables([]);
    setSimulationPath([]);
    setSelectedNodeId(null);
    localStorage.removeItem('NET_MATRIX_NODES');
    localStorage.removeItem('NET_MATRIX_CABLES');
    logToTerminal("🗑️ [STORAGE] Local memory maps wiped clean.");
  };

  // --- SAVE/LOAD TOPOLOGIES: FILE ENGINE HANDLERS ---
  const exportTopologyToJSON = () => {
    if (nodes.length === 0 && cables.length === 0) {
      logToTerminal("❌ EXPORT_ERROR: Cannot map an empty infrastructure topology matrix.");
      return;
    }
    
    const topologyPackage = {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      nodes,
      cables
    };

    const dataStream = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify(topologyPackage, null, 2)
    );
    
    const downloadHook = document.createElement('a');
    downloadHook.setAttribute("href", dataStream);
    downloadHook.setAttribute("download", `net_matrix_${Math.random().toString(36).substring(2, 7)}.json`);
    document.body.appendChild(downloadHook);
    downloadHook.click();
    downloadHook.remove();
    
    logToTerminal("💾 [SYSTEM_EXPORT] Core infrastructure layouts successfully compiled to JSON filesystem.");
  };

  const importTopologyFromJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileTarget = event.target.files?.[0];
    if (!fileTarget) return;

    const streamReader = new FileReader();
    streamReader.onload = (e) => {
      try {
        const structuralMap = JSON.parse(e.target?.result as string);
        
        if (Array.isArray(structuralMap.nodes) && Array.isArray(structuralMap.cables)) {
          setNodes(structuralMap.nodes);
          setCables(structuralMap.cables);
          setSimulationPath([]);
          setSelectedNodeId(null);
          logToTerminal(`🛸 [SYSTEM_IMPORT] External layout map "${fileTarget.name}" injected successfully into grid arrays.`);
        } else {
          logToTerminal("❌ IMPORT_CRITICAL: Structured arrays do not match current Net_Matrix telemetry guidelines.");
        }
      } catch (err) {
        logToTerminal("❌ IMPORT_CRITICAL: Failed to compile JSON syntax tree. File corrupted.");
      }
    };
    
    streamReader.readAsText(fileTarget);
    event.target.value = '';
  };

  // --- ACTIVE FIREWALLS: INTERACTIVE TOGGLE HANDLER ---
  const handleToggleFirewallRule = () => {
    setFirewallBypassActive(prev => !prev);
    logToTerminal(`🛡️ [FIREWALL_RULE_CHANGED] Global protection matrix toggled. Re-evaluating shield grids.`);
  };

  const handleMouseDown = (e: React.MouseEvent, node: NetworkNode) => {
    if (linkModeSourceId) {
      handleLinkTarget(node.id);
      return;
    }
    draggingNodeId.current = node.id;
    setSelectedNodeId(node.id); // Focus node configuration drawer on click
    
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNodeId.current) return;
    
    const canvas = e.currentTarget.getBoundingClientRect();
    let newX = e.clientX - canvas.left - dragOffset.current.x;
    let newY = e.clientY - canvas.top - dragOffset.current.y;

    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === draggingNodeId.current ? { ...node, gridX: newX, gridY: newY } : node
      )
    );
  };

  const handleMouseUp = () => {
    if (draggingNodeId.current) {
      const finalId = draggingNodeId.current;
      setNodes(prevNodes =>
        prevNodes.map(node => node.id === finalId ? { ...node, gridX: Math.round(node.gridX / 20) * 20, gridY: Math.round(node.gridY / 20) * 20 } : node)
      );
      draggingNodeId.current = null;
    }
  };

  const initiateLink = () => {
    if (nodes.length < 2) {
      logToTerminal("❌ LINK_ERROR: Build more terminal infrastructure before initiating link sequences.");
      return;
    }
    setLinkModeSourceId('PENDING');
    logToTerminal("🔌 LINK_MODE: Select primary data packet vector source...");
  };

  const handleNodeClick = (node: NetworkNode) => {
    if (linkModeSourceId === 'PENDING') {
      setLinkModeSourceId(node.id);
      logToTerminal(`[LINK SOURCE] ${node.label} selected. Map destination node...`);
    } else if (linkModeSourceId && linkModeSourceId !== 'PENDING') {
      handleLinkTarget(node.id);
    }
  };

  const handleLinkTarget = (targetId: string) => {
    if (!linkModeSourceId || linkModeSourceId === 'PENDING') return;
    if (linkModeSourceId === targetId) {
      logToTerminal("❌ LINK_ABORTED: Loopback error.");
      setLinkModeSourceId(null);
      return;
    }

    const linkExists = cables.some(c => (c.fromId === linkModeSourceId && c.toId === targetId) || (c.fromId === targetId && c.toId === linkModeSourceId));
    if (linkExists) {
      logToTerminal("❌ LINK_ABORTED: Network path vector already exists.");
      setLinkModeSourceId(null);
      return;
    }

    const newCable: NetworkCable = { id: `cable_${Math.random().toString(36).substring(2, 9)}`, fromId: linkModeSourceId, toId: targetId };
    setCables([...cables, newCable]);
    logToTerminal(`⚡ [VECTOR SECURED] Physical layer connection mapped successfully.`);
    setLinkModeSourceId(null);
  };

  const runRoutingDiagnostic = () => {
    logToTerminal("🚀 SPINNING UP DYNAMIC PATHFINDING MATRIX...");
    
    const startNode = nodes.find(n => n.type === 'WORKSTATION');
    const endNode = nodes.find(n => n.type === 'SERVER');

    if (!startNode || !endNode) {
      logToTerminal("❌ CRITICAL ANOMALY: Simulation requires at least one WORKSTATION source and one SERVER target core.");
      return;
    }

    const queue: string[] = [startNode.id];
    const visited = new Set<string>([startNode.id]);
    const parentMap = new Map<string, { parentId: string; viaCable: NetworkCable }>();

    let pathFound = false;

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      
      if (currentId === endNode.id) {
        pathFound = true;
        break;
      }

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

      setSimulationPath(orderedHops);
      setCurrentPathIndex(0);
      setPacketProgress(0);
      setIsSimulating(true);
      logToTerminal(`⚡ ROUTE MAP LOCKED: Found shortest connection layout involving ${orderedHops.length} hardware hops.`);
    } else {
      logToTerminal("❌ PACKET DROP: Target core matrix unreachable. System topology fragmented.");
    }
  };

  const handleUpdateNodeField = (id: string, field: 'label' | 'ipAddress', value: string) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, [field]: value } : n));
  };

  const handleResetNodeStats = (id: string) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, txCount: 0, rxCount: 0 } : n));
    logToTerminal(`⚡ Telemetry cache purged for focused hardware core.`);
  };

  const renderHardwareGraphic = (type: NodeType, color: string) => {
    switch (type) {
      case 'WORKSTATION':
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
            <rect x="2" y="3" width="20" height="13" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="16" x2="12" y2="21" />
          </svg>
        );
      case 'ROUTER':
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
            <ellipse cx="12" cy="17" rx="9" ry="4" /><path d="M12 2v11" /><path d="M17 5l-5-3-5 3" />
          </svg>
        );
      case 'SERVER':
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
            <rect x="2" y="2" width="20" height="6" rx="1" /><rect x="2" y="9" width="20" height="6" rx="1" /><rect x="2" y="16" width="20" height="6" rx="1" />
          </svg>
        );
      case 'FIREWALL':
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        );
      case 'MALICIOUS':
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        );
    }
  };

  const activeFocusedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div style={styles.dashboardContainer}>
      <style>{`
        @keyframes pulseCircuit { to { stroke-dashoffset: -20; } }
        @keyframes targetPulse { 0% { box-shadow: 0 0 4px #ffffff; } 50% { box-shadow: 0 0 20px #ffffff, inset 0 0 10px #ffffff44; } 100% { box-shadow: 0 0 4px #ffffff; } }
        @keyframes textBlink { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        .circuit-wire { stroke-dasharray: 6, 4; animation: pulseCircuit 1s linear infinite; }
        .target-pulsing { animation: targetPulse 1.5s infinite ease-in-out !important; }
        .routing-flash { animation: textBlink 0.6s infinite ease-in-out; color: #ff0055 !important; }
        .drawer-input { background: #111116; border: 1px solid #222235; color: #00ffcc; padding: 8px; font-family: monospace; font-size: 0.8rem; width: 100%; box-sizing: border-box; border-radius: 4px; margin-top: 4px; outline: none; }
        .drawer-input:focus { border-color: #00ffcc; }
      `}</style>

      <header style={styles.headerHUD}>
        <div style={styles.logo}>NET_MATRIX // OPERATIONAL_SIMULATOR</div>
        <div style={styles.actionsHUD}>
          <button style={{ ...styles.linkButton, marginRight: '12px', backgroundColor: linkModeSourceId ? '#00ffcc' : '#1a1a24', color: linkModeSourceId ? '#000' : '#00ffcc' }} onClick={initiateLink}>
            {linkModeSourceId ? "SELECT TARGET NODE..." : "⚡ LINK HARDWARE"}
          </button>
          
          {/* FILE ACTIONS BUTTON CORES */}
          <label style={{ ...styles.linkButton, marginRight: '12px', borderColor: '#ffff00', color: '#ffff00', display: 'inline-block', cursor: 'pointer' }}>
            📥 IMPORT MAP
            <input type="file" accept=".json" onChange={importTopologyFromJSON} style={{ display: 'none' }} />
          </label>
          <button style={{ ...styles.linkButton, marginRight: '12px', borderColor: '#00ffcc', color: '#00ffcc' }} onClick={exportTopologyToJSON}>
            💾 EXPORT MAP
          </button>
          <button style={{ ...styles.linkButton, marginRight: '12px', borderColor: '#ff0055', color: '#ff0055' }} onClick={clearTopologyMap}>
            🗑️ PURGE STORAGE
          </button>

          <button style={styles.runButton} onClick={runRoutingDiagnostic} disabled={isSimulating}>
            {isSimulating ? "TRANSMITTING..." : "RUN_DIAGNOSTIC.EXE"}
          </button>
        </div>
      </header>

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

          <div style={styles.firewallToggleContainer}>
            <label style={{ fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={firewallBypassActive} onChange={(e) => setFirewallBypassActive(e.target.checked)} style={{ cursor: 'pointer' }} />
              BYPASS FIREWALL PROTOCOLS
            </label>
          </div>
        </aside>

        <main style={styles.canvasArea} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onClick={() => setSelectedNodeId(null)}>
          <svg style={styles.svgLayer}>
            <defs>
              <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {cables.map(cable => {
              const source = nodes.find(n => n.id === cable.fromId);
              const target = nodes.find(n => n.id === cable.toId);
              if (!source || !target) return null;

              const x1 = source.gridX + 52; const y1 = source.gridY + 52;
              const x2 = target.gridX + 52; const y2 = target.gridY + 52;

              const activeCableHop = simulationPath[currentPathIndex];
              const isCableInActiveRoute = isSimulating && simulationPath.some(c => c.id === cable.id);
              const isCableCurrentlyHot = isSimulating && activeCableHop?.id === cable.id;

              let pX = x1; let pY = y1;
              if (isCableCurrentlyHot) {
                const globalWorkstation = nodes.find(n => n.type === 'WORKSTATION');
                let entryNodeId = globalWorkstation ? globalWorkstation.id : cable.fromId;
                
                if (currentPathIndex > 0) {
                  const prevCable = simulationPath[currentPathIndex - 1];
                  const currentLegIdSet = new Set([cable.fromId, cable.toId]);
                  entryNodeId = currentLegIdSet.has(prevCable.fromId) && prevCable.fromId !== activeCableHop.fromId && prevCable.fromId !== activeCableHop.toId ? prevCable.fromId : prevCable.toId;
                }
                
                if (cable.toId === entryNodeId) {
                  pX = x2 + (x1 - x2) * packetProgress;
                  pY = y2 + (y1 - y2) * packetProgress;
                } else {
                  pX = x1 + (x2 - x1) * packetProgress;
                  pY = y1 + (y2 - y1) * packetProgress;
                }
              }

              return (
                <g key={cable.id}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} 
                    style={{ ...styles.neonWire, stroke: isCableCurrentlyHot ? '#ff0055' : isCableInActiveRoute ? '#ff005577' : '#0099ff', strokeWidth: isCableCurrentlyHot ? 3.5 : 2 }} filter="url(#neonGlow)" 
                  />
                  <line x1={x1} y1={y1} x2={x2} y2={y2} className="circuit-wire" style={{ stroke: isCableCurrentlyHot ? '#ffff00' : '#00ffff', strokeWidth: 1.5, opacity: isCableInActiveRoute ? 1 : 0.4 }} />

                  {isCableCurrentlyHot && (
                    <circle cx={pX} cy={pY} r="7" fill="#ff0055" filter="url(#neonGlow)" />
                  )}
                </g>
              );
            })}
          </svg>

          {nodes.map(node => {
            const isSelectedSource = linkModeSourceId === node.id;
            const isPendingMode = linkModeSourceId && linkModeSourceId !== 'PENDING';
            const isValidTarget = isPendingMode && !isSelectedSource && hoveredNodeId === node.id;
            const isDrawerFocused = selectedNodeId === node.id;
            
            const activeCableHop = simulationPath[currentPathIndex];
            const isNodeCurrentlyRouting = isSimulating && activeCableHop && (activeCableHop.fromId === node.id || activeCableHop.toId === node.id);

            let nodeColor = node.type === 'ROUTER' ? '#ff0055' : node.type === 'SERVER' ? '#00ffcc' : node.type === 'FIREWALL' ? '#ffff00' : node.type === 'MALICIOUS' ? '#aa00ff' : '#0099ff';
            if (isSelectedSource) nodeColor = '#ffffff';
            if (isValidTarget) nodeColor = '#ffff00';
            
            return (
              <div key={node.id} 
                onMouseDown={(e) => handleMouseDown(e, node)} 
                onClick={(e) => { e.stopPropagation(); handleNodeClick(node); }} 
                onMouseEnter={() => setHoveredNodeId(node.id)} 
                onMouseLeave={() => setHoveredNodeId(null)}
                className={isSelectedSource ? 'target-pulsing' : ''}
                style={{ 
                  ...styles.nodeSprite, 
                  left: `${node.gridX}px`, 
                  top: `${node.gridY}px`, 
                  borderColor: isDrawerFocused ? '#ffffff' : nodeColor, 
                  backgroundColor: isSelectedSource ? '#1b1b26' : '#0d0d14', 
                  boxShadow: isDrawerFocused ? '0 0 22px #ffffff' : isSelectedSource ? '0 0 20px #ffffff' : isValidTarget ? '0 0 20px #ffff00' : isNodeCurrentlyRouting ? `0 0 16px ${nodeColor}` : `0 4px 14px rgba(0,0,0,0.7), inset 0 0 8px ${nodeColor}22` 
                }}
              >
                <div style={{ ...styles.cornerAccent, top: -1, left: -1, borderTop: `2px solid ${nodeColor}`, borderLeft: `2px solid ${nodeColor}` }} />
                <div style={{ ...styles.cornerAccent, top: -1, right: -1, borderTop: `2px solid ${nodeColor}`, borderRight: `2px solid ${nodeColor}` }} />
                <div style={{ ...styles.cornerAccent, bottom: -1, left: -1, borderBottom: `2px solid ${nodeColor}`, borderLeft: `2px solid ${nodeColor}` }} />
                <div style={{ ...styles.cornerAccent, bottom: -1, right: -1, borderBottom: `2px solid ${nodeColor}`, borderRight: `2px solid ${nodeColor}` }} />

                <div style={styles.stateStatusBar}>
                  <span className={isNodeCurrentlyRouting ? 'routing-flash' : ''} style={{ color: isSelectedSource ? '#ffffff' : '#666677' }}>
                    ● {isNodeCurrentlyRouting ? 'ROUTING' : isSelectedSource ? 'LINK_SRC' : node.type}
                  </span>
                </div>

                <div style={styles.graphicContainer}>{renderHardwareGraphic(node.type, nodeColor)}</div>
                <div style={{ ...styles.nodeLabel, color: nodeColor }}>{node.label}</div>
                <div style={styles.nodeIP}>{node.ipAddress}</div>

                <div style={styles.metricsPanel}>
                  <div>TX: {node.txCount}</div>
                  <div>RX: {node.rxCount}</div>
                </div>
              </div>
            );
          })}
        </main>

        {/* FEATURE 1: INTERACTIVE HUD DRAWER SIDE PANEL */}
        {activeFocusedNode && (
          <aside style={styles.sidebarRight}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ ...styles.panelTitle, color: activeFocusedNode.type === 'FIREWALL' ? '#ffff00' : '#ffffff' }}>
                {activeFocusedNode.type === 'FIREWALL' ? 'SEC_PERIMETER // HUD' : 'CORE_CONFIG // HUD'}
              </h3>
              <button style={styles.closeDrawerBtn} onClick={() => setSelectedNodeId(null)}>✕</button>
            </div>
            
            <div style={styles.drawerFieldBlock}>
              <label style={styles.drawerLabel}>HARDWARE IDENTIFIER</label>
              <input type="text" className="drawer-input" value={activeFocusedNode.label} onChange={(e) => handleUpdateNodeField(activeFocusedNode.id, 'label', e.target.value)} />
            </div>

            <div style={styles.drawerFieldBlock}>
              <label style={styles.drawerLabel}>LOCAL IP VECTOR ADDRESS</label>
              <input type="text" className="drawer-input" value={activeFocusedNode.ipAddress} onChange={(e) => handleUpdateNodeField(activeFocusedNode.id, 'ipAddress', e.target.value)} />
            </div>

            {/* CONDITIONAL SECURITY RULES ENVELOPE FOR FIREWALL CORES */}
            {activeFocusedNode.type === 'FIREWALL' && (
              <div style={{ ...styles.drawerTelemetryCard, borderColor: '#ffff00' }}>
                <div style={{ ...styles.drawerLabel, color: '#ffff00' }}>FIREWALL INTERCEPT LAYER</div>
                <div style={{ marginTop: '10px', fontSize: '0.8rem' }}>
                  Status: <span style={{ color: firewallBypassActive ? '#ff0055' : '#00ffcc', fontWeight: 'bold' }}>
                    {firewallBypassActive ? "⚠️ BYPASSED (INACTIVE)" : "🔒 ACTIVE PROTECTION SHIELD"}
                  </span>
                </div>
                <button 
                  style={{ 
                    ...styles.drawerResetBtn, 
                    background: firewallBypassActive ? '#00ffcc22' : '#ff005522', 
                    borderColor: firewallBypassActive ? '#00ffcc' : '#ff0055', 
                    color: firewallBypassActive ? '#00ffcc' : '#ff0055',
                    marginTop: '12px'
                  }} 
                  onClick={handleToggleFirewallRule}
                >
                  {firewallBypassActive ? "ENGAGE SECURITY PERIMETER" : "DISABLE SECURITY SHIELD"}
                </button>
              </div>
            )}

            <div style={styles.drawerTelemetryCard}>
              <div style={styles.drawerLabel}>HARDWARE TRAFFIC STATISTICS</div>
              <div style={{ marginTop: '6px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Total Packets Transmitted (TX): <span style={{ color: '#00ffcc' }}>{activeFocusedNode.txCount} pkts</span></div>
                <div>Total Packets Received (RX): <span style={{ color: '#00ffcc' }}>{activeFocusedNode.rxCount} pkts</span></div>
              </div>
              <button style={styles.drawerResetBtn} onClick={() => handleResetNodeStats(activeFocusedNode.id)}>PURGE TELEMETRY CACHE</button>
            </div>
          </aside>
        )}
      </div>

      <footer style={styles.terminalContainer}>
        <div style={styles.terminalHeader}>SYSTEM_LOG_STREAM // FEED.LOG</div>
        <div style={styles.terminalBody}>
          {terminalLogs.map((log, index) => <div key={index} style={styles.terminalLine}>{log}</div>)}
        </div>
      </footer>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  dashboardContainer: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0a0a0c', color: '#00ffcc', fontFamily: 'monospace', overflow: 'hidden', userSelect: 'none' },
  headerHUD: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', backgroundColor: '#111115', borderBottom: '2px solid #222' },
  logo: { fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: '2px', color: '#00ffcc' },
  actionsHUD: { display: 'flex', alignItems: 'center' },
  linkButton: { border: '1px solid #00ffcc', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', letterSpacing: '1px', background: 'transparent' },
  runButton: { backgroundColor: '#ff0055', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 0 10px #ff0055' },
  workspace: { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebarLeft: { width: '260px', backgroundColor: '#111115', borderRight: '2px solid #222', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 10 },
  sidebarRight: { width: '280px', backgroundColor: '#111115', borderLeft: '2px solid #222', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 10 },
  panelTitle: { color: '#ff0055', margin: 0, fontSize: '1rem', letterSpacing: '1px' },
  subtitle: { color: '#666', fontSize: '0.8rem', margin: '0 0 4px 0' },
  nodeButton: { backgroundColor: '#1a1a24', color: '#00ffcc', border: '1px solid #00ffcc', padding: '12px', textAlign: 'left', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px' },
  firewallToggleContainer: { borderTop: '1px solid #222235', marginTop: '14px', paddingTop: '14px', color: '#666677' },
  canvasArea: { flex: 1, backgroundColor: '#060608', position: 'relative', backgroundImage: 'radial-gradient(#1c1c28 1.5px, transparent 1.5px)', backgroundSize: '20px 20px', overflow: 'hidden' },
  svgLayer: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 },
  neonWire: { stroke: '#0099ff', strokeWidth: 2 },
  nodeSprite: { position: 'absolute', width: '104px', height: '114px', border: '1px solid', borderRadius: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 5, cursor: 'grab', transition: 'box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease', padding: '4px 0' },
  cornerAccent: { position: 'absolute', width: '6px', height: '6px', pointerEvents: 'none' },
  stateStatusBar: { fontSize: '0.55rem', alignSelf: 'flex-start', paddingLeft: '8px', marginBottom: '2px', letterSpacing: '0.5px' },
  graphicContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '32px', marginBottom: '2px' },
  nodeLabel: { fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.5px' },
  nodeIP: { fontSize: '0.6rem', color: '#444455', marginTop: '1px' },
  metricsPanel: { display: 'flex', justifyContent: 'space-between', width: '88%', borderTop: '1px solid #222230', marginTop: '6px', paddingTop: '4px', fontSize: '0.55rem', color: '#666677' },
  drawerFieldBlock: { display: 'flex', flexDirection: 'column' },
  drawerLabel: { fontSize: '0.65rem', color: '#666680', letterSpacing: '0.5px' },
  drawerTelemetryCard: { background: '#14141c', border: '1px dashed #222235', padding: '12px', borderRadius: '4px', marginTop: '8px' },
  drawerResetBtn: { background: '#ff005522', border: '1px solid #ff0055', color: '#ff0055', padding: '6px', fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', width: '100%', marginTop: '12px' },
  closeDrawerBtn: { background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: '1rem' },
  terminalContainer: { height: '160px', backgroundColor: '#07070a', borderTop: '2px solid #222', display: 'flex', flexDirection: 'column', zIndex: 10 },
  terminalHeader: { backgroundColor: '#111115', padding: '6px 16px', fontSize: '0.75rem', color: '#666', borderBottom: '1px solid #222' },
  terminalBody: { flex: 1, padding: '12px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse', gap: '4px' },
  terminalLine: { fontSize: '0.85rem', color: '#00ffcc', lineHeight: '1.4' }
};