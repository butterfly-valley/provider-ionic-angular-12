import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ToolbarComponent} from '../toolbar/toolbar.component';
import {IonicModule} from '@ionic/angular';
import {TranslateModule} from '@ngx-translate/core';
import {RouterModule} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {LanguagePickerComponent} from '../languagepicker/languagepicker.component';
import {MainmenuComponent} from '../menus/mainmenu/mainmenu.component';
import {AutocompleteComponent} from '../autocomplete/autocomplete.component';
import { AgmCoreModule } from '@agm/core';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {UserDropdownComponent} from '../userdropdown/userdropdown.component';
import {
    MatDatepickerModule,
    MatDialogModule,
    MatIconModule, MatInputModule,
    MatNativeDateModule,
    MatSelectModule,
    MatStepperModule,
    MatTreeModule
} from '@angular/material';
import {ViewconfigComponent} from '../popover/viewconfig/viewconfig.component';
import {BookingmodalComponent} from '../modals/bookingmodal/bookingmodal.component';
import {AppointmentComponent} from '../modals/appointment/appointment.component';
import {MessageComponent} from '../modals/message/message.component';
import {AutosizeModule} from 'ngx-autosize';
import {ResetpasswordComponent} from '../modals/resetpassword/resetpassword.component';
import {ResetpasswordsendComponent} from '../modals/resetpasswordsend/resetpasswordsend.component';
import {ContactComponent} from '../modals/contact/contact.component';
import { NgxCaptchaModule } from 'ngx-captcha';
import {TermsComponent} from '../popover/terms/terms.component';
import {ImageComponent} from '../modals/image/image.component';
import {TreeComponent} from '../material/tree/tree.component';
import {FullCalendarScheduleComponent} from '../calendar/fullcalendar/fullcalendar.component';
import {FullCalendarModule} from '@fullcalendar/angular';
import {EditscheduleComponent} from '../modals/editschedule/editschedule.component';
import {MatExpansionModule} from '@angular/material/expansion';
import {ScheduleComponent} from '../modals/schedule/schedule.component';
import {InfoComponent} from '../popover/info/info.component';
import {ModifySlotComponent} from '../modals/modifyslot/modify-slot.component';
import {TimepickerComponent} from '../timepicker/timepicker.component';
import {CalendarComponent} from '../popover/calendar/calendar.component';
import {CustomerComponent} from '../modals/customer/customer.component';
import {ImageloaderModule} from '../imageloader/imageloader.module';
import {BsDropdownModule} from 'ngx-bootstrap';
import {NgxIntlTelInputModule} from 'ngx-intl-tel-input';
import {MatPaginatorModule} from '@angular/material/paginator';
import {CreateCustomerComponent} from '../modals/customer/create-customer/create-customer.component';
import {CampaignComponent} from '../modals/customer/campaign/campaign.component';
import {PaginatorComponent} from '../popover/paginator/paginator.component';
import {EmployeeComponent} from '../modals/employee/employee.component';
import {EditAccountComponent} from '../modals/edit-account/edit-account.component';
import {OrderTranslatePipe} from '../../pipes/order-translate.pipe';
import {EditPageComponent} from '../modals/edit-page/edit-page.component';
import {NumberPickerModule} from 'ng-number-picker';
import {MatCardModule} from '@angular/material/card';
import {EditCustomerComponent} from '../modals/customer/edit-customer/edit-customer.component';
import {ViewConfigPopoverComponent} from '../popover/view-config-popover/view-config-popover.component';
import {EditImageComponent} from "../modals/edit-image/edit-image.component";
import {ImageCropperModule} from "ngx-image-cropper";
import {VideoComponent} from "../modals/video/video.component";
import {SlotPickerComponent} from "../modals/slot-picker/slot-picker.component";
import {AppSummaryComponent} from "../modals/app-summary/app-summary.component";
import {MultipleBookingsComponent} from "../modals/multiple-bookings/multiple-bookings.component";
import {GuidedTourModule} from 'ngx-guided-tour';
import {DesktopMenuComponent} from '../menus/desktop-menu/desktop-menu.component';
import {EmployeeScheduleComponent} from '../modals/employee/employee-schedule/employee-schedule.component';
import {ColorPickerModule} from 'ngx-color-picker';
import {RosterComponent} from '../calendar/roster/roster.component';
import {EditRosterSlotComponent} from '../modals/employee/edit-roster-slot/edit-roster-slot.component';
import {EditSubdivisionComponent} from '../modals/edit-subdivision/edit-subdivision.component';
import {NgbTimepickerModule} from '@ng-bootstrap/ng-bootstrap';
import {WeekdayPickerComponent} from '../calendar/weekday-picker/weekday-picker.component';
import {DraggableEventComponent} from '../calendar/fullcalendar/draggable-event/draggable-event.component';
import {RosterListComponent} from '../calendar/roster-list/roster-list.component';
import {TimeOffComponent} from '../calendar/time-off/time-off.component';
import {NoSanitizePipe} from '../../pipes/no-sanitize.pipe';
import {TimeoffRequestComponent} from '../modals/employee/timeoff-request/timeoff-request.component';



@NgModule({
    declarations: [ToolbarComponent,
        LanguagePickerComponent,
        MainmenuComponent,
        AutocompleteComponent,
        UserDropdownComponent,
        ViewconfigComponent,
        BookingmodalComponent,
        AppointmentComponent,
        MessageComponent,
        ResetpasswordComponent,
        ResetpasswordsendComponent,
        ContactComponent,
        TermsComponent,
        ImageComponent,
        TreeComponent,
        FullCalendarScheduleComponent,
        EditscheduleComponent,
        ScheduleComponent,
        InfoComponent,
        ModifySlotComponent,
        TimepickerComponent,
        CalendarComponent,
        CustomerComponent,
        CreateCustomerComponent,
        CampaignComponent,
        PaginatorComponent,
        EmployeeComponent,
        EditAccountComponent,
        EditPageComponent,
        OrderTranslatePipe,
        EditCustomerComponent,
        ViewConfigPopoverComponent,
        EditImageComponent,
        VideoComponent,
        SlotPickerComponent,
        AppSummaryComponent,
        MultipleBookingsComponent,
        DesktopMenuComponent,
        EmployeeScheduleComponent,
        RosterComponent,
        EditRosterSlotComponent,
        EditSubdivisionComponent,
        WeekdayPickerComponent,
        DraggableEventComponent,
        RosterListComponent,
        TimeOffComponent,
        NoSanitizePipe,
        TimeoffRequestComponent
    ],
    exports: [ToolbarComponent,
        MainmenuComponent,
        AutocompleteComponent,
        LanguagePickerComponent,
        UserDropdownComponent,
        ViewconfigComponent,
        BookingmodalComponent,
        ResetpasswordComponent,
        ResetpasswordsendComponent,
        ContactComponent,
        TermsComponent,
        ImageComponent,
        TreeComponent,
        FullCalendarScheduleComponent,
        InfoComponent,
        ModifySlotComponent,
        CalendarComponent,
        CustomerComponent,
        CreateCustomerComponent,
        CampaignComponent,
        PaginatorComponent,
        EmployeeComponent,
        EditAccountComponent,
        EditPageComponent,
        OrderTranslatePipe,
        EditCustomerComponent,
        ViewConfigPopoverComponent,
        EditImageComponent,
        VideoComponent,
        SlotPickerComponent,
        AppSummaryComponent,
        MultipleBookingsComponent,
        DesktopMenuComponent,
        EmployeeScheduleComponent, RosterComponent,
        EditRosterSlotComponent,
        EditSubdivisionComponent,
        WeekdayPickerComponent,
        DraggableEventComponent,
        RosterListComponent,
        TimeOffComponent,
        NoSanitizePipe,
        TimeoffRequestComponent
    ],
    imports: [
        CommonModule,
        IonicModule,
        TranslateModule.forChild(),
        RouterModule,
        ReactiveFormsModule,
        AgmCoreModule.forRoot({
            apiKey: 'AIzaSyDm5F2ZmWc2yxVZqBsVLme8dfLPS5EGN9Y',
            libraries: ['places'],
        }),
        FontAwesomeModule,
        MatSelectModule,
        MatNativeDateModule,
        MatDatepickerModule,
        AutosizeModule,
        MatDialogModule,
        NgxCaptchaModule,
        MatTreeModule,
        MatIconModule,
        FullCalendarModule,
        MatExpansionModule,
        MatStepperModule,
        MatInputModule,
        FormsModule,
        ImageloaderModule,
        BsDropdownModule.forRoot(),
        NgxIntlTelInputModule,
        MatPaginatorModule,
        NumberPickerModule,
        MatCardModule,
        ImageCropperModule,
        GuidedTourModule,
        ColorPickerModule,
        NgbTimepickerModule,

    ]


})
export class ComponentsModule { }
