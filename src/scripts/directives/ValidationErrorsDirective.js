'use strict';

/*
 * Directive: 'validation-errors'
 * Restrict: A
 */

angular.module('uiFormValidation.directives').directive('validationErrors', function(utilsService, uiFormValidation) {
  
    return {
      replace:true,
      restrict: 'A',
      require: ['^?uiValidation', 'validationErrors'],
      template: function () {
        return uiFormValidation.validationErrorsTemplate();
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
        
        utilsService.afterValidationErrorsControllerInitialized(scope, validationControllerName, function () {

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
            
            scope.$watchCollection(function () {              
              return controlWrapper.control.$error;
            }, function () {
            
              if (watchedControl.errors && watchedControl.errors.length < 1) {
                scope.errors = {};
                return;
              }
              
              var controlErrors = {};
              controlErrors.control = controlWrapper.control;
              controlErrors.controlElement = controlErrors.controlElement;
              controlErrors.errors = {};
              
              if (controlWrapper.control && controlWrapper.control.$error) {
                angular.forEach(controlWrapper.control.$error, function (error, errorName) {
                  var formValidation = uiFormValidation.formValidations[errorName];

                  if (watchedControl.errors && watchedControl.errors.indexOf(errorName) == -1) {
                    delete controlErrors.errors[errorName];
                  } else if (error && formValidation) {
                    controlErrors.errors[errorName] = formValidation.errorMessage(errorName, scope.$parent, controlWrapper, validationController);
                  } else if (error) {
                    controlErrors.errors[errorName] = uiFormValidation.defaultErrorMessage(errorName, scope.$parent, controlWrapper, validationController);
                  }
                });
              }
              
              scope.errors[watchedControl.controlName] = controlErrors;
            });
          });
        });
      }
    };
});