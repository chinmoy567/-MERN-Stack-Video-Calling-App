import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthService from "../../services/AuthService";


const Login = () => {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);

    const handleSubmit = async (event) => {
      event.preventDefault();
      setErrors({});
      
      try {
        const response = await AuthService.login({ email, password });
        const data = response.data;
        
        if (data.success) {
          AuthService.loginUser(data);
          setIsLoggedIn(true);
        }
        else {
          alert(data.msg);
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

    useEffect(() => {
      if (isLoggedIn) {
        navigate("/dashboard", { replace: true });
      }
    }, [isLoggedIn, navigate]);


  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-slate-950 px-4 py-10">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="animate-orb absolute -top-40 left-1/4 h-[28rem] w-[28rem] rounded-full bg-indigo-600/30 blur-[120px]" />
        <div className="animate-orb animation-delay-300 absolute bottom-0 -right-32 h-[24rem] w-[24rem] rounded-full bg-fuchsia-600/20 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm [perspective:1200px]">
        <div className="glass-card tilt-card text-white p-6 sm:p-8 animate-slideFade">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6">
            Login
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

            {/* Password */}
            <div>
              <label className="block mb-1 font-medium text-sm sm:text-base">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full px-4 py-2.5 bg-white/5 text-white border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white py-2.5 rounded-xl font-semibold
                         shadow-lg shadow-indigo-900/50 transition hover:from-indigo-400 hover:to-violet-500"
            >
              Login
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center mt-5 text-sm text-slate-300">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-indigo-400 hover:underline">
              Register
            </Link>{" "}
            |
            <Link to="/forgot-password" className="text-indigo-400 hover:underline">
              {" "}
              Forgot Password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
