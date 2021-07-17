import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {FlatTreeControl} from '@angular/cdk/tree';
import {ScheduleCategory} from '../../../store/models/provider.model';
import {faSlidersH} from '@fortawesome/free-solid-svg-icons';
import {ScheduleService} from "../../../services/user/schedule.service";

interface TreeFlatNode {
    expandable: boolean;
    name: string;
    level: number;
    scheduleId?: string;
}

interface ScheduleNode {
    name: string;
    children?: ScheduleNode[];
    scheduleId?: string;
    freeSchedule: boolean;
}


@Component({
    selector: 'app-tree',
    templateUrl: './tree.component.html',
    styleUrls: ['./tree.component.scss']

})
export class TreeComponent implements OnInit {

    @Input() scheduleCategories: ScheduleCategory[];
    @Input() schedulePage: boolean;
    @Output() addSchedule = new EventEmitter<Array<any>>();
    @Output() openSchedule = new EventEmitter<string>();
    @Output() editSchedule = new EventEmitter<string>();
    @Output() deleteSchedule = new EventEmitter<string>();

    treeControl = new FlatTreeControl<TreeFlatNode>(
        node => node.level, node => node.expandable);
    treeFlattener;
    dataSource;

    constructor(public scheduleService: ScheduleService) { }

    ngOnInit() {
        const scheduleData: ScheduleNode[] = [];
        this.scheduleCategories.forEach(
            scheduleCategory => {
                const schedules: ScheduleNode[] = [];
                scheduleCategory.schedules.forEach(
                    schedule => {
                        schedules.push(
                            {
                                name: schedule.scheduleName,
                                scheduleId: schedule.scheduleId,
                                freeSchedule: schedule.freeSchedule
                            }
                        );
                    }

                );
                scheduleData.push(
                    {
                        freeSchedule: false,
                        name: scheduleCategory.category,
                        children: schedules
                    }
                );
            }
        );
        this.treeFlattener = new MatTreeFlattener(
            this._transformer, node => node.level, node => node.expandable, node => node.children);
        this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
        this.dataSource.data = scheduleData;
    }


    // tslint:disable-next-line:variable-name
    private _transformer = (node: ScheduleNode, level: number) => {
        return {
            expandable: !!node.children && node.children.length > 0,
            name: node.name,
            level: level,
            scheduleId: node.scheduleId,
            freeSchedule: node.freeSchedule
        };
    }

    hasChild = (_: number, node: TreeFlatNode) => node.expandable;

    iconName(node: any) {
        return this.treeControl.isExpanded(node) ? 'arrow-down' : 'arrow-forward';
    }

    addScheduleIds(scheduleDetails: any, event: any) {
        const scheduleEvent = [];
        scheduleEvent.push(scheduleDetails);
        scheduleEvent.push(event);
        this.addSchedule.emit(scheduleEvent);
    }

    editScheduleInParent(scheduleId: any) {
        this.editSchedule.emit(scheduleId);

    }

    openScheduleInParent(scheduleId: string) {
        this.openSchedule.emit(scheduleId);
    }

    deleteScheduleInParent(scheduleId: any) {
        this.deleteSchedule.emit(scheduleId);
    }
}
