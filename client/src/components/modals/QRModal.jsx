

export function QRModal({ trackingNumber, qrCode, onClose, onDone }) {
  const handlePrint = () => {
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <body style="text-align:center;font-family:monospace;padding:32px">
          <h3 style="margin-bottom:4px;font-size:16px">meroBhariya</h3>
          <p style="font-size:11px;color:#888;margin-bottom:16px">Package label — stick on package before handoff</p>
          <img src="${qrCode}" style="width:200px;height:200px" />
          <p style="font-size:15px;margin-top:12px;letter-spacing:3px;font-weight:bold">${trackingNumber}</p>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-xs shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Shipment created!</h2>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Print the label and stick it on the package</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300">
            <X size={16} />
          </button>
        </div>

        {/* QR code */}
        <div className="bg-white rounded-xl p-4 flex flex-col items-center mb-4 border border-gray-100">
          <img src={qrCode} alt={trackingNumber} className="w-48 h-48" />
          <p className="font-mono text-sm font-bold text-gray-900 mt-2 tracking-widest">
            {trackingNumber}
          </p>
          <p className="text-xs text-gray-400 mt-1">Dispatcher scans this at the hub</p>
        </div>

        <div className="space-y-2">
          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-all"
          >
            <Printer size={14} /> Print label
          </button>
          <button
            onClick={onDone}
            className="w-full py-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-sm rounded-lg transition-all"
          >
            Done — view shipments
          </button>
        </div>
      </div>
    </div>
  );
}
