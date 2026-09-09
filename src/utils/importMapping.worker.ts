import { inspectWorkbook, reviewMapping } from './importMapping';
self.onmessage = ({ data }) => {
  try {
    const result = data.kind === 'inspect' ? inspectWorkbook(data.buffer, data.headerRow) : reviewMapping(data.buffer, data.options, data.offerings, data.actions, data.quarter);
    self.postMessage({ result });
  } catch (error) { self.postMessage({ error: error instanceof Error ? error.message : 'Unable to read workbook.' }); }
};
