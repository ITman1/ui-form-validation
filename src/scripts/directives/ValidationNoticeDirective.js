'use strict';

/*
 * Directive: 'validation-notice'
 * Restrict: A
 */

angular.module('uiFormValidation.directives').directive('validationNotice', function(utilsService, uiFormValidation) {
  
    return {
      restrict: 'A',
      require:  ['^uiValidation', 'validationNotice'],
      controller: 'validationNoticeController',
      link: function(scope, element, attrs, controllers) {
        var validationController = controllers[0];
        var directiveController = controllers[1];
        
        var inputs = attrs['validationNotice'];
        var controlAndErrorSelectors = directiveController.parseControlErrorsSelectors(inputs);

        validationController.afterInitialized(function () {
          scope.$watch(function () {
            return validationController.shouldNoticeForControlSelectors(controlAndErrorSelectors);
          }, function (shouldToggleHasError) {
            element.toggleClass('has-error', shouldToggleHasError);
          });
        });
      }
    };
});