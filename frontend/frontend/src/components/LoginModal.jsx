import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

export default function LoginModal({ onClose }) {
  const handleLogin = async () => {
    await signInWithPopup(auth, googleProvider);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 text-center w-80">
        <h2 className="text-2xl font-bold mb-4">Login Required</h2>
        <p className="text-gray-600 mb-4">
          Please login to continue searching.
        </p>

        <button
          onClick={handleLogin}
          className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600"
        >
          Continue with Google
        </button>

        <button
          onClick={onClose}
          className="mt-3 text-sm text-gray-500 underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
