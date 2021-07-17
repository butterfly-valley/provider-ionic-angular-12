import { TestBed } from '@angular/core/testing';

import { InfoPopoverService } from './info-popover.service';

describe('InfopopoverService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: InfoPopoverService = TestBed.get(InfoPopoverService);
    expect(service).toBeTruthy();
  });
});
