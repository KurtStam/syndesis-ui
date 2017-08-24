import { RouterStateSnapshot } from '@angular/router';
import { ConnectionsReviewComponent } from './review.component';
import { CurrentConnectionService } from '../current-connection';
import { ModalService } from '../../../common/modal/modal.service';

describe('ConnectionsReviewComponent', () => {

  let current, modalService, nextState, component;

  beforeEach(() => {
    current = <CurrentConnectionService>{};
    modalService = jasmine.createSpyObj('modalService', ['show']);
    nextState = <RouterStateSnapshot>{};
    component = new ConnectionsReviewComponent(current, modalService);
  });

  describe('canDeactivate', () => {
    it('should return true when connection is saved', () => {
      component['saved'] = true;
      const canDeactivate = component.canDeactivate(nextState);
      expect(canDeactivate).toBe(true);
    });

    it('should return true when user cancels wizard', () => {
      nextState.url = '/connections/create/cancel';
      const canDeactivate = component.canDeactivate(nextState);
      expect(canDeactivate).toBe(true);
    });

    it('should return true when user navigates back to Configure Fields page', () => {
      nextState.url = '/connections/create/configure-fields';
      const canDeactivate = component.canDeactivate(nextState);
      expect(canDeactivate).toBe(true);
    });

    it('should return true when user confirms he wants to leave wizard', (done) => {
      modalService.show.and.returnValue(Promise.resolve({ result: true }));
      component.canDeactivate(nextState)
        .then(canDeactivate => {
          expect(canDeactivate).toBe(true);
          done();
        });
    });

    it('should return false when user does not confirm he wants to leave wizard', (done) => {
      modalService.show.and.returnValue(Promise.resolve({ result: false }));
      component.canDeactivate(nextState)
        .then(canDeactivate => {
          expect(canDeactivate).toBe(false);
          done();
        });
    });
  });

});
