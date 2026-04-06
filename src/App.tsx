

const projects = [
  {
    id: 1,
    title: 'Context-Aware RAG Support Bot',
    description: 'An AI support agent that utilizes a vector database (Pinecone) and LLM to answer technical queries with sources. Demonstrates safe prompt engineering and chunking strategies.',
    tags: ['Next.js', 'LangChain', 'Pinecone', 'Vercel AI SDK'],
    link: '#',
    repo: '#'
  },
  {
    id: 2,
    title: 'Autonomous Task Agent',
    description: 'A multi-step reasoning agent workflow capable of tool use. Built to automate research and data summarization tasks.',
    tags: ['Python', 'FastAPI', 'LangGraph', 'OpenAI'],
    link: '#',
    repo: '#'
  },
  {
    id: 3,
    title: 'Multimodal Data Analyzer',
    description: 'A deployed ML application that analyzes images and audio files using specialized models (Whisper, CLIP) beyond standard text completions.',
    tags: ['PyTorch', 'HuggingFace', 'Streamlit'],
    link: '#',
    repo: '#'
  }
];

const skills = [
  { category: 'Languages', items: ['Python', 'TypeScript', 'SQL', 'Go'] },
  { category: 'AI/ML & Frameworks', items: ['PyTorch', 'LangChain', 'LlamaIndex', 'Hugging Face', 'TensorFlow'] },
  { category: 'Data & Infra', items: ['Pinecone/Weaviate', 'PostgreSQL', 'Docker', 'AWS', 'Vercel'] },
  { category: 'Frontend/Fullstack', items: ['React', 'Next.js', 'TailwindCSS', 'Node.js'] }
];

function App() {
  return (
    <div className="min-h-screen font-sans selection:bg-brand selection:text-white pb-20">
      
      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-xl font-bold tracking-tighter text-white">
            AE<span className="text-brand">.</span>
          </div>
          <div className="flex gap-6 text-sm font-medium text-slate-300">
            <a href="#projects" className="hover:text-white transition-colors">Projects</a>
            <a href="#skills" className="hover:text-white transition-colors">Skills</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-32">
        {/* Hero Section */}
        <section className="py-20 md:py-32">
          <div className="inline-block px-3 py-1 mb-6 rounded-full bg-brand/10 text-brand text-sm font-medium border border-brand/20">
            Weekend Tinkerer 👋
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
            Building cool <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-cyan-400">
              AI experiments
            </span>.
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl leading-relaxed mb-10">
            Welcome to my digital sandbox. I spend my free time exploring new LLMs, wiring up custom RAG systems, and building weird but useful autonomous agents purely out of curiosity.
          </p>
          <div className="flex gap-4">
            <a href="#projects" className="px-6 py-3 rounded-lg bg-white text-slate-900 font-semibold hover:bg-slate-200 transition-colors">
              View My Work
            </a>
            <a href="https://github.com/" target="_blank" rel="noreferrer" className="px-6 py-3 rounded-lg bg-slate-800 text-white font-semibold border border-slate-700 hover:bg-slate-700 transition-colors">
              GitHub Profile
            </a>
          </div>
        </section>

        {/* Projects Section */}
        <section id="projects" className="py-20">
          <h2 className="text-3xl font-bold text-white mb-12 flex items-center">
            <span className="w-8 h-[2px] bg-brand mr-4"></span>
            Featured Engineering Work
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="group relative rounded-2xl bg-slate-800/50 border border-slate-700 p-6 hover:border-brand/50 transition-colors flex flex-col h-full">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand transition-colors">{project.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{project.description}</p>
                </div>
                <div className="flex flex-wrap gap-2 mb-6 mt-auto">
                  {project.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-slate-900 rounded-md text-xs font-medium text-slate-300 border border-slate-800">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex gap-4 text-sm font-semibold">
                  <a href={project.repo} className="text-white hover:text-brand transition-colors">View Source →</a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Skills Section */}
        <section id="skills" className="py-20">
          <h2 className="text-3xl font-bold text-white mb-12 flex items-center">
            <span className="w-8 h-[2px] bg-brand mr-4"></span>
            Technical Arsenal
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {skills.map((skillGroup) => (
              <div key={skillGroup.category} className="border border-slate-800 rounded-xl p-6 bg-slate-900/50">
                <h3 className="text-lg font-semibold text-white mb-4">{skillGroup.category}</h3>
                <div className="flex flex-wrap gap-3">
                  {skillGroup.items.map((item) => (
                    <span key={item} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-sm border border-slate-700">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to build?</h2>
          <p className="text-slate-400 mb-10 max-w-lg mx-auto">
            I build and explore AI-native applications as a hobby. If you want to talk about AI or collaborate on a project, let's chat.
          </p>
          <a href="mailto:hello@example.com" className="inline-block px-8 py-4 rounded-xl bg-brand text-white font-bold text-lg hover:bg-blue-600 transition-colors shadow-lg shadow-brand/20">
            Get in touch
          </a>
          <div className="mt-16 flex justify-center gap-8 text-slate-400">
            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">X (Twitter)</a>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
