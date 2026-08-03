import {AppDataSource} from '../../core/config/database';
import {SaleTransaction} from '../sales/entities/SaleTransaction';
import * as csv from 'json2csv';
import PDFDocument from 'pdfkit';
import {paginate} from '../../core/utils/pagination';

export class ReportingService {
    /**
     * Builds the base query for aggregated sales.
     */
    private buildSalesQuery(filters: any) {
        const query = AppDataSource.getRepository(SaleTransaction)
            .createQueryBuilder('sale')
            .select('DATE(sale.soldDate)', 'date')
            .addSelect('branch.name', 'branch')
            .addSelect('employee.full_name', 'employee')
            .addSelect('drug.name', 'drug')
            .addSelect('SUM(sale.quantity)', 'totalQuantity')
            .addSelect('SUM(sale.totalPrice)', 'totalRevenue')
            .leftJoin('sale.branch', 'branch')
            .leftJoin('sale.employee', 'employee')
            .leftJoin('sale.drugBatch', 'batch')
            .leftJoin('batch.drug', 'drug')
            .groupBy('DATE(sale.soldDate)')
            .addGroupBy('branch.id')
            .addGroupBy('employee.id')
            .addGroupBy('drug.id');

        if (filters.startDate) query.andWhere('sale.soldDate >= :startDate', {startDate: filters.startDate});
        if (filters.endDate) query.andWhere('sale.soldDate <= :endDate', {endDate: filters.endDate});
        if (filters.branchId) query.andWhere('sale.branchId = :branchId', {branchId: filters.branchId});

        return query;
    }

    /**
     * Paginated aggregated sales for the JSON response.
     */
    async getAggregatedSalesPaginated(
        filters: any,
        paginationOptions: { page?: number; limit?: number }
    ) {
        const query = this.buildSalesQuery(filters);
        // Use a sub-query to paginate grouped results
        const rawData = await query.getRawMany();

        // Manual pagination (since GROUP BY + paginate doesn't work directly)
        const total = rawData.length;
        const page = Math.max(1, paginationOptions.page || 1);
        const limit = Math.min(100, Math.max(1, paginationOptions.limit || 10));
        const skip = (page - 1) * limit;
        const items = rawData.slice(skip, skip + limit);

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Unpaginated aggregated sales (for CSV/PDF export).
     */
    async getAggregatedSales(filters: any) {
        const query = this.buildSalesQuery(filters);
        return query.getRawMany();
    }

    generateCSV(data: any[]): string {
        if (data.length === 0) return '';
        const parser = new csv.Parser({fields: Object.keys(data[0])});
        return parser.parse(data);
    }

    generatePDF(data: any[]): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument();
            const buffers: Buffer[] = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            doc.fontSize(16).text('Sales Report', {align: 'center'});
            doc.moveDown();
            data.forEach((row, i) => {
                doc.fontSize(10).text(`${i + 1}. ${JSON.stringify(row)}`);
            });
            doc.end();
        });
    }
}
