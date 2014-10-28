'use strict';

angular.module('uiFormValidation.directives').directive('validationErrorsTemplate', function($parse) {
  return {
    restrict: 'A',
    require: '^uiValidation',
    link: function (scope, element, attrs, validationController){
      if (validationController) {
        validationController.afterInitialized(function () {
          var wrapper = validationController.getFormOrControlWrapper(element);

          if (!wrapper) { // FIXME: Uncomment and fix
            //throw  "Unable to get element wrapper. Directive validation-errors-template is not placed probably on the form or input element.";
          } else {
            wrapper.validationErrorsTemplate = attrs.validationErrorsTemplate;
          }
        });
      }
    }
  };
});
