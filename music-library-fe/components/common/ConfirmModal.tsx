"use client";

interface Props {
    title: string;
    message: string;
    icon?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({
    title,
    message,
    icon = "⚠️",
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    danger = false,
    loading = false,
    onConfirm,
    onCancel,
}: Props) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !loading && onCancel()} />
            <div className="glass rounded-2xl p-6 w-full max-w-sm relative slide-up text-center">
                <p className="text-3xl mb-4">{icon}</p>
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>{message}</p>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="btn-glass text-sm !py-2 !px-5"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`text-sm font-semibold py-2 px-5 rounded-xl transition ${danger
                                ? "bg-gradient-to-r from-red-500 to-orange-500 text-white hover:shadow-lg hover:shadow-red-500/25"
                                : "btn-accent"
                            }`}
                    >
                        {loading ? "Processing..." : confirmLabel}
                    </button>
                </div>

                <button
                    onClick={() => !loading && onCancel()}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition text-sm"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
