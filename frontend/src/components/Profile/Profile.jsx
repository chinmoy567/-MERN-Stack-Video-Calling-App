import { useEffect, useRef, useState } from "react";
import { MdCameraAlt, MdCheckCircle, MdErrorOutline } from "react-icons/md";
import AuthService from "../../services/AuthService";
import { resolveAvatar, validateImageFile } from "../../utils/avatar";

const Profile = () => {
  const [profile, setProfile] = useState(AuthService.getUserData());
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
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

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const onPickImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileError = validateImageFile(file);
    if (fileError) {
      setError(fileError);
      e.target.value = "";
      return;
    }
    setError(null);
    setImage(file);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
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
    if (image) setUploadProgress(0);
    try {
      const res = await AuthService.updateUserData(formData, (evt) => {
        if (evt.total) {
          setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      });
      const updated = res.data?.user || res.data?.data;
      if (updated) {
        setProfile(updated);
        AuthService.setUserData(updated);
        setPreview(null);
        setImage(null);
        if (fileRef.current) fileRef.current.value = "";
      }
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0]?.msg ||
          err.response?.data?.msg ||
          (err.code === "ECONNABORTED"
            ? "Upload timed out. Check your connection and try again."
            : "Could not update profile. Please try again.")
      );
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  const avatarSrc = preview || resolveAvatar(profile?.image);

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-8 shadow-xl shadow-slate-200/50 backdrop-blur">
        <h1 className="mb-1 text-2xl font-bold text-slate-800">My Profile</h1>
        <p className="mb-6 text-sm text-slate-500">
          Update your photo and personal details.
        </p>

        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="relative">
            <img
              src={avatarSrc}
              alt={profile?.name || "avatar"}
              className="h-28 w-28 rounded-full border-4 border-indigo-100 object-cover shadow-lg"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={saving}
              aria-label="Change photo"
              className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md transition hover:bg-indigo-500 disabled:opacity-50"
            >
              <MdCameraAlt size={17} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={saving}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
          >
            {profile?.imagePublicId || preview ? "Replace photo" : "Upload photo"}
          </button>
          <p className="text-xs text-slate-400">
            JPG, PNG or WEBP · up to 5 MB
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onPickImage}
            className="hidden"
          />
        </div>

        {uploadProgress !== null && (
          <div className="mb-4">
            <div className="mb-1 flex justify-between text-xs text-slate-500">
              <span>Uploading photo…</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {message && (
          <p className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
            <MdCheckCircle className="shrink-0" /> {message}
          </p>
        )}
        {error && (
          <p className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
            <MdErrorOutline className="shrink-0" /> {error}
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
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
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
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50"
          >
            {saving
              ? uploadProgress !== null
                ? `Uploading… ${uploadProgress}%`
                : "Saving…"
              : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
