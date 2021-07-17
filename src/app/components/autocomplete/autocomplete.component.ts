import {Component, Input, OnInit} from '@angular/core';
import {LocalizationService} from '../../services/localization/localization.service';
import { SearchService} from '../../services/search/search.service';
import {Router} from '@angular/router';
import {ToastService} from '../../services/overlay/toast.service';
import {Provider} from '../../store/models/provider.model';
import {mobile} from '../../app.component';


@Component({
  selector: 'app-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss'],
})
export class AutocompleteComponent implements OnInit {
  @Input() color: string;
  @Input() buttonColor: string;
  @Input() rowBorder: string;

  constructor(private searchService: SearchService,
              private localizationService: LocalizationService,
              private router: Router,
              private toastService: ToastService
  ) { }
  /*when no search is performed*/
  isListAvailable = false;
  /* if no results message is displayed*/
  noResults = false;
  /* loading spinner*/
  isLoading = false;
  foundProviders: Provider[] = [];

  mobile = mobile;


  ngOnInit() {}

  /*translated placeholder*/
  searchbarPlaceholder(): string {
    return this.localizationService.getFromKey('search-name-placeholder');
  }

  autocompleteProviderByName(ev: any): Provider[] {
    this.isLoading = true;

    /*  selected value*/
    const val = ev.target.value;

    this.noResults = false;
    this.searchService.onProviderSearchAutocomplete(val).subscribe(response => {
      this.foundProviders = response;
      if (this.foundProviders.length > 0) {
        this.isListAvailable = true;
      } else {
        this.noResults = true;
        this.isListAvailable = false;
      }

      if (val.length < 1) {
        this.noResults = false;
      }
      this.isLoading = false;
      return this.foundProviders;
    }, error => {
      this.isLoading = false;
      /*present error toast*/
      this.toastService.presentToast(this.localizationService.getFromKey('navbar-searchError'),
          'bottom', 'danger', 4000);
    });
    return this.foundProviders;
  }

  /*redirect to provider page*/
  onProviderClick(id: string) {
    this.router.navigate(['/search/provider/' + id]);
  }


}
