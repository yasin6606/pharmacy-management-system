import { Parser } from 'json2csv';

export class CSVExporter {
  export(data: any[], fields?: string[]): string {
    const parser = new Parser({ fields });
    return parser.parse(data);
  }
}
