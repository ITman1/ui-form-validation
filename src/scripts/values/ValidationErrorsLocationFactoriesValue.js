'use strict';

angular.module('uiFormValidation.values').value('validationErrorsLocationFactories', {
  after: 'uiFormValidation.validationErrorsLocation.after', 
  append: 'uiFormValidation.validationErrorsLocation.append', 
  explicit: 'uiFormValidation.validationErrorsLocation.explicit'
});