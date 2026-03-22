import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="bg-gray-900 text-white shadow-lg rounded-2xl p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-2">404</h1>
        <p className="text-gray-400 mb-6">
          The page you are looking for does not exist.
        </p>
        <Link
          to="/login"
          className="text-blue-400 hover:underline font-medium"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
