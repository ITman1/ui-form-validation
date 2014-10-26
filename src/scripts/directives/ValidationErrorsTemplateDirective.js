'use strict';

angular.module('uiFormValidation.directives').directive('validationErrorsTemplate', function($parse) {
  return {
    restrict: 'A',
    require: 'uiValidation',
    link: function (scope, element, attrs, validationController){
      var templateGetter = $parse(attrs.validationErrorsLocation);
      validationController.validationErrorsTemplate = templateGetter(scope);
    }
  };
});
