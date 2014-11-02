'use strict';

angular.module('uiFormValidation.directives').directive('validationErrorsMode', function() {
  return {
    restrict: 'A',
    require: '^uiValidation',
    link: function (scope, element, attrs, validationController){
      validationController.afterInitialized(function () {
        var wrapper = validationController.getFormOrControlWrapper(element);
        
        if (!wrapper) {
          throw  "Unable to get element wrapper. Directive validation-errors-mode is not placed probably on the form or input element.";
        }

        wrapper.validationErrorsMode = attrs.validationErrorsMode.split(/\s+/);
      });
    }
  };
});