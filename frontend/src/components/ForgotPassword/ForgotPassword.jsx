
import { useState } from "react";
import { Link } from "react-router-dom";
import AuthService from "../../services/AuthService";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});

      const handleSubmit = async (event) => {
        event.preventDefault();
        setErrors({});
        
        try {
          const response = await AuthService.forgotPassword({ email });
          const data = response.data;
          alert(data.msg);
          if (data.success) {
            setEmail("");
          }
        }
        catch (error) {
          if (
            error.response &&
            (error.response.status === 400 || error.response.status === 401)) {
            if (error.response.data.errors) {
              const apiErrors = error.response.data.errors;
              const newErrors = {};
              apiErrors.forEach((apiError) => {
                newErrors[apiError.path] = apiError.msg;
              });
              setErrors(newErrors);
            } 
            else {
              alert(
                error.response.data.msg
                  ? error.response.data.msg
                  : error.response.message
              );
            }
          } else {
            alert(error.message);
          }
        } 
      };

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-slate-950 px-4 py-10">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="animate-orb absolute -top-40 left-1/3 h-[26rem] w-[26rem] rounded-full bg-indigo-600/25 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm [perspective:1200px]">
        <div className="glass-card tilt-card text-white p-6 sm:p-8 animate-slideFade">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6">
            Forgot Password
          </h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label className="block mb-1 font-medium text-sm sm:text-base">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-2.5 bg-white/5 text-white border border-white/10
                rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white py-2.5 rounded-xl font-semibold
                         shadow-lg shadow-indigo-900/50 transition hover:from-indigo-400 hover:to-violet-500"
            >
              Submit
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center mt-5 text-sm text-slate-300">
            <Link to="/login" className="text-indigo-400 hover:underline">
              Login
            </Link>{" "}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
