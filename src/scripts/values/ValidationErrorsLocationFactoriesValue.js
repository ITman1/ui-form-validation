'use strict';

angular.module('uiFormValidation.values').value('uiFormValidation.validationErrorsLocationFactories', {
  after: 'uiFormValidation.validationErrorsLocation.after', 
  append: 'uiFormValidation.validationErrorsLocation.append', 
  explicit: 'uiFormValidation.validationErrorsLocation.explicit'
});