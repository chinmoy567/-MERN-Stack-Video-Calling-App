import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthService from "../../services/AuthService";

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
    formData.append("image", image);

    try {
      const response = await AuthService.register(formData);
      const data = response.data;
      alert(data.msg);
      if (data.success) {
        navigate("/login", { replace: true });
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
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="bg-gray-900 text-white shadow-lg rounded-2xl p-8 w-full max-w-sm animate-slideFade">
        <h2 className="text-3xl font-bold text-center mb-6">Register</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Name */}
          <div>
            <label className="block mb-1 font-medium">Full Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 
              rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 
              rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Mobile */}
          <div>
            <label className="block mb-1 font-medium">Mobile Number</label>
            <input
              type="tel"
              placeholder="Enter your mobile number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 
              rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {errors.mobile && (
              <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block mb-1 font-medium">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 
              rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block mb-1 font-medium">Profile Image</label>
            <input
              type="file"
              onChange={(e) => setImage(e.target.files[0])}
              className="w-full text-gray-300 bg-gray-800 border border-gray-700 
              rounded-lg p-2"
            />
            {errors.image && (
              <p className="text-red-500 text-sm mt-1">{errors.image}</p>
            )}
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold 
             hover:bg-blue-700 transition"
          >
            Register
          </button>
        </form>

        {/* Redirect to Login */}
        <p className="text-center mt-4 text-gray-300">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
