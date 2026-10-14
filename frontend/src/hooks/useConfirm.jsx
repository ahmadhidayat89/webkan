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
        <button
          type="button"
          aria-label="Batalkan konfirmasi"
          className="absolute inset-0 border-0 bg-black/40 p-0 backdrop-blur-sm"
          onClick={() => handleChoice(false)}
        />

        {/* Dialog */}
        <div className="relative w-full max-w-sm p-6 duration-150 bg-white shadow-2xl rounded-2xl animate-in fade-in zoom-in">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-amber-100 rounded-xl">
              <FaExclamationTriangle className="text-lg text-amber-500" />
            </div>

            <div className="flex-1 pt-1">
              <h3 className="mb-1 text-sm font-black text-gray-900">
                Konfirmasi
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                {state.message}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-5">
            <button
              onClick={() => handleChoice(false)}
              className="px-4 py-2 text-sm font-bold text-gray-600 transition-colors bg-gray-100 hover:bg-gray-200 rounded-xl"
            >
              Batal
            </button>

            <button
              onClick={() => handleChoice(true)}
              className="px-4 py-2 text-sm font-bold text-white transition-colors bg-red-600 hover:bg-red-700 rounded-xl"
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
