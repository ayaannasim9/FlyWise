import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg p-8 rounded-lg w-96">
        <h2 className="text-2xl font-bold mb-4">Login</h2>

        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full mb-3 rounded"
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2 w-full mb-4 rounded"
        />

        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Login
        </button>

        <p className="mt-4 text-sm text-center">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue-600 underline">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}
