import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthService from "../../services/AuthService";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token in the link.");
      return;
    }

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
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="bg-gray-900 text-white shadow-lg rounded-2xl p-8 w-full max-w-md animate-slideFade text-center">
        <h1 className="text-2xl font-bold mb-4">Email verification</h1>

        {status === "loading" && (
          <p className="text-gray-300">Verifying your email…</p>
        )}

        {status === "ok" && (
          <>
            <p className="text-green-400 mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Go to login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <p className="text-red-400 mb-6">{message}</p>
            <Link to="/login" className="text-blue-400 hover:underline">
              Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
