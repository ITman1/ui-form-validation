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
        var compiledMessageElement = null;
        var watchers = [];
        scope.$watch(function () {
          return scope[attrs.validationError];
        }, function (validationError) {
          angular.forEach(watchers, function (watcher) {
            watcher();
          });
          watchers = [];
          
          var errorMessagesScope = $rootScope.$new(true);
          angular.forEach(validationError.validationErrorContext, function (contextValue, contextKey) {
            watchers.push(scope.$watch(function () {
              return validationError.validationErrorContext[contextKey];
            }, function (newValue) {
              errorMessagesScope[contextKey] = newValue;
            }));
          });
          
          
          if (compiledMessageElement) {
            compiledMessageElement.remove();
          }
          
          compiledMessageElement = $compile(angular.element("<span>" + validationError.errorMessage + "</span>"))(errorMessagesScope);
          element.append(compiledMessageElement);
        });
      }
    };
});