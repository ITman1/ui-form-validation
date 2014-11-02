'use strict';

angular.module('uiFormValidation.services').service('utilsService', function () {
  var $this = this;
  
  this.validationErrorsControllers = {};
  this.validationControllers = {};
  this.validationControllerInitializationCallbacks = {};
  
  this.addValidationErrorsController = function (scope, validationControllerName, validationErrorsController) {
    if (!this.validationErrorsControllers[scope]) {
      this.validationErrorsControllers[scope] = {};
      
      scope.$on('$destroy', function () {
        delete $this.validationErrorsControllers[scope];
      });
    }
  
    if (!this.validationErrorsControllers[scope][validationControllerName]) {
      this.validationErrorsControllers[scope][validationControllerName] = [];
    }
    
    this.validationErrorsControllers[scope][validationControllerName].push(validationErrorsController);
  };
  
  this.addValidationController = function (scope, validationController) {
    if (!this.validationControllers[scope]) {
      this.validationControllers[scope] = [];
      
      scope.$on('$destroy', function () {
        delete $this.validationControllers[scope];
      });
    }
    
    this.validationControllers[scope][validationController.controllerName] = validationController;

    if (this.validationControllerInitializationCallbacks[scope] && this.validationControllerInitializationCallbacks[scope][validationController.controllerName]) {
      angular.forEach(this.validationControllerInitializationCallbacks[scope][validationController.controllerName], function (callback) {
        validationController.afterInitialized(callback);
      });
    
      delete this.validationControllerInitializationCallbacks[scope][validationController.controllerName];
    }
  };
        
  this.selectFromScope = function (scope, selector) {   
    selector = selector.trim();

    if (selector !== "" || selector !== "this") {
      /*jslint evil: true */
      return eval('scope.' + selector);   
    }
    
    return scope;
  };
  
  this.afterValidationControllerInitialized = function (scope, validationControllerName, callback) {
    if (this.validationControllers[scope] && this.validationControllers[scope][validationControllerName]) {
      this.validationControllers[scope][validationControllerName].afterInitialized(callback);
    } else {
      if (!this.validationControllerInitializationCallbacks[scope]) {
        this.validationControllerInitializationCallbacks[scope] = {};
        
        scope.$on('$destroy', function () {
          delete $this.validationControllerInitializationCallbacks[scope];
        });
      }
    
      if (!this.validationControllerInitializationCallbacks[scope][validationControllerName]) {
        this.validationControllerInitializationCallbacks[scope][validationControllerName] = [];
      }
      
      this.validationControllerInitializationCallbacks[scope][validationControllerName].push(callback);
    }
  };
  
  this.parseControlErrorsSelectors = function (controlErrorsSelectorsString) {
    var controlErrorsSelectors = {};
    
    angular.forEach(controlErrorsSelectorsString.split(/\s+/), function (controlAndError) {
      var parseRegexp = /^\s*(.*?)\s*(\{\s*([^\{\}]*?)\s*\})?$/;
      var match = parseRegexp.exec(controlAndError);
      if (match !== null && match.length === 4) {
        var controlName = match[1];
        controlErrorsSelectors[controlName] = {};
        controlErrorsSelectors[controlName].controlName = controlName;
        controlErrorsSelectors[controlName].errors = match[3]? match[3].split(",") : undefined;
        if (controlErrorsSelectors[controlName].errors) {
          controlErrorsSelectors[controlName].errors = controlErrorsSelectors[controlName].errors.map(function (errorName) {
            return errorName.trim();
          });
        }
      } else {
          throw "Unable to parse input-errors controls.";
      }
    });
    
    return controlErrorsSelectors;
  };
  
  this.evalAndParseControlErrorsSelectors = function (scope, inputs) {
    var inputsArr = inputs.split(/\s+/);

    inputsArr = inputsArr.map(function (input) {
      return scope.$eval(input);
    });
    inputs = inputsArr.join(" ");
    
    return this.parseControlErrorsSelectors(inputs);
  };
  
  this.isExpression = function (value) {
    var controlErrorsSelectors = {};
    var parseRegexp = /^\s*\{([^\{\}]*)\}\s*?$/;
    var match = parseRegexp.exec(value);
    
    return match !== null;
  };
  
  this.parseExpression = function (value) {
    var controlErrorsSelectors = {};
    var parseRegexp = /^\s*\{([^\{\}]*)\}\s*?$/;
    var match = parseRegexp.exec(value);
    
    if (match !== null && match.length === 2) {
      return match[1];
    } else {
      return undefined;
    }
  };
  
  this.camelToSnakeCase = function (camelCase, separator) {
    return camelCase.replace(/[A-Z]/g, function (match, pos) {
        return (pos > 0 ? separator : '') + match.toLowerCase();
    });
  };
});