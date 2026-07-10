import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthService from "../../services/AuthService";
import { validateImageFile } from "../../utils/avatar";

const Register = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("mobile", mobile);
    formData.append("password", password);
    // Profile image is optional — only send it when the user picked a file.
    if (image) formData.append("image", image);

    try {
      const response = await AuthService.register(formData);
      const data = response.data;
      if (data.success) {
        navigate("/register-success", { replace: true });
      }
    }
    catch (error) {
      console.log(error);
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
        <div className="animate-orb absolute -top-40 right-1/4 h-[28rem] w-[28rem] rounded-full bg-violet-600/30 blur-[120px]" />
        <div className="animate-orb animation-delay-300 absolute bottom-0 -left-32 h-[24rem] w-[24rem] rounded-full bg-indigo-600/20 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm [perspective:1200px]">
        <div className="glass-card tilt-card text-white p-6 sm:p-8 animate-slideFade">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6">
            Register
          </h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Name */}
            <div>
              <label className="block mb-1 font-medium text-sm sm:text-base">Full Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 text-white border border-white/10
                rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block mb-1 font-medium text-sm sm:text-base">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 text-white border border-white/10
                rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Mobile */}
            <div>
              <label className="block mb-1 font-medium text-sm sm:text-base">Mobile Number</label>
              <input
                type="tel"
                placeholder="Enter your mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 text-white border border-white/10
                rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
              />
              {errors.mobile && (
                <p className="text-red-400 text-sm mt-1">{errors.mobile}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block mb-1 font-medium text-sm sm:text-base">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 text-white border border-white/10
                rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
              />
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label className="block mb-1 font-medium text-sm sm:text-base">Profile Image</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const fileError = validateImageFile(file);
                  if (fileError) {
                    setErrors((prev) => ({ ...prev, image: fileError }));
                    setImage(null);
                    e.target.value = "";
                    return;
                  }
                  setErrors((prev) => ({ ...prev, image: undefined }));
                  setImage(file);
                }}
                className="w-full text-sm text-slate-300 bg-white/5 border border-white/10
                rounded-xl p-2 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600
                file:px-3 file:py-1.5 file:text-white file:text-sm"
              />
              {errors.image && (
                <p className="text-red-400 text-sm mt-1">{errors.image}</p>
              )}
            </div>

            {/* Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white py-2.5 rounded-xl font-semibold
               shadow-lg shadow-indigo-900/50 transition hover:from-indigo-400 hover:to-violet-500"
            >
              Register
            </button>
          </form>

          {/* Redirect to Login */}
          <p className="text-center mt-5 text-sm text-slate-300">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-400 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
