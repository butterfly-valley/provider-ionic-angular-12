import {Injectable} from '@angular/core';
import {ModalController} from '@ionic/angular';
import {MultipleSpotInfo} from '../search/search.service';
import {Employee, OpsHours, PickedSchedule, Provider} from '../../store/models/provider.model';



@Injectable({
  providedIn: 'root'
})
export class ModalService {

  bookingModal: HTMLIonModalElement;
  appointmentModal: HTMLIonModalElement;
  messageModal: HTMLIonModalElement;
  profileModal: HTMLIonModalElement;
  resetPasswordEmailSendModal: HTMLIonModalElement;
  resetPasswordModal: HTMLIonModalElement;
  contactModal: HTMLIonModalElement;
  imageModal: HTMLIonModalElement;
  ediScheduleModal: HTMLIonModalElement;
  scheduleModal: HTMLIonModalElement;
  modifySlotModal: HTMLIonModalElement;
  customerModal: HTMLIonModalElement;
  createCustomerModal: HTMLIonModalElement;
  campaignModal: HTMLIonModalElement;
  employeeModal: HTMLIonModalElement;
  editAccountModal: HTMLIonModalElement;
  editPageModal: HTMLIonModalElement;
  editCustomerModal: HTMLIonModalElement;
  editImageModal: HTMLIonModalElement;
  videoModal: HTMLIonModalElement;
  slotPickerModal: HTMLIonModalElement;
  appSummaryModal: HTMLIonModalElement;
  multipleBookingsModal: HTMLIonModalElement;
  employeeScheduleModal: HTMLIonModalElement;
  rosterSlotModal: HTMLIonModalElement;
  ediSubdivisionModal: HTMLIonModalElement;
  timeOffRequestModal: HTMLIonModalElement;

  timeOffRequestOpen = false;
  ediSubdivisionOpen = false;
  rosterSlotModalOpen = false;
  employeeScheduleModalOpen = false;
  multipleBookingsModalOpen = false;
  appSummaryModalOpen = false;
  slotPickerModalOpen = false;
  videoModalOpen = false;
  editImageModalOpen = false;
  editCustomerModalOpen = false;
  editPageModalOpen = false;
  editAccountModalOpen = false;
  employeeModalOpen = false;
  campaignModalOpen = false;
  createCustomerModalOpen = false;
  customerModalOpen = false;
  modifySlotModalOpen = false;
  newScheduleModalOpen = false;
  scheduleModalOpen = false;
  contactModalOpen = false;
  bookingModalOpen = false;
  appointmentModalOpen = false;
  messageModalOpen = false;
  profileModalOpen = false;
  resetPasswordEmailSendModalOpen = false;
  resetPasswordModalOpen = false;
  imageModalOpen = false;


  constructor(private modalCtrl: ModalController) {
  }

  /*open booking modal with booking form*/
  async openBookingModal(component: any, calEvent: any, locale: string, cssClass: string, scheduleName, presentingElement, scheduleId?, start?, end?, fullCalendar?, simplified?, freeSchedule?) {
    if (!this.bookingModalOpen) {
      this.bookingModal = await this.modalCtrl.create({
        component: component,
        componentProps: {
          calEvent,
          locale,
          start,
          end,
          scheduleId,
          fullCalendar,
          simplified,
          scheduleName,
          freeSchedule
        },
        cssClass: cssClass,
        backdropDismiss: false,
        swipeToClose: true,
        presentingElement: presentingElement
      });
      return this.bookingModal.present().then(
          () => {
            this.bookingModalOpen = true;
          }
      );
    }
  }

  /*open schedule edit modal with booking form*/
  async openScheduleEditModal(component: any, scheduleId: string, cssClass: string, presentingElement) {
    if (!this.scheduleModalOpen) {
      this.ediScheduleModal = await this.modalCtrl.create({
        component: component,
        componentProps: {
          scheduleId
        },
        cssClass: cssClass,
        backdropDismiss: false,
        swipeToClose: true,
        presentingElement: presentingElement
      });
      return this.ediScheduleModal.present().then(
          () => {
            this.scheduleModalOpen = true;
          }
      );
    }
  }

  /*open new schedule modal with booking form*/
  async openScheduleModal(component: any, cssClass: string, freeSchedule, presentingElement) {
    if (!this.newScheduleModalOpen) {
      this.scheduleModal = await this.modalCtrl.create({
        component: component,
        componentProps: {
          freeSchedule
        },
        cssClass: cssClass,
        swipeToClose: true,
        backdropDismiss: false,
        presentingElement: presentingElement
      });
      return this.scheduleModal.present().then(
          () => {
            this.newScheduleModalOpen = true;
          }
      );
    }
  }

  /*open message modal with message form*/
  async openMessageModal(component: any, cssClass: string, presentingElement, dateTime?: string, appointmentId?: number, threadId?: number,
                         userName?: string, refresh?, swipe?, enter?, leave?, close?) {
    if (!this.messageModalOpen) {
      this.messageModal = await this.modalCtrl.create({
        component: component,
        componentProps: {
          dateTime,
          appointmentId,
          threadId,
          userName,
          refresh,
          swipe,
          close
        },
        cssClass: cssClass,
        backdropDismiss: false,
        swipeToClose: swipe,
        presentingElement: presentingElement
      });
      return this.messageModal.present().then(() => {
        this.messageModalOpen = true;
      });
    }
  }

  /*open profile modal for editing*/
  async openProfileModal(component: any, field: string, emailNotification: boolean, presentingElement) {
    if (!this.profileModalOpen) {
      this.profileModal = await this.modalCtrl.create({
        component: component,
        componentProps: {
          field,
          emailNotification
        },
        backdropDismiss: false,
        swipeToClose: true,
        presentingElement: presentingElement
      });
      return this.profileModal.present().then(() => {
        this.profileModalOpen = true;
      });
    }
  }

  /*open profile modal for editing*/
  async openImageModal(component: any, image: string) {
    if (!this.imageModalOpen) {
      this.imageModal = await this.modalCtrl.create({
        component: component,
        componentProps: {
          image
        },
        backdropDismiss: false,
        swipeToClose: true,

      });
      return this.imageModal.present().then(() => {
        this.imageModalOpen = true;
      });
    }
  }

  /*open appointment details modal form*/
  async openAppointmentModal(component: any, appointmentId: string, locale: string, cssClass: string, appPage: boolean, history?: boolean, scheduleId?: string,
                             start?, end?, fullcalendar?, presentingElement?, swipe?, enter?, leave?) {
    if (!this.appointmentModalOpen) {
      this.appointmentModal = await this.modalCtrl.create({
        component: component,
        componentProps: {
          appointmentId,
          locale,
          history,
          appPage,
          scheduleId,
          start,
          end,
          fullcalendar,
          swipe

        },
        cssClass: cssClass,
        backdropDismiss: false,
        swipeToClose: swipe,
        presentingElement: presentingElement
      });
      return this.appointmentModal.present().then(() => {
        this.appointmentModalOpen = true;
      });
    }
  }

  /*open reset password modal send email*/
  async resetPasswordSendEmailModal(component: any, cssClass: string, presentingElement) {
    if (!this.resetPasswordEmailSendModalOpen) {
      this.resetPasswordEmailSendModal = await this.modalCtrl.create({
        component: component,
        cssClass: cssClass,
        backdropDismiss: false,
        swipeToClose: true,
        presentingElement: presentingElement
      });
      return this.resetPasswordEmailSendModal.present().then(() => {
        this.resetPasswordEmailSendModalOpen = true;
      });
    }
  }

  /*open reset password modal*/
  async openResetPasswordModal(component: any, passwordRecoveryToken: string, cssClass: string, presentingElement, employeeToken?) {
    if (!this.resetPasswordModalOpen) {
      this.resetPasswordModal = await this.modalCtrl.create({
        component: component,
        componentProps: {
          passwordRecoveryToken,
          employeeToken
        },
        cssClass: cssClass,
        backdropDismiss: false,
        swipeToClose: true,
        presentingElement: presentingElement
      });
      return this.resetPasswordModal.present().then(() => {
        this.resetPasswordModalOpen = true;
      });
    }
  }


  /*open modify slot password modal*/
  async openModifySlotModal(component: any, selectedSlots, locale, scheduleId, cssClass: string, deleteSlots: boolean, modifySlots: boolean, presentingElement,
                            fullCalendar?) {
    if (!this.modifySlotModalOpen) {
      this.modifySlotModal = await this.modalCtrl.create({
        component: component,
        componentProps: {
          selectedSlots,
          locale,
          scheduleId,
          deleteSlots,
          modifySlots,
          fullCalendar,
        },
        cssClass: cssClass,
        backdropDismiss: false,
        swipeToClose: true,
        presentingElement: presentingElement
      });
      return this.modifySlotModal.present().then(() => {
        this.modifySlotModalOpen = true;
      });
    }
  }


  /*open contact us modal*/
  async openContactUsModal(component: any, cssClass: string, presentingElement, sales?: boolean, provider?: Provider) {
    if (!this.contactModalOpen) {
      this.contactModal = await this.modalCtrl.create({
        component: component,
        cssClass: cssClass,
        backdropDismiss: false,
        swipeToClose: true,
        presentingElement: presentingElement,
        componentProps: {
          sales,
          provider
        },
      });
      return this.contactModal.present().then(
          () => {
            this.contactModalOpen = true;
          }
      );
    }
  }

  /*open modal with customer info modal*/
  async openCustomerModal(component: any, cssClass: string, id: string, bookanapp, enter, leave) {
    if (!this.customerModalOpen) {
      this.customerModal = await this.modalCtrl.create({
        component: component,
        componentProps: {
          id,
          bookanapp
        },
        cssClass: cssClass,
        backdropDismiss: false
      });
      return this.customerModal.present().then(
          () => {
            this.customerModalOpen = true;
          }
      );
    }
  }

  /*open modal with customer info modal*/
  async openEditCustomerModal(component: any, cssClass: string, id: string, bookanapp, presentingElement) {
    if (!this.editCustomerModalOpen) {
      this.editCustomerModal = await this.modalCtrl.create({
        component: component,
        componentProps: {
          id,
          bookanapp
        },
        cssClass: cssClass,
        backdropDismiss: false,
        swipeToClose: true,
        presentingElement: presentingElement
      });
      return this.editCustomerModal.present().then(
          () => {
            this.editCustomerModalOpen = true;
          }
      );
    }
  }

  /*open modal with customer info modal*/
  async openCreateCustomerModal(component: any, cssClass: string, presentingElement) {
    if (!this.customerModalOpen) {
      this.createCustomerModal = await this.modalCtrl.create({
        component: component,
        cssClass: cssClass,
        backdropDismiss: false,
        swipeToClose: true,
        presentingElement: presentingElement
      });
      return this.createCustomerModal.present().then(
          () => {
            this.createCustomerModalOpen = true;
          }
      );
    }
  }

  /*open modal to send campaign*/
  async openCampaignModal(component: any, cssClass: string, ids, all, bookanapp, presentingElement) {
    if (!this.campaignModalOpen) {
      this.campaignModal = await this.modalCtrl.create({
        component: component,
        cssClass: cssClass,
        componentProps: {
          ids,
          all,
          bookanapp
        },
        backdropDismiss: false,
        swipeToClose: true,
      });
      return this.campaignModal.present().then(
          () => {
            this.campaignModalOpen = true;
          }
      );
    }
  }

  /*open employee modal*/
  // tslint:disable-next-line:no-shadowed-variable
  async openEmployeeModal(component: any, cssClass: string, enterAnimation, leaveAnimation, id?) {
    if (!this.employeeModalOpen) {
      this.employeeModal = await this.modalCtrl.create({
        component: component,
        cssClass: cssClass,
        componentProps: {
          id
        },
        backdropDismiss: false,
        enterAnimation: enterAnimation,
        leaveAnimation: leaveAnimation
      });
      return this.employeeModal.present().then(
          () => {
            this.employeeModalOpen = true;
          }
      );
    }
  }

  async openEditAccountModal(component: any) {
    if (!this.editAccountModalOpen) {
      this.editAccountModal = await this.modalCtrl.create({
        component: component,
        backdropDismiss: false
      });
      return this.editAccountModal.present().then(
          () => {
            this.editAccountModalOpen = true;
          }
      );
    }
  }

  async openEditPageModal(component: any, opsHours: OpsHours[]) {
    if (!this.editPageModalOpen) {
      this.editPageModal = await this.modalCtrl.create({
        component: component,
        backdropDismiss: false,
        componentProps: {
          opsHours
        }
      });
      return this.editPageModal.present().then(
          () => {
            this.editPageModalOpen = true;
          }
      );
    }
  }

  async openEditImageModal(component: any, image, css, mainImagePicked?, imageToEdit?,
                           pagePic?, employeeId?, newEmployee?, customerId?, newCustomer?, scheduleId?, newSchedule?) {
    if (!this.editImageModalOpen) {
      this.editImageModal = await this.modalCtrl.create({
        component: component,
        componentProps: {
          image,
          mainImagePicked,
          imageToEdit,
          employeeId,
          newEmployee,
          customerId,
          newCustomer,
          scheduleId,
          newSchedule,
          pagePic
        },
        backdropDismiss: false,
        cssClass: css
      });
      return this.editImageModal.present().then(
          () => {
            this.editImageModalOpen = true;
          }
      );
    }
  }

  async openVideoModal(component: any, link) {
    if (!this.videoModalOpen) {
      this.videoModal = await this.modalCtrl.create({
        component: component,
        componentProps: {
          link
        },
        backdropDismiss: false,
      });
      return this.videoModal.present().then(
          () => {
            this.videoModalOpen = true;
          }
      );
    }
  }

  async openSlotPickerModal(component: any, scheduleId: string, cssClass: string) {
    if (!this.slotPickerModalOpen) {
      this.slotPickerModal = await this.modalCtrl.create({
        component: component,
        backdropDismiss: false,
        componentProps: {
          scheduleId
        },
        cssClass: cssClass
      });
      return this.slotPickerModal.present().then(
          () => {
            this.slotPickerModalOpen = true;
          }
      );
    }
  }


  async openAppSummaryModal(component: any, date: string, appSummary: MultipleSpotInfo, duration: number, cssClass: string, presentingElement, scheduleId: string) {
    if (!this.appSummaryModalOpen) {
      this.appSummaryModal = await this.modalCtrl.create({
        component: component,
        backdropDismiss: false,
        componentProps: {
          appSummary,
          date,
          duration,
          scheduleId
        },
        cssClass: cssClass,
        swipeToClose: true,
        presentingElement: presentingElement
      });
      return this.appSummaryModal.present().then(
          () => {
            this.appSummaryModalOpen = true;
          }
      );
    }
  }

  async openMultipleBookingsModal(component: any, pickedSchedule: PickedSchedule, cssClass: string, locale: string, simplified: boolean) {
    if (!this.multipleBookingsModalOpen) {
      this.multipleBookingsModal = await this.modalCtrl.create({
        component: component,
        backdropDismiss: false,
        componentProps: {
          pickedSchedule,
          locale,
          simplified
        },
        cssClass: cssClass,
        swipeToClose: true,
      });
      return this.multipleBookingsModal.present().then(
          () => {
            this.multipleBookingsModalOpen = true;
          }
      );
    }
  }

  async openEmployeeScheduleModal(component: any, cssClass: string, employee?: Employee, subdivision?: boolean, division?: boolean) {
    if (!this.employeeScheduleModalOpen) {
      this.employeeScheduleModal = await this.modalCtrl.create({
        component: component,
        backdropDismiss: false,
        componentProps: {
          employee,
          subdivision,
          division
        },
        cssClass: cssClass,
        swipeToClose: true,
      });
      return this.employeeScheduleModal.present().then(
          () => {
            this.employeeScheduleModalOpen = true;
          }
      );
    }
  }

  async openRosterSlotModal(component: any, cssClass: string, slots: any[]) {
    if (!this.rosterSlotModalOpen) {
      this.rosterSlotModal = await this.modalCtrl.create({
        component: component,
        backdropDismiss: false,
        componentProps: {
          slots
        },
        cssClass: cssClass,
        swipeToClose: true,
      });
      return this.rosterSlotModal.present().then(
          () => {
            this.rosterSlotModalOpen = true;
          }
      );
    }
  }

  async openEditSubdivisionModal(component: any, cssClass: string, subdivisionId: number, divisionId: number, subdivisionName: string, divisionName, routerOutlet?) {
    if (!this.ediSubdivisionOpen) {
      this.ediSubdivisionModal = await this.modalCtrl.create({
        component: component,
        backdropDismiss: false,
        componentProps: {
          subdivisionId,
          divisionId,
          subdivisionName,
          divisionName
        },
        cssClass: cssClass,
        swipeToClose: true,
        presentingElement: routerOutlet
      });
      return this.ediSubdivisionModal.present().then(
          () => {
            this.ediSubdivisionOpen = true;
          }
      );
    }
  }

  async openTimeOffRequestModal(component: any, cssClass: string, employee: Employee, date: Date, routerOutlet?) {
    if (!this.timeOffRequestOpen) {
      this.timeOffRequestModal = await this.modalCtrl.create({
        component: component,
        backdropDismiss: false,
        componentProps: {
          employee,
          date
        },
        cssClass: cssClass,
        swipeToClose: true,
        presentingElement: routerOutlet
      });
      return this.timeOffRequestModal.present().then(
          () => {
            this.timeOffRequestOpen = true;
          }
      );
    }
  }

  async dismissTimeOffRequestModal() {
    this.timeOffRequestOpen = false;
    await this.timeOffRequestModal.dismiss();
  }

  async dismissEditSubdivisionModal() {
    this.ediSubdivisionOpen = false;
    await this.ediSubdivisionModal.dismiss();
  }

  async dismissRosterSlotModal() {
    this.rosterSlotModalOpen = false;
    await this.rosterSlotModal.dismiss();
  }

  async dismissEmployeeScheduleModal() {
    this.employeeScheduleModalOpen = false;
    await this.employeeScheduleModal.dismiss();
  }

  async dismissMultipleBookingsModal() {
    this.multipleBookingsModalOpen = false;
    await this.multipleBookingsModal.dismiss();
  }

  async dismissAppSummaryModal() {
    if (this.appSummaryModal) {
      this.appSummaryModalOpen = false;
      await this.appSummaryModal.dismiss();
    }
  }

  async dismissSlotPickerModal() {
    this.slotPickerModalOpen = false;
    await this.slotPickerModal.dismiss();
  }

  async dismissVideoModal() {
    this.videoModalOpen = false;
    await this.videoModal.dismiss();
  }

  async dismissEditImageModal() {
    this.editImageModalOpen = false;
    await this.editImageModal.dismiss();
  }

  async dismissEditPageModal() {
    this.editPageModalOpen = false;
    await this.editPageModal.dismiss();
  }

  async dismissEditAccountModal() {
    this.editAccountModalOpen = false;
    await this.editAccountModal.dismiss();
  }


  async dismissEmployeeModal() {
    this.employeeModalOpen = false;
    await this.employeeModal.dismiss();
  }

  async dismissCampaignModal() {
    this.campaignModalOpen = false;
    await this.campaignModal.dismiss();
  }

  async dismissCreateCustomerModal() {
    this.createCustomerModalOpen = false;
    await this.createCustomerModal.dismiss();
  }

  async dismissCustomerModal() {
    this.customerModalOpen = false;
    await this.customerModal.dismiss();
  }

  async dismissEditCustomerModal() {
    this.editCustomerModalOpen = false;
    await this.editCustomerModal.dismiss();
  }

  async dismissModifySlotModal() {
    this.modifySlotModalOpen = false;
    await this.modifySlotModal.dismiss();
  }

  async dismissScheduleModal() {
    this.newScheduleModalOpen = false;
    await this.scheduleModal.dismiss();
  }


  async dismissScheduleEditModal() {
    this.scheduleModalOpen = false;
    await this.ediScheduleModal.dismiss();
  }

  async dismissContactModal() {
    this.contactModalOpen = false;
    await this.contactModal.dismiss();
  }

  async dismissBookingModal() {
    this.bookingModalOpen = false;
    await this.bookingModal.dismiss();
  }


  async dismissAppointmentModal() {
    this.appointmentModalOpen = false;
    await this.appointmentModal.dismiss();
  }

  async dismissMessageModal() {
    this.messageModalOpen = false;
    await this.messageModal.dismiss();
  }

  async dismissProfileModal() {
    this.profileModalOpen = false;
    await this.profileModal.dismiss();
  }

  async dismissResetPasswordEmailSendModal() {
    this.resetPasswordEmailSendModalOpen = false;
    await this.resetPasswordEmailSendModal.dismiss();
  }

  async dismissResetPasswordModal() {
    this.resetPasswordModalOpen = false;
    await this.resetPasswordModal.dismiss();
  }

  async dismissImageModal() {
    this.imageModalOpen = false;
    await this.imageModal.dismiss();
  }


}

