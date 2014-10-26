'use strict';

angular.module('uiFormValidation.factories').factory('uiFormValidation.validationErrorsLocation.after', function (utilsService) {
  return {
    name: "after",
    link: function (scope, validationErrorsElement, controlWrapper, args) {
      var insertElement = controlWrapper.controlElement;
      
      if (args.length > 0) {
        var argElement = utilsService.selectFromScope(insertElement, args[0]);
        
        if (argElement) {
          insertElement = argElement;
        }
      }

      insertElement.after(validationErrorsElement);
    }
  };
});

angular.module('uiFormValidation.factories').factory('uiFormValidation.validationErrorsLocation.append', function (utilsService) {
  return {
    name: "append",
    link: function (scope, validationErrorsElement, controlWrapper, args) {      
      var appendElement = controlWrapper.controlElement;
      
      if (args.length > 0) {
        var argElement = utilsService.selectFromScope(appendElement, args[0]);
        
        if (argElement) {
          appendElement = argElement;
        }
      }
      
      appendElement.append(validationErrorsElement);
    }
  };
});

angular.module('uiFormValidation.factories').factory('uiFormValidation.validationErrorsLocation.explicit', function () {
  return {
    name: "explicit",
    compile: function () { 
      return function () {};
    },
  };
});