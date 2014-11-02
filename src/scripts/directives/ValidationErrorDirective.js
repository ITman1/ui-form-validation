'use strict';

/*
 * Directive: 'validation-error'
 * Restrict: A
 */

angular.module('uiFormValidation.directives').directive('validationError', function($compile, $rootScope) {  
    return {
      restrict: 'A',
      require: 'validationError',
      controller: 'validationErrorsController',
      link: function(scope, element, attrs) {
        var validationError = scope[attrs.validationError];
        
        var errorMessagesScope = $rootScope.$new(true);
        angular.forEach(validationError.validationErrorContext, function (contextValue, contextKey) {
          scope.$watch(function () {
            return validationError.validationErrorContext[contextKey];
          }, function (newValue) {
            errorMessagesScope[contextKey] = newValue;
          });
        });
        
        var compiledMessageElement = $compile(angular.element("<span>" + validationError.errorMessage + "</span>"))(errorMessagesScope);
        element.append(compiledMessageElement);
      }
    };
});