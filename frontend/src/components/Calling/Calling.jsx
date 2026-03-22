import { MdCall, MdCallEnd } from "react-icons/md";

const Calling = ({ callerName, onAnswer, onReject }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 text-white rounded-3xl shadow-2xl w-80 p-6 flex flex-col items-center gap-4 animate-slideFade">

        <div className="relative flex items-center justify-center mt-4">
          <span className="absolute w-28 h-28 rounded-full bg-green-500 opacity-20 animate-ping" />
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-bold z-10 border-4 border-green-400">
            {callerName?.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-400 uppercase tracking-widest">Incoming Call</p>
          <h2 className="text-2xl font-bold mt-1">{callerName}</h2>
        </div>

        <div className="flex items-center justify-center gap-10 mt-2 mb-2">

          <div className="flex flex-col items-center gap-1">
            <button
              onClick={onReject}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
            >
              <MdCallEnd size={28} className="text-white" />
            </button>
            <span className="text-xs text-gray-400">Decline</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button
              onClick={onAnswer}
              className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-500 flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
            >
              <MdCall size={28} className="text-white" />
            </button>
            <span className="text-xs text-gray-400">Answer</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Calling;