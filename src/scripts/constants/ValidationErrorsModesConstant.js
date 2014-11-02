'use strict';

// TODO: Convert on factory & strategy pattern just like uiFormValidation.validationErrorsLocationFactories...
angular.module('uiFormValidation.constants').constant('validationErrorsModes', {
  onSubmitAndInvalid: "onSubmitAndInvalid", 
  onDirtyAndInvalid: "onDirtyAndInvalid", 
  onInvalid: "onInvalid"
});