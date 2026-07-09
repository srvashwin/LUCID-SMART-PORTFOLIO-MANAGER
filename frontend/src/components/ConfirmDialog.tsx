import { motion, AnimatePresence } from 'framer-motion'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="glass rounded-xl p-6 w-80 max-w-full"
          >
            <h3 className="text-base font-semibold text-ivory mb-2">{title}</h3>
            <p className="text-sm text-ash mb-5 leading-relaxed">{message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={onCancel}
                className="text-sm text-ash hover:text-ivory transition-colors px-3 py-1.5 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="text-sm text-white bg-red-500 hover:bg-red-400 transition-colors px-4 py-1.5 rounded-lg font-medium"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
