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
]);

/*
 * FIXME: Move attribute validationErrorsTemplate to validation errors, definition of the template 
 *        and association with control is bad because validation errors might be binded to more controls. 
 *        Selecting the right one cannot be accomplished then.
 * TODO: Refactor and make more services e.g. some registry for validation notice and errors + service 
 *       maintaining custom validation directives, notice modes, validation modes etc.
*/

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

angular.module('uiFormValidation.constants').constant('uiFormValidation.supportedValidations', {
  'validateRequired' : { /* required validation */
    validationName: "validateRequired",
    performableValidation: function () {
      return true;
    },
    validate: function (value) {
      return !(!value);
    },
    errorMessage: function () {
      return "Field is required.";
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
    errorMessage: function (errorName, scope, control) {
      var adhocPath = control.controlElement.attr("validate-adhoc");
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
    },
    errorMessage: function (errorName, scope, control, validationController) {
      return "Expected text length with at least " + control.controlElement.attr("validate-length") + " characters.";
    }
  },
  'validateRegex' : {
    validationName: "validateRegex",
    performableValidation: function () {
      return true;
    },
    validate: function (value, validationContext) {
      return new RegExp(validationContext.element.attr("validate-regex")).test(value);
    },
    errorMessage: function (errorName, scope, control, validationController) {
      return "Value does not matches regular expression " + control.controlElement.attr("validate-regex") + ".";
    }
  }
});

// TODO: Convert on factory & strategy pattern just like uiFormValidation.validationErrorsLocationFactories...
angular.module('uiFormValidation.constants').constant('uiFormValidation.validationErrorsModes', {
  onSubmitAndInvalid: "onSubmitAndInvalid", 
  onDirtyAndInvalid: "onDirtyAndInvalid", 
  onInvalid: "onInvalid"
});

// TODO: Convert on factory & strategy pattern just like uiFormValidation.validationErrorsLocationFactories...
angular.module('uiFormValidation.constants').constant('uiFormValidation.validationNoticeModes', {
  onSubmitAndInvalid: "onSubmitAndInvalid", 
  onDirtyAndInvalid: "onDirtyAndInvalid", 
  onInvalid: "onInvalid"
});

angular.module('uiFormValidation.directives').directive('uiValidation', function ($parse, uiFormValidation, utilsService, $compile, $injector) {
  var uniqueId = 1;
  return {
    restrict: 'A',
    require: ['uiValidation', 'form'],
    controller: function ($scope, $injector, $element) {
      var validationErrorsModes = utilsService.getValidationErrorsModes();
      var validationNoticeModes = utilsService.getValidationNoticeModes();
      var validationErrorsLocationFactoriesNames = utilsService.getValidationErrorsLocationFactories();
      var validationErrorsLocationFactories = [];
      
      angular.forEach(validationErrorsLocationFactoriesNames, function (factoryName) {
        validationErrorsLocationFactories.push($injector.get(factoryName));
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
          
          var parsedValidationErrorsLocation = $this.getParsedValidationErrorsLocation(controlName);
          
          angular.forEach(validationErrorsLocationFactories, function (validationErrorsLocationFactory) {
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

        wrapper.validationErrorsMode = attrs.validationErrorsMode.split("\\s+");
      });
    }
  };
});

angular.module('uiFormValidation.directives').directive('validationErrorsTemplate', function($parse) {
  return {
    restrict: 'A',
    require: 'uiValidation',
    link: function (scope, element, attrs, validationController){
      var templateGetter = $parse(attrs.validationErrorsLocation);
      validationController.validationErrorsTemplate = templateGetter(scope);
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

        wrapper.validationNoticeMode = attrs.validationNoticeMode.split("\\s+");
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

angular.module('uiFormValidation.values').value('uiFormValidation.validationErrorsLocationFactories', {
  after: 'uiFormValidation.validationErrorsLocation.after', 
  append: 'uiFormValidation.validationErrorsLocation.append', 
  explicit: 'uiFormValidation.validationErrorsLocation.explicit'
});

angular.module('uiFormValidation.providers').provider('uiFormValidation', function ($injector, $compileProvider) {
  var $this = this;
  
  this.formValidations = {};
  
  this.validationErrorsTemplate = function() {
    return '<div class="alert alert-danger"><div ng-repeat="controlErrors in errors"><div class="row" ng-repeat="controlError in controlErrors.errors"><span ng-bind-html="controlError"</span></div></div></div>';
  };
  
  this.defaultErrorMessage = function(errorName, scope, control, validationController) {
    return 'Validation "' + errorName + '" has failed.';
  };
   
  var validationErrorsModes = $injector.get('uiFormValidation.validationErrorsModes');
  this.validationErrorsMode = [validationErrorsModes.onSubmitAndInvalid, validationErrorsModes.onDirtyAndInvalid];
  
  var validationNoticeModes = $injector.get('uiFormValidation.validationNoticeModes');
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
  
  this.supportedValidations = $injector.get('uiFormValidation.supportedValidations');
  
  function UIFormValidationProvider() {
    this.customValidations = [];
  
    this.validationNoticeMode = $this.validationNoticeMode;
  
    this.validationErrorsMode = $this.validationErrorsMode;
    this.validationErrorsLocation = $this.validationErrorsLocation;
    this.validationErrorsTemplate = $this.validationErrorsTemplate;
    
    this.formValidations = $this.formValidations;
    this.defaultErrorMessage = $this.defaultErrorMessage;

    angular.forEach($this.supportedValidations, function (validation, index) {
      $this.addFormValidation(validation);
    });
  }
  
  this.$get = [function () {
    return new UIFormValidationProvider();
  }];
});

angular.module('uiFormValidation.services').service('utilsService', function ($injector) {
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
    
  this.getValidationErrorsLocationFactories = function () {
    return $injector.get('uiFormValidation.validationErrorsLocationFactories');
  };
  
  this.getValidationErrorsModes = function () {
    return $injector.get('uiFormValidation.validationErrorsModes');
  };
  
  this.getValidationNoticeModes = function () {
    return $injector.get('uiFormValidation.validationNoticeModes');
  };
    
  this.selectFromScope = function (scope, selector) {   
    selector = selector.trim();

    if (selector !== "" || selector !== "this") {
      /*jslint evil: true */
      return eval('scope.' + selector);   
    }
    
    return scope;
  };
  
  this.afterValidationErrorsControllerInitialized = function (scope, validationControllerName, callback) {
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
    
    angular.forEach(controlErrorsSelectorsString.split("\\s+"), function (controlAndError) {
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
    var inputsArr = inputs.split("\\s+");

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
});

})(window, document);
