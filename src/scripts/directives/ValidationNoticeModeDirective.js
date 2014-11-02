'use strict';

angular.module('uiFormValidation.directives').directive('validationNoticeMode', function() {
  return {
    restrict: 'A',
    require: '^uiValidation',
    link: function (scope, element, attrs, validationController){
      validationController.afterInitialized(function () {
        var wrapper = validationController.getFormOrControlWrapper(element);
        
        if (!wrapper) {
          throw  "Unable to get element wrapper. Directive validation-notice-mode is not placed probably on the form or input element.";
        }

        wrapper.validationNoticeMode = attrs.validationNoticeMode.split(/\s+/);
      });
    }
  };
});