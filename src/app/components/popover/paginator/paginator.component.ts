import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {PageEvent} from "@angular/material/paginator";
import {PopoverController} from "@ionic/angular";


@Component({
    selector: 'app-paginator',
    templateUrl: './paginator.component.html',
    styleUrls: ['./paginator.component.scss'],
})
export class PaginatorComponent {
    @Input() total;
    @Input()  bookanapp: boolean;
    @Input() customersPerPage;
    @Input()  pageIndex: any;
    @Input()  searchTerm: any;

    constructor(private popoverController: PopoverController) { }

    async paginator(event: PageEvent) {
        await this.popoverController.dismiss(
            {
                paginatorEvent: event,
                bookanapp: this.bookanapp,
                pageIndex: event.pageIndex,
                searchTerm: this.searchTerm
            }
        );
    }
}
