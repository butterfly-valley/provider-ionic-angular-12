import { Injectable } from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class SearchForm {

  constructor() { }

  getSearchForm() {
    return new FormGroup({
      'category': new FormControl('BEAUTY', Validators.required),
      'place': new FormControl(null),
      'nearBy': new FormControl(false, this.coordinatesValidator('place')),
      'radius': new FormControl(5, Validators.required)
    });
  }

  /*check if both user location and place search are active*/
 coordinatesValidator(otherControlName: string) {

   let thisControl: FormControl;
   let otherControl: FormControl;

   return function matchOtherValidate(control: FormControl) {

     if (!control.parent) {
       return null;
     }

     // Initializing the validator.
     if (!thisControl) {
       thisControl = control;
       otherControl = control.parent.get(otherControlName) as FormControl;
       if (!otherControl) {
         throw new Error('coordinatesValidator(): other control is not found in parent group');
       }
       otherControl.valueChanges.subscribe(() => {
         thisControl.updateValueAndValidity();
       });
     }

     if (!otherControl) {
       return null;
     }

     if (otherControl.value && thisControl.value) {
       return {
         bothActive: true
       };
     }

     if (!otherControl.value && !thisControl.value) {
       return {
         bothActive: true
       };
     }


     return null;

   };
 }

}
