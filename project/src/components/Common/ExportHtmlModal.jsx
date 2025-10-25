export default function ExportHtmlModal({
  isOpen,
  html,
  onClose,
  onCopy,
  onDownload,
  onRefresh,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Exporter le code HTML</h2>
            <p className="mt-1 text-sm text-gray-600">
              Copiez ou téléchargez un instantané complet de la page actuelle pour l&apos;utiliser dans un fichier HTML.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            Fermer
          </button>
        </div>
        <div className="border-b border-gray-200 bg-primary-50 px-6 py-3 text-sm text-primary-800">
          ⚠️ Les dépendances (scripts, styles) restent référencées via leurs chemins d&apos;origine. Pour un rendu hors-ligne parfait, assurez-vous de copier les fichiers associés ou d&apos;utiliser un build Vite.
        </div>
        <div className="px-6 py-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onCopy}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              Copier dans le presse-papiers
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              Télécharger (HTML)
            </button>
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              Régénérer le code
            </button>
          </div>
          <label htmlFor="export-html" className="sr-only">
            Code HTML à copier
          </label>
          <textarea
            id="export-html"
            value={html}
            readOnly
            className="h-96 w-full resize-none rounded-md border border-gray-200 bg-gray-50 p-4 font-mono text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
      </div>
    </div>
  );
}
