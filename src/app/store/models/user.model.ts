export interface UserStats {
    messages: string;
    appointments: string;
}

export interface AppointmentMap {
    title: number;
    date: string;
    appointments: Appointment[];
    nextPage: boolean;
}


export interface Appointment {
    id: string;
    dateTime: string;
    availabilityId: number;
    reminderSent: boolean;
    schedule: string;
    category: string;
    duration: number;
    name: string;
    pastAppointment: boolean;
    restriction: boolean;
    numberOfSpots: number;
    confirmed: boolean;
    sendSms: boolean;
    smsSent: boolean;
    sendWhatsApp: boolean;
    whatsAppSent: boolean;
    bookedServices: string[];
    userRemark: string;
    providerRemark: string;
    nextPage: boolean;
    phone: string;
    userPic: string;
    appointmentDate: string;
    bookAnApp: boolean;
    noShow: boolean;
    email: string;
    checked: boolean;
    providerCategory: string;
    providerCustomer: string;
    anonymous: boolean;
}

export class Message {


    constructor(messageText: string, timestamp: string, from: string, subject: string, sent: string, link: string,
                messageId: string, nextPage: boolean, fromUser: boolean, fromProvider: boolean, appointmentDate: string,
                providerMessage: string, readByProvider: boolean, readByUser: boolean, attachment: string, attachmentName: string) {
        this.messageText = messageText;
        this.timestamp = timestamp;
        this.from = from;
        this.subject = subject;
        this.sent = sent;
        this.link = link;
        this.messageId = messageId;
        this.nextPage = nextPage;
        this.fromUser = fromUser;
        this.fromProvider = fromProvider;
        this.appointmentDate = appointmentDate;
        this.providerMessage = providerMessage;
        this.readByProvider = readByProvider;
        this.readByUser = readByUser;
        this.attachment = attachment;
        this.attachmentName = attachmentName;
    }

    messageText: string;
    timestamp: string;
    from: string;
    subject: string;
    sent: string;
    link: string;
    messageId: string;
    nextPage: boolean;
    fromUser: boolean;
    fromProvider: boolean;
    appointmentDate: string;
    providerMessage: string;
    readByProvider: boolean;
    readByUser: boolean;
    attachment: string;
    attachmentName: string;

}

export interface MessageThread {
    lastMessage: Message;
    threadId: number;
    appointmentId: number;
    isThread: boolean;
    nextPage: boolean;
    userName: string;
    avatar: string;
    unreadMessages: number;
    notification: boolean;
    fromUser: boolean;
}

export interface UserSearch {
    id: number;
    location: string;
    providerName: string;
    userLocation: string;
    distance: string;
    coordinates: string;
    serviceType: string;
    timestamp: Date;

}

export interface CancelResponse {
    message: string;
}

export interface Customer {
    id: string;
    name: string;
    sendSms: boolean;
    nextPage: boolean;
    missedApps: string;
    docPhoto: string;
    email: string;
    phone: string;
    appointments: Appointment[];
    avatar: string;
    gdpr: string;
    dob: string;
    note: string;
    checked: boolean;
    timeline: CustomerTimeline[];
    subStart: string;
    subEnd: string;
    userId: string;
}

export interface BookanappCustomer {
    id: string;
    name: string;
    appointments: Appointment[];
    avatar: string;
    missedApps: string;
    checked: boolean;
    pushNotifications: boolean;
}

export interface CustomerTimeline {
    timestamp: string;
    description: string;
}


