import {Injectable} from '@angular/core';
import { Plugins } from '@capacitor/core';
const { Storage } = Plugins;

@Injectable({
    providedIn: 'root'
})
export class LocalStorageService {

    /* write key-value pair*/
    async writeObject(key, value) {
        await Storage.set({
            key: key,
            value: JSON.stringify(value)
        });
    }

    /*retrieve key-value pair*/
    async getObject(key) {
        return await Storage.get({key: key}).then(result => {
            return JSON.parse(result.value);
        });
/*
        return JSON.parse(ret.value);*/
    }

    async getItem(key) {
        return await Storage.get({ key: key });
    }

    async removeItem(key) {
        await Storage.remove({ key: key });
    }
}
