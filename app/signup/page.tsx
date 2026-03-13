import React from 'react';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="h-[calc(100vh-10rem)] bg-[#f3f4f6] flex items-center justify-center p-4 rounded-3xl">
      <div className="max-w-md w-full bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black tracking-tighter mb-2 text-black">Create Account</h1>
          <p className="text-gray-600 font-medium">Join PennyWise to take control of your finances.</p>
        </div>

        <form className="space-y-6">
          <div className="space-y-2">
            <label className="font-bold text-black" htmlFor="name">Full Name</label>
            <input 
              id="name" 
              type="text" 
              placeholder="John Doe" 
              className="w-full p-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="font-bold text-black" htmlFor="email">Email</label>
            <input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
              className="w-full p-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all font-medium"
            />
          </div>
          
          <div className="space-y-2">
            <label className="font-bold text-black" htmlFor="password">Password</label>
            <input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              className="w-full p-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all font-medium"
            />
          </div>

          <button 
            type="button" 
            className="w-full py-3 px-4 bg-yellow-400 text-black font-black text-lg rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            Sign Up
          </button>
        </form>

        <div className="mt-8 text-center border-t-2 border-gray-100 pt-6">
          <p className="text-gray-600 font-bold">
            Already have an account?{' '}
            <Link href="/login" className="text-yellow-600 hover:text-yellow-800 underline decoration-2 underline-offset-4">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
