import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Mail, Lock } from "lucide-react";
import { loginApi } from "../services/AuthApi";
import { Toaster, toast } from "react-hot-toast";
import { socket } from "../socket";
import { useDispatch } from "react-redux";
import { getUserById } from "../services/UserApi";
import { setUser } from "../redux/userSlice"; 
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await loginApi(data);

      if (res?.data?.token) {
        //  Save token
        localStorage.setItem("token", res.data.token);

        //  Decode token to get userId
        const token = res.data.token;
        const decoded = JSON.parse(atob(token.split(".")[1]));
        const loggedInUserId = decoded.userId;

        //  Fetch user data and store in Redux
        const userRes = await getUserById(loggedInUserId);
        dispatch(setUser(userRes.data));
        console.log("user logged in : ",userRes.data)

        

        //  Navigate to main app (or dashboard)
        navigate("/chat");

        toast.success(res.data.message || "Login Successful!");
      }

    } catch (error) {
      console.error("Error: ", error);
      toast.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F7F7FF] h-screen flex justify-center items-center">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
