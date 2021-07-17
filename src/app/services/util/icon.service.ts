import { Injectable } from '@angular/core';
import {
  faBirthdayCake, faBookOpen,
  faClinicMedical,
  faCut,
  faDumbbell, faGavel, faHotTub,
  faLaptopMedical, faMarker,
  faOilCan, faPaw, faRandom, faStamp, faToilet, faTools,
  faTooth, faTruck, faUtensils
} from "@fortawesome/free-solid-svg-icons";

@Injectable({
  providedIn: 'root'
})
export class IconService {

  iconMap = {
    "AUTO": faOilCan,
    "BEAUTY": faCut,
    "BEAUTY_HAIRDRESSER": faCut,
    "CLINICS": faClinicMedical,
    "DENTIST": faTooth,
    "EVENTS": faBirthdayCake,
    "FITNESS": faDumbbell,
    "HAIRDRESSER": faCut,
    "HEALTHCARE": faClinicMedical,
    "IT": faLaptopMedical,
    "LAWYER": faGavel,
    "MASSAGE": faHotTub,
    "MISC": faRandom,
    "MOVERS": faTruck,
    "NOTARY": faStamp,
    "PETS": faPaw,
    "PLUMBING": faToilet,
    "PLUMBING_REPAIRS": faToilet,
    "REPAIRS": faTools,
    "RESTAURANT": faUtensils,
    "TATTOO": faMarker,
    "TUTOR": faBookOpen,
  };

  constructor() { }

  getIcon(name) {
    return this.iconMap[name];
  }
}
