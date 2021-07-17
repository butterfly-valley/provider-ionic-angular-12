import {Component, OnDestroy} from '@angular/core';
import {BehaviorSubject, Subscription, throwError} from 'rxjs';
import {Message, MessageThread} from '../../../store/models/user.model';
import {messageIcon} from '../user.page';
import {MessageService} from '../../../services/user/message.service';
import {AuthService} from '../../../services/auth/auth.service';
import {DateTimeUtilService} from '../../../services/util/date-time-util.service';
import {ModalService} from '../../../services/overlay/modal.service';
import {MessageComponent} from '../../../components/modals/message/message.component';
import {LocalizationService} from '../../../services/localization/localization.service';
import {AlertService} from '../../../services/overlay/alert.service';
import {ToastService} from '../../../services/overlay/toast.service';
import {catchError, distinctUntilChanged} from 'rxjs/operators';
import {mobile, tablet} from '../../../app.component';

@Component({
    selector: 'app-messages',
    templateUrl: './messages.page.html',
    styleUrls: ['./messages.page.scss'],
})
export class MessagesPage implements OnDestroy {
    mobile = mobile;
    tablet = tablet;
    messageIcon = messageIcon;

    messageThreads$ = new BehaviorSubject<MessageThread[]>(null);

    /*message subscription*/
    messageThreadSub$: Subscription;

    // update message threads subscription
    updatemessageThreadSub$: Subscription;

    /*delete notification subscription*/
    deleteMessagesSub$: Subscription;

    readMessageSub$: Subscription;
    loadingError;
    page = 1;

    isLoading = false;

    constructor(private messageService: MessageService,
                private auth: AuthService,
                private dateTimeUtil: DateTimeUtilService,
                private modalService: ModalService,
                private translate: LocalizationService,
                private alertService: AlertService,
                private toast: ToastService) { }


    ionViewWillEnter() {
        this.loadOrRefreshMessages();
    }

    ionViewWillLeave() {
        this.messageThreads$.next(null);
        this.page = 1;
        this.cancelSubs();
    }

    ngOnDestroy(): void {
        this.cancelSubs();
    }

    private cancelSubs() {
        if (this.messageThreadSub$) {
            this.messageThreadSub$.unsubscribe();
        }

        if (this.updatemessageThreadSub$) {
            this.updatemessageThreadSub$.unsubscribe();
        }

        if (this.deleteMessagesSub$) {
            this.deleteMessagesSub$.unsubscribe();
        }

        if (this.readMessageSub$) {
            this.readMessageSub$.unsubscribe();
        }
    }

    loadMessages(token: string ) {
        return this.messageService.getAllThreads(token, this.page).pipe(
            catchError((err) => {
                this.loadingError = err;
                return throwError(err);
            })
        );
    }

    // load more message threads
    async loadMore() {
        this.isLoading = true;

        this.page++;
        this.updatemessageThreadSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            token => {
                this.loadMessages(token).subscribe(
                    threads => {
                        const currentMessageThreadArray = this.messageThreads$.value;
                        currentMessageThreadArray.push(...threads);
                        this.messageThreads$.next(currentMessageThreadArray);
                        this.isLoading = false;
                    }
                );
            }, error => {
                this.isLoading = false;
            }
        );



    }

    showDateTime(timestamp: string) {
        return this.dateTimeUtil.showLocalDateTimeNoYear(timestamp);
    }

    async showMessage(messageThread: MessageThread) {
        let cssClass = '';
        if (!mobile)  {
            cssClass = 'message-modal';
        }


        if (messageThread.appointmentId) {
            this.modalService.openMessageModal(MessageComponent, cssClass, undefined, messageThread.lastMessage.timestamp,
                messageThread.appointmentId, null, messageThread.userName, true, false).then(whenOpened => {
                this.updateMessageThread(messageThread);
            });
        }

        if (messageThread.threadId) {
            this.modalService.openMessageModal(MessageComponent, cssClass, undefined, messageThread.lastMessage.timestamp, null,
                messageThread.threadId, messageThread.userName, true, false).then(whenOpened => {
                this.updateMessageThread(messageThread);
            });
        }

        if (!messageThread.threadId && !messageThread.appointmentId) {
            this.alertService.presentAlert(
                this.getNotificationTitle(messageThread.lastMessage),
                null,
                messageThread.lastMessage.from + ' ' + this.getNotification(messageThread.lastMessage),
                [
                    {
                        text: 'Ok',
                        role: 'cancel'

                    },
                    {
                        cssClass: 'actionsheet-delete',
                        text: this.translate.getFromKey('delete'),
                        handler: () => {
                            /*handle notification deletion */
                            const idsToDelete = [];
                            idsToDelete.push(messageThread.lastMessage.messageId);
                            this.processDeleteMessage(idsToDelete, messageThread).then(deleteMessageSub => {
                                this.deleteMessagesSub$ = deleteMessageSub;
                            });
                        }
                    }

                ]
            ).then(
                whenOpened => {
                    if (!messageThread.lastMessage.readByProvider) {
                        this.messageRead(messageThread.lastMessage.messageId);
                    }
                }
            );
        }

    }

    /*parse notification message from the message codes*/
    getNotification(message: Message) {
        return this.translate.getFromKey(message.messageText) + ' ' + this.dateTimeUtil.showLocalDateTime(this.translate.getLocale(),
            message.appointmentDate);
    }

    getNotificationTitle(lastMessage: Message) {
        return this.translate.getFromKey(lastMessage.subject);
    }

    async deleteMessage(messageThread: MessageThread) {
        const idsToDelete = [];
        idsToDelete.push(messageThread.lastMessage.messageId);
        await this.alertService.presentAlert(
            this.translate.getFromKey('mess-delete'),
            null,
            null,
            [
                {
                    text: this.translate.getFromKey('close'),
                    role: 'cancel'

                },
                {
                    text: this.translate.getFromKey('delete'),
                    cssClass: 'actionsheet-delete',
                    handler: () => {
                        this.processDeleteMessage(idsToDelete, messageThread).then(deleteMessageSub => {
                            this.deleteMessagesSub$ = deleteMessageSub;
                        });
                    }

                }
            ]
        );
    }

    async processDeleteMessage(idsToDelete: string[], messageThread: MessageThread) {
        this.isLoading = true;
        return  this.auth.getCurrentToken().subscribe(currentToken => {
            if (currentToken) {
                this.messageService.deleteMessages(currentToken, idsToDelete).subscribe(
                    response => {
                        this.messageService.processMessageDelete(response, this.toast, this.messageThreads$, messageThread);
                        this.isLoading = false;
                    }
                );
            } else {
                this.toast.presentToast(this.translate.getFromKey('mss-deleteError'), 'bottom', 'danger', 3000);
                this.isLoading = false;
            }
        }, error => {
            this.toast.presentToast(this.translate.getFromKey('mss-deleteError'), 'bottom', 'danger', 3000);
            this.isLoading = false;
        });

    }

    /*identify message threads by category*/
    threadId(messageThread: MessageThread) {
        if (messageThread.threadId) {
            return 'messageThread-' + messageThread.threadId;
        } else if (messageThread.appointmentId) {
            return 'appointmentId-' + messageThread.appointmentId;
        } else {
            return 'notificationId-' + messageThread.lastMessage.messageId;
        }
    }


    private messageRead(messageId: string) {
        this.readMessageSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            token => {
                if (token) {
                    this.messageService.messageRead(token, messageId).subscribe(
                        response => {
                            this.updateUserStats();
                        }
                    );
                }
            }
        );
    }

    private updateMessageThread(messageThread: MessageThread) {
        const currentMessageThreadArray = this.messageThreads$.value;
        this.updateUserStats(messageThread.unreadMessages);
        currentMessageThreadArray.forEach(item => {
            if (item.lastMessage.messageId === messageThread.lastMessage.messageId) {
                messageThread.lastMessage.readByProvider = true;
                messageThread.unreadMessages = 0;
                item = messageThread;
            }
        });
        this.messageThreads$.next(currentMessageThreadArray);
    }

    private updateUserStats(unreadMessagesInThread?: number) {
        const user = this.auth.getLoggedUser().value;
        const unreadMessages = Number(user.userStats.messages);
        if (unreadMessages > 1) {
            let updatedUnreadMessages;
            if (unreadMessagesInThread) {
                updatedUnreadMessages = unreadMessages - unreadMessagesInThread;
            } else {
                updatedUnreadMessages = unreadMessages - 1;
            }
            user.userStats.messages = updatedUnreadMessages.toString();
        } else {
            user.userStats.messages = undefined;
        }
        this.auth.setLoggedUser(user);
    }

    /*   refresh view on mobile*/
    doRefresh(event) {
        this.loadOrRefreshMessages(event);
    }

    private loadOrRefreshMessages(refresh?: any) {
        this.isLoading = true;
        this.messageThreadSub$ = this.auth.getCurrentToken().pipe(distinctUntilChanged()).subscribe(
            token => {
                if (token) {
                    this.loadMessages(token).subscribe(
                        threads => {
                            this.messageThreads$.next([]);
                            const currentMessageThreadArray = this.messageThreads$.value;
                            currentMessageThreadArray.push(...threads);
                            this.messageThreads$.next(currentMessageThreadArray);
                            this.auth.loadProviderFromServer(token).subscribe(
                                fetchedUser => {
                                    this.auth.setLoggedUser(fetchedUser);
                                    this.auth.userStats$.next(fetchedUser.userStats);
                                    if (refresh) {
                                        refresh.target.complete();
                                    }
                                }
                            );
                            this.isLoading = false;
                        }, error => {
                            this.isLoading = false;
                        }
                    );
                }
            }
        );
    }

    messageText(lastMessage: Message) {
        if (!lastMessage.attachment && !lastMessage.attachmentName) {
            return lastMessage.messageText;
        } else {
            return '<ion-icon name="document"></ion-icon>';
        }
    }
}
