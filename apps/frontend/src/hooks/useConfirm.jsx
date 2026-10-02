import { useState } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

/**
 * useConfirm — replaces window.confirm() with a styled inline dialog.
 *
 * Usage:
 *   const { confirm, ConfirmDialog } = useConfirm();
 *   // In JSX: <ConfirmDialog />
 *   // In handler: if (!(await confirm('Hapus item ini?'))) return;
 */
export function useConfirm() {
  const [state, setState] = useState({ open: false, message: '', resolve: null });

  const confirm = (message) =>
    new Promise((resolve) => {
      setState({ open: true, message, resolve });
    });

  const handleChoice = (value) => {
    state.resolve(value);
    setState({ open: false, message: '', resolve: null });
  };

  const ConfirmDialog = () => {
    if (!state.open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => handleChoice(false)}
        />
        {/* Dialog */}
        <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-150">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FaExclamationTriangle className="text-amber-500 text-lg" />
            </div>
            <div className="flex-1 pt-1">
              <h3 className="text-sm font-black text-gray-900 mb-1">Konfirmasi</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{state.message}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-5 justify-end">
            <button
              onClick={() => handleChoice(false)}
              className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              onClick={() => handleChoice(true)}
              className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    );
  };

  return { confirm, ConfirmDialog };
}
