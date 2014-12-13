'use strict';

/*
 * Directive: 'validation-errors'
 * Restrict: A
 */

angular.module('uiFormValidation.directives').directive('validationErrors', function($timeout, utilsService, uiFormValidation, validationErrorMessagesService, $parse) {  
    return {
      replace:true,
      restrict: 'A',
      require: ['^?uiValidation', 'validationErrors'],
      templateUrl: function($element, $scope) {
        var elementErrorsTemplate = $element.attr('validation-errors-template');
        return elementErrorsTemplate ? elementErrorsTemplate : uiFormValidation.validationErrorsTemplate;
      },
      scope: {
        'uiValidationController' : '@',
        '$index': '@'
      },
      controller: 'validationErrorsController',
      link: function(scope, element, attrs, controllers) {
      
        var validationController = controllers[0];
        var validationErrorsController = controllers[1];
            
        var validationControllerName = null;
        if (validationController) {
          validationControllerName = validationController.controllerName;
        } else {
          validationControllerName = attrs.validationController;
        }

        utilsService.addValidationErrorsController(scope, validationControllerName, validationErrorsController);
        
        scope.errors = {};
        
        utilsService.afterValidationControllerInitialized(scope, validationControllerName, function () {

          var validationController = utilsService.validationControllers[scope][validationControllerName];
          var watchedControls = validationErrorsController.parseControlErrorsSelectors(attrs['validationErrors']);
          
          scope.$watch(function () {
            return validationController.shouldDisplayValidationErrorsForControlSelectors(watchedControls);
          }, function (shouldToggleHidden) {
            element.toggleClass('hidden', !shouldToggleHidden);
          });
          
          angular.forEach(watchedControls, function (watchedControl) {

            var controlWrapper = validationController.controls[watchedControl.controlName];
            
            if (!controlWrapper) {
              throw "Undefined control '" + watchedControl.controlName + '" to watch.';
            }
            
            var refreshControlErrors = function () {
              if (watchedControl.errors && watchedControl.errors.length < 1) {
                return;
              }
              
              var controlErrors = validationErrorMessagesService.getControlErrors(scope, validationController, watchedControl, controlWrapper);             
              
              scope.errors[watchedControl.controlName] = controlErrors;
            };
            
            scope.$watchCollection(function () {              
              return controlWrapper.control.$error;
            }, refreshControlErrors);
            
            scope.$watch(function () {              
              return validationErrorMessagesService.invalidatedDate;
            }, refreshControlErrors);
          });
        });
      }
    };
});