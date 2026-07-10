import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import AuthService from "../../services/AuthService";

const ResetPasswordEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [phase, setPhase] = useState(token ? "loading" : "no_token");
  const [errorMsg, setErrorMsg] = useState(
    token
      ? ""
      : "This page needs a reset link from your email. You can request a new one below."
  );
  const [password, setPassword] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const { data } = await AuthService.validateResetToken(token);
        if (cancelled) return;
        if (data.success) {
          setPhase("form");
        } else {
          setPhase("error");
          setErrorMsg(data.message || "Invalid reset link.");
        }
      } catch (err) {
        if (cancelled) return;
        const body = err.response?.data;
        setPhase("error");
        setErrorMsg(
          body?.message || body?.msg || "This reset link is invalid or expired."
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setSubmitError("");
    try {
      const { data } = await AuthService.submitPasswordReset({
        token,
        password,
        c_password: cPassword,
      });
      if (data.success) {
        navigate("/reset-success", { replace: true });
      }
    } catch (err) {
      const body = err.response?.data;
      if (body?.errors?.length) {
        const next = {};
        body.errors.forEach((e) => {
          next[e.path] = e.msg;
        });
        setFieldErrors(next);
      } else {
        setSubmitError(
          body?.message || body?.msg || "Could not reset password."
        );
      }
    }
  };

  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="glass-card text-white p-6 sm:p-8 max-w-md text-center">
          <p className="text-slate-300">Checking your reset link…</p>
        </div>
      </div>
    );
  }

  if (phase === "no_token" || phase === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="glass-card text-white p-6 sm:p-8 w-full max-w-md text-center">
          <p className="text-red-400 mb-6">{errorMsg}</p>
          <Link
            to="/forgot-password"
            className="text-indigo-400 hover:underline block mb-4"
          >
            Request a new reset link
          </Link>
          <Link to="/login" className="text-slate-400 hover:underline text-sm">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-slate-950 px-4 py-10">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="animate-orb absolute -top-40 right-1/3 h-[26rem] w-[26rem] rounded-full bg-fuchsia-600/25 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm [perspective:1200px]">
        <div className="glass-card tilt-card text-white p-6 sm:p-8 animate-slideFade">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6">
            Set new password
          </h2>
          {submitError && (
            <p className="text-red-400 text-sm text-center mb-4">{submitError}</p>
          )}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block mb-1 font-medium text-sm sm:text-base">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 text-white border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                required
              />
              {fieldErrors.password && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.password}</p>
              )}
            </div>
            <div>
              <label className="block mb-1 font-medium text-sm sm:text-base">Confirm password</label>
              <input
                type="password"
                value={cPassword}
                onChange={(e) => setCPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 text-white border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                required
              />
              {fieldErrors.c_password && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.c_password}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-900/50 transition hover:from-indigo-400 hover:to-violet-500"
            >
              Update password
            </button>
          </form>
          <p className="text-center mt-5 text-slate-400 text-sm">
            <Link to="/login" className="text-indigo-400 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordEmail;
