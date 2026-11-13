import { motion } from 'framer-motion'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bolt,
  Check,
  CircleHelp,
  Crown,
  GraduationCap,
  PartyPopper,
  Play,
  Radio,
  Users,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'

const features = [
  {
    icon: Radio,
    title: 'The room moves together',
    description:
      'Questions, countdowns, and results keep pace across every screen in the room.',
    color: 'bg-blue-400/10 text-blue-300',
  },
  {
    icon: Bolt,
    title: 'Quick to join',
    description:
      'Players jump in with a game PIN and a nickname. No account needed to play.',
    color: 'bg-orange-400/10 text-orange-300',
  },
  {
    icon: BarChart3,
    title: 'A little friendly rivalry',
    description:
      'Fast, correct answers earn more points, and the leaderboard keeps the energy up.',
    color: 'bg-emerald-400/10 text-emerald-300',
  },
]

function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#0b1020] text-white">
      <Navbar />

      <main>
        <section
          className="relative isolate mx-auto grid min-h-[680px] max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:min-h-[720px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-12 lg:py-24"
          id="home"
        >
          <div className="pointer-events-none absolute -left-40 top-12 -z-10 size-[420px] rounded-full bg-violet-600/15 blur-[120px]" />
          <div className="pointer-events-none absolute right-0 top-44 -z-10 size-80 rounded-full bg-blue-500/10 blur-[100px]" />

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.08] px-4 py-2 text-sm font-medium text-violet-200">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              Big energy. One shared screen.
            </div>

            <h1 className="max-w-2xl text-[clamp(3rem,8vw,5.6rem)] leading-[0.98] font-black tracking-[-0.06em]">
              Let the
              <span className="block bg-gradient-to-r from-violet-300 via-purple-300 to-blue-300 bg-clip-text text-transparent">
                bright ideas
              </span>
              compete.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Turn a classroom, club, or friendly get-together into a live quiz
              arena. Bring your questions; bring your people.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-violet-500 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-violet-950/40 transition hover:-translate-y-0.5 hover:bg-violet-400"
                to="/join"
              >
                Join a game
                <ArrowRight
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-1"
                  size={17}
                />
              </Link>
              <a
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-bold text-slate-100 transition hover:border-white/20 hover:bg-white/[0.08]"
                href="#how-it-works"
              >
                See how it works
                <ArrowDown aria-hidden="true" size={16} />
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-400">
              <span className="inline-flex items-center gap-2">
                <Check aria-hidden="true" className="text-emerald-400" size={16} />
                Easy to host
              </span>
              <span className="inline-flex items-center gap-2">
                <Check aria-hidden="true" className="text-emerald-400" size={16} />
                Easy to join
              </span>
              <span className="inline-flex items-center gap-2">
                <Check aria-hidden="true" className="text-emerald-400" size={16} />
                Made for groups
              </span>
            </div>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            className="relative mx-auto w-full max-w-[500px]"
            initial={{ opacity: 0, y: 24, rotate: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
          >
            <div className="absolute -inset-5 rounded-[36px] bg-gradient-to-br from-violet-600/20 via-blue-500/10 to-transparent blur-2xl" />
            <div className="relative rounded-[30px] border border-white/10 bg-[#141a30]/90 p-5 shadow-2xl shadow-black/30 backdrop-blur sm:p-7">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex -space-x-2">
                    {['bg-pink-400', 'bg-amber-300', 'bg-blue-400'].map((color) => (
                      <span
                        aria-hidden="true"
                        className={`size-7 rounded-full border-2 border-[#141a30] ${color}`}
                        key={color}
                      />
                    ))}
                  </span>
                  <span className="text-xs font-medium text-slate-300">The room is in</span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  LIVE PREVIEW
                </span>
              </div>

              <div className="mt-7 rounded-2xl border border-white/[0.07] bg-[#0c1225] p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between text-xs text-slate-400">
                  <span>QUESTION 03 <span className="text-slate-600">/ 10</span></span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-orange-300">
                    <Zap aria-hidden="true" size={13} />
                    00:18
                  </span>
                </div>
                <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-violet-500 to-blue-400" />
                </div>
                <h2 className="text-xl leading-snug font-bold tracking-tight sm:text-2xl">
                  Which planet has the most moons?
                </h2>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {[
                    { label: 'Jupiter', color: 'from-rose-500/20 to-rose-500/5', icon: 'A' },
                    { label: 'Saturn', color: 'from-blue-500/20 to-blue-500/5', icon: 'B' },
                    { label: 'Neptune', color: 'from-amber-500/20 to-amber-500/5', icon: 'C' },
                    { label: 'Uranus', color: 'from-emerald-500/20 to-emerald-500/5', icon: 'D' },
                  ].map((answer) => (
                    <div
                      className={`flex min-h-[72px] items-center gap-3 rounded-xl border border-white/[0.07] bg-gradient-to-br ${answer.color} px-3 py-3 sm:px-4`}
                      key={answer.label}
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.08] text-xs font-bold text-white/80">
                        {answer.icon}
                      </span>
                      <span className="text-sm font-semibold text-slate-100">{answer.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-amber-400/10 text-amber-300">
                    <Crown aria-hidden="true" size={17} />
                  </span>
                  <div>
                    <p className="text-xs text-slate-400">Current leader</p>
                    <p className="mt-0.5 text-sm font-bold">Quiz Wizard</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-violet-200">2,450 pts</span>
              </div>
            </div>

            <div className="absolute -right-3 top-20 hidden items-center gap-2 rounded-2xl border border-white/10 bg-[#1a2140] px-3.5 py-3 shadow-xl sm:flex sm:-right-8">
              <span className="grid size-9 place-items-center rounded-xl bg-violet-400/10 text-violet-300">
                <Users aria-hidden="true" size={18} />
              </span>
              <span>
                <span className="block text-xs text-slate-400">Playing now</span>
                <span className="block text-sm font-bold">24 players</span>
              </span>
            </div>
          </motion.div>
        </section>

        <section
          className="border-y border-white/[0.07] bg-white/[0.025]"
          id="features"
        >
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-bold tracking-[0.2em] text-violet-300 uppercase">
                A better kind of quiz
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Learning looks good
                <span className="text-violet-300"> on a leaderboard.</span>
              </h2>
              <p className="mt-4 leading-7 text-slate-400">
                Made to bring people into the same moment—whether you’re leading
                the room or racing your friends.
              </p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {features.map(({ icon: Icon, title, description, color }, index) => (
                <motion.article
                  className="rounded-3xl border border-white/[0.08] bg-[#11172a] p-6 sm:p-7"
                  initial={{ opacity: 0, y: 16 }}
                  key={title}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                >
                  <span className={`grid size-12 place-items-center rounded-2xl ${color}`}>
                    <Icon aria-hidden="true" size={21} />
                  </span>
                  <h3 className="mt-6 text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-20 lg:px-12 lg:py-24" id="how-it-works">
          <div>
            <span className="text-xs font-bold tracking-[0.2em] text-blue-300 uppercase">
              Start with a question
            </span>
            <h2 className="mt-4 text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
              Simple to start.
              <span className="block text-slate-400">Hard to sit out.</span>
            </h2>
            <p className="mt-5 max-w-lg leading-7 text-slate-400">
              Hosts prepare a quiz and bring it to the room. Everyone else joins
              in a moment, then it’s all about the next question.
            </p>
            <a
              className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-violet-300 transition hover:text-violet-200"
              href="#for-everyone"
            >
              Find your place in the game
              <ArrowRight aria-hidden="true" size={16} />
            </a>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                icon: CircleHelp,
                number: '01',
                title: 'Build your quiz',
                description: 'Bring your own questions and set the pace for each one.',
              },
              {
                icon: Users,
                number: '02',
                title: 'Gather the players',
                description: 'Share a six-digit PIN so your group can join the lobby.',
              },
              {
                icon: Play,
                number: '03',
                title: 'Play in real time',
                description: 'Everyone answers together while the clock is ticking.',
              },
              {
                icon: PartyPopper,
                number: '04',
                title: 'Celebrate the scores',
                description: 'See points and rankings add up after every question.',
              },
            ].map(({ icon: Icon, number, title, description }) => (
              <article
                className="rounded-2xl border border-white/[0.08] bg-[#11172a] p-5"
                key={number}
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-xl bg-white/[0.06] text-violet-300">
                    <Icon aria-hidden="true" size={18} />
                  </span>
                  <span className="text-xs font-bold tracking-widest text-slate-600">{number}</span>
                </div>
                <h3 className="mt-5 font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="relative isolate overflow-hidden border-y border-violet-300/10 bg-gradient-to-r from-violet-950/50 via-[#171d38] to-blue-950/30"
          id="for-everyone"
        >
          <div className="pointer-events-none absolute -right-20 -top-32 -z-10 size-96 rounded-full bg-violet-500/15 blur-[100px]" />
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-2 md:items-center lg:px-12 lg:py-20">
            <div>
              <span className="text-xs font-bold tracking-[0.2em] text-violet-200 uppercase">
                One arena, every role
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                A good game needs
                <span className="block text-violet-300">a great host and a crowd.</span>
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                <span className="grid size-10 place-items-center rounded-xl bg-violet-400/15 text-violet-200">
                  <GraduationCap aria-hidden="true" size={20} />
                </span>
                <h3 className="mt-4 font-bold">For hosts</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Create a quiz, run the room, and watch the scores roll in.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                <span className="grid size-10 place-items-center rounded-xl bg-blue-400/15 text-blue-200">
                  <Users aria-hidden="true" size={20} />
                </span>
                <h3 className="mt-4 font-bold">For players</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Pick a nickname, join your people, and go for the top spot.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 text-center sm:px-8 lg:px-12 lg:py-20">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-violet-400/10 text-violet-200">
            <PartyPopper aria-hidden="true" size={21} />
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            Your next great quiz starts here.
          </h2>
          <p className="mx-auto mt-3 max-w-lg leading-7 text-slate-400">
            Get the room together. The arena is ready when you are.
          </p>
          <a
            className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-violet-100"
            href="#home"
          >
            Back to the top
            <ArrowUpRight aria-hidden="true" size={16} />
          </a>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default LandingPage
