/*!
 * ui-form-validation
 * https://github.com/ITman1/ui-form-validation
 * Version: v0.0.3 - 2014-12-13T21:00:59.609Z
 * License: MIT
 */


(function(window, document, undefined) {
'use strict';
angular.module('uiFormValidation.constants', []);
angular.module('uiFormValidation.values', []);
angular.module('uiFormValidation.providers', []);

angular.module('uiFormValidation.services', [  
  'uiFormValidation.constants',
  'uiFormValidation.values'
]);

angular.module('uiFormValidation.factories', [  
  'uiFormValidation.constants',
  'uiFormValidation.values',
  'uiFormValidation.services'
]);

angular.module('uiFormValidation.controllers', [
  'uiFormValidation.constants',
  'uiFormValidation.values',
  'uiFormValidation.services',
  'uiFormValidation.factories'
]);

angular.module('uiFormValidation.directives', [
  'uiFormValidation.constants',
  'uiFormValidation.values',
  'uiFormValidation.services',
  'uiFormValidation.factories',
  'uiFormValidation.controllers'
]);

angular.module('uiFormValidation', [
  'uiFormValidation.constants',
  'uiFormValidation.values',
  'uiFormValidation.services',,
  'uiFormValidation.factories',
  'uiFormValidation.controllers',
  'uiFormValidation.directives',
  'uiFormValidation.providers',
  'ngSanitize'
]).run(function (uiFormValidation, validationErrorMessagesService) {
  angular.forEach(uiFormValidation.validationErrorMessagesFiles, function (file) {
    validationErrorMessagesService.addValidationErrorMessages(file.locale, file.validationErrorMessagesName);
  });
  
});

/*
 * TODO: Refactor and make more services e.g. some registry for validation notice and errors + service 
 *       maintaining custom validation directives, notice modes, validation modes etc.
*/

angular.module('uiFormValidation.constants').constant('supportedValidations', {
  'validateRequired' : { /* required validation */
    validationName: "validateRequired",
    performableValidation: function () {
      return true;
    },
    validate: function (value) {
      return !(!value);
    }
  },
  'validateAdhoc' : {
    validationName: "validateAdhoc",
    performableValidation: function () {
      return true;
    },
    validate: function (value, validationContext) {
      var adhocPath = validationContext.element.attr("validate-adhoc");
      var error = validationContext.scope.$eval(adhocPath);
      return !error;
    },
    errorMessage: function (validationErrorContext) {
      var adhocPath = validationErrorContext.control.controlElement.attr("validate-adhoc");
      var error = scope.$eval(adhocPath);
      return error;
    }
  },
  'validateLength' : {
    validationName: "validateLength",
    performableValidation: function () {
      return true;
    },
    validate: function (value, validationContext) {
      return value && value.length && value.length >= parseInt(validationContext.element.attr("validate-length"));
    }
  },
  'validateRegex' : {
    validationName: "validateRegex",
    performableValidation: function () {
      return true;
    },
    validate: function (value, validationContext) {
      return new RegExp(validationContext.element.attr("validate-regex")).test(value);
    }
  }
});

// TODO: Convert on factory & strategy pattern just like uiFormValidation.validationErrorsLocationFactories...
angular.module('uiFormValidation.constants').constant('validationErrorsModes', {
  onSubmitAndInvalid: "onSubmitAndInvalid", 
  onDirtyAndInvalid: "onDirtyAndInvalid", 
  onInvalid: "onInvalid"
});

angular.module('uiFormValidation.constants').constant('validationErrorsTemplates', {
  DEFAULT: 'validation-errors-templates/default.html'
});

// TODO: Convert on factory & strategy pattern just like uiFormValidation.validationErrorsLocationFactories...
angular.module('uiFormValidation.constants').constant('validationNoticeModes', {
  onSubmitAndInvalid: "onSubmitAndInvalid", 
  onDirtyAndInvalid: "onDirtyAndInvalid", 
  onInvalid: "onInvalid"
});

angular.module('uiFormValidation.controllers').controller('validationErrorsController', function (utilsService, $scope) {

  this.parseControlErrorsSelectors = function (inputs) {
    if (utilsService.isExpression(inputs)) {
      inputs = utilsService.parseExpression(inputs);
      return utilsService.evalAndParseControlErrorsSelectors($scope.$parent, inputs); // FIXME: $parent??
    } else {
      return utilsService.parseControlErrorsSelectors(inputs);
    };
  };
});

angular.module('uiFormValidation.controllers').controller('validationNoticeController', function (utilsService, $scope) {

  this.parseControlErrorsSelectors = function (inputs) {
    if (utilsService.isExpression(inputs)) {
      inputs = utilsService.parseExpression(inputs);
      return utilsService.evalAndParseControlErrorsSelectors($scope.$parent, inputs); // FIXME: $parent??
    } else {
      return utilsService.parseControlErrorsSelectors(inputs);
    };
  };

});

angular.module('uiFormValidation.directives').directive('uiValidation', function (validationErrorMessagesService, $parse, uiFormValidation, validationErrorsModes, validationNoticeModes, validationErrorsLocationFactories, utilsService, $compile, $injector) {
  var uniqueId = 1;
  return {
    restrict: 'A',
    require: ['uiValidation', 'form'],
    controller: function ($scope, $injector, $element) {
      var validationErrorsLocationFactoryInstances = [];
      
      angular.forEach(validationErrorsLocationFactories, function (factoryName) {
        validationErrorsLocationFactoryInstances.push($injector.get(factoryName));
      });
    
      this.controllerName = $element.attr("name") || "uiValidation_" + uniqueId++;
      this.initialized = false;
      this.isSubmited = false;
      this.initializationCallbacks = [];
    
      this.formController = undefined;
      this.formElement = undefined;
      this.controls = {};
    
      this.validationNoticeMode = uiFormValidation.validationNoticeMode;
    
      //this.controlsErrors = undefined;
      this.validationErrorsMode = uiFormValidation.validationErrorsMode;
      this.validationErrorsLocation = uiFormValidation.validationErrorsLocation;
      this.validationErrorsTemplate = uiFormValidation.validationErrorsTemplate;
      
      var $this = this;
      this.initialize = function (formController, formElement) {   
        $this.controllerName = formController.$name || $this.controllerName; 
        $this.formController = formController;
        $this.formElement = formElement;
        
        // Decorate form controller
        var original$addControl = formController.$addControl;
        formController.$addControl = function (control) {
          original$addControl(control);
          $this.addControl(control);
        };
        
        angular.forEach(formController, function (control, controlName) {
          if (control && control.hasOwnProperty('$modelValue')) {
            $this.addControl(control);
          }
        });
        
        $this.initialized = true;
        
        angular.forEach($this.initializationCallbacks, function (fn, index) {
          fn();
        });
      };
      
      this.addControl = function (control) {
        if (!control.$name || control.$name === "") {
          return;
        }
      
        var controlWrapper = {};
            
        var controlElement   = this.formElement[0].querySelector('[name="' + control.$name + '"]');
        controlElement = angular.element(controlElement);
        
        controlWrapper.control = control;
        controlWrapper.controlElement = controlElement;
        controlWrapper.validationNoticeMode = undefined;
        controlWrapper.validationErrorsMode = undefined;
        controlWrapper.validationErrorsLocation = undefined;
        controlWrapper.validationErrorsTemplate = undefined;
        
        $this.controls[control.$name] = controlWrapper;
      };
      
      this.afterInitialized = function (fn) {
        if (this.initialized) {
          fn();
        } else {
          this.initializationCallbacks.push(fn);
        }
      };
      
      this.getValidationProperty = function (controlName, property) {
        if (!$this.controls[controlName]) {
          throw "Control with given name " + controlName + " does not exist.";
        }
        
        var controlPropertyValue = $this.controls[controlName][property];
        if (!controlPropertyValue) {
          return $this[property];
        } else {
          return controlPropertyValue;
        }
      };
      
      this.getValidationErrorsMode = function (controlName) {
        return this.getValidationProperty(controlName, 'validationErrorsMode');
      };
      
      this.getValidationNoticeMode = function (controlName) {
        return this.getValidationProperty(controlName, 'validationNoticeMode');
      };
      
      this.getValidationErrorsTemplate = function (controlName) {
        return this.getValidationProperty(controlName, 'validationErrorsTemplate');
      };
      
      this.getValidationErrorsLocation = function (controlName) {
        return this.getValidationProperty(controlName, 'validationErrorsLocation');
      };
      
      this.hasControlErrors = function (controlAndErrorSelector) {
        var selectorControlName = controlAndErrorSelector.controlName;
        var selectorErrorNames = controlAndErrorSelector.errors;
        var controlWrapper = this.controls[selectorControlName];

        if (!controlWrapper) {
          throw "Control with name '" + selectorControlName + "' does not exist.";
        }
        
        var isInvalid = false;
        
        if (!selectorErrorNames) {
          isInvalid = controlWrapper.control.$invalid;
          
          if (isInvalid === undefined) {
            angular.forEach(controlWrapper.control.$error, function(errorName) {
              isInvalid = true;
            });
          }
        } else {
          angular.forEach(selectorErrorNames, function(errorName) {
            if (controlWrapper.control.$error[errorName]) {
              isInvalid = true;
            } 
          });
        }
        
        return isInvalid;
      };
      
      this.hasControlsErrors = function (controlAndErrorSelectors) {
        var hasErrors = false;
        
        angular.forEach(controlAndErrorSelectors, function(controlAndErrorSelector) {
          if ($this.hasControlErrors(controlAndErrorSelector)) {
            hasErrors = true;
          }
        });
        
        return hasErrors;
      };
      
      this.shouldNoticeForControlSelector = function (controlAndErrorSelector) {
        var selectorControlName = controlAndErrorSelector.controlName;
        var validationNoticeMode = this.getValidationNoticeMode(selectorControlName);
        var controlWrapper = this.controls[selectorControlName];
        var isInvalid = this.hasControlErrors(controlAndErrorSelector);
        
        if (!controlWrapper) {
          throw "Control with name '" + selectorControlName + "' does not exist.";
        }
        
        var onSubmitAndInvalid = false;
        var onDirtyAndInvalid = false;
        var onInvalid = false;
        
        if (validationNoticeMode.indexOf(validationNoticeModes.onSubmitAndInvalid) !== -1) {
          onSubmitAndInvalid = this.isSubmited && isInvalid;
        }
        
        if (validationNoticeMode.indexOf(validationNoticeModes.onDirtyAndInvalid) !== -1) {
          onDirtyAndInvalid = controlWrapper.control.$dirty && isInvalid;
        }
        
        if (validationNoticeMode.indexOf(validationNoticeModes.onInvalid) !== -1) {
          onInvalid = isInvalid;
        }

        return (onSubmitAndInvalid || onDirtyAndInvalid || onInvalid);
      };
      
      this.shouldNoticeForControlSelectors = function (controlsAndErrorSelectors) {
        var hasErrors = false;
        
        angular.forEach(controlsAndErrorSelectors, function(controlAndErrorSelector) {
          if ($this.shouldNoticeForControlSelector(controlAndErrorSelector)) {
            hasErrors = true;
          }
        });
        
        return hasErrors;
      };
      
      this.shouldDisplayValidationErrorsForControlSelector = function (controlAndErrorSelector) {
        var selectorControlName = controlAndErrorSelector.controlName;
        var validationErrorsMode = this.getValidationErrorsMode(selectorControlName);
        var controlWrapper = this.controls[selectorControlName];
        var isInvalid = this.hasControlErrors(controlAndErrorSelector);
        
        if (!controlWrapper) {
          throw "Control with name '" + selectorControlName + "' does not exist.";
        }
        
        var onSubmitAndInvalid = false;
        var onDirtyAndInvalid = false;
        var onInvalid = false;
        
        if (validationErrorsMode.indexOf(validationErrorsModes.onSubmitAndInvalid) !== -1) {
          onSubmitAndInvalid = this.isSubmited && isInvalid;
        }
        
        if (validationErrorsMode.indexOf(validationErrorsModes.onDirtyAndInvalid) !== -1) {
          onDirtyAndInvalid = controlWrapper.control.$dirty && isInvalid;
        }
        
        if (validationErrorsMode.indexOf(validationErrorsModes.onInvalid) !== -1) {
          onInvalid = isInvalid;
        }

        return (onSubmitAndInvalid || onDirtyAndInvalid || onInvalid);
      };
      
      this.shouldDisplayValidationErrorsForControlSelectors = function (controlsAndErrorSelectors) {
        var hasErrors = false;
        
        angular.forEach(controlsAndErrorSelectors, function(controlAndErrorSelector) {
          if ($this.shouldDisplayValidationErrorsForControlSelector(controlAndErrorSelector)) {
            hasErrors = true;
          }
        });
        
        return hasErrors;
      };
      
      this.getParsedValidationErrorsLocation = function (controlName) {
        var validationErrorsLocation = this.getValidationErrorsLocation(controlName);
        var parsedValidationErrorsLocation = {name: "", args: []};
        
        var parseRegexp = /^\s*(.*?)\s*(\{\s*([^\{\}]*?)\s*\})?$/;
        var match = parseRegexp.exec(validationErrorsLocation);
        if (match !== null && match.length === 4) {
            parsedValidationErrorsLocation.name = match[1].trim();
            parsedValidationErrorsLocation.args = match[3]? match[3].split(",") : [];
        } else {
            throw "Unable to parse validation errors location - '" + validationErrorsLocation + "'.";
        }
        
        return parsedValidationErrorsLocation;
      };
      
      this.getFormOrControlWrapper = function (element) {
        if ($this.formElement[0] === element[0]) {
          return $this;
        }
        
        var result;
        angular.forEach($this.controls, function (controlWrapper, controlName) {
          if (!result && controlWrapper.controlElement[0] === element[0]) {
            result = controlWrapper;
          } 
        });
        
        return result;
      };
      
      this.injectValidationErrors = function () {
        angular.forEach($this.controls, function (controlWrapper, controlName) {
          var validationErrorsElement = angular.element("<div></div>");
          validationErrorsElement.attr('validation-errors', controlName);
          validationErrorsElement.attr('validation-controller', $this.controllerName);   
          validationErrorsElement.attr('validation-errors-template', $this.getValidationErrorsTemplate(controlName));   
          
          var parsedValidationErrorsLocation = $this.getParsedValidationErrorsLocation(controlName);
          
          angular.forEach(validationErrorsLocationFactoryInstances, function (validationErrorsLocationFactory) {
            if (validationErrorsLocationFactory.name === parsedValidationErrorsLocation.name) {
              var link = null;
              if (validationErrorsLocationFactory.compile) {
                if (typeof validationErrorsLocationFactory.compile !== 'function') {
                  throw "Validation attribute compile is not function.";
                }
                
                link = validationErrorsLocationFactory.compile(validationErrorsElement, parsedValidationErrorsLocation.args);
              } else {
                link = $compile(validationErrorsElement);
              }
              
              link($scope, function(clonedValidationErrorsElement) {
                if (validationErrorsLocationFactory.link) {
                  if (typeof validationErrorsLocationFactory.link !== 'function') {
                    throw "Validation attribute link is not function.";
                  }
                  
                  validationErrorsLocationFactory.link($scope, clonedValidationErrorsElement, controlWrapper, parsedValidationErrorsLocation.args);
                }
              });
            }
          });
        });
      };
      
      /* FIXME: Implementation is not sufficient */
      this.bindSubmitEvent = function () {
        this.formElement.bind('submit', function () {
          $scope.$apply(function () {
            $this.submit();
          });
        });
      };
      
      this.validate = function () {
        angular.forEach(this.controls, function(controlWrapper) {
          var viewValue = controlWrapper.control.$viewValue;
          controlWrapper.control.$setViewValue(viewValue);
        });
      };
      
      /* FIXME: Implementation is not sufficient */
      this.submit = function () {
        var ngSubmit = this.formElement.attr("ng-submit");
        
        if (ngSubmit) {
          this.isSubmited = true;
          $scope.$eval(ngSubmit);
        }
      };
    },
    controllerAs: 'uiValidationController',
    link: function(scope, formElement, attrs, controllers) {
      var validationController = controllers[0];
      var formController = controllers[1];
      
      formElement.attr("novalidate", true);

      validationController.initialize(formController, formElement);
      validationController.injectValidationErrors();
      validationController.bindSubmitEvent();
      
      utilsService.addValidationController(scope, validationController);
    }
  };
});

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

angular.module('uiFormValidation.directives').directive('validationErrorsLocation', function() {
  return {
    restrict: 'A',
    require: '^uiValidation',
    link: function (scope, element, attrs, validationController){
      validationController.afterInitialized(function () {
        var wrapper = validationController.getFormOrControlWrapper(element);
        
        if (!wrapper) {
          throw  "Unable to get element wrapper. Directive validation-errors-location is not placed probably on the form or input element.";
        }

        wrapper.validationErrorsLocation = attrs.validationErrorsLocation;
      });
    }
  };
});

angular.module('uiFormValidation.directives').directive('validationErrorsMode', function() {
  return {
    restrict: 'A',
    require: '^uiValidation',
    link: function (scope, element, attrs, validationController){
      validationController.afterInitialized(function () {
        var wrapper = validationController.getFormOrControlWrapper(element);
        
        if (!wrapper) {
          throw  "Unable to get element wrapper. Directive validation-errors-mode is not placed probably on the form or input element.";
        }

        wrapper.validationErrorsMode = attrs.validationErrorsMode.split(/\s+/);
      });
    }
  };
});

angular.module('uiFormValidation.directives').directive('validationErrorsTemplate', function($parse) {
  return {
    restrict: 'A',
    require: '^uiValidation',
    link: function (scope, element, attrs, validationController){
      if (validationController) {
        validationController.afterInitialized(function () {
          var wrapper = validationController.getFormOrControlWrapper(element);

          if (!wrapper) { // FIXME: Uncomment and fix
            //throw  "Unable to get element wrapper. Directive validation-errors-template is not placed probably on the form or input element.";
          } else {
            wrapper.validationErrorsTemplate = attrs.validationErrorsTemplate;
          }
        });
      }
    }
  };
});

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

angular.module('uiFormValidation.directives').directive('validationNoticeMode', function() {
  return {
    restrict: 'A',
    require: '^uiValidation',
    link: function (scope, element, attrs, validationController){
      validationController.afterInitialized(function () {
        var wrapper = validationController.getFormOrControlWrapper(element);
        
        if (!wrapper) {
          throw  "Unable to get element wrapper. Directive validation-notice-mode is not placed probably on the form or input element.";
        }

        wrapper.validationNoticeMode = attrs.validationNoticeMode.split(/\s+/);
      });
    }
  };
});

/*
 * Directive: 'validation-submit'
 * Restrict: A
 */

angular.module('uiFormValidation.directives').directive('validationSubmit', function ($parse, utilsService) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) { 
                
      utilsService.afterValidationControllerInitialized(scope, attrs.validationSubmit, function () {
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

angular.module('uiFormValidation.providers').provider('uiFormValidation', function ($compileProvider, validationErrorsModes, validationNoticeModes, supportedValidations, validationErrorsTemplates) {
  var $this = this;
  
  this.formValidations = {};
  
  this.validationErrorsTemplate = validationErrorsTemplates.DEFAULT;
  this.validationErrorMessagesLocale = undefined;
    
  this.validationErrorsMode = [validationErrorsModes.onSubmitAndInvalid, validationErrorsModes.onDirtyAndInvalid];
  this.validationNoticeMode = [validationNoticeModes.onSubmitAndInvalid, validationNoticeModes.onDirtyAndInvalid];
  
  this.validationErrorsLocation = "after{this}";
  
  this.addFormValidation = function(validation) {
    this.formValidations[validation.validationName] = validation;
    
    $compileProvider.directive.apply(null, [validation.validationName, function() {
      return {
        restrict: 'A',
        require: ['^uiValidation', 'ngModel'],
        link: function(scope, element, attrs, controllers) {
          var uiValidationController = controllers[0];
          var ngModelController = controllers[1];
          
          if (validation.performableValidation && typeof validation.performableValidation === "function") {
            //TODO: performableValidation(element)
          }

          /* For AngularJS 1.2.x - uses parsers pipeline */
          if (!ngModelController.$validators) {
            var value = ngModelController.$modelValue || ngModelController.$viewValue;
            var validationResult = $this.validate(value, uiValidationController, ngModelController, validation, scope, element, attrs);
            
            if (validationResult) {
              ngModelController.$setValidity(validation.validationName, true);
            } else {
              ngModelController.$setValidity(validation.validationName, false);
            }
            
            ngModelController.$parsers.unshift(function(value) {
              var validationResult = $this.validate(value, uiValidationController, ngModelController, validation, scope, element, attrs);
              ngModelController.$setValidity(validation.validationName, validationResult);
              return value;
            });
            
            ngModelController.$formatters.unshift(function(value) {
              var validationResult = $this.validate(value, uiValidationController, ngModelController, validation, scope, element, attrs);
              ngModelController.$setValidity(validation.validationName, validationResult);
              return value;
            });
          } else {           /* For AngularJS 1.3.x - uses validators pipeline */
            ngModelController.$validators[validation.validationName] = function(modelValue, viewValue) {
              var value = modelValue || viewValue;
              return $this.validate(value, uiValidationController, ngModelController, validation, scope, element, attrs);
            };
            
            ngModelController.$validate();
          }
        }
      };
    }]);
  };
  
  this.validate = function (value, uiValidationController, ngModelController, validation, scope, element, attrs) {
    var validationContext = {
      uiValidationController: uiValidationController,
      ngModelController: ngModelController,
      validation: validation,
      scope: scope,
      attrs: attrs,
      element: element
    };
    
    return validation.validate(value, validationContext);
  };
  
  this.supportedValidations = supportedValidations;
  
  
  this.validationErrorMessagesFiles = [];
  this.addValidationErrorMessages = function (locale, validationErrorMessagesName) {
    this.validationErrorMessagesFiles.push({
      locale: locale,
      validationErrorMessagesName: validationErrorMessagesName
    });
  };
  
  function UIFormValidationProvider() {
    this.validationErrorMessagesFiles = $this.validationErrorMessagesFiles;
  
    this.validationNoticeMode = $this.validationNoticeMode;
  
    this.validationErrorsMode = $this.validationErrorsMode;
    this.validationErrorsLocation = $this.validationErrorsLocation;
    this.validationErrorsTemplate = $this.validationErrorsTemplate;
    
    this.formValidations = $this.formValidations;

    this.validationErrorMessagesLocale = $this.validationErrorMessagesLocale;
    
    angular.forEach($this.supportedValidations, function (validation, index) {
      $this.addFormValidation(validation);
    });
  }
  
  this.$get = [function () {
    return new UIFormValidationProvider();
  }];
});

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
      var parseRegexp = /^\s*(.*?)\s*(\[\s*([^\{\}]*?)\s*\])?$/;
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

angular.module('uiFormValidation.services').service('validationErrorMessagesService', function (uiFormValidation, validationErrorMessages, utilsService, $locale, $templateCache, $cacheFactory, $log, $http) {
  var $this = this;
  var validationErrorMessagesCache = $cacheFactory('validationErrorMessagesCache');
  
  this.invalidatedDate = new Date();
  
  this.invalidateCache = function (locale) {
    if (locale && locale != 'default') {
      validationErrorMessagesCache.remove(locale);
    } else {
      validationErrorMessagesCache.removeAll();
    }
    
    this.invalidatedDate = new Date();
  };
  
  this.addValidationErrorMessages = function (locale, validationErrorMessagesName, validationErrorMessages) {
    if (!validationErrorMessages) {
      $http.get(validationErrorMessagesName)
      .then(function(res){
         $this.addValidationErrorMessages(locale, validationErrorMessagesName, res.data);                
       });
      
      return;
    }
    
    var localeValidationErrorMessages = this.getValidationErrorMessages(locale);
    
    if (!localeValidationErrorMessages) {
      localeValidationErrorMessages = [];
      this.setValidationErrorMessages(locale, localeValidationErrorMessages);
    }
    
    localeValidationErrorMessages.push(validationErrorMessagesName);
    $templateCache.put(validationErrorMessagesName, validationErrorMessages);
    
    this.invalidateCache(locale);
  };
  
  this.removeValidationErrorMessages = function (locale, validationErrorMessagesName) {
    var localeValidationErrorMessages = this.getValidationErrorMessages(locale);
    
    if (!localeValidationErrorMessages) {
      $log.error("Validation error messages with given locale '" + locale + "' do not exist.");
      return;
    }
    
    var removeIndex = localeValidationErrorMessages.indexOf(validationErrorMessagesName);
    
    if (removeIndex == -1) {
      $log.error("Provider with name '" + validationErrorMessagesName + 
          "' of the error messages with given locale does not exist.");
      return;
    }
    
    localeValidationErrorMessages.splice(removeIndex, 1);
    $templateCache.remove(validationErrorMessagesName);
    
    this.invalidateCache(locale);
  };
   
  this.getErrorMessagesLocale = function () {
    if (uiFormValidation.validationErrorMessagesLocale) {
      return uiFormValidation.validationErrorMessagesLocale;
    } else {
      return $locale.id;
    }
  };
  
  this.getErrorMessagesLocaleKey = function (locale) {
    return locale.replace('-', '_').toUpperCase();
  };
  
  this.getValidationErrorMessages = function (locale) {
    var errorMessagesLocaleKey = this.getErrorMessagesLocaleKey(locale);
    return validationErrorMessages[errorMessagesLocaleKey];  
  };
  
  this.setValidationErrorMessages = function (locale, messages) {
    var errorMessagesLocaleKey = this.getErrorMessagesLocaleKey(locale);
    validationErrorMessages[errorMessagesLocaleKey] = messages;  
  };
  
  this.getLocalValidationErrorMessages = function (locale) {   
    var locale = (locale) ? locale : this.getErrorMessagesLocale();   
    var localeValidationErrorMessagesTemplateNames = this.getValidationErrorMessages(locale);  
    
    return this.getValidationErrorMessagesInstance(locale, localeValidationErrorMessagesTemplateNames);
  };
  
  this.getDefaultValidationErrorMessages = function () {
    return this.getValidationErrorMessagesInstance('default', validationErrorMessages.DEFAULT);
  };
  
  this.getValidationErrorMessagesInstance = function (locale, validationErrorMessagesTemplateNames) {   
    var cachedValidationErrorMessages = validationErrorMessagesCache.get(locale);
    if (cachedValidationErrorMessages) {
      return cachedValidationErrorMessages;
    } else {
      var validationErrorMessagesInstance = {};
      angular.forEach(validationErrorMessagesTemplateNames, function (validationErrorMessagesTemplateName) {
        var validationErrorMessagesTemplate = $templateCache.get(validationErrorMessagesTemplateName);
        var validationErrorMessagesTemplateInstance = angular.fromJson(validationErrorMessagesTemplate);
        
        angular.forEach(validationErrorMessagesTemplateInstance, function (controllerMessages, controllerName) {
          validationErrorMessagesInstance[controllerName] = validationErrorMessagesInstance[controllerName] || {};
          angular.extend(validationErrorMessagesInstance[controllerName], controllerMessages);
        });
        
      });
      
      /* Put default validation message if there is no translation */
      if (locale != 'default') {
        var defaultValidationErrorMessages = this.getDefaultValidationErrorMessages();
        angular.forEach(defaultValidationErrorMessages, function (controllerMessages, controllerName) {
          validationErrorMessagesInstance[controllerName] = validationErrorMessagesInstance[controllerName] || {};
          angular.forEach(defaultValidationErrorMessages[controllerName], function (defaultValidationErrorMessage, key) {
            if (!validationErrorMessagesInstance[controllerName][key]) {
              validationErrorMessagesInstance[controllerName][key] = defaultValidationErrorMessage;
            }
          });
        });
      }
      
      validationErrorMessagesCache.put(locale, validationErrorMessagesInstance);
      return validationErrorMessagesInstance;
    }
  };

  this.getControlErrors = function (scope, validationController, watchedControl, controlWrapper) {
    var controlErrors = {};
    controlErrors.control = controlWrapper.control;
    controlErrors.controlElement = controlErrors.controlElement;
    controlErrors.errors = {};
    
    if (controlWrapper.control && controlWrapper.control.$error) {
      angular.forEach(controlWrapper.control.$error, function (error, errorName) {
        var formValidation = uiFormValidation.formValidations[errorName];
        var validationErrorMessages = $this.getLocalValidationErrorMessages();
        var validationErrorContext = {
            validationName: errorName, 
            validationValue: undefined,
            controlValue: undefined,
            control: controlWrapper,
            validationController: validationController,
            errorMessages: validationErrorMessages,
            scope: scope.$parent,
            errorsScope: scope
        };
        
        scope.$watch(function () {
          return controlWrapper.control.$viewValue || controlWrapper.control.$modelValue;
        }, function (newValue) {
          validationErrorContext.controlValue = newValue;
        });
        
        var errorMessage = null;
        if (watchedControl.errors && watchedControl.errors.indexOf(errorName) == -1) {
          delete controlErrors.errors[errorName];
        } else if (error && formValidation) {
          var errorNameAttr = utilsService.camelToSnakeCase(errorName, "-");
          validationErrorContext.validationValue = controlWrapper.controlElement.attr(errorNameAttr);
          
          if (formValidation.errorMessage) {
            errorMessage = formValidation.errorMessage;
            if (typeof errorMessage === 'Function') {
              errorMessage = errorMessage(validationErrorContext);
            }
          } else {
            errorMessage = $this.getValidationErrorMessage(validationErrorMessages, validationController.controllerName, errorName);
          }
        } else if (error) {
          errorMessage = $this.getValidationErrorMessage(validationErrorMessages, validationController.controllerName, errorName);
        };
        
        if (errorMessage) {
          if (typeof errorMessage === 'Function') {
            errorMessage = errorMessage(validationErrorContext);
          }
          
          controlErrors.errors[errorName] = {
              validationErrorContext: validationErrorContext,
              errorMessage: errorMessage
          };
        }
      });
    }
    
    return controlErrors;
  };
  
  this.getValidationErrorMessage = function (validationErrorMessages, controllerName, errorName) {
    if (validationErrorMessages[controllerName] && validationErrorMessages[controllerName][errorName]) {
      return validationErrorMessages[controllerName][errorName];
    }
    
    return validationErrorMessages['*'][errorName] || validationErrorMessages['*']['*'];
    
  };
  
});

angular.module('uiFormValidation.values').constant('validationErrorMessages', {
  DEFAULT: ["validation-error-messages/en-US.messages"],
  EN_US: ["validation-error-messages/en-US.messages"], 
  CS_CZ: ["validation-error-messages/cs-CZ.messages"]
});

angular.module('uiFormValidation.values').value('validationErrorsLocationFactories', {
  after: 'uiFormValidation.validationErrorsLocation.after', 
  append: 'uiFormValidation.validationErrorsLocation.append', 
  explicit: 'uiFormValidation.validationErrorsLocation.explicit'
});

angular.module("uiFormValidation").run(["$templateCache", function($templateCache) {$templateCache.put("validation-errors/default.html","<div class=\"alert alert-danger\">\r\n    <div ng-repeat=\"controlErrors in errors\">\r\n	    <div class=\"row\" ng-repeat=\"controlError in controlErrors.errors\">\r\n		    <span ng-bind-html=\"controlError\"</span>\r\n	    </div>\r\n	</div>\r\n</div>");
$templateCache.put("validation-errors-templates/default.html","<div class=\"alert alert-danger\">\r\n    <div ng-repeat=\"controlErrors in errors\">\r\n	    <div class=\"row\" ng-repeat=\"controlError in controlErrors.errors\">\r\n		    <span validation-error=\"controlError\"></span>\r\n	    </div>\r\n	</div>\r\n</div>");
$templateCache.put("validation-error-messages/cs-CZ.messages","{\r\n    \"*\": {\r\n        \"*\": \"Validace {{validationName}} selhala.\",\r\n        \"required\": \"Polo�ka je povinn�.\",\r\n        \"validateRequired\": \"Polo�ka je povinn�.\",\r\n        \"validateLength\": \"O�ek�v�n text alespo� o d�lce {{validationValue}} znak�, sou�asn� d�lka je {{controlValue ? controlValue.length : \'0\'}} znak�.\",\r\n        \"validateRegex\": \"Hodnota nespl�uje po�adovan� regul�rn� v�raz: {{validationValue}}.\"\r\n    }\r\n}");
$templateCache.put("validation-error-messages/en-US.messages","{\r\n    \"*\": {\r\n        \"*\": \"Validation {{validationName}} has failed.\",\r\n        \"required\": \"Field is required.\",\r\n        \"validateRequired\": \"Field is required.\",\r\n        \"validateLength\": \"Expecting text with length at least {{validationValue}} characters, but length is {{controlValue ? controlValue.length : \'0\'}} characters.\",\r\n        \"validateRegex\": \"Value does not matches regular expression {{validationValue}}.\"\r\n    }\r\n}");}]);

})(window, document);

// end of file
