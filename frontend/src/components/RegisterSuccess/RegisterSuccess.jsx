import { Link } from "react-router-dom";

const RegisterSuccess = () => {
  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-slate-950 px-4">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="animate-orb absolute top-1/3 left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-emerald-600/20 blur-[120px]" />
      </div>
      <div className="relative z-10 glass-card tilt-card text-white p-6 sm:p-8 w-full max-w-md text-center animate-slideFade [perspective:1200px]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl shadow-lg shadow-emerald-900/40">
          ✓
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-emerald-400 mb-4">
          Registration successful
        </h1>
        <p className="text-slate-300 mb-6 text-sm sm:text-base">
          We sent a verification link to your email. Please verify before logging
          in.
        </p>
        <Link
          to="/login"
          className="inline-block bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-900/50 transition hover:from-indigo-400 hover:to-violet-500"
        >
          Go to login
        </Link>
      </div>
    </div>
  );
};

export default RegisterSuccess;
