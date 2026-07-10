import { Link } from "react-router-dom";
import {
  MdVideocam,
  MdChat,
  MdLock,
  MdBolt,
  MdGroups,
  MdNotificationsActive,
  MdArrowForward,
  MdPersonAdd,
  MdOutlineWavingHand,
} from "react-icons/md";

const FEATURES = [
  {
    icon: MdVideocam,
    title: "Crystal-clear video calls",
    text: "Peer-to-peer WebRTC calls with adaptive quality — no plugins, no downloads, straight from your browser.",
  },
  {
    icon: MdChat,
    title: "Real-time messaging",
    text: "Instant one-to-one chat with typing indicators, unread badges and live presence built on WebSockets.",
  },
  {
    icon: MdLock,
    title: "Secure by design",
    text: "JWT-based authentication, verified emails and encrypted media streams keep your conversations yours.",
  },
  {
    icon: MdBolt,
    title: "Blazing fast",
    text: "A lightweight stack tuned for low latency, so calls connect in seconds and messages land instantly.",
  },
  {
    icon: MdGroups,
    title: "Presence that works",
    text: "See who's online at a glance and reach the right person at the right time — every time.",
  },
  {
    icon: MdNotificationsActive,
    title: "Never miss a call",
    text: "Incoming-call alerts, busy signals and graceful fallbacks keep every conversation on track.",
  },
];

const STEPS = [
  {
    icon: MdPersonAdd,
    title: "Create your account",
    text: "Sign up in under a minute and verify your email to unlock your workspace.",
  },
  {
    icon: MdOutlineWavingHand,
    title: "Find your people",
    text: "Everyone in your workspace appears in your contact list with live online status.",
  },
  {
    icon: MdVideocam,
    title: "Talk face to face",
    text: "Start a chat or jump on a video call with a single click — it's that simple.",
  },
];

const STATS = [
  { value: "1-click", label: "to start a call" },
  { value: "<1s", label: "message delivery" },
  { value: "100%", label: "browser-based" },
  { value: "24/7", label: "always available" },
];

const Landing = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      {/* ── Background décor: gradient orbs + floating shapes ─────────── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="animate-orb absolute -top-40 left-1/4 h-[32rem] w-[32rem] rounded-full bg-indigo-600/30 blur-[120px]" />
        <div className="animate-orb animation-delay-300 absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-fuchsia-600/20 blur-[120px]" />
        <div className="animate-orb animation-delay-150 absolute bottom-0 -left-40 h-[26rem] w-[26rem] rounded-full bg-violet-600/20 blur-[120px]" />
        {/* floating geometric shapes */}
        <div className="animate-float absolute left-[12%] top-40 h-14 w-14 rotate-12 rounded-2xl border border-white/10 bg-white/5 backdrop-blur" />
        <div className="animate-float-slow absolute right-[15%] top-64 h-10 w-10 rounded-full border border-white/10 bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/30" />
        <div className="animate-float-slow absolute left-[8%] bottom-48 h-16 w-16 -rotate-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur" />
        <div className="animate-float absolute right-[10%] bottom-32 h-12 w-12 rotate-45 rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-indigo-500/20" />
      </div>

      {/* ── Nav ────────────────────────────────────────────────────────── */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-900/50">
            <MdVideocam size={20} />
          </span>
          <span className="text-lg font-bold tracking-tight">Meetly</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-indigo-50"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-16 text-center lg:pt-24">
        <p className="animate-fadeUp mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-indigo-200 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Live video calls &amp; chat, right in your browser
        </p>
        <h1 className="animate-fadeUp animation-delay-150 mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Talk face to face,{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            from anywhere
          </span>
        </h1>
        <p className="animate-fadeUp animation-delay-300 mx-auto mt-6 max-w-xl text-base text-slate-400 sm:text-lg">
          Meetly brings crystal-clear video calls and instant messaging
          together in one beautiful, secure workspace. No installs. No fuss.
        </p>
        <div className="animate-fadeUp animation-delay-450 mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/register"
            className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-7 py-3.5 text-sm font-semibold shadow-xl shadow-indigo-900/50 transition hover:from-indigo-400 hover:to-violet-500"
          >
            Start for free
            <MdArrowForward className="transition group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/login"
            className="rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-slate-200 backdrop-blur transition hover:bg-white/10"
          >
            I already have an account
          </Link>
        </div>

        {/* 3D-style preview card */}
        <div className="animate-fadeUp animation-delay-450 relative mx-auto mt-16 max-w-3xl [perspective:1200px]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-3 shadow-2xl shadow-indigo-950/60 backdrop-blur-xl transition-transform duration-500 [transform:rotateX(8deg)] hover:[transform:rotateX(0deg)]">
            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-900/80 p-4 sm:grid-cols-3">
              {[
                "from-indigo-500/60 to-violet-700/60",
                "from-fuchsia-500/60 to-pink-700/60",
                "from-violet-500/60 to-indigo-700/60",
              ].map((g, i) => (
                <div
                  key={i}
                  className={`flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br ${g} ${
                    i === 2 ? "hidden sm:flex" : ""
                  }`}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                    <MdVideocam size={22} className="text-white/90" />
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-3 py-4">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-400">
                3 participants connected · call in progress
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-white/10 bg-white/5 backdrop-blur">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 py-10 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="bg-gradient-to-r from-indigo-300 to-fuchsia-300 bg-clip-text text-3xl font-extrabold text-transparent">
                {s.value}
              </p>
              <p className="mt-1 text-xs uppercase tracking-wider text-slate-400">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to stay connected
          </h2>
          <p className="mt-4 text-slate-400">
            Designed for teams and friends who want fast, secure, delightful
            conversations.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-indigo-400/40 hover:bg-white/10 hover:shadow-xl hover:shadow-indigo-950/40"
            >
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-900/40 transition group-hover:scale-110">
                <feature.icon size={20} />
              </span>
              <h3 className="mb-2 font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">
                {feature.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Up and running in three steps
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
                <step.icon size={24} className="text-indigo-300" />
              </div>
              <span className="absolute -top-2 left-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full bg-indigo-600 text-xs font-bold sm:hidden lg:flex">
                {i + 1}
              </span>
              <h3 className="mb-2 font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-600 to-violet-700 p-10 text-center shadow-2xl shadow-indigo-950/60">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <h2 className="text-2xl font-bold sm:text-3xl">
            Ready for your first call?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-indigo-100">
            Create a free account and be face to face with your people in
            under a minute.
          </p>
          <Link
            to="/register"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-indigo-700 shadow-lg transition hover:bg-indigo-50"
          >
            Create your account <MdArrowForward />
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <MdVideocam size={15} />
            </span>
            <span className="text-sm font-semibold">Meetly</span>
          </div>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Meetly. Built with the MERN stack.
          </p>
          <div className="flex gap-5 text-xs text-slate-400">
            <Link to="/login" className="transition hover:text-white">
              Log in
            </Link>
            <Link to="/register" className="transition hover:text-white">
              Register
            </Link>
            <Link to="/forgot-password" className="transition hover:text-white">
              Forgot password
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
