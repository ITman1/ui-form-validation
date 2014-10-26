'use strict';

/*
 * Directive: 'validation-controller'
 * Restrict: A
 */

angular.module('uiFormValidation.directives').directive('validationController', function() {
    return {
      restrict: 'A',
      link: function (scope, element, attrs){
        if (typeof attrs.validationController !== 'string') {
          throw "Invalid name of the validation controller.";
        }
      }
    };
});