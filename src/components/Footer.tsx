import { Sparkles } from 'lucide-react'

function Footer() {
  return (
    <footer className="border-t border-white/[0.08]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <a className="inline-flex items-center gap-2 font-semibold text-slate-200" href="#home">
          <Sparkles aria-hidden="true" className="text-violet-300" size={16} />
          QuizArena
        </a>
        <p>Made for curious minds and friendly competition.</p>
        <a className="transition hover:text-white" href="#home">
          Back to top ↑
        </a>
      </div>
    </footer>
  )
}

export default Footer
