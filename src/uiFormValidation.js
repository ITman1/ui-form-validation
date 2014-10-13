'use strict';

var app = angular.module('uiFormValidation', ['ngSanitize', 'ui.bootstrap']);

// TODO: Convert on factory & strategy pattern just like uiFormValidation.validationErrorsLocationFactories...
app.constant('uiFormValidation.validationErrorsModes', {
  onSubmitAndInvalid: "onSubmitAndInvalid", 
  onDirtyAndInvalid: "onDirtyAndInvalid", 
  onInvalid: "onInvalid"
});

app.factory('uiFormValidation.validationErrorsLocation.after', function ($injector) {
  return {
    name: "after",
    link: function (scope, validationErrorsElement, controlWrapper, args) {
      var utilsService = $injector.get('uiFormValidation.utilsService');
      var insertElement = controlWrapper.controlElement;
      
      if (args.length > 0) {
        var argElement = utilsService.selectFromScope(insertElement, args[0]);
        
        if (argElement) {
          insertElement = argElement;
        }
      }
      
      validationErrorsElement.insertAfter(insertElement);
    }
  };
});

app.factory('uiFormValidation.validationErrorsLocation.append', function ($injector) {
  return {
    name: "append",
    link: function (scope, validationErrorsElement, controlWrapper, args) {      
      var utilsService = $injector.get('uiFormValidation.utilsService');
      var appendElement = controlWrapper.controlElement;
      
      if (args.length > 0) {
        var argElement = utilsService.selectFromScope(appendElement, args[0]);
        
        if (argElement) {
          appendElement = argElement;
        }
      }
      
      appendElement.append(validationErrorsElement)
    }
  };
});

app.factory('uiFormValidation.validationErrorsLocation.explicit', function () {
  return {
    name: "explicit",
    compile: function () { 
      return function () {}
    },
  };
});

app.value('uiFormValidation.validationErrorsLocationFactories', {
  after: 'uiFormValidation.validationErrorsLocation.after', 
  append: 'uiFormValidation.validationErrorsLocation.append', 
  explicit: 'uiFormValidation.validationErrorsLocation.explicit'
});

app.constant('uiFormValidation.supportedValidations', {
  'validateRequired' : { /* required validation */
    validationName: "validateRequired",
    performableValidation: function () {
      return true;
    },
    validate: function (value) {
      return !(!value);
    },
    errorMessage: function (value, scope, control, validationController) {
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
    errorMessage: function (value, scope, control, validationController) {
      var adhocPath = control.controlElement.attr("validate-adhoc");
      var error = scope.$eval(adhocPath);
      return error;
    }
  }
});

app.service('uiFormValidation.utilsService', function ($injector) {
  var $this = this;
  
  this.validationErrorsControllers = {};
  this.validationControllers = {};
  this.validationControllerInitializationCallbacks = {};
  
  this.addValidationErrorsController = function (scope, validationControllerName, validationErrorsController) {
    if (!this.validationErrorsControllers[scope]) {
      this.validationErrorsControllers[scope] = {};
      
      scope.$on('$destroy', function () {
        $this.validationErrorsControllers[scope] = undefined;
      });
    }
  
    if (!this.validationErrorsControllers[scope][validationControllerName]) {
      this.validationErrorsControllers[scope][validationControllerName] = [];
    }
    
    this.validationErrorsControllers[scope][validationControllerName].push(validationErrorsController);
  }
  
  this.addValidationController = function (scope, validationController) {
    if (!this.validationControllers[scope]) {
      this.validationControllers[scope] = [];
      
      scope.$on('$destroy', function () {
        $this.validationControllers[scope] = undefined;
      });
    }
    
    this.validationControllers[scope][validationController.controllerName] = validationController;

    if (this.validationControllerInitializationCallbacks[scope] && this.validationControllerInitializationCallbacks[scope][validationController.controllerName]) {
      angular.forEach(this.validationControllerInitializationCallbacks[scope][validationController.controllerName], function (callback, key) {
        validationController.afterInitialized(callback);
      });
    
      this.validationControllerInitializationCallbacks[scope][validationController.controllerName] = undefined;
    }
  }
    
  this.getValidationErrorsLocationFactories = function () {
    return $injector.get('uiFormValidation.validationErrorsLocationFactories');
  }
  
  this.getValidationErrorsModes = function () {
    return $injector.get('uiFormValidation.validationErrorsModes');
  }
    
  this.selectFromScope = function (scope, selector) {   
    var selector = selector.trim();

    if (selector != "" || selector != "this") {
      return eval('scope.' + selector);   
    }
    
    return scope;
  }
  
  this.afterValidationErrorsControllerInitialized = function (scope, validationControllerName, callback) {
    if (this.validationControllers[scope] && this.validationControllers[scope][validationControllerName]) {
      this.validationControllers[scope][validationControllerName].afterInitialized(callback);
    } else {
      if (!this.validationControllerInitializationCallbacks[scope]) {
        this.validationControllerInitializationCallbacks[scope] = {};
        
        scope.$on('$destroy', function () {
          $this.validationControllerInitializationCallbacks[scope] = undefined;
        });
      }
    
      if (!this.validationControllerInitializationCallbacks[scope][validationControllerName]) {
        this.validationControllerInitializationCallbacks[scope][validationControllerName] = [];
      }
      
      this.validationControllerInitializationCallbacks[scope][validationControllerName].push(callback);
    }
  }
  
  this.parseControlErrorsSelectors = function (controlErrorsSelectorsString) {
    var controlErrorsSelectors = {};
    
    angular.forEach(controlErrorsSelectorsString.split("\\s+"), function (controlAndError, key) {
      var parseRegexp = /^\s*(.*?)\s*(\[\s*(.*?)\s*\])?$/;
      var match = parseRegexp.exec(controlAndError);
      if (match != null && match.length == 4) {
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
          throw "Unable to parse input-errors controls."
      }
    });
    
    return controlErrorsSelectors;
  }
});

app.provider('uiFormValidation', function ($injector, $compileProvider) {
  var $this = this;
  
  this.formValidations = {};
  
  this.validationErrorsTemplate = function() {
    return '<div class="alert alert-error"><div ng-repeat="controlErrors in errors"><div class="row" ng-repeat="controlError in controlErrors.errors"><span ng-bind-html="controlError"</span></div></div></div>';
  };
  
  this.defaultErrorMessage = function(errorName, scope, control, validationController) {
    return 'Validation "' + errorName + '" has failed.';
  };
   
  var validationErrorsModes = $injector.get('uiFormValidation.validationErrorsModes');
  this.validationErrorsMode = [validationErrorsModes.onSubmitAndInvalid, validationErrorsModes.onDirtyAndInvalid];
  
  this.validationErrorsLocation = "after[this]";
  
  this.addFormValidation = function(validation) {
    this.formValidations[validation.validationName] = validation;
    
    $compileProvider.directive.apply(null, [validation.validationName, function() {
      return {
        restrict: 'A',
        require: ['^uiValidation', 'ngModel'],
        link: function(scope, element, attrs, controllers) {
          var uiValidationController = controllers[0];
          var ngModelController = controllers[1];
          
          if (validation.performableValidation && typeof validation.performableValidation == "function") {
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
              if (validationResult) {
                ngModelController.$setValidity(validation.validationName, true);
              } else {
                ngModelController.$setValidity(validation.validationName, false);
              }
            });
          } 
          /* For AngularJS 1.3.x - uses validators pipeline */
          else {
            ngModelController.$validators[validation.validationName] = function(modelValue, viewValue) {
              var value = modelValue || viewValue;
              return $this.validate(value, uiValidationController, ngModelController, validation, scope, element, attrs);
            };
            
            ngModelController.$validate();
          }
        }
      };
    }]);
  }
  
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
  }
  
  this.supportedValidations = $injector.get('uiFormValidation.supportedValidations');
  
  function UIFormValidationProvider() {
    this.customValidations = [];
  
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

app.directive('uiValidation', function ($parse, $log, uiFormValidation, $injector, $compile) {
  var uniqueId = 1;
  return {
    restrict: 'A',
    require: ['uiValidation', 'form'],
    controller: function ($scope, $injector, $element) {
      var utilsService = $injector.get('uiFormValidation.utilsService');
      var validationErrorsModes = utilsService.getValidationErrorsModes();
      var validationErrorsLocationFactoriesNames = utilsService.getValidationErrorsLocationFactories();
      var validationErrorsLocationFactories = [];
      
      angular.forEach(validationErrorsLocationFactoriesNames, function (factoryName, key) {
        validationErrorsLocationFactories.push($injector.get(factoryName));
      });
    
      this.controllerName = $element.attr("name") || "uiValidation_" + uniqueId++;
      this.initialized = false;
      this.isSubmited = false;
      this.initializationCallbacks = [];
    
      this.formController = undefined;
      this.formElement = undefined;
      this.controls = {};
    
      //this.controlsErrors = undefined;
      this.validationErrorsMode = uiFormValidation.validationErrorsMode;
      this.validationErrorsLocation = uiFormValidation.validationErrorsLocation;
      this.validationErrorsTemplate = uiFormValidation.validationErrorsTemplate;
      
      var $this = this;
      this.initialize = function (formController, formElement) {   
        $this.controllerName = formController.$name || $this.controllerName; 
        $this.formController = formController;
        $this.formElement = formElement;
        
        angular.forEach(formController, function (control, controlName) {
          if (control && control.hasOwnProperty('$modelValue')) {
            var controlWrapper = {};
            
            var controlElement   = formElement[0].querySelector('[name="' + controlName + '"]');
            controlElement = angular.element(controlElement);
            
            controlWrapper.control = control;
            controlWrapper.controlElement = controlElement;
            controlWrapper.validationErrorsMode = undefined;
            controlWrapper.validationErrorsLocation = undefined;
            controlWrapper.validationErrorsTemplate = undefined;
            
            $this.controls[controlName] = controlWrapper
          }
        });
        
        $this.initialized = true;
        
        angular.forEach($this.initializationCallbacks, function (fn, index) {
          fn();
        });
      }
      
      this.afterInitialized = function (fn) {
        if (this.initialized) {
          fn();
        } else {
          this.initializationCallbacks.push(fn);
        }
      }
      
      this.getValidationErrorsProperty = function (controlName, property) {
        if (!$this.controls[controlName]) {
          throw "Control with given name " + controlName + " does not exist.";
        }
        
        var controlPropertyValue = $this.controls[controlName][property];
        if (!controlPropertyValue) {
          return $this[property];
        } else {
          return controlPropertyValue;
        }
      }
      
      this.getValidationErrorsMode = function (controlName) {
        return this.getValidationErrorsProperty(controlName, 'validationErrorsMode');
      }
      
      this.getValidationErrorsTemplate = function (controlName) {
        return this.getValidationErrorsProperty(controlName, 'validationErrorsTemplate');
      }
      
      this.getValidationErrorsLocation = function (controlName) {
        return this.getValidationErrorsProperty(controlName, 'validationErrorsLocation');
      }
      
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
          angular.forEach(selectorErrorNames, function(errorName, key) {
            if (controlWrapper.control.$error[errorName]) {
              isInvalid = true;
            } 
          });
        }
        
        return isInvalid;
      }
      
      this.hasControlsErrors = function (controlAndErrorSelectors) {
        var hasErrors = false;
        
        angular.forEach(controlAndErrorSelectors, function(controlAndErrorSelector, key) {
          if ($this.hasControlErrors(controlAndErrorSelector)) {
            hasErrors = true;
          }
        });
        
        return hasErrors;
      }
      
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
        
        if (validationErrorsMode.indexOf(validationErrorsModes.onSubmitAndInvalid) != -1) {
          onSubmitAndInvalid = this.isSubmited && isInvalid;
        }
        
        if (validationErrorsMode.indexOf(validationErrorsModes.onDirtyAndInvalid) != -1) {
          onDirtyAndInvalid = controlWrapper.control.$dirty && isInvalid;
        }
        
        if (validationErrorsMode.indexOf(validationErrorsModes.onInvalid) != -1) {
          onInvalid = isInvalid;
        }

        return (onSubmitAndInvalid || onDirtyAndInvalid || onInvalid);
      }
      
      this.shouldDisplayValidationErrorsForControlSelectors = function (controlsAndErrorSelectors) {
        var hasErrors = false;
        
        angular.forEach(controlsAndErrorSelectors, function(controlAndErrorSelector, key) {
          if ($this.shouldDisplayValidationErrorsForControlSelector(controlAndErrorSelector)) {
            hasErrors = true;
          }
        });
        
        return hasErrors;
      }
      
      this.getParsedValidationErrorsLocation = function (controlName) {
        var validationErrorsLocation = this.getValidationErrorsLocation(controlName);
        var parsedValidationErrorsLocation = {name: "", args: []};
        
        var parseRegexp = /^\s*(.*?)\s*(\[\s*(.*?)\s*\])?$/;
        var match = parseRegexp.exec(validationErrorsLocation);
        if (match != null && match.length == 4) {
            parsedValidationErrorsLocation.name = match[1].trim();
            parsedValidationErrorsLocation.args = match[3]? match[3].split(",") : [];
        } else {
            throw "Unable to parse validation errors location - '" + validationErrorsLocation + "'.";
        }
        
        return parsedValidationErrorsLocation;
      }
      
      this.getFormOrControlWrapper = function (element) {
        if ($this.formElement[0] === element[0]) {
          return $this;
        }
        
        var result = undefined;
        angular.forEach($this.controls, function (controlWrapper, controlName) {
          if (!result && controlWrapper.controlElement[0] === element[0]) {
            result = controlWrapper;
          } 
        });
        
        return result;
      }
      
      this.injectValidationErrors = function () {
        angular.forEach($this.controls, function (controlWrapper, controlName) {
          var validationErrorsLocation = $this.getValidationErrorsLocation(controlName);
          var validationErrorsMode = $this.getValidationErrorsMode(controlName);

          var validationErrorsElement = angular.element("<div></div>");
          validationErrorsElement.attr('validation-errors', controlName);
          validationErrorsElement.attr('validation-controller', $this.controllerName);   
          
          var parsedValidationErrorsLocation = $this.getParsedValidationErrorsLocation(controlName);
          
          angular.forEach(validationErrorsLocationFactories, function (validationErrorsLocationFactory, key) {
            if (validationErrorsLocationFactory.name == parsedValidationErrorsLocation.name) {
              var link = null;
              if (validationErrorsLocationFactory.compile) {
                if (typeof validationErrorsLocationFactory.compile != 'function') {
                  throw "Validation attribute compile is not function.";
                }
                
                link = validationErrorsLocationFactory.compile(validationErrorsElement, parsedValidationErrorsLocation.args);
              } else {
                link = $compile(validationErrorsElement);
              }
              
              link($scope, function(clonedValidationErrorsElement) {
                if (validationErrorsLocationFactory.link) {
                  if (typeof validationErrorsLocationFactory.link != 'function') {
                    throw "Validation attribute link is not function.";
                  }
                  
                  validationErrorsLocationFactory.link($scope, clonedValidationErrorsElement, controlWrapper, parsedValidationErrorsLocation.args);
                }
              });
            }
          });
        });
      }
            
      this.bindSubmitEvent = function () {
        this.formElement.bind('submit', function (event) {
          $scope.$apply(function () {
            $this.submit();
          });
        });
      }
      
      this.validate = function () {
        angular.forEach(this.controls, function(controlWrapper, controlName) {
          var viewValue = controlWrapper.control.$viewValue;
          controlWrapper.control.$setViewValue(viewValue);
        });
      }
      
      this.submit = function () {
        var ngSubmit = this.formElement.attr("ng-submit");
        
        if (ngSubmit) {
          this.isSubmited = true;
          $scope.$eval(ngSubmit);
          $log.info("submited");
        } else {
          $log.info("not-submited");
        }
      }
    },
    controllerAs: 'uiValidationController',
    link: function(scope, formElement, attrs, controllers) {
      var validationController = controllers[0];
      var formController = controllers[1];
      
      formElement.prop("novalidate", true);

      validationController.initialize(formController, formElement);
      validationController.injectValidationErrors();
      validationController.bindSubmitEvent();
      
      var utilsService = $injector.get('uiFormValidation.utilsService');
      utilsService.addValidationController(scope, validationController);
    }
  };
});

app.directive('validationErrorsMode', function($timeout, $log) {
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
    }
});

app.directive('validationErrorsLocation', function($timeout, $log) {
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
    }
});

app.directive('validationErrorsTemplate', function($timeout, $log) {
    return {
      restrict: 'A',
      require: 'uiValidation',
      link: function (scope, element, attrs, validationController){
        var templateGetter = $parse(attrs.validationErrorsLocation);
        validationController.validationErrorsTemplate = templateGetter(scope);
      }
    }
});

app.directive('validationErrors', function($timeout, $log, $injector, $compile, uiFormValidation) {
  var utilsService = $injector.get('uiFormValidation.utilsService'); 
  
    return {
      replace:true,
      restrict: 'A',
      require: ['^?uiValidation', 'validationErrors'],
      template: function (element, attrs, $scope) {
        return uiFormValidation.validationErrorsTemplate();
      },
      scope: {
        'uiValidation' : '=uiValidation'
      },
      controller: function ($element) {
        var $this = this;
        
        this.hasControlName = function (controlName) {
          return this.watchedControls.indexOf(controlName) != -1;
        }
        
        this.validationErrorsElement = $element;
        this.watchedControls = utilsService.parseControlErrorsSelectors($element.attr("validation-errors"));
        

      },
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

          scope.$watch(function () {
            return validationController.shouldDisplayValidationErrorsForControlSelectors(validationErrorsController.watchedControls);
          }, function (shouldToggleHidden) {      $log.info(shouldToggleHidden);
            element.toggleClass('hidden', !shouldToggleHidden);
          });
          
          angular.forEach(validationErrorsController.watchedControls, function (watchedControl, key) {

            var controlWrapper = validationController.controls[watchedControl.controlName];
            
            if (!controlWrapper) {
              throw "Undefined control '" + watchedControl.controlName + '" to watch.';
            }
            
            scope.$watchCollection(function () {              
              return controlWrapper.control.$error;
            }, function () {             
              var controlErrors = {};
              controlErrors.control = controlWrapper.control;
              controlErrors.controlElement = controlErrors.controlElement;
              controlErrors.errors = {};
              
              if (controlWrapper.control && controlWrapper.control.$error) {
                angular.forEach(controlWrapper.control.$error, function (error, errorName) {
                var formValidation = uiFormValidation.formValidations[errorName];

                if (error && formValidation) {
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
    }
});

app.directive('validationController', function($timeout, $log, $injector) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs){
        if (typeof attrs.validationController !== 'string') {
          throw "Invalid name of the validation controller.";
        }
      }
    }
});

app.directive('validationSubmit', function ($parse, $log, $injector) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var utilsService = $injector.get('uiFormValidation.utilsService');  
                
      utilsService.afterValidationErrorsControllerInitialized(scope, attrs.validationSubmit, function () {
        var validationController = utilsService.validationControllers[scope][attrs.validationSubmit];
        
        element.bind('click', function (event) {
          scope.$apply(function () {
            validationController.submit();
          });
        });
      });
      
    }
  }
});

app.directive('validationInputs', function($compile, $log, $injector) {
  var utilsService = $injector.get('uiFormValidation.utilsService'); 
  
    return {
      restrict: 'A',
      require:  '^uiValidation',
      link: function(scope, element, attrs, validationController) {     

        var inputs = attrs.validationInputs;
        var controlAndErrorSelectors = utilsService.parseControlErrorsSelectors(inputs);

        validationController.afterInitialized(function () {
          scope.$watch(function () {
            return validationController.hasControlsErrors(controlAndErrorSelectors);
          }, function (shouldToggleHasError) {
            element.toggleClass('has-error', shouldToggleHasError);
          });
        });
      }
    }
});