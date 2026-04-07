import React, { useEffect, useState, useRef, useCallback } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Custom Global Cursor (Square Hybrid) ──────────────────────────────────────
function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    const updatePos = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      const target = e.target as HTMLElement;
      const clickableType = target.closest('a, button, [role="button"]') || window.getComputedStyle(target).cursor === 'pointer' || window.getComputedStyle(target.parentElement || target).cursor === 'pointer';
      setIsPointer(!!clickableType);
    };
    window.addEventListener("mousemove", updatePos);
    return () => window.removeEventListener("mousemove", updatePos);
  }, []);

  return (
    <>
      <div
        className="fixed w-3 h-3 bg-[#10b981] pointer-events-none z-[100] mix-blend-difference"
        style={{
          left: pos.x, top: pos.y,
          transform: `translate(-50%, -50%) scale(${isPointer ? 0.5 : 1})`,
          transition: 'transform 0.1s step-end'
        }}
      />
      <div
        className="fixed w-10 h-10 border border-[#10b981]/50 pointer-events-none z-[99]"
        style={{
          left: pos.x, top: pos.y,
          transform: `translate(-50%, -50%) scale(${isPointer ? 1.5 : 1})`,
          transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), left 0.1s ease-out, top 0.1s ease-out'
        }}
      />
    </>
  );
}

// ─── Particle Constellation ───────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Array<{ x: number, y: number, vx: number, vy: number, radius: number }> = [];
    let particleCount = Math.floor(window.innerWidth / 20);
    if (particleCount > 80) particleCount = 80;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 // slightly larger for terminal feel
      });
    }

    let animationId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)'; // #10b981
        // draw squares instead of circles
        ctx.fillRect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
      });

      // Connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const opacity = 0.2 - dist / 600;
            ctx.strokeStyle = `rgba(16, 185, 129, ${opacity > 0 ? opacity : 0})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none -z-10 opacity-60" />;
}

// ─── Magnetic Button Pull Effect (Terminal Style) ─────────────────────────────
function MagneticButton({ children, href, className, primary, ...props }: { children: React.ReactNode, href?: string, className?: string, primary?: boolean } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.2;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.2;
    setPos({ x, y });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setPos({ x: 0, y: 0 });
    props.onMouseLeave?.(e);
  };

  return (
    <a
      ref={ref}
      href={href}
      {...props}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      className={cn(
        "inline-flex w-fit items-center justify-center transition-all duration-150 ease-out font-mono text-sm tracking-widest relative group overflow-hidden border border-[#10b981]",
        primary
          ? "bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981] hover:text-[#050505] px-8 py-3 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          : "bg-[#050505] text-[#10b981] hover:bg-[#10b981]/20 px-8 py-3",
        className
      )}
    >
      <span className="relative z-10 flex items-center gap-2">
        {primary ? "[ " : ""}
        {children}
        {primary ? " ]" : ""}
      </span>
    </a>
  )
}

// ─── Typing Effect & Aura & Reveal ───────────────────────────────────────────
function useTypingEffect(text: string, speed = 40, delay = 0) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  useEffect(() => {
    if (!started) return;
    let i = 0;
    const iv = setInterval(() => {
      setDisplayed(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(iv);
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed, started]);
  return displayed;
}

function Aura() {
  return (
    <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
      <div className="aura w-[800px] h-[800px] bg-[#10b981]/10 -top-40 -left-60 float-slow" />
      <div className="aura w-[700px] h-[700px] bg-syntax-cyan/5 top-[20%] -right-80 float-slower" />
      <div className="aura w-[600px] h-[600px] bg-[#10b981]/5 bottom-[-10%] left-[10%] float-slow" />
      <div className="bg-grid absolute inset-0 mix-blend-overlay opacity-30" />
    </div>
  );
}

function Reveal({ children, className, delay = 0, noY = false }: { children: React.ReactNode; className?: string; delay?: number; noY?: boolean }) {
  const [vis, setVis] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setTimeout(() => setVis(true), delay); obs.disconnect(); } }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [delay]);
  return (
    <div ref={ref} className={cn("transition-all duration-700 ease-in", vis ? "opacity-100 translate-y-0" : cn("opacity-0", noY ? "" : "translate-y-8"), className)}>
      {children}
    </div>
  );
}

// ─── Terminal Window ────────────────────────────────────────────────────────
function Terminal({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className="h-full relative group">
      <div className="absolute -inset-[1px] bg-gradient-to-b from-[#10b981]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div
        className={cn("terminal-panel flex flex-col h-full bg-[#000000] z-10 transition-colors hover:border-white/20", className)}
      >
        <div className="scanline" />
        <div className="bg-[#10b981]/5 px-4 py-2 flex items-center justify-between border-b border-[#10b981]/30 relative z-10 w-full font-mono text-xs">
          <div className="flex gap-2 shrink-0">
            <span className="text-[#10b981] opacity-70">root@sys:</span>
          </div>
          <span className="text-[#10b981] font-bold tracking-widest uppercase flex-1 ml-2">~/{title}</span>
          <div className="w-[10px] h-[10px] bg-[#10b981] animate-blink shrink-0" />
        </div>
        <div className="p-6 flex-1 font-mono text-sm leading-relaxed relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Data ───────────────────────────────────────────────────────────────────
// ─── Holographic Tilt Component ──────────────────────────────────────────
function HolographicCard({ children, className }: { children: React.ReactNode, className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [shine, setShine] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Rotate relative to center (-1 to 1 range)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 10; // Degrees
    const rotateY = (centerX - x) / 10; // Degrees
    
    setRotation({ x: rotateX, y: rotateY });
    setShine({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setShine({ x: 50, y: 50 });
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn("relative transition-all duration-200 ease-out perspective-1200", className)}
      style={{ 
        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(1.02)`,
      }}
    >
      <div 
        className="absolute inset-0 z-10 holographic-shine opacity-60 rounded-lg pointer-events-none"
        style={{ '--shine-x': `${shine.x}%`, '--shine-y': `${shine.y}%` } as any}
      />
      {children}
    </div>
  );
}

const projects = [
  {
    id: 1, title: "agent-city", ext: ".tsx", status: "DEPLOYED",
    description: "Multi-agent simulation dashboard to model urban scenarios and governance styles using local LLMs.",
    tags: ["Next.js", "Tailwind", "Multi-Agent"],
    accent: "var(--color-syntax-cyan)", link: "https://kartikdube.github.io/agent-city/", repo: "https://github.com/kartikdube/agent-city",
    isBroken: false,
  },
  {
    id: 2, title: "llm-mind-map", ext: ".ts", status: "DEPLOYED",
    description: "An LLM Semantic Graph Comparator that visualizes semantic relationships and clusters word associations into interactive islands.",
    tags: ["React", "D3.js", "LLMs"],
    accent: "var(--color-syntax-gold)", link: "https://kartikdube.github.io/llm-mind-map/", repo: "https://github.com/kartikdube/llm-mind-map",
    isBroken: false,
  },
  {
    id: 3, title: "multimodal-analyzer", ext: ".ts", status: "OFFLINE",
    description: "CORRUPTED_SYSTEM_DATA: ERR_NODE_UNREACHABLE",
    tags: ["ERR_503"],
    accent: "var(--color-syntax-purple)", link: "#", repo: "#",
    isBroken: true,
  },
  {
    id: 4, title: "rag-knowledge-engine", ext: ".go", status: "OFFLINE",
    description: "DATA_CORRUPTION_DETECTED: OFFLINE_FOR_MAINTENANCE",
    tags: ["ERR_503"],
    accent: "var(--color-syntax-emerald)", link: "#", repo: "#",
    isBroken: true,
  },
];

const skills = [
  { cat: "LLMs & Agents", items: ["OpenAI", "Anthropic", "LangGraph", "DSPy"] },
  { cat: "ML Frameworks", items: ["PyTorch", "HuggingFace", "PEFT", "vLLM"] },
  { cat: "Vector & Data", items: ["Pinecone", "pgvector", "DuckDB"] },
  { cat: "Infra & Cloud", items: ["Kubernetes", "Docker", "AWS", "Terraform"] },
];

const aiIntelData = {
  rules: [
    { id: "r1", name: "common", desc: "Language-agnostic coding standards and safety protocols.", related: ["s4", "w4"] },
    { id: "r2", name: "python", desc: "PEP8, type-hinting, and async concurrency patterns.", related: ["s1", "w3"] },
    { id: "r3", name: "typescript", desc: "Strict typing, interface architecture, and React best practices.", related: ["s2", "w1"] },
    { id: "r4", name: "rust", desc: "Memory safety, ownership models, and zero-cost abstractions.", related: ["s1", "w6"] },
    { id: "r5", name: "golang", desc: "Interface design, goroutine management, and error handling.", related: ["s1", "w2"] },
    { id: "r6", name: "java", desc: "Spring paradigms, JVM optimization, and enterprise patterns.", related: ["s1", "w7"] },
    { id: "r7", name: "cpp", desc: "Manual memory management, STL optimization, and RAII.", related: ["s1", "w5"] },
    { id: "r8", name: "web", desc: "A11y, core web vitals, and modern CSS/HTML standards.", related: ["s2", "w8"] }
  ],
  skills: [
    { id: "s1", name: "backend-patterns", desc: "Scalable API design and distributed system architectures.", related: ["r2", "r5", "w3"] },
    { id: "s2", name: "design-system", desc: "Foundational UI tokens and component library structures.", related: ["r3", "r8", "w1"] },
    { id: "s3", name: "deployment-patterns", desc: "CI/CD automation, Docker orchestration, and cloud ops.", related: ["r1", "w7"] },
    { id: "s4", name: "coding-standards", desc: "Static analysis, linting, and automated code quality.", related: ["r1", "r2", "w4"] },
    { id: "s5", name: "e2e-testing", desc: "Comprehensive user-flow simulation and regression safety.", related: ["r8", "w7"] },
    { id: "s6", name: "github-ops", desc: "Repository management, PR automation, and branch security.", related: ["r1", "w2"] }
  ],
  workflows: [
    { id: "w1", name: "architect", desc: "High-level system design and technical decision-making.", related: ["s2", "r3"] },
    { id: "w2", name: "chief-of-staff", desc: "Project orchestration, task prioritization, and review.", related: ["s6", "r1"] },
    { id: "w3", name: "planner", desc: "Strategic feature roadmap and implementation breakdowns.", related: ["s1", "r2"] },
    { id: "w4", name: "code-reviewer", desc: "Automated logic verification and performance audit.", related: ["s4", "r1"] },
    { id: "w5", name: "performance-optimizer", desc: "Latency reduction and resource usage analysis.", related: ["r7"] },
    { id: "w6", name: "security-reviewer", desc: "Vulnerability detection and cryptographic safety check.", related: ["r4"] },
    { id: "w7", name: "e2e-runner", desc: "Automated test suite execution and report generation.", related: ["s5", "s3"] },
    { id: "w8", name: "refactor-cleaner", desc: "Codebase simplification and legacy debt reduction.", related: ["r3", "r8"] },
    { id: "w9", name: "silent-failure-hunter", desc: "Error tracking and edge-case detection in log sets.", related: ["s4", "r1"] }
  ]
};

const philosophyItems = [
  { quote: "Ship early. Measure everything. Iterate relentlessly fast.", title: "INIT_VELOCITY" },
  { quote: "The best model is the one that solves the user's problem. Not the biggest one.", title: "EXEC_PRAGMATISM" },
  { quote: "Eval sets are not an afterthought. They are the entire operating system.", title: "SYS_EVALUATION" },
];

// ─── 3D Background Objects ──────────────────────────────────────────────────
function WireframeShape({ position, scale, type, floatSpeed = 1.5 }: { position: [number, number, number], scale: number, type: 'icosahedron' | 'box' | 'octahedron', floatSpeed?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.02 * (1 + (window.scrollY * 0.005));
      meshRef.current.rotation.y += delta * 0.03 * (1 + (window.scrollY * 0.005));
    }
  });

  return (
    <Float speed={floatSpeed} rotationIntensity={1.5} floatIntensity={2} position={position}>
      <mesh ref={meshRef} scale={scale}>
        {type === 'icosahedron' && <icosahedronGeometry args={[1, 0]} />}
        {type === 'box' && <boxGeometry args={[1, 1, 1]} />}
        {type === 'octahedron' && <octahedronGeometry args={[1, 0]} />}
        <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.25} />
      </mesh>
    </Float>
  );
}

function NeuralLattice() {
  const meshRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    if (meshRef.current) {
      meshRef.current.rotation.y = time * 0.1;
      meshRef.current.rotation.z = time * 0.05;
      // Pulse scale
      const s = 1 + Math.sin(time * 2) * 0.03;
      meshRef.current.scale.set(s, s, s);
    }
    
    if (pointsRef.current) {
      pointsRef.current.rotation.y = time * 0.1;
      pointsRef.current.rotation.z = time * 0.05;
    }
    
    if (coreRef.current) {
      coreRef.current.rotation.x = -time * 0.5;
      coreRef.current.rotation.y = -time * 0.3;
      // Core flicker/pulse
      const op = 0.5 + Math.sin(time * 10) * 0.2;
      (coreRef.current.material as THREE.MeshBasicMaterial).opacity = op;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group scale={1.8}>
        {/* The Connection Lattice (Synapses) */}
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.15} />
        </mesh>
        
        {/* The Active Nodes (Neural Points) */}
        <points ref={pointsRef}>
          <icosahedronGeometry args={[1, 1]} />
          <pointsMaterial color="#10b981" size={0.04} sizeAttenuation={true} transparent opacity={0.8} />
        </points>

        {/* The Central Intelligence Core */}
        <mesh ref={coreRef} scale={0.2}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.6} />
        </mesh>
        
        {/* Inner Glow Core */}
        <mesh scale={0.15}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.4} />
        </mesh>
      </group>
    </Float>
  );
}

function ScrollRig({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (groupRef.current) {
        // Clamp the scroll value so objects don't pass the camera (at Z=10)
        // We'll limit it from -2 (far) to 5 (middle-ground) for safety
        const scrollVal = window.scrollY * 0.003;
        const clampedZ = Math.min(scrollVal, 5); 
        
        // Damping/Interpolation for smoother motion
        groupRef.current.position.z += (clampedZ - groupRef.current.position.z) * 0.1;
        
        // Subtle tilt based on scroll
        groupRef.current.rotation.y += (window.scrollY * 0.00005 - groupRef.current.rotation.y) * 0.1;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

function ThreeBackground() {
  return (
    <div className="fixed inset-0 z-[-15] pointer-events-none">
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <ScrollRig>
          {/* Refined positions: closer than edges, but clearing the center hero */}
          <WireframeShape position={[-5, 4, 0]} scale={1.2} type="icosahedron" floatSpeed={1} />
          <WireframeShape position={[6, -4, -2]} scale={1.2} type="box" floatSpeed={1.5} />
          <WireframeShape position={[7, 5, -3]} scale={1.8} type="octahedron" floatSpeed={1.2} />
          <WireframeShape position={[-7, -3, -2]} scale={2.2} type="icosahedron" floatSpeed={0.8} />
          <WireframeShape position={[0, -6, -6]} scale={2.5} type="box" floatSpeed={1} />
        </ScrollRig>
      </Canvas>
    </div>
  );
}

// ─── App ────────────────────────────────────────────────────────────────────
const BOOT_LINES = [
  "[ OK ] INITIALIZING_ANTIGRAVITY_KERNEL_v1.0.4",
  "[ OK ] MOUNTING_FS_BLOCK_DATA...",
  "[ OK ] INITIALIZING_INTEL_SUBSYSTEM...",
  "[ OK ] LOADING_LLM_DRIVER: GEMINI_3_FLASH",
  "[ OK ] SYNCHRONIZING_KNOWLEDGE_NETWORKS...",
  "[ OK ] ESTABLISHING_NEURO_LINK_SECURE...",
  "[ OK ] SYSTEM_INTEGRITY: 100%",
  "RUNNING_INITIALIZE_SYSTEMS.sh"
];

function BootScreen({ onComplete }: { onComplete: () => void }) {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    let currentIndex = 0;
    const iv = setInterval(() => {
      if (currentIndex < BOOT_LINES.length) {
        const nextLine = BOOT_LINES[currentIndex];
        if (nextLine) {
          setLines(prev => [...prev, nextLine]);
        }
        currentIndex++;
      } else {
        clearInterval(iv);
        setTimeout(onComplete, 400); // Tighter final delay for 1.5s target
      }
    }, 90);
    return () => clearInterval(iv);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[201] bg-[#050505] flex flex-col items-center justify-center font-mono p-4 cursor-none pointer-events-auto">
      <div className="w-full max-w-lg space-y-2">
        {lines.map((L, i) => {
          if (!L) return null;
          return (
            <div key={i} className="text-[#10b981] text-xs md:text-sm animate-boot-text">
              {L.startsWith("[ OK ]") ? (
                <span className="flex items-center gap-3">
                  <span className="text-[#10b981] font-bold">{L.slice(0, 6)}</span>
                  <span className="text-white opacity-80">{L.slice(6)}</span>
                </span>
              ) : (
                <span className="text-syntax-gold flex items-center gap-2">
                  <span className="animate-blink cursor-none">{">"}</span> {L}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IntelTooltip({ content, visible, x, y }: { content: string, visible: boolean, x: number, y: number }) {
  if (!visible) return null;
  return (
    <div 
      className="fixed z-[150] pointer-events-none transition-opacity duration-150 ease-out animate-fade-in-quick"
      style={{ left: x + 10, top: y + 10 }}
    >
      <div className="terminal-panel p-2 bg-[#000000]/95 border-[#10b981]/50 shadow-[0_0_20px_rgba(16,185,129,0.2)] max-w-[240px]">
        <div className="uppercase text-[8px] tracking-[0.2em] text-[#10b981]/40 mb-1 border-b border-[#10b981]/20 pb-0.5">Manifest_Entry</div>
        <div className="text-[10px] text-white font-mono leading-relaxed opacity-90">{content}</div>
      </div>
    </div>
  );
}

function StatusBar() {
  const [metrics, setMetrics] = useState({ latency: 12, mem: 4.2, load: 14 });
  
  useEffect(() => {
    const iv = setInterval(() => {
      setMetrics({
        latency: Math.floor(8 + Math.random() * 10),
        mem: (4.2 + Math.random() * 0.5).toFixed(1) as any,
        load: Math.floor(10 + Math.random() * 15)
      });
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="fixed bottom-0 w-full z-[100] bg-[#000000]/90 backdrop-blur-md border-t border-[#10b981]/30 py-1.5 px-6 font-mono overflow-hidden whitespace-nowrap select-none">
      <div className="flex items-center gap-10 text-[9px] sm:text-[10px] tracking-widest text-[#10b981]/80">
        <div className="flex items-center gap-2 animate-pulse">
           <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
           <span className="font-bold">SYSTEM_LIVE</span>
        </div>
        
        <div className="flex gap-6 uppercase">
          <span>LATENCY: <span className="text-white font-bold">{metrics.latency}ms</span></span>
          <span>MEM: <span className="text-white font-bold">{metrics.mem}GB</span></span>
          <span>LOAD: <span className="text-white font-bold">{metrics.load}%</span></span>
        </div>

        <div className="flex-1 overflow-hidden relative h-4">
           <div className="absolute flex gap-10 animate-ticker">
              {["AUTHENTICATING_USER...", "FETCHING_LATENT_VECTORS...", "RUNNING_SYS_INTEGRITY_CHECK...", "OPTIMIZING_WORKSPACE...", "MODEL_CONFIDENCE: 98.4%", "ACTIVE_NEUROLINK: ESTABLISHED"].map((msg, i) => (
                <span key={i} className="opacity-40">{msg}</span>
              ))}
              {/* Duplicate for seamless infinite loop */}
              {["AUTHENTICATING_USER...", "FETCHING_LATENT_VECTORS...", "RUNNING_SYS_INTEGRITY_CHECK...", "OPTIMIZING_WORKSPACE...", "MODEL_CONFIDENCE: 98.4%", "ACTIVE_NEUROLINK: ESTABLISHED"].map((msg, i) => (
                <span key={i + 'up'} className="opacity-40">{msg}</span>
              ))}
           </div>
        </div>

        <div className="opacity-60 hidden md:block">
           v1.0.4-LORE_HANDSHAKE
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [tooltip, setTooltip] = useState({ visible: false, content: "", x: 0, y: 0 });
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [hoveredIntelId, setHoveredIntelId] = useState<string | null>(null);
  const [linkedIntelIds, setLinkedIntelIds] = useState<string[]>([]);


  const handleBootComplete = useCallback(() => setBooting(false), []);

  const line1 = useTypingEffect("kartik@portfolio:~$ ./initialize_systems", 40, booting ? 999999 : 200);
  const line2 = useTypingEffect("> SYSTEM OP: Curiosity-driven AI Engineering & Experiments.", 30, booting ? 999999 : 1800);
  const line3 = useTypingEffect("> STATUS: Online. Awaiting input...", 30, booting ? 999999 : 3500);

  const handlePing = (e: React.MouseEvent) => {
    e.preventDefault();
    setPingStatus("HANDSHAKE_ESTABLISHED: 127.0.0.1");
    setTimeout(() => setPingStatus(null), 3000);
  };

  const showTooltip = (item: any, e: React.MouseEvent) => {
    setTooltip({ visible: true, content: item.desc, x: e.clientX, y: e.clientY });
    setHoveredIntelId(item.id);
    setLinkedIntelIds(item.related || []);
  };
  const hideTooltip = () => {
    setTooltip({ ...tooltip, visible: false });
    setHoveredIntelId(null);
    setLinkedIntelIds([]);
  };

  const statusColor: Record<string, string> = {
    ONLINE: "text-[#10b981]",
    DEPLOYED: "text-syntax-cyan",
    TESTING: "text-syntax-gold",
    RESEARCH: "text-syntax-purple",
  };

  return (
    <div className="relative min-h-screen">
      {booting && <BootScreen onComplete={handleBootComplete} />}
      {!booting && <StatusBar />}
      {!booting && <CustomCursor />}
      <ParticleCanvas />
      {!booting && <ThreeBackground />}
      {!booting && <IntelTooltip {...tooltip} />}
      {!booting && <Aura />}

      {pingStatus && (
        <div className="fixed top-20 right-6 z-[100] animate-slide-up">
           <div className="terminal-panel px-4 py-2 border-syntax-cyan/50 text-syntax-cyan text-[10px] font-bold tracking-widest bg-[#000000]/90">
             {pingStatus}
           </div>
        </div>
      )}

      {/* ── Nav ── */}
      <nav className="fixed w-full top-0 z-50 bg-[#000000]/80 backdrop-blur-md border-b border-[#10b981]/20">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center font-mono text-xs">
          <div className="flex items-center gap-1.5 text-sm group cursor-pointer">
            <span className="text-[#10b981] font-bold">kartik</span>
            <span className="text-slate-500">@</span>
            <span className="text-[#10b981]">portfolio</span>
            <span className="text-slate-500">:~#</span>
            <span className="w-2 h-4 bg-[#10b981] inline-block ml-1 animate-blink" />
          </div>
          <div className="hidden md:flex gap-8 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
            {[["#about", "01. about"], ["#projects", "02. work"], ["#skills", "03. env"], ["#contact", "04. ping"]].map(([href, label]) => (
              <a key={href} href={href} className="hover:text-[#10b981] transition-colors pb-1 border-b border-transparent hover:border-[#10b981]/50">{'['} {label} {']'}</a>
            ))}
          </div>
          <a href="https://github.com/kartikdube" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1 bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981] hover:text-black transition-colors text-xs font-bold border border-[#10b981]/30">
            <span>[ GIT ]</span>
          </a>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-40">

        {/* ── Hero ── */}
        <section id="about" className="relative pt-32 pb-40 grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative z-10 w-full">
            <div className="font-mono text-[#10b981] text-sm mb-6 min-h-[20px] font-bold">{line1}<span className="animate-blink block mt-1 w-2 h-4 bg-[#10b981] invisible"></span></div>

            <Reveal delay={1000} noY>
              <h1 className="font-bold mb-6 mt-10">
                <div className="text-5xl md:text-7xl font-bold text-white leading-tight tracking-tight text-glow">
                  Engineering <br />
                  <span className="text-[#10b981]">Intelligent</span> <br />
                  Systems<span className="text-slate-400">_</span>
                </div>
              </h1>
            </Reveal>

            <Reveal delay={2000} noY className="flex flex-col gap-4 mb-12 mt-6">
              <div className="font-mono text-white text-sm leading-relaxed min-h-[3em] md:min-h-[1.5em]">{line2 || '\u00A0'}</div>
              <div className="font-mono text-white text-sm leading-relaxed">{line3 || '\u00A0'}</div>
            </Reveal>

            <Reveal delay={4000}>
              <div className="flex flex-wrap gap-4 items-center">
                <MagneticButton href="#projects" primary>
                  EXECUTE BINARY
                </MagneticButton>
                <MagneticButton href="#contact" onMouseEnter={(e) => {
                   if (e.currentTarget.innerText.includes("PING")) handlePing(e as any);
                }}>
                  PING HOST
                </MagneticButton>
              </div>
            </Reveal>
          </div>

          <Reveal delay={2000} className="hidden lg:flex w-full h-[500px] items-center justify-center relative">
            <div className="absolute inset-0 bg-[#10b981]/5 rounded-full blur-[100px] animate-pulse" />
            <div className="w-full h-full relative z-10 pointer-events-none">
              <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
                <NeuralLattice />
              </Canvas>
            </div>
          </Reveal>
        </section>

        {/* ── Philosophy (Values) ── */}
        <section className="py-20 border-t border-[#10b981]/20">
          <Reveal>
            <div className="mb-12">
              <span className="font-mono text-[#10b981] text-sm font-bold bg-[#10b981]/10 px-3 py-1 border border-[#10b981]/30">/etc/system/directives.conf</span>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {philosophyItems.map((p, i) => (
              <Reveal key={i} delay={i * 150}>
                <div className="terminal-panel p-6 h-full border border-slate-800 transition-colors relative group">
                  <div className="text-[#10b981] font-bold text-sm mb-4 font-mono group-hover:text-white transition-colors">{"\u003E"} {p.title}</div>
                  <p className="font-mono text-xs text-slate-400 leading-relaxed group-hover:text-[#10b981]/80 transition-colors">{p.quote}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Projects ── */}
        <section id="projects" className="py-24">
          <Reveal>
            <div className="flex items-center gap-4 mb-16">
              <span className="font-mono text-[#10b981] text-lg font-bold">ls -l /projects</span>
            </div>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-8">
            {projects.map((p, i) => (
              <Reveal key={p.id} delay={i * 100} className="h-full">
                <HolographicCard className={p.isBroken ? "broken-screen" : ""}>
                  <Terminal title={`${p.title}${p.ext}`} className={p.isBroken ? "broken-content" : undefined}>
                    <div className="space-y-6 h-full flex flex-col">
                      <div className="flex items-center justify-between pb-4 border-b border-[#10b981]/20">
                        <span className={cn("text-[10px] font-bold font-mono tracking-widest", statusColor[p.status] || "text-red-500")}>
                          [{p.status}]
                        </span>
                        {p.isBroken ? (
                          <span className="text-slate-600 bg-slate-900 px-3 py-1 border border-red-900/50 text-xs font-bold cursor-not-allowed opacity-50 relative z-30">
                            ERR_404
                          </span>
                        ) : (
                          <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#10b981] bg-slate-900 px-3 py-1 border border-slate-800 hover:border-[#10b981] transition-all text-xs font-bold relative z-30">
                            EXEC
                          </a>
                        )}
                      </div>

                      {p.isBroken ? (
                        <div className="inline-block mt-2 relative z-30 pointer-events-none">
                          <h3 className="text-slate-600 outline-none text-lg font-bold font-mono tracking-tight w-max line-through decoration-red-900">
                            ./{p.title}
                          </h3>
                        </div>
                      ) : (
                        <a href={p.link} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 relative z-30">
                          <h3 className="text-white text-lg font-bold font-mono tracking-tight group-hover:text-[#10b981] hover:underline transition-colors w-max">
                            ./{p.title}
                          </h3>
                        </a>
                      )}

                      <p className="text-slate-400 font-mono text-sm leading-relaxed flex-1">
                        {p.description}
                      </p>

                      <div className="flex flex-wrap gap-2 pt-4 mt-auto">
                        {p.tags.map(t => (
                          <span key={t} className="text-[10px] px-2 py-1 border border-slate-800 text-slate-500 bg-[#050505] font-mono group-hover:border-[#10b981]/50 group-hover:text-[#10b981]/80 transition-colors">
                            <span className="text-slate-700">arg:</span>{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Terminal>
                </HolographicCard>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── AI Intel Subsystems ── */}
        <section id="ai-intel" className="py-24 border-t border-[#10b981]/20">
          <Reveal>
            <div className="flex items-center gap-4 mb-16">
              <span className="font-mono text-[#10b981] text-lg font-bold">ls -la /ai_intel/</span>
            </div>
          </Reveal>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Rules */}
            <Reveal delay={100} className="h-full">
               <Terminal title="tree ./rules" className="h-full lg:min-h-[400px]">
                 <div className="flex flex-wrap gap-2 mt-2">
                   {aiIntelData.rules.map(r => (
                     <div 
                        key={r.id} 
                        className={cn(
                           "text-[#10b981]/80 px-2 flex items-center gap-2 border border-[#10b981]/30 bg-[#10b981]/10 text-[10px] sm:text-xs py-1.5 uppercase font-bold tracking-widest hover:bg-[#10b981]/20 transition-all cursor-crosshair",
                           hoveredIntelId === r.id && "bg-[#10b981]/40 border-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.3)] text-white scale-105 z-10",
                           linkedIntelIds.includes(r.id) && "bg-[#10b981]/20 border-[#10b981]/60 shadow-[0_0_10px_rgba(16,185,129,0.2)] text-[#10b981]"
                        )}
                        onMouseEnter={(e) => showTooltip(r, e)}
                        onMouseLeave={hideTooltip}
                     >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
                        {r.name}.conf
                     </div>
                   ))}
                 </div>
               </Terminal>
            </Reveal>

            {/* Skills */}
            <Reveal delay={200} className="h-full">
               <Terminal title="tree ./skills" className="h-full lg:min-h-[400px]">
                 <div className="flex flex-col gap-2 mt-2">
                   {aiIntelData.skills.map(s => (
                     <div 
                        key={s.id} 
                        className={cn(
                           "text-syntax-cyan flex justify-between items-center bg-[#050505] border border-syntax-cyan/30 px-3 py-2 text-[10px] sm:text-xs hover:border-syntax-cyan transition-all cursor-crosshair",
                           hoveredIntelId === s.id && "bg-syntax-cyan/20 border-syntax-cyan shadow-[0_0_15px_rgba(103,232,249,0.3)] text-white scale-105 z-10",
                           linkedIntelIds.includes(s.id) && "bg-syntax-cyan/10 border-syntax-cyan/50 shadow-[0_0_10px_rgba(103,232,249,0.1)]"
                        )}
                        onMouseEnter={(e) => showTooltip(s, e)}
                        onMouseLeave={hideTooltip}
                     >
                        <span className="font-bold tracking-wide">{s.name}</span>
                        <span className="text-[10px] opacity-70 bg-syntax-cyan/20 px-1.5 py-0.5">LOADED</span>
                     </div>
                   ))}
                 </div>
               </Terminal>
            </Reveal>

            {/* Workflows */}
            <Reveal delay={300} className="h-full">
               <Terminal title="ls -1 ./workflows" className="h-full lg:min-h-[400px]">
                 <div className="flex flex-col gap-1.5 mt-2">
                   {aiIntelData.workflows.map(w => (
                     <div 
                        key={w.id} 
                        className={cn(
                           "text-syntax-purple/90 text-[10px] sm:text-xs font-mono font-bold flex items-center gap-3 hover:text-white transition-all cursor-crosshair tracking-wider",
                           hoveredIntelId === w.id && "bg-syntax-purple/20 text-white scale-y-110 pl-2 border-l-2 border-syntax-purple",
                           linkedIntelIds.includes(w.id) && "text-syntax-purple brightness-150 pl-1"
                        )}
                        onMouseEnter={(e) => showTooltip(w, e)}
                        onMouseLeave={hideTooltip}
                     >
                        <span className="text-syntax-purple/50 shrink-0">{`>`}</span>
                        <span className="truncate">{w.name}.md</span>
                     </div>
                   ))}
                   <div className="text-slate-500 text-[10px] sm:text-xs mt-4 pt-4 border-t border-syntax-purple/20 italic">...and 38 more specialized agents available in registry.</div>
                 </div>
               </Terminal>
            </Reveal>
          </div>
        </section>

        {/* ── Skills & Environment ── */}
        <section id="skills" className="py-24 border-t border-[#10b981]/20">
          <Reveal>
            <div className="flex items-center gap-4 mb-12">
              <span className="font-mono text-[#10b981] text-lg font-bold">cat config.env</span>

            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {skills.map((sg, i) => (
              <Reveal key={sg.cat} delay={i * 100}>
                <div className="terminal-panel p-6 hover:border-[#10b981] transition-colors h-full border border-slate-800">
                  <div className="font-mono text-[10px] text-slate-500 mb-4 uppercase tracking-[0.2em] font-bold border-b border-slate-800 pb-2">
                    {sg.cat}
                  </div>
                  <div className="flex flex-col gap-2 font-mono text-sm">
                    {sg.items.map(it => (
                      <div key={it} className="text-slate-400 group/item flex gap-2">
                        <span className="text-[#10b981]/50">+</span>
                        <span className="group-hover/item:text-white transition-colors">{it}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── System Monitor ── */}
        <section className="py-20">
          <Reveal>
            <Terminal title="top - 14:32:00 up 4 days" className="shadow-none border-[#10b981]/50">
              <div className="py-2 space-y-3">
                <div className="flex bg-[#10b981]/10 text-[#10b981] items-center gap-3 text-xs mb-4 pb-2 pt-2 px-2 border-b border-slate-800">
                  <div className="w-1/4">PID USER</div>
                  <div className="w-1/4">NI S  %CPU</div>
                  <div className="w-1/4">%MEM</div>
                  <div className="w-1/4">COMMAND</div>
                </div>
                {[
                  { pid: "root", status: "S", cpu: "1.2", mem: "128M", name: "core_plan" },
                  { pid: "kartik", status: "S", cpu: "0.0", mem: "64M", name: "v_db_sync" },
                  { pid: "root", status: "R", cpu: "4.5", mem: "512M", name: "llm_router" },
                  { pid: "root", status: "Z", cpu: "8.9", mem: "1.2G", name: "auto_agent", highlight: true },
                ].map((proc, idx) => (
                  <div key={idx} className={cn("flex px-2 items-center gap-3 text-xs font-mono", proc.highlight ? "text-syntax-gold animate-blink" : "text-slate-400 group-hover:text-slate-300")}>
                    <div className="w-1/4">{3100 + idx} {proc.pid}</div>
                    <div className="w-1/4"> 0 {proc.status}   {proc.cpu}</div>
                    <div className="w-1/4">{proc.mem}</div>
                    <div className="w-1/4">{proc.name}</div>
                  </div>
                ))}
              </div>
            </Terminal>
          </Reveal>
        </section>

        {/* ── Contact ── */}
        <section id="contact" className="pt-32 pb-20 border-t border-[#10b981]/20">
          <div className="text-center">
            <Reveal>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6 font-mono text-[#10b981]">
                [ END OF FILE ]
              </h2>
              <p className="text-slate-400 mb-12 max-w-lg mx-auto font-mono text-sm leading-relaxed">
                Socket listening on port 443. Awaiting direct connection.
              </p>

              <div className="flex justify-center">
                <MagneticButton href="mailto:hello@kartikdube.com" primary>
                  ESTABLISH TCP HANDSHAKE
                </MagneticButton>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[#10b981]/20 bg-[#000000]">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center font-mono text-[10px] text-slate-500 uppercase tracking-widest font-bold">
          <div>EOF - KARTIK_DUBE.sys</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#10b981] transition-colors">[ GH ]</a>
            <a href="#" className="hover:text-[#10b981] transition-colors">[ IN ]</a>
            <a href="#" className="hover:text-[#10b981] transition-colors">[ X ]</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
