import React, { useEffect, useState, useRef } from "react";
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
function MagneticButton({ children, href, className, primary }: { children: React.ReactNode, href?: string, className?: string, primary?: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.2;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.2;
    setPos({ x, y });
  };

  const handleMouseLeave = () => setPos({ x: 0, y: 0 });

  return (
    <a
      ref={ref}
      href={href}
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
const projects = [
  {
    id: 1, title: "autonomous-task-agent", ext: ".py", status: "ONLINE",
    description: "Multi-step reasoning agent with dynamic tool-calling. Orchestrates Search, Calculator, and Code-Executor tools.",
    tags: ["LangGraph", "OpenAI", "FastAPI"],
    accent: "var(--color-syntax-cyan)", link: "#", repo: "#",
  },
  {
    id: 2, title: "multimodal-analyzer", ext: ".ts", status: "DEPLOYED",
    description: "Production ML pipeline for image and audio analysis using Whisper and CLIP on a K8s cluster.",
    tags: ["PyTorch", "HuggingFace", "K8s"],
    accent: "var(--color-syntax-purple)", link: "#", repo: "#",
  },
  {
    id: 3, title: "rag-knowledge-engine", ext: ".go", status: "TESTING",
    description: "Enterprise knowledge retrieval engine using hybrid search (BM25 + vector embeddings).",
    tags: ["Pinecone", "Golang", "Cohere"],
    accent: "var(--color-syntax-emerald)", link: "#", repo: "#",
  },
  {
    id: 4, title: "fine-tune-pipeline", ext: ".py", status: "RESEARCH",
    description: "Automated fine-tuning framework for domain adaptation. Supports LoRA/QLoRA on consumer GPUs.",
    tags: ["PEFT", "LoRA", "W&B"],
    accent: "var(--color-syntax-gold)", link: "#", repo: "#",
  },
];

const skills = [
  { cat: "LLMs & Agents", items: ["OpenAI", "Anthropic", "LangGraph", "DSPy"] },
  { cat: "ML Frameworks", items: ["PyTorch", "HuggingFace", "PEFT", "vLLM"] },
  { cat: "Vector & Data", items: ["Pinecone", "pgvector", "DuckDB"] },
  { cat: "Infra & Cloud", items: ["Kubernetes", "Docker", "AWS", "Terraform"] },
];

const aiIntelData = {
  rules: ["common", "python", "typescript", "rust", "golang", "java", "cpp", "web"],
  skills: ["backend-patterns", "design-system", "deployment-patterns", "coding-standards", "e2e-testing", "github-ops"],
  workflows: ["architect", "chief-of-staff", "planner", "code-reviewer", "performance-optimizer", "security-reviewer", "e2e-runner", "refactor-cleaner", "silent-failure-hunter"]
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
      meshRef.current.rotation.x += delta * 0.02;
      meshRef.current.rotation.y += delta * 0.03;
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

function HeroGraphic() {
  const outerRef = useRef<THREE.Mesh>(null);
  const midRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((_state, delta) => {
    if (outerRef.current) outerRef.current.rotation.x += delta * 0.3;
    if (midRef.current) midRef.current.rotation.y += delta * 0.5;
    if (innerRef.current) innerRef.current.rotation.z += delta * 0.7;
    if (coreRef.current) {
      coreRef.current.rotation.x -= delta * 0.2;
      coreRef.current.rotation.y -= delta * 0.2;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={1} floatIntensity={1}>
      <group scale={1.2}>
        <mesh ref={outerRef}>
          <torusGeometry args={[2.2, 0.015, 16, 100]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.3} />
        </mesh>
        <mesh ref={midRef}>
          <torusGeometry args={[1.6, 0.025, 16, 100]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.5} />
        </mesh>
        <mesh ref={innerRef}>
          <torusGeometry args={[1.0, 0.04, 16, 100]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.8} />
        </mesh>
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[0.4, 0]} />
          <meshBasicMaterial color="#10b981" wireframe={true} transparent opacity={0.9} />
        </mesh>
      </group>
    </Float>
  );
}

function ThreeBackground() {
  return (
    <div className="fixed inset-0 z-[-15] pointer-events-none">
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <WireframeShape position={[-6, 3, -2]} scale={1.5} type="icosahedron" floatSpeed={1} />
        <WireframeShape position={[6, -4, -4]} scale={1.5} type="box" floatSpeed={1.5} />
        <WireframeShape position={[7, 4, -5]} scale={2} type="octahedron" floatSpeed={1.2} />
        <WireframeShape position={[-7, -3, -4]} scale={2.5} type="icosahedron" floatSpeed={0.8} />
        <WireframeShape position={[0, -6, -8]} scale={3} type="box" floatSpeed={1} />
      </Canvas>
    </div>
  );
}

// ─── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const line1 = useTypingEffect("kartik@portfolio:~$ ./initialize_systems", 40, 200);
  const line2 = useTypingEffect("> SYSTEM OP: Curiosity-driven AI Engineering & Experiments.", 30, 1800);
  const line3 = useTypingEffect("> STATUS: Online. Awaiting input...", 30, 3500);

  const statusColor: Record<string, string> = {
    ONLINE: "text-[#10b981]",
    DEPLOYED: "text-syntax-cyan",
    TESTING: "text-syntax-gold",
    RESEARCH: "text-syntax-purple",
  };

  return (
    <div className="relative min-h-screen">
      <CustomCursor />
      <ParticleCanvas />
      <ThreeBackground />
      <Aura />

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
            <div className="font-mono text-[#10b981] text-sm mb-6 h-5 font-bold">{line1}<span className="animate-blink block mt-1 w-2 h-4 bg-[#10b981] invisible"></span></div>

            <Reveal delay={1000} noY>
              <h1 className="font-bold mb-6 mt-10">
                <div className="text-5xl md:text-7xl font-bold text-white leading-tight tracking-tight text-glow">
                  Engineering <br />
                  <span className="text-[#10b981]">Intelligent</span> <br />
                  Systems<span className="text-slate-400">_</span>
                </div>
              </h1>
            </Reveal>

            <Reveal delay={2000} noY>
              <div className="font-mono text-white text-sm mb-2 h-5 mt-2">{line2}</div>
              <div className="font-mono text-white text-sm mb-12 h-5 mt-2">{line3}</div>
            </Reveal>

            <Reveal delay={4000}>
              <div className="flex flex-wrap gap-4 items-center">
                <MagneticButton href="#projects" primary>
                  EXECUTE BINARY
                </MagneticButton>
                <MagneticButton href="#contact">
                  PING HOST
                </MagneticButton>
              </div>
            </Reveal>
          </div>

          <Reveal delay={2000} className="hidden lg:flex w-full h-[500px] items-center justify-center relative">
            <div className="absolute inset-0 bg-[#10b981]/5 rounded-full blur-[100px] animate-pulse" />
            <div className="w-full h-full relative z-10 pointer-events-none">
              <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
                <HeroGraphic />
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
                <div className="terminal-panel p-6 h-full border border-slate-800 hover:border-[#10b981] transition-colors relative group">
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
                <Terminal title={`${p.title}${p.ext}`}>
                  <div className="space-y-6 h-full flex flex-col">
                    <div className="flex items-center justify-between pb-4 border-b border-[#10b981]/20">
                      <span className={cn("text-[10px] font-bold font-mono tracking-widest", statusColor[p.status])}>
                        [{p.status}]
                      </span>
                      <a href={p.link} className="text-slate-400 hover:text-[#10b981] bg-slate-900 px-3 py-1 border border-slate-800 hover:border-[#10b981] transition-all text-xs font-bold">
                        EXEC
                      </a>
                    </div>

                    <h3 className="text-white text-lg font-bold font-mono tracking-tight group-hover:text-[#10b981] transition-colors mt-2">
                      ./{p.title}
                    </h3>

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
                     <div key={r} className="text-[#10b981]/80 px-2 flex items-center gap-2 border border-[#10b981]/30 bg-[#10b981]/10 text-[10px] sm:text-xs py-1.5 uppercase font-bold tracking-widest hover:bg-[#10b981]/20 transition-colors cursor-crosshair">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
                        {r}.conf
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
                     <div key={s} className="text-syntax-cyan flex justify-between items-center bg-[#050505] border border-syntax-cyan/30 px-3 py-2 text-[10px] sm:text-xs hover:border-syntax-cyan transition-colors cursor-crosshair">
                        <span className="font-bold tracking-wide">{s}</span>
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
                     <div key={w} className="text-syntax-purple/90 text-[10px] sm:text-xs font-mono font-bold flex items-center gap-3 hover:text-white transition-colors cursor-crosshair tracking-wider">
                        <span className="text-syntax-purple/50 shrink-0">{`>`}</span>
                        <span className="truncate">{w}.md</span>
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
