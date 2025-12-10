import { Workbook } from 'exceljs';
import * as fs from 'file-saver';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export class ExcelExporter {

  static export(
    title: string,
    columns: ExcelColumn[],
    data: any[],
    filename: string
  ) {
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet('Reporte');

    // ========================================
    // 1. PRIMERO: DEFINIR LAS COLUMNAS (CREA LOS ENCABEZADOS AUTOMÁTICOS)
    // ========================================
    sheet.columns = columns.map(col => ({
      header: col.header,
      key: col.key,
      width: col.width || 20
    }));

    // ========================================
    // 2. INSERTAR EL TÍTULO ARRIBA DE LOS HEADERS
    // ========================================
    sheet.insertRow(1, []); // espacio
    sheet.insertRow(1, []); // espacio
    sheet.insertRow(1, [title]);

    const totalCols = columns.length;
    const lastCol = sheet.getColumn(totalCols).letter;

    sheet.mergeCells(`A1:${lastCol}1`);

    const titleCell = sheet.getCell('A1');
    titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0D47A1' }
    };

    // ========================================
    // 3. ESTILAR LOS HEADERS (QUE AHORA ESTÁN EN LA FILA 4)
    // ========================================
    const headerRow = sheet.getRow(4);

    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1565C0' }
      };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // ========================================
    // 4. AGREGAR LOS DATOS DEBAJO DE LOS HEADERS
    // ========================================
    data.forEach(row => {
      sheet.addRow(row);
    });

    // Bordes para la data
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 4) {
        row.eachCell(cell => {
          cell.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });

    // ========================================
    // 5. EXPORTAR ARCHIVO
    // ========================================
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      fs.saveAs(blob, `${filename}.xlsx`);
    });
  }
}
