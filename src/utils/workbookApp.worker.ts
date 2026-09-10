import { readWorkbookApp, validateWorkbookApp } from './workbookApp';
self.onmessage = ({ data }) => {
  try { self.postMessage({ result: data.kind === 'read' ? readWorkbookApp(data.buffer, data.name, data.headerRows) : validateWorkbookApp(data.app) }); }
  catch (error) { self.postMessage({ error: error instanceof Error ? error.message : 'Unable to process workbook.' }); }
};
