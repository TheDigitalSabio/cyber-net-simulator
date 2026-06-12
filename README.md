# 🪐 NET_MATRIX // Interactive IT Network Simulator

A high-performance, web-based interactive IT architecture and network topology routing simulator built with a cyberpunk, gamified sci-fi dashboard aesthetic. This application allows users to build physical networks on a dynamic grid, establish node vectors, and simulate real-time packet transmissions down vector connection streams.

---

## 🛠️ The Professional Stack

This project was engineered from scratch on an Apple Silicon M1 workstation leveraging modern, high-performance web infrastructure:

* **Runtime Framework:** React 18 + TypeScript (Strict Type Checked)
* **Compilation Toolchain:** Vite (Native ES Modules for lightning-fast HMR)
* **Graphics & Vector Physics Engine:** Native HTML5 SVG Layer with dynamic geometric math
* **Styling Architecture:** Cyberpunk retro terminal theme with native CSS neon glow filters

---

## ⚡ Core Operational Features

* **Matrix Component Spawning:** Instantly initialize and deploy distinct hardware nodes (`Workstation Terminals`, `Nexus Core Routers`, and `Mainframe Data Cores`) into an active matrix data array.
* **Vector Grid-Snapping Mechanics:** Built custom math constraints (`Math.round(val / 20) * 20`) to force components to seamlessly lock along standard 20px grid lines for clean spatial layouts.
* **Dynamic SVG Cable Tracking:** Implemented a continuous physics layer using an SVG overlay. Nodes act as coordinate anchors; when a user moves a hardware component, the vector connection wires dynamically stretch and calculate real-time paths.
* **Diagnostic Simulation Engine:** Features a simulation controller that creates a visual data packet trace traveling down active cables to test path connectivity and log telemetry to an integrated system terminal window.

---

## 🚀 Local Development Setup

To replicate this environment on your local workstation:

```bash
# Clone the repository
git clone [https://github.com/YOUR_USERNAME/cyber-net-simulator.git](https://github.com/YOUR_USERNAME/cyber-net-simulator.git)

# Move into the project matrix
cd cyber-net-simulator

# Install production and development packages
npm install

# Boot up the local M1 development engine
npm run dev