import { Link } from "react-router-dom";

const RegisterSuccess = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="bg-gray-900 text-white shadow-lg rounded-2xl p-8 w-full max-w-md text-center animate-slideFade border border-gray-800">
        <div className="text-5xl mb-4 text-green-500">✓</div>
        <h1 className="text-2xl font-bold text-green-400 mb-4">
          Registration successful
        </h1>
        <p className="text-gray-300 mb-6">
          We sent a verification link to your email. Please verify before logging
          in.
        </p>
        <Link
          to="/login"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Go to login
        </Link>
      </div>
    </div>
  );
};

export default RegisterSuccess;
