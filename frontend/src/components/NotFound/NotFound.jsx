import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-slate-950 px-4">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="animate-orb absolute top-1/3 left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-fuchsia-600/20 blur-[120px]" />
      </div>
      <div className="relative z-10 glass-card tilt-card text-white p-6 sm:p-8 w-full max-w-md text-center [perspective:1200px]">
        <h1 className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-5xl font-extrabold text-transparent mb-2">
          404
        </h1>
        <p className="text-slate-400 mb-6 text-sm sm:text-base">
          The page you are looking for does not exist.
        </p>
        <Link
          to="/login"
          className="text-indigo-400 hover:underline font-medium"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
