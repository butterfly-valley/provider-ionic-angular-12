import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MultipleSpotInfo} from '../../../services/search/search.service';
import {mobile, tablet} from 'src/app/app.component';
import {LocalizationService} from '../../../services/localization/localization.service';
import {DateTimeUtilService} from '../../../services/util/date-time-util.service';
import {ModalService} from '../../../services/overlay/modal.service';
import {AppointmentComponent} from "../appointment/appointment.component";
import {scheduleIcon} from "../../../pages/user/user.page";

@Component({
  selector: 'app-app-summary',
  templateUrl: './app-summary.component.html',
  styleUrls: ['./app-summary.component.scss'],
})
export class AppSummaryComponent implements OnDestroy{
  @Input() appSummary: MultipleSpotInfo[];
  @Input() date: string;
  @Input() duration: number;
  @Input() scheduleId: string;

  mobile = mobile;
  tablet = tablet;
  locale = this.translate.getLocale();

  scheduleIcon = scheduleIcon;

  constructor(private translate: LocalizationService,
              public dateTimeUtil: DateTimeUtilService,
              private modalService: ModalService) { }


  async dismiss() {
    await this.modalService.dismissAppSummaryModal();
  }

  ngOnDestroy() {
    this.dismiss();
  }

  showDateTime() {

  }

  async showAppointment(appointmentId: string) {
    const locale = this.translate.getLocale();
    let cssClass = '';
    if (!mobile) {
      cssClass = 'appointment-modal';
    }
    await this.modalService.openAppointmentModal(AppointmentComponent, appointmentId, locale, cssClass, false, false, this.scheduleId);
  }


}
