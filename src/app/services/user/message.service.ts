import { Injectable } from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Message, MessageThread} from '../../store/models/user.model';
import {ToastService} from '../overlay/toast.service';
import {LocalizationService} from '../localization/localization.service';
import {ModalService} from '../overlay/modal.service';
import {Router} from '@angular/router';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  constructor(private http: HttpClient,
              private translate: LocalizationService,
              private modalService: ModalService,
              private router: Router) { }

  BASE_URL = 'http://localhost:8086/message/provider';
  AUTH_HEADER = 'Bearer ';

  /*get all threads*/
  getAllThreads(token: string, page: number) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    const params = new HttpParams().set('page', String(page));
    return this.http.get<MessageThread[]>(this.BASE_URL + '/show/messages', { headers: tokenHeaders, params});
  }

  /*get individual thread in a modal*/
  getMessageThread(token: string, threadId?: string, appointmentId?) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    let params;
    if (threadId) {
      params = new HttpParams().set('threadId', threadId);
    }

    if (appointmentId) {
      params = new HttpParams().set('appointmentId', appointmentId);
    }
    return this.http.get<Message[]>(this.BASE_URL + '/show/message', { headers: tokenHeaders, params});
  }

  sendMessage(token: string, message: string, threadId?: string, appointmentId?, providerId?: string) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post(this.BASE_URL + '/send', {message, threadId, appointmentId, providerId}, {headers: tokenHeaders});
  }

  processSentMessageResponse(response: any): Message {
    if (!response.failureMessage) {
      return new Message(
          response.messageText,
          response.timestamp,
          response.from,
          response.subject,
          response.sent,
          response.link,
          response.messageId,
          response.nextPage,
          response.fromUser,
          response.fromProvider,
          response.appointmentDate,
          response.providerMessage,
          response.readByProvider,
          response.readByUser,
          response.attachment,
          response.attachmentName

      );
    } else {
      return null;
    }

  }

  getMessageForm() {
    return new FormGroup({
      message: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(1000)]),
    });
  }

  deleteMessages(token: string, messageIds: string[]) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post(this.BASE_URL + '/delete/messages', {idsToDelete: messageIds}, {headers: tokenHeaders});
  }

  deleteThread(token: string, idToDelete: any) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post(this.BASE_URL + '/delete/thread', idToDelete, {headers: tokenHeaders});
  }

  async processMessageDelete(response: any, toast: ToastService,
                             messageThreads$?: BehaviorSubject<MessageThread[]>, messageThread?: MessageThread) {
    if (response.successMessage) {
      await toast.presentToast(this.translate.getFromKey('mss-deleteMessageSuccess'), 'bottom', 'success', 2000);
      if (messageThreads$ && messageThread) {
        const currentMessageThreadArray = messageThreads$.value.filter(thread => thread !== messageThread);
        messageThreads$.next(currentMessageThreadArray);
      } else {
        this.router.navigateByUrl('/user/management/refresh', {skipLocationChange: true}).then(() =>
            this.router.navigate(['/user/management/messages']));
      }
      await this.modalService.dismissMessageModal();

    } else {
      switch (response.failureMessage) {
        case 'deleteError':
          await toast.presentToast(this.translate.getFromKey('mss-deleteError'), 'bottom', 'danger', 3000);
          break;
        case 'invalidMessage':
          await toast.presentToast(this.translate.getFromKey('mss-sendMessageError'), 'bottom', 'danger', 3000);
          break;
        case 'bindingError':
          await toast.presentToast(this.translate.getFromKey('app-bookingBindingError'), 'bottom', 'danger', 3000);
          break;
      }
    }

  }

  messageRead(token: string, messageId: string) {
    const messageIds = [];
    messageIds.push(messageId);
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    return this.http.post(this.BASE_URL + '/read/message', {idsToDelete: messageIds}, {headers: tokenHeaders});
  }

  uploadFile(token: string, fileToUpload: File, threadId: string, appointmentId: string, providerId: string) {
    const tokenHeaders: HttpHeaders = new HttpHeaders().append('Authorization', this.AUTH_HEADER + token);
    const formData = new FormData();
    formData.append('fileKey', fileToUpload, fileToUpload.name);
    let params;
    if (threadId) {
      params = new HttpParams().set('threadId', String(threadId));
    }
    if (appointmentId) {
      params = new HttpParams().set('appointmentId', String(appointmentId));
    }
    if (providerId) {
      params = new HttpParams().set('providerId', String(providerId));
    }
    return this.http.post<Message>(this.BASE_URL + '/send/attachment', formData, { headers: tokenHeaders, params: params});
  }



}
