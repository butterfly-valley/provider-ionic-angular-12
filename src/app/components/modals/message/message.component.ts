import {
    Component,
    ElementRef,
    Input, OnDestroy,
    OnInit,
    ViewChild
} from '@angular/core';
import {ModalService} from '../../../services/overlay/modal.service';
import {FormGroup} from '@angular/forms';
import {MessageService} from '../../../services/user/message.service';
import {AuthService} from '../../../services/auth/auth.service';
import {BehaviorSubject, Subscription, throwError} from 'rxjs';
import {Message} from '../../../store/models/user.model';
import {messageIcon} from '../../../pages/user/user.page';
import {IonContent} from '@ionic/angular';
import {DateTimeUtilService} from '../../../services/util/date-time-util.service';
import {ToastService} from '../../../services/overlay/toast.service';
import {catchError, distinctUntilChanged} from 'rxjs/operators';
import {alertPosition, mobile, tablet} from '../../../app.component';
import {LoadingService} from "../../../services/loading/loading.service";
import {LocalizationService} from "../../../services/localization/localization.service";
import {Router} from "@angular/router";
import {addWeekParseToken} from 'ngx-bootstrap/chronos/parse/token';


@Component({
    selector: 'app-message',
    templateUrl: './message.component.html',
    styleUrls: ['./message.component.scss'],
})
export class MessageComponent implements OnInit, OnDestroy {

    @ViewChild('container', {static: false}) container: IonContent;
    @ViewChild('messageGrid', {static: false, read: ElementRef}) messageGrid: ElementRef;
    @ViewChild('textAreaElement', {static: false}) textAreaElement: ElementRef;
    @ViewChild('filePicker', {static: false}) filePicker: any;
    @ViewChild('submitBtn', {static: false}) submitBtn;

    /*get current token*/
    tokenSub$: Subscription;

    /*send attachment*/
    sendAttachmentSub$: Subscription;

    /*delete current thread*/
    deleteSub$: Subscription;

    /*list of messages*/
    messageList$ = new BehaviorSubject<Message[]>([]);

    @Input() dateTime;
    @Input() appointmentId: string;
    @Input() threadId: string;
    @Input() providerId: string;
    @Input() userName: string;
    @Input() refresh: boolean;
    @Input() swipe;
    @Input() close;

    /*message form*/
    messageForm: FormGroup;
    messageIcon = messageIcon;

    mutationObserver: MutationObserver;
    mobile = mobile;
    tablet = tablet;

    isLoading = false;
    scrollToEnd = true;

    constructor(public modalService: ModalService,
                private messageService: MessageService,
                private auth: AuthService,
                private dateTimeUtil: DateTimeUtilService,
                private toast: ToastService,
                private loading: LoadingService,
                private translate: LocalizationService,
                private router: Router

    ) { }


    ngOnInit() {
        this.isLoading = true;
        this.tokenSub$ = this.auth.getCurrentToken().subscribe(
            token => {
                if (token) {
                    this.messageService.getMessageThread(token, this.threadId, this.appointmentId).pipe(
                        catchError((err) => {
                            this.isLoading = false;
                            return throwError(err);
                        })
                    ).subscribe(
                        response => {
                            if (!response['failureMessage']) {
                                this.messageList$.next(response);
                                this.isLoading = false;
                            }
                        }
                    );

                } else {
                    this.isLoading = false;
                }
            }
        );
        this.messageForm = this.messageService.getMessageForm();
    }

    ngOnDestroy(): void {
        if ( this.tokenSub$) {
            this.tokenSub$.unsubscribe();
        }

        if ( this.deleteSub$) {
            this.deleteSub$.unsubscribe();
        }

        this.dismiss();
    }


    // scroll to bottom on new message
    async ionViewDidEnter() {
        await this.scrollToBottom();
    }

    async scrollToBottom() {
        this.container.scrollToBottom().then(whenDown => {
            if (this.messageGrid) {
                this.mutationObserver = new MutationObserver((mutations) => {
                    this.container.scrollToBottom();
                });
                this.mutationObserver.observe(this.messageGrid.nativeElement, {
                    childList: true
                });
            }

        });
    }

    onSendMessage() {
        const messageToSend = this.messageForm.controls.message.value;
        this.tokenSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            token => {
                if (token) {
                    this.messageService.sendMessage(token, messageToSend, this.threadId, this.appointmentId, this.providerId).subscribe(
                        async response => {
                            const currentMessageArray = this.messageList$.value;
                            const receivedMessage = this.messageService.processSentMessageResponse(response);
                            const updatedMessageArray = [...currentMessageArray, receivedMessage];
                            this.messageList$.next(updatedMessageArray);
                            setTimeout(() => {this.scrollToBottom(); }, 100);

                        }
                    );
                }
            }
        );

        this.messageForm.reset();

    }

    timestamp(timestamp: string) {
        return this.dateTimeUtil.showLocalDateTimeNoYear(timestamp);

    }

    /* archives or deletes all messages*/
    deleteThread() {
        let idToDelete;
        if (this.threadId) {
            idToDelete = {
                threadId: this.threadId
            };
        }
        if (this.appointmentId) {
            idToDelete = {
                appointmentId: this.appointmentId
            };
        }
        this.deleteSub$ = this.auth.getCurrentToken().subscribe(
            token => {
                this.messageService.deleteThread(token, idToDelete).subscribe(
                    response => {
                        this.messageService.processMessageDelete(response, this.toast);
                    }
                );
            }
        );

    }

    async dismiss() {
        if (this.refresh) {
            this.router.navigateByUrl('/user/management/refresh', {skipLocationChange: true}).then(() =>
                this.router.navigateByUrl('/user/management/messages'));
        }
        await this.modalService.dismissMessageModal();
    }

    async onFilePicked(event: any) {
        this.isLoading = true;
        const file = event.target.files[0];

        this.sendAttachmentSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            token => {
                if (token) {
                    this.messageService.uploadFile(token, file, this.threadId, this.appointmentId, this.providerId).subscribe(
                        response => {
                            if (response.messageText) {
                                const currentMessageArray = this.messageList$.value;
                                const receivedMessage = this.messageService.processSentMessageResponse(response);
                                const updatedMessageArray = [...currentMessageArray, receivedMessage];
                                this.messageList$.next(updatedMessageArray);
                                this.isLoading = false;
                            } else {
                                this.isLoading = false;
                                switch (response['error']) {
                                    case 'invalidFile':
                                        this.toast.presentToast(this.translate.getFromKey('' +
                                            ''), alertPosition, 'danger', 6000);
                                        break;
                                    case 'fileUploadError':
                                        this.toast.presentToast(this.translate.getFromKey('mess-attach-error'), alertPosition, 'danger', 6000);
                                        break;
                                }

                            }
                        }, error => {
                            this.isLoading = false;
                            this.toast.presentToast(this.translate.getFromKey('mess-attach-error'), alertPosition, 'danger', 6000);
                        }
                    );
                }
            }, error => {
                this.isLoading = false;
                this.toast.presentToast(this.translate.getFromKey('mess-attach-error'), alertPosition, 'danger', 6000);
            }
        );

    }

    openFilePicker() {
        this.filePicker.nativeElement.click();

    }

    attachmentName(fileName: string) {
        return '.' + fileName.split('.')[1];
    }

    previewAttachment(message: Message) {
        if (message.attachment.includes('pdf') || message.attachment.includes('PDF')) {
            return message.attachmentName;
        } else {
            return '<img style=" height="300" width="200" src="' + message.attachment + '" />';
        }

    }

    scrollPosition(event: CustomEvent) {
        this.scrollToEnd = true;
        this.container.ionScrollEnd.subscribe(
            () => {
                const scrollPosition = event.detail.scrollTop;
                const gridHeight = this.container['el'].children[1]['offsetHeight'];
                const contentHeight = this.container['el']['offsetHeight'];
                if (gridHeight - contentHeight === Math.ceil(scrollPosition)) {
                    this.scrollToEnd = true;
                } else {
                    this.scrollToEnd = false;
                }
            }
        );

    }

    submit() {
        const button: HTMLElement = this.submitBtn.nativeElement;
        button.click();
    }
}
