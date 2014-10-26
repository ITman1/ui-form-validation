'use strict';

/*
 * Directive: 'validation-submit'
 * Restrict: A
 */

angular.module('uiFormValidation.directives').directive('validationSubmit', function ($parse, utilsService) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) { 
                
      utilsService.afterValidationErrorsControllerInitialized(scope, attrs.validationSubmit, function () {
        var validationController = utilsService.validationControllers[scope][attrs.validationSubmit];
        
        element.bind('click', function () {
          scope.$apply(function () {
            validationController.submit();
          });
        });
      });
    }
  };
});