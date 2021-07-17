import {Appointment, UserStats} from './user.model';

export interface Provider {
    username: string;
    name: string;
    companyName: string;
    address: Address;
    coordinates: string;
    image: string;
    distance: number;
    id: string;
    category: string;
    categoryIcon: string;
    availability: string;
    nextPage: boolean;
    images: string[];
    description: string;
    phones: Phone[];
    opsHours: OpsHours[];
    fullAddress: Address;
    availabilities: Availability[];
    availabilityCategories: string[];
    services: string[];
    restrictedProvider: boolean;
    invitationLink: string;
    userStats: UserStats;
    emailBookingNotification: boolean;
    emailMessageNotification: boolean;
    pushBookingNotification: boolean;
    pushMessageNotification: boolean;
    emailNewsletterNotification: boolean;
    appointments: Appointment[];
    timezoneId: string;
    locale: string;
    allowAnonimousBooking: boolean;
    addressVisible: boolean;
    vatNumber: string;
    billingAddress: BillingAddress;
}

export interface BillingAddress {
    street1: string;
    street2: string;
    postalCode: string;
    country: string;
    city: string;
    province: string;
}

export interface Phone {
    id: number;
    phoneType: string;
    code: string;
    number: string;
}

export interface OpsHours {
    id: string;
    dayOfWeek: string;
    displayName: string;
    opening: string[];
    provider: {
        id: string;
    };
}

export interface Address {
    street: string;
    number: string;
    postalCode: string;
    latitude: any;
    longitude: any;
    country: string;
    location: string;
    city: string;
    province: string;
}

export interface Availability {
    id: string;
    name: string;
    availabilityCategory: string;
    paidUntil: string;
    visible: boolean;
    viewPaidUntil: string;
    main: boolean;
    providerId: string;
    serviceEvents: Service[];
    freeSchedule: boolean;
}

export interface ScheduleCategory {
    category: string;
    schedules: Schedule[];

}

export interface Schedule {
    scheduleId: string;
    scheduleName: string;
    visible: boolean;
    main: boolean;
    providerId: string;
    mandatoryPhone: boolean;
    scheduleCategory: string;
    smsReminder: boolean;
    minimumNotice: string;
    serviceList: Service[];
    avatar: string;
    notif: boolean;
    notifEmail: string;
    freeSchedule: boolean;
    appointments: number;
    note: string;
    multi: boolean;
    noDuration: boolean;
    start: string;
    end: string;
    service: boolean;
    serviceSchedule: string;
    numberOfSpots: number;
    duration: number;
}

export interface Employee {
    id: string;
    username: string;
    name;
    registerDate;
    authorities: string[];
    authorizedSchedules: string[];
    authorizedScheduleNames: string[];
    avatar: string;
    checked: boolean;
    division: string;
    subdivision: string;
    subdivisionId: number;
    divisionId: number;
    jobTitle: string;
    authorizedRosters: number[];
    timeOffBalance: TimeOffBalance;
    homeAddress: Address;
    personalEmail: string;
    bankAccount: string;
    taxPayerId: string;
    phones: Phone[];
    family: {
        id: number;
        kinship: number;
        name: string;
    }[];
}



export interface TimeOffBalance {
    vacationDays: number;
    vacationRolloverDays: number;
    complimentaryBankHolidayDays: number;
    complimentaryBankHolidayRolloverDays: number;
    compensationDays: number;
    compensationRolloverDays: number;
}

export interface TimeRequest {
    id: number;
    approved: boolean;
    toBeApproved: boolean;
    overtime: boolean;
    comments: string;
    start: string;
    end: string;
    attachments: string[];
}

export interface RosterSlotColor {
    name: string;
    color: string;
}

export interface RosterPattern {
    name: string;
    start: string;
    end: string;
    pattern: string;
}

export interface Service {
    service: string;
    duration: string;
}

export interface Plan {
    plan: string;
    sms: string;
    lastPayment: string;
    nextPayment: string;
    created: string;
    frequency: string;
    demo: boolean;
}

export interface Payment {
    id: string;
    createDate: string;
    number: string;
    smsCount: number;
    price: number;
    tax: number;
    totalSum: number;
    description: string;
    billLink: boolean;
}

export interface PickedSchedule {
    scheduleId: string;
    multipleSpots: boolean;
    noDuration: boolean;
    scheduleName: string;
    serviceSchedule: boolean;
    freeSchedule: boolean;
}

export interface ShortSchedule {
    id: number;
    name: string;
    categoryName: string;

}

export interface NewScheduleEntity {
    opsHours: OpsHours[];
    schedules: ShortSchedule[];

}

export interface Subdivision {
    subdivision: string;
    division: string;
    subdivisionId: number;
    divisionId: number;
}

export interface SlotDetails {
    slotId: string;
    subdivisionId: string;
    employeeId: string;
}

export interface SimpleServerResponse {
    message: string;
}

export function converterDataURItoBlob(dataURI) {
    let byteString;
    let mimeString;
    let ia;

    if (dataURI.split(',')[0].indexOf('base64') >= 0) {
        byteString = atob(dataURI.split(',')[1]);
    } else {
        byteString = encodeURI(dataURI.split(',')[1]);
    }
    // separate out the mime component
    mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ia], {type:mimeString});
}
