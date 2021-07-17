import {MatPaginatorIntl} from "@angular/material/paginator";
import {TranslateService} from "@ngx-translate/core";

export class CustomMatPaginatorIntl {

    constructor(private readonly translate: TranslateService) {}

    getPaginatorIntl(): MatPaginatorIntl {
        const paginatorIntl = new MatPaginatorIntl();
        paginatorIntl.itemsPerPageLabel = this.translate.instant('items-per-page');
        paginatorIntl.nextPageLabel = this.translate.instant('next-page');
        paginatorIntl.previousPageLabel = this.translate.instant('previous-page');
        paginatorIntl.firstPageLabel = this.translate.instant('first-page');
        paginatorIntl.lastPageLabel = this.translate.instant('last-page');
        paginatorIntl.getRangeLabel = this.getRangeLabel.bind(this);
        return paginatorIntl;
    }

    private getRangeLabel(page: number, pageSize: number, length: number): string {
        if (length === 0 || pageSize === 0) {
            return this.translate.instant('RANGE_PAGE_LABEL_1', { length });
        }
        length = Math.max(length, 0);
        const startIndex = page * pageSize;
        // If the start index exceeds the list length, do not try and fix the end index to the end.
        const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
        return this.translate.instant('RANGE_PAGE_LABEL_2', { startIndex: startIndex + 1, endIndex, length });
    }
}
