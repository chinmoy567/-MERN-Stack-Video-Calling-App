import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import AuthService from "../../services/AuthService";

const ResetPasswordEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [phase, setPhase] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [userId, setUserId] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!token) {
      setPhase("no_token");
      setErrorMsg(
        "This page needs a reset link from your email. You can request a new one below."
      );
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data } = await AuthService.validateResetToken(token);
        if (cancelled) return;
        if (data.success && data.data) {
          setUserId(String(data.data.userId));
          setResetToken(data.data.token);
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
        user_id: userId,
        token: resetToken,
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
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="bg-gray-900 text-white rounded-2xl p-8 max-w-md text-center">
          <p className="text-gray-300">Checking your reset link…</p>
        </div>
      </div>
    );
  }

  if (phase === "no_token" || phase === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="bg-gray-900 text-white rounded-2xl p-8 w-full max-w-md text-center">
          <p className="text-red-400 mb-6">{errorMsg}</p>
          <Link
            to="/forgot-password"
            className="text-blue-400 hover:underline block mb-4"
          >
            Request a new reset link
          </Link>
          <Link to="/login" className="text-gray-400 hover:underline text-sm">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="bg-gray-900 text-white shadow-lg rounded-2xl p-8 w-full max-w-sm animate-slideFade">
        <h2 className="text-3xl font-bold text-center mb-6">Set new password</h2>
        {submitError && (
          <p className="text-red-400 text-sm text-center mb-4">{submitError}</p>
        )}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block mb-1 font-medium">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
            {fieldErrors.password && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>
            )}
          </div>
          <div>
            <label className="block mb-1 font-medium">Confirm password</label>
            <input
              type="password"
              value={cPassword}
              onChange={(e) => setCPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
            {fieldErrors.c_password && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.c_password}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Update password
          </button>
        </form>
        <p className="text-center mt-4 text-gray-400 text-sm">
          <Link to="/login" className="text-blue-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordEmail;
