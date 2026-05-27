import * as XLSX from 'xlsx';

export function exportToExcel(data: any[], fileName: string) {
  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Convert the array of objects to a worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, "Données");
  
  // Trigger a download in the browser
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}
