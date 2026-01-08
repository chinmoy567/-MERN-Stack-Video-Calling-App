
import { useState } from "react";
import { Link } from "react-router-dom";
import AuthService from "../../services/AuthService";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});

      const handleSubmit = async (event) => {
        event.preventDefault();
        setErrors({});
        
        const formData = new FormData();
  
        formData.append("email", email);
        
    
        try {
          const response = await AuthService.forgotPassword(formData);
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
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="bg-gray-900 text-white shadow-lg rounded-2xl p-8 w-full max-w-sm animate-slideFade">
        <h2 className="text-3xl font-bold text-center mb-6">ForgotPassword</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 
              rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold 
                       hover:bg-blue-700 transition"
          >
            Submit
          </button>
        </form>

        {/* Register Link */}
        <p className="text-center mt-4 text-gray-300">
          <Link to="/login" className="text-blue-500 hover:underline">
            Login
          </Link>{" "}
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
