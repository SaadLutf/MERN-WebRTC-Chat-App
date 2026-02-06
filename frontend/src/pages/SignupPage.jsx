import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Mail, User, Lock } from "lucide-react";
import { registerApi } from "../services/AuthApi";

const SignupPage = () => {
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false); 
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true); 
    try {
      const res = await registerApi(data);
      setMessage(res.data.message || "Registered successfully!");
      setIsError(false);
    } catch (error) {
      console.error("Error", error);
      setMessage(error.response?.data?.message || "Something went wrong");
      setIsError(true);
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="bg-[#F7F7FF] h-screen flex justify-center items-center">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Show Success/Error Message */}
          {message && (
            <div
              className={`px-4 py-3 rounded mb-4 text-sm font-medium ${
                isError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
              }`}
            >
              {message}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="font-medium text-gray-700">Email</label>
            <div className="flex items-center border border-gray-200 rounded mt-1">
              <div className="px-3 py-2 bg-gray-100 text-gray-500 rounded-l">
                <Mail size={18} />
              </div>
              <input
                type="email"
                placeholder="Enter Email"
                className="w-full px-2 py-2 text-sm outline-none rounded-r"
                {...register("email", { required: true })}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">Email is required</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="font-medium text-gray-700">Username</label>
            <div className="flex items-center border border-gray-200 rounded mt-1">
              <div className="px-3 py-2 bg-gray-100 text-gray-500 rounded-l">
                <User size={18} />
              </div>
              <input
                type="text"
                placeholder="Enter Username"
                className="w-full px-2 py-2 text-sm outline-none rounded-r"
                {...register("username", { required: true })}
              />
            </div>
            {errors.username && (
              <p className="text-red-500 text-xs mt-1">Username is required</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="font-medium text-gray-700">Password</label>
            <div className="flex items-center border border-gray-200 rounded mt-1">
              <div className="px-3 py-2 bg-gray-100 text-gray-500 rounded-l">
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="Enter Password"
                className="w-full px-2 py-2 text-sm outline-none rounded-r"
                {...register("password", { required: true })}
              />
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">Password is required</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="font-medium text-gray-700">Confirm Password</label>
            <div className="flex items-center border border-gray-200 rounded mt-1">
              <div className="px-3 py-2 bg-gray-100 text-gray-500 rounded-l">
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="Confirm Password"
                className="w-full px-2 py-2 text-sm outline-none rounded-r"
                {...register("confirmPassword", {
                  required: true,
                  validate: (value) =>
                    value === watch("password") || "Passwords do not match",
                })}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                {errors.confirmPassword.message ||
                  "Confirm Password is required"}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-md font-medium transition ${
              loading
                ? "bg-indigo-300 cursor-not-allowed text-white"
                : "bg-indigo-500 hover:bg-indigo-600 text-white"
            }`}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {/* Terms */}
        <p className="text-xs text-gray-500 text-center mt-4">
          By registering you agree to the{" "}
          <span className="font-medium text-indigo-500 cursor-pointer">
            Chatvia Terms of Use
          </span>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
