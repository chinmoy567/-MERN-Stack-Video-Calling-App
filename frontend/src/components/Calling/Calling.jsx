import { MdCall, MdCallEnd } from "react-icons/md";

const Calling = ({ callerName, callType = "video", onAnswer, onReject }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="glass-card tilt-card w-full max-w-xs sm:max-w-sm p-6 flex flex-col items-center gap-4 text-white animate-slideFade [perspective:1000px]">

        <div className="relative flex items-center justify-center mt-4">
          <span className="absolute w-28 h-28 rounded-full bg-emerald-500 opacity-20 animate-ping" />
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-3xl font-bold z-10 border-4 border-emerald-400 shadow-lg shadow-indigo-900/40">
            {callerName?.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-slate-400 uppercase tracking-widest">
            Incoming {callType === "audio" ? "Audio" : "Video"} Call
          </p>
          <h2 className="text-2xl font-bold mt-1 truncate max-w-full">{callerName}</h2>
        </div>

        <div className="flex items-center justify-center gap-8 sm:gap-10 mt-2 mb-2">

          <div className="flex flex-col items-center gap-1">
            <button
              onClick={onReject}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 flex items-center justify-center shadow-lg shadow-red-950/40 transition-all hover:scale-110 active:scale-95"
            >
              <MdCallEnd size={28} className="text-white" />
            </button>
            <span className="text-xs text-slate-400">Decline</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button
              onClick={onAnswer}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-950/40 transition-all hover:scale-110 active:scale-95"
            >
              <MdCall size={28} className="text-white" />
            </button>
            <span className="text-xs text-slate-400">Answer</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Calling;