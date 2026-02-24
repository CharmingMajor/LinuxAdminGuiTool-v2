import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`bg-surface-50 border border-zinc-800 rounded-2xl shadow-2xl ${wide ? 'w-full max-w-2xl' : 'w-full max-w-md'} max-h-[85vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-200 text-zinc-400 hover:text-zinc-200 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
