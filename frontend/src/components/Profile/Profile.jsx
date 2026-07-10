import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowBack } from "react-icons/md";
import AuthService from "../../services/AuthService";

const BE_URL = import.meta.env.VITE_API_BE_URL;

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(AuthService.getUserData());
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    AuthService.getProfile()
      .then((res) => {
        const data = res.data?.data;
        if (data) {
          setProfile(data);
          setName(data.name || "");
          setMobile(data.mobile || "");
          AuthService.setUserData(data);
        }
      })
      .catch((e) => {
        setError(e.response?.data?.msg || "Could not load profile.");
      });
  }, []);

  const onPickImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!/^\d{10}$/.test(mobile)) {
      setError("Mobile number must be exactly 10 digits.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("mobile", mobile);
    if (image) formData.append("image", image);

    setSaving(true);
    try {
      const res = await AuthService.updateUserData(formData);
      const updated = res.data?.user || res.data?.data;
      if (updated) {
        setProfile(updated);
        AuthService.setUserData(updated);
        setPreview(null);
        setImage(null);
      }
      setMessage("Profile updated.");
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0]?.msg ||
          err.response?.data?.msg ||
          "Could not update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = preview || (profile?.image ? `${BE_URL}${profile.image}` : "");

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="mx-auto max-w-lg">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="mb-4 flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <MdArrowBack size={18} /> Back to Dashboard
        </button>

        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-2xl font-bold text-slate-800">My Profile</h1>

          <div className="mb-6 flex flex-col items-center gap-3">
            <img
              src={avatarSrc}
              alt={profile?.name || "avatar"}
              className="h-28 w-28 rounded-full border-4 border-blue-100 object-cover"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Change photo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg"
              onChange={onPickImage}
              className="hidden"
            />
          </div>

          {message && (
            <p className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
              {message}
            </p>
          )}
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Mobile
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                maxLength={10}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
