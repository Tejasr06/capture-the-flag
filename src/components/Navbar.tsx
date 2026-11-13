import { useState } from 'react'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'

const links = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#for-everyone', label: 'For everyone' },
]

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="relative z-20 border-b border-white/[0.07]">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12"
      >
        <a
          aria-label="QuizArena home"
          className="flex items-center gap-3"
          href="#home"
          onClick={closeMenu}
        >
          <span className="grid size-10 place-items-center rounded-[14px] bg-gradient-to-br from-violet-400 to-indigo-600 text-lg font-black text-white shadow-lg shadow-violet-950/50">
            Q
          </span>
          <span className="text-[17px] font-bold tracking-tight text-white">
            Quiz<span className="text-violet-300">Arena</span>
          </span>
        </a>

        <div className="hidden items-center gap-9 md:flex">
          {links.map((link) => (
            <a
              className="text-sm font-medium text-slate-300 transition hover:text-white"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <Link
            className="rounded-full border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
            to="/join"
          >
            Join a game
          </Link>
          <Link
            className="rounded-full px-3 py-2 text-sm font-semibold text-slate-300 transition hover:text-white"
            to="/host/login"
          >
            Host sign in
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-violet-100"
            to="/host/register"
          >
            Create account
            <ArrowUpRight aria-hidden="true" size={16} />
          </Link>
        </div>

        <button
          aria-controls="mobile-navigation"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="grid size-10 place-items-center rounded-xl border border-white/10 text-white transition hover:bg-white/10 md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {menuOpen && (
        <div
          className="absolute inset-x-0 top-full border-b border-white/10 bg-[#10152a] px-5 py-4 shadow-2xl md:hidden"
          id="mobile-navigation"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            <Link
              className="rounded-xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/5 hover:text-white"
              onClick={closeMenu}
              to="/join"
            >
              Join a game
            </Link>
            {links.map((link) => (
              <a
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/5 hover:text-white"
                href={link.href}
                key={link.href}
                onClick={closeMenu}
              >
                {link.label}
              </a>
            ))}
            <Link
              className="rounded-xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/5 hover:text-white"
              onClick={closeMenu}
              to="/host/login"
            >
              Host sign in
            </Link>
            <Link
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-bold text-white"
              onClick={closeMenu}
              to="/host/register"
            >
              Create host account
              <ArrowUpRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
