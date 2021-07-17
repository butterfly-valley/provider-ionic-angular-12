import { Injectable } from '@angular/core';
import {LocalizationService} from '../localization/localization.service';
import * as moment from 'moment';
import {of} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class DateTimeUtilService {

    locale: string;
    constructor(private translate: LocalizationService) {
        this.locale = this.translate.getLocale();
    }

    showDate(locale: string, dateTime: string, showYear?: boolean): string {
        const date = this.parseTimestampToUtc(dateTime);
        const day = date.getDate();
        let year = '';
        if (showYear) {
            year = ' ' + date.getFullYear();
        }

        if (this.isToday(date)) {
            return this.translate.getFromKey('today')
        }

        if (this.isTomorrow(date)) {
            return this.translate.getFromKey('tomorrow')
        }

        if (locale !== 'en-US') {
            return date.toLocaleDateString(locale, { weekday: 'short'}).substring(0, 3) + ', ' + String(day) + ' ' + date.toLocaleDateString(locale, { month: 'short'}) + year;
        }  else {
            return date.toLocaleDateString(locale, { weekday: 'short'}) + ', ' + date.toLocaleDateString(locale, {  month: 'short'}) + ' ' + String(day) + year;
        }
    }

    showMomentDate(locale: string, date: any): string {
        moment.locale(locale);
        return moment(date).format('LL');
    }

    showShortDate(locale: string, dateTime: string) {
        const date = this.parseTimestampToUtc(dateTime);
        return date.toLocaleDateString(locale);
        // if (locale !== 'en-US') {
        // }  else {
        //     return date.toLocaleDateString(locale, { weekday: 'short'}) + ', ' + date.toLocaleDateString(locale, {  month: 'short'}) + ' ' + String(day) + year;
        // }
    }


    showUTCDate(locale: string, date) {
        moment.locale(locale);

        const momentDate = moment(moment(date).toISOString());

        if (this.dayIsToday(momentDate)) {
            return this.translate.getFromKey('today')
        }

        if (this.dayIsTomorrow(momentDate)) {
            return this.translate.getFromKey('tomorrow')
        }

        if (locale === 'en-US') {
            return momentDate.format("ddd[, ] MMM DD");
        } else {
            return momentDate.format("ddd[, ] DD MMM");
        }

    }

    dayIsToday(day) {
        const today = moment().endOf('day');
        const yesterday = moment().add(-1, 'day').endOf('day');
        return (day > yesterday && day < today);
    }

    dayIsTomorrow(day) {
        const today = moment().endOf('day');
        const tomorrow = moment().add(1, 'day').endOf('day');
        return (day > today && day < tomorrow);
    }

    showUTCTime(locale: string, date: string, duration) {
        moment.locale(locale);
        const start = date + '.000Z';
        const end = moment(start).add(+duration, 'minutes');
        return this.showUTCDate(locale, date) + ', ' + moment.utc(start).format('LT') + ' - ' + moment.utc(end).format('LT');

    }

    showDateNoYear(locale: string, date: Date): string {
        // const date = this.parseTimestampToUtc(dateTime);
        const day = date.getDate();
        if (locale !== 'en') {
            return String(day) + ' ' + date.toLocaleDateString('pt-PT', { month: 'short'});
        } else {
            return date.toLocaleDateString('en-US', {  month: 'short'}) + ' ' + String(day);
        }
    }

    showLocalTime(locale: string, dateTime: string, utcDate?: Date) {
        let date;
        if (utcDate) {
            date = utcDate;
        } else {
            date = this.parseTimestampToUtc(dateTime);
        }
        if (locale !== 'en-US') {
            return date.toLocaleTimeString(locale, { hour: 'numeric', hour12: false, minute: 'numeric' });
        } else {
            const meridianTime = date.toLocaleTimeString(locale, { hour: 'numeric', hour12: true, minute: 'numeric' });
            if (meridianTime.includes(' AM')) {
                return meridianTime.replace(' AM', 'am');
            } else {
                return meridianTime.replace(' PM', 'pm');
            }
        }
    }

    showLocalTimeFromDate(locale: string, date: Date) {
        moment.locale(locale);
        return moment.utc(date.toISOString()).format('LT');
    }



    showLocalTimeFromDateString(locale: string, date: string) {
        moment.locale(locale);
        return moment.utc(date).format('LT');
    }

    showLocalDateFromDateString(locale: string, date: string) {
        moment.locale(locale);
        return moment.utc(date).format('L');
    }


    showLocalDateTime(locale: string, date: string) {
        return this.showDate(locale, date) + ', ' + this.showLocalTime(locale, date);
    }

    showLocalDateTimeNoYear(date: string) {
        const today = new Date();
        const parsedDate = new Date(+date);

        if (parsedDate.getDate() !== today.getDate()) {
            return this.showDateNoYear(this.locale, parsedDate);
        } else {
            return this.showLocalTime(this.locale, null, parsedDate);
        }
    }


    /*show duration in minutes and hours*/
    timeConvert(n: number) {
        const num = n;
        const hours = (num / 60);
        const rhours = Math.floor(hours);
        const minutes = (hours - rhours) * 60;
        const rminutes = Math.round(minutes);
        let addZerotoMinutes;
        if (rminutes < 9) {
            addZerotoMinutes = '0' + rminutes;
        } else {
            addZerotoMinutes = rminutes;
        }
        if (rminutes > 0) {
            if (rhours > 0) {
                return rhours + ' ' + this.translate.getFromKey('hour-short') + ' ' + addZerotoMinutes + ' ' + this.translate.getFromKey('minute-short');
            } else {
                return addZerotoMinutes + ' ' + this.translate.getFromKey('minute-short');
            }
        } else {
            return rhours + ' ' + this.translate.getFromKey('hour-short');
        }
    }


    /*convert date to utc*/
    parseTimestampToUtc(timestampStr: string) {
        return new Date(new Date(timestampStr).getTime() + (new Date(timestampStr).getTimezoneOffset() * 60 * 1000));
    }

    isToday(someDate) {
        const today = new Date();
        return someDate.getDate() === today.getDate() &&
            someDate.getMonth() === today.getMonth() &&
            someDate.getFullYear() === today.getFullYear();
    }

    isTomorrow(someDate) {
        const today = new Date();
        return someDate.getDate() === today.getDate() + 1 &&
            someDate.getMonth() === today.getMonth() &&
            someDate.getFullYear() === today.getFullYear();

    }

    showDob(date: string, locale) {
        moment.locale(locale);
        return moment.utc(date).format('L');
    }

    showTime(locale: string, date: Date, duration) {
        moment.locale(locale);
        // const start = date + '.000Z';
        const end = moment.utc(date.toISOString()).add(+duration, 'minutes');
        return  moment.utc(date.toISOString()).format('LT') + ' - ' + end.format('LT');


    }

    addZeroToHour(hour: string) {
        if (hour.length === 4) {
            return 0 + hour;
        } else {
            return hour;
        }
    }

    addZero(input: number): string {
        if (input < 10) {
            return '0' + input;
        } else {
            return input.toString();
        }
    }

    showSchedule(interval: string, locale: string) {

        const opening = interval.split('-')[0];
        const closure = interval.split('-')[1];

        if (locale !== 'en-US') {
            return opening + ' - ' + closure;
        } else {
            return moment.utc('2099-01-01T' + opening + ':00').format('LT') + ' - ' + moment.utc('2099-01-01T' + closure + ':00').format('LT')

        }
    }

    convertDateToString(date: Date) {
        const start = moment(date);
        return start.year() + '-' + this.addZero((start.month() + 1)) + '-' + this.addZero(start.date()) + 'T' + this.addZero(start.hour()) + ':' + this.addZero(start.minute()) + ':00';

    }

    convertDateToStringUTC(date: Date) {
        return this.convertDateToString(date) + '000Z';

    }

    getDuration(startDate: Date, endDate: Date) {
        const start = moment(startDate);
        const end = moment(endDate);
        const duration = moment.duration(end.diff(start));
        return duration.asMinutes();
    }

    showDateInterval(locale: string, date: Date, plusDays: number): string {
        moment.locale(locale);
        if (plusDays < 2) {
            return moment(date).format('LL');
        } else {
            return moment(date).format('LL') + ' - ' + moment(date).add(plusDays - 1 , 'd').format('LL');
        }
    }

    dateIsBeforeToday(dateString: string) {
        const eventDate = moment(dateString);
        const today = moment(new Date());
        return eventDate < today;
    }

    addZeroToHourTimePicker(hour: string) {
        if (hour.length === 4) {
            return 0 + hour;
        } else {
            return hour;
        }
    }

    extractLocalDateTime(date: Date) {
        const today = new Date();
        return new Date(date.getTime() - today.getTimezoneOffset() * 60000).toISOString();
    }

    showLocalTimeFromIsoDateString(locale: string, date: string) {
        moment.locale(locale);
        return moment(date).format('LT');
    }

    getDate(date: Date) {
        const year = date.getFullYear();
        const month = this.addZero(date.getMonth() + 1);
        const day = this.addZero(date.getDate());
        return year + '-' + month + '-' + day;

    }

}
