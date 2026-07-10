import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthService from "../../services/AuthService";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState(token ? "loading" : "error");
  const [message, setMessage] = useState(
    token ? "" : "Missing verification token in the link."
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const { data } = await AuthService.verifyEmail(token);
        if (cancelled) return;
        if (data.success) {
          setStatus("ok");
          setMessage(data.message || "Your email is verified.");
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed.");
        }
      } catch (err) {
        if (cancelled) return;
        const body = err.response?.data;
        setStatus("error");
        setMessage(
          body?.message ||
            body?.msg ||
            "This link is invalid or expired."
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-slate-950 px-4">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="animate-orb absolute top-1/3 left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />
      </div>
      <div className="relative z-10 glass-card tilt-card text-white p-6 sm:p-8 w-full max-w-md animate-slideFade text-center [perspective:1200px]">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">Email verification</h1>

        {status === "loading" && (
          <p className="text-slate-300 text-sm sm:text-base">Verifying your email…</p>
        )}

        {status === "ok" && (
          <>
            <p className="text-emerald-400 mb-6 text-sm sm:text-base">{message}</p>
            <Link
              to="/login"
              className="inline-block bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-900/50 transition hover:from-indigo-400 hover:to-violet-500"
            >
              Go to login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <p className="text-red-400 mb-6 text-sm sm:text-base">{message}</p>
            <Link to="/login" className="text-indigo-400 hover:underline">
              Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
