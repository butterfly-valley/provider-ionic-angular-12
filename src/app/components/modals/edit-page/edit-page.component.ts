import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Subscription, throwError} from "rxjs";
import {PageService} from "../../../services/user/page.service";
import {AuthService} from "../../../services/auth/auth.service";
import {ToastService} from "../../../services/overlay/toast.service";
import {LocalizationService} from "../../../services/localization/localization.service";
import {MapsAPILoader} from "@agm/core";
import {catchError, take} from "rxjs/operators";
import {alertPosition} from "../../../app.component";
import {ModalService} from "../../../services/overlay/modal.service";
import {Router} from "@angular/router";
import {OpsHours} from '../../../store/models/provider.model';

@Component({
  selector: 'app-edit-page',
  templateUrl: './edit-page.component.html',
  styleUrls: ['./edit-page.component.scss'],
})
export class EditPageComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() opsHours: OpsHours[];

  providerSub$: Subscription;
  editPageSub$: Subscription;
  loadingError;
  isLoading = false;

  @ViewChild('submitBtn', {static: false}) submitBtn;
  formSubmitted: boolean;

  @ViewChild('googlePlacesAutocomplete', {static: false}) googlePlacesAutocomplete: ElementRef;

  constructor(public pageService: PageService,
              private auth: AuthService,
              private modalService: ModalService,
              private toast: ToastService,
              private translate: LocalizationService,
              private mapsAPILoader: MapsAPILoader,
              private cd: ChangeDetectorRef,
              private router: Router) { }

  ngOnInit(): void {
    this.pageService.addressPicked = '';
    this.pageService.location.next(undefined);
    this.providerSub$ = this.pageService.provider$.pipe(take(1)).subscribe(
        async provider => {
          if (provider) {
            this.pageService.provider$.next(provider);
            this.pageService.setForm(provider);
          } else {
            await this.dismiss();
          }
        },
        catchError((err) => {
          this.loadingError = err;
          return throwError(err);
        })
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.pageService.googleMapsAutocomplete(this.googlePlacesAutocomplete.nativeElement,
          this.mapsAPILoader);
    }, 200);
    // set address fields after autocomplete
    // this.pageService.location.unsubscribe();
    this.pageService.location.subscribe(
        value => {
          if (value) {
            for (let component in this.pageService.componentForm) {
              // document.getElementById(component).firstElementChild.value = '';
              // document.getElementById(component).disabled = false;
            }

            for (let i = 0; i < value.length; i++) {
              const addressType = value[i].types[0];
              if (this.pageService.componentForm[addressType]) {
                const val = value[i][this.pageService.componentForm[addressType]];
                this.pageService.pageForm.controls.address.get(addressType).setValue(val);
                this.pageService.addressPicked = this.pageService.addressPicked + ' ' + val;
              }
            }

            this.pageService.coordinates.subscribe(value1 => {
              this.pageService.pageForm.controls.address.get('coordinates').setValue(value1);
            });

            this.cd.detectChanges();
          }
        }
    );
  }

  ngOnDestroy(): void {
    this.pageService.resetFields();
    if (this.providerSub$) {
      this.providerSub$.unsubscribe();
    }
    if (this.editPageSub$) {
      this.editPageSub$.unsubscribe();
    }
    this.dismiss();
  }


  async dismiss() {
    await this.modalService.dismissEditPageModal();
  }

  setTitle() {
    if (this.pageService.editAddress) {
      return this.translate.getFromKey('address');
    }
    if (this.pageService.editDescription) {
      return this.translate.getFromKey('man-desc');
    }

    if (this.pageService.editOpsHours) {
      return this.translate.getFromKey('man-schedule');
    }

    if (this.pageService.editRestricted) {
      return this.translate.getFromKey('prof-restrict-access-title');
    }


    if (this.pageService.editAnonymousApps) {
      return this.translate.getFromKey('anonymous-apps');
    }

    if (this.pageService.editAddressVisible) {
      return this.translate.getFromKey('prof-addressVisible');
    }

  }

  submitForm() {
    const button: HTMLElement = this.submitBtn.nativeElement;
    button.click();
  }

  async onSubmitForm() {
    this.formSubmitted = true;
    const form = this.pageService.pageForm;
    if (form.valid) {
      this.isLoading = true;
      this.editPageSub$ = this.auth.getCurrentToken().subscribe(async token => {
        if (token) {
          this.pageService.editPageRequest(token, form.value).subscribe(
              async response => {
                if(response['message']) {
                  await this.pageService.processServerError(response['message'], this.toast);
                } else if (response['id']) {
                  this.router.navigateByUrl('/user/profile/refresh', {skipLocationChange: true}).then(() =>
                      this.router.navigateByUrl('/user/profile/page'));
                  await this.toast.presentToast(this.translate.getFromKey('page-edit-success'), alertPosition, 'success' , 200);
                  await this.dismiss();

                } else {
                  await this.toast.presentToast(this.translate.getFromKey('page-edit-error'), alertPosition, 'danger' , 4000);
                }
                this.isLoading = false;
              }, async error => {
                await this.toast.presentToast(this.translate.getFromKey('page-edit-error'), alertPosition, 'danger' , 4000);
                this.isLoading = false;
              }
          );

        } else {
          await this.toast.presentToast(this.translate.getFromKey('page-edit-error'), alertPosition, 'danger' , 4000);
          this.isLoading = false;
        }
      }, async error => {
        await this.toast.presentToast(this.translate.getFromKey('page-edit-error'), alertPosition, 'danger' , 4000);
        this.isLoading = false;
      });
    } else {
      await this.toast.presentToast(this.translate.getFromKey('reg-errors'), alertPosition, 'danger', 6000);
      return;
    }

  }

  resetFacilityAddress() {
    this.pageService.pageForm.controls.address.reset();
    this.googlePlacesAutocomplete.nativeElement.value = '';
    this.pageService.addressPicked = '';
    this.cd.detectChanges();
  }
}
