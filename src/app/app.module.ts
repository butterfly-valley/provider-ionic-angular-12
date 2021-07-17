import {NgModule} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ColorPickerModule } from 'ngx-color-picker';


// translation imports
import {TranslateModule, TranslateLoader, TranslateService} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import { HttpClientModule, HttpClient } from '@angular/common/http';

// reactive forms
import {ReactiveFormsModule} from '@angular/forms';
import {CookieService} from 'ngx-cookie-service';

/*Fullcalendar*/
import { FullCalendarModule } from '@fullcalendar/angular'; // the main connector. must go first
import dayGridPlugin from '@fullcalendar/daygrid'; // a plugin
import interactionPlugin from '@fullcalendar/interaction'; // a plugin
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';

/*FontAwesome*/
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCommentAlt, faCalendarCheck, faSearch, faInfoCircle, faUserCog } from '@fortawesome/free-solid-svg-icons';
import {faSignOutAlt} from '@fortawesome/free-solid-svg-icons/faSignOutAlt';
import {faGlobe} from '@fortawesome/free-solid-svg-icons/faGlobe';

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {BookingmodalComponent} from './components/modals/bookingmodal/bookingmodal.component';
import {ComponentsModule} from './components/components/components.module';
import {AppointmentComponent} from './components/modals/appointment/appointment.component';
import {MessageComponent} from './components/modals/message/message.component';
import {ResetpasswordComponent} from './components/modals/resetpassword/resetpassword.component';
import {ResetpasswordsendComponent} from './components/modals/resetpasswordsend/resetpasswordsend.component';
import {ContactComponent} from './components/modals/contact/contact.component';
import {DeviceDetectorModule} from 'ngx-device-detector';
import {ImageComponent} from './components/modals/image/image.component';
import {EditscheduleComponent} from './components/modals/editschedule/editschedule.component';
import {ScheduleComponent} from './components/modals/schedule/schedule.component';
import {InfoComponent} from './components/popover/info/info.component';
import {ModifySlotComponent} from './components/modals/modifyslot/modify-slot.component';
import {MatPaginatorIntl} from '@angular/material/paginator';
import {CustomMatPaginatorIntl} from './services/localization/CustomMatPaginatorIntl';

import {CalendarComponent} from './components/popover/calendar/calendar.component';
import {CustomerComponent} from './components/modals/customer/customer.component';
import {CreateCustomerComponent} from './components/modals/customer/create-customer/create-customer.component';
import {CampaignComponent} from './components/modals/customer/campaign/campaign.component';
import {PaginatorComponent} from './components/popover/paginator/paginator.component';
import {EmployeeComponent} from './components/modals/employee/employee.component';
import {EditAccountComponent} from './components/modals/edit-account/edit-account.component';
import {EditPageComponent} from './components/modals/edit-page/edit-page.component';
import {NumberPickerModule} from 'ng-number-picker';
import {EditCustomerComponent} from './components/modals/customer/edit-customer/edit-customer.component';
import {ViewconfigComponent} from './components/popover/viewconfig/viewconfig.component';
import {ViewConfigPopoverComponent} from './components/popover/view-config-popover/view-config-popover.component';
import {EditImageComponent} from './components/modals/edit-image/edit-image.component';
import {VideoComponent} from './components/modals/video/video.component';
import {AppSummaryComponent} from './components/modals/app-summary/app-summary.component';
import {SlotPickerComponent} from './components/modals/slot-picker/slot-picker.component';
import {MultipleBookingsComponent} from './components/modals/multiple-bookings/multiple-bookings.component';
import {GuidedTourModule, GuidedTourService} from 'ngx-guided-tour';
import {EmployeeScheduleComponent} from './components/modals/employee/employee-schedule/employee-schedule.component';
import {EditRosterSlotComponent} from './components/modals/employee/edit-roster-slot/edit-roster-slot.component';
import {EditSubdivisionComponent} from './components/modals/edit-subdivision/edit-subdivision.component';
import {TimeoffRequestComponent} from './components/modals/employee/timeoff-request/timeoff-request.component';
import { StickyCalendarHeaderDirective } from './directives/sticky-calendar-header.directive';
import {MatSnackBarModule} from '@angular/material';

FullCalendarModule.registerPlugins([ // register FullCalendar plugins
  dayGridPlugin,
  interactionPlugin,
  timeGridPlugin,
  listPlugin
]);


library.add(faCommentAlt, faCalendarCheck, faSearch, faInfoCircle, faUserCog, faSignOutAlt, faGlobe);
@NgModule({
  declarations: [AppComponent, StickyCalendarHeaderDirective],
  entryComponents: [BookingmodalComponent,
    AppointmentComponent,
    MessageComponent,
    ResetpasswordComponent,
    ResetpasswordsendComponent,
    ContactComponent,
    ImageComponent,
    EditscheduleComponent,
    ScheduleComponent,
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
    EditCustomerComponent,
    ViewconfigComponent,
    ViewConfigPopoverComponent,
    EditImageComponent,
    VideoComponent,
    AppSummaryComponent,
    SlotPickerComponent,
    MultipleBookingsComponent,
    EmployeeScheduleComponent,
    EditRosterSlotComponent,
    EditSubdivisionComponent,
    TimeoffRequestComponent
  ],
  imports: [BrowserModule,
    BrowserAnimationsModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (HttpLoaderFactory),
        deps: [HttpClient]
      }
    }),
    FullCalendarModule,
    FontAwesomeModule,
    /* import modals*/
    ComponentsModule,
    /*device detection*/
    DeviceDetectorModule.forRoot(),
    NumberPickerModule,
    GuidedTourModule,
    ColorPickerModule,
    MatSnackBarModule

  ],
  providers: [
    StatusBar,
    SplashScreen,
    CookieService,
    GuidedTourService,
    {provide: RouteReuseStrategy, useClass: IonicRouteStrategy},
    {provide: MatPaginatorIntl, deps: [TranslateService],
      useFactory: (translateService: TranslateService) => new CustomMatPaginatorIntl(translateService).getPaginatorIntl()}

  ],
  exports: [
  ],
  bootstrap: [AppComponent],

})
export class AppModule {}

// Translation factory loader
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}
