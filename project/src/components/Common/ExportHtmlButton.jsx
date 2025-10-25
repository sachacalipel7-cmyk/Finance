import { useCallback, useState } from 'react';
import ExportHtmlModal from './ExportHtmlModal';
import { useNotifications } from '../../contexts/NotificationContext';

function buildDoctypeString(doctype) {
  if (!doctype) {
    return '<!DOCTYPE html>';
  }

  const publicId = doctype.publicId ? ` "${doctype.publicId}"` : '';
  const systemId = doctype.systemId ? ` "${doctype.systemId}"` : '';

  return `<!DOCTYPE ${doctype.name}${publicId}${systemId}>`;
}

function captureFullHtml() {
  if (typeof document === 'undefined') {
    return '';
  }

  const doctype = buildDoctypeString(document.doctype);
  const html = document.documentElement?.outerHTML ?? '';

  return `${doctype}\n${html}`.trim();
}

export default function ExportHtmlButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [htmlSnapshot, setHtmlSnapshot] = useState('');
  const { notify } = useNotifications();

  const refreshSnapshot = useCallback(
    (silent = false) => {
      try {
        const snapshot = captureFullHtml();
        setHtmlSnapshot(snapshot);
        if (!silent) {
          notify({
            type: 'info',
            title: 'Instantané mis à jour',
            message: "Le code HTML reflète maintenant l'état actuel de la page.",
            duration: 3000,
          });
        }
      } catch (error) {
        notify({
          type: 'error',
          title: 'Export impossible',
          message: "Nous n'avons pas pu récupérer le code HTML (voir la console).",
        });
        // eslint-disable-next-line no-console
        console.error('Failed to capture HTML snapshot', error);
      }
    },
    [notify],
  );

  const openModal = useCallback(() => {
    refreshSnapshot(true);
    setIsOpen(true);
  }, [refreshSnapshot]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const copyToClipboard = useCallback(async () => {
    const text = htmlSnapshot || captureFullHtml();

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      notify({
        type: 'success',
        title: 'HTML copié',
        message: 'Le code complet est disponible dans votre presse-papiers.',
        duration: 3000,
      });
    } catch (error) {
      notify({
        type: 'error',
        title: 'Copie impossible',
        message: 'Votre navigateur a refusé la copie automatique.',
      });
      // eslint-disable-next-line no-console
      console.error('Failed to copy HTML snapshot', error);
    }
  }, [htmlSnapshot, notify]);

  const downloadHtml = useCallback(() => {
    try {
      const text = htmlSnapshot || captureFullHtml();
      const blob = new Blob([text], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'finadvisor-export.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      notify({
        type: 'success',
        title: 'Téléchargement lancé',
        message: "Un fichier HTML vient d'être généré dans votre dossier de téléchargements.",
        duration: 3000,
      });
    } catch (error) {
      notify({
        type: 'error',
        title: 'Téléchargement impossible',
        message: "Impossible de générer le fichier HTML (voir la console).",
      });
      // eslint-disable-next-line no-console
      console.error('Failed to download HTML snapshot', error);
    }
  }, [htmlSnapshot, notify]);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="w-full rounded-lg border border-gray-200 px-4 py-3 text-left text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-400"
      >
        <span className="flex items-center space-x-3">
          <span className="text-xl" aria-hidden="true">
            📄
          </span>
          <span>Exporter le HTML complet</span>
        </span>
      </button>

      <ExportHtmlModal
        isOpen={isOpen}
        html={htmlSnapshot}
        onClose={closeModal}
        onCopy={copyToClipboard}
        onDownload={downloadHtml}
        onRefresh={() => refreshSnapshot(false)}
      />
    </>
  );
}
