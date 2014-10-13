'use strict';

var app = angular.module('uiFormValidation', ['ngSanitize', 'ui.bootstrap']);

// TODO: Convert on factory & strategy pattern just like uiFormValidation.showErrorsLocationFactories...
app.constant('uiFormValidation.showErrorsModes', {
  onSubmit: "onSubmit", 
  onDirtyAndInvalid: "onDirtyAndInvalid", 
  onInvalid: "onInvalid"
});

app.factory('uiFormValidation.showErrorsLocation.after', function () {
  return {
    name: "after",
    link: function (scope, showErrorsElement, controlElement, args) {
    
    }
  };
});

app.factory('uiFormValidation.showErrorsLocation.append', function ($parse, $injector) {
  return {
    name: "append",
    link: function (scope, showErrorsElement, controlWrapper, args) {      
      var utilsService = $injector.get('uiFormValidation.utilsService');
      var appendElement = controlWrapper.controlElement;
      
      if (args.length > 0) {
        var argElement = utilsService.selectFromScope(appendElement, args[0]);
        
        if (argElement) {
          appendElement = argElement;
        }
      }
      
      appendElement.append(showErrorsElement)
    }
  };
});

app.factory('uiFormValidation.showErrorsLocation.explicit', function () {
  return {
    name: "explicit",
    link: function () {}
  };
});

app.value('uiFormValidation.showErrorsLocationFactories', {
  after: 'uiFormValidation.showErrorsLocation.after', 
  append: 'uiFormValidation.showErrorsLocation.append', 
  explicit: 'uiFormValidation.showErrorsLocation.explicit'
});

app.constant('uiFormValidation.supportedValidations', [
  { /* required validation */
    validationName: "validateRequired",
    performableValidation: function () {
      return true;
    },
    validate: function (value) {
      return !(!value);
    },
    errorMessage: "Field {{name}} is required."
  }
]);

app.service('uiFormValidation.utilsService', function ($injector) {
  this.showErrorsControllers = {};
  this.validationControllers = {};
  
  this.addShowErrorsController = function (scope, validationControllerName, showErrorsController) {
    if (!this.showErrorsControllers[scope]) {
      this.showErrorsControllers[scope] = {};
      
      scope.$on('$destroy', function () {
        this.showErrorsControllers[scope] = undefined;
      });
    }
  
    if (!this.showErrorsControllers[scope][validationControllerName]) {
      this.showErrorsControllers[scope][validationControllerName] = [];
    }
    
    this.showErrorsControllers[scope][validationControllerName].push(showErrorsController);
  }
  
  this.addValidationController = function (scope, validationController) {
    if (!this.validationControllers[scope]) {
      this.validationControllers[scope] = [];
      
      scope.$on('$destroy', function () {
        this.validationControllers[scope] = undefined;
      });
    }
    
    this.validationControllers[scope][validationController.controllerName] = validationController;
    

  }
    
  this.getShowErrorsLocationFactories = function () {
    return $injector.get('uiFormValidation.showErrorsLocationFactories');
  }
  
  this.getShowErrorsModes = function () {
    return $injector.get('uiFormValidation.showErrorsModes');
  }
    
  this.selectFromScope = function (scope, selector) {   
    var selector = selector.trim();

    if (selector != "" || selector != "this") {
      return eval('scope.' + selector);   
    }
    
    return scope;
  }
});

app.provider('uiFormValidation', function ($injector, $compileProvider) {
	var $this = this;
  
  this.formValidations = {};
  
  this.showErrorsTemplate = function() {
	  return '<div class="alert alert-error"><div ng-init="getErrors()"></div><div ng-repeat="controlErrors in errors">11</div></div>';
	};
  
  this.defaultErrorMessage = function(errorName, control) {
	  return 'Validation "' + errorName + '" has failed.';
	};
   
  var showErrorsModes = $injector.get('uiFormValidation.showErrorsModes');
  this.showErrorsMode = [showErrorsModes.onSubmit, showErrorsModes.onDirtyAndInvalid];
  
  this.showErrorsLocation = "after[this]";
  
  this.addFormValidation = function(validation) {
    this.formValidations[validation.validationName] = validation;
    
    $compileProvider.directive.apply(null, [validation.validationName, function() {
      return {
        restrict: 'A',
        require: ['^uiValidation', 'ngModel'],
        link: function(scope, element, attrs, controllers) {
          var uiValidationController = controllers[0];
          var ngModelController = controllers[1];
          
          /* For AngularJS 1.2.x - uses parsers pipeline */
          if (!ngModelController.$validators) {
            var value = ngModelController.$modelValue || ngModelController.$viewValue;
            var validationResult = $this.validate(value, uiValidationController, ngModelController, validation, scope, element, attrs);
            
            if (validationResult) {
              ngModelController.$setValidity(validation.validationName, true);
            } else {
              ngModelController.$setValidity(validation.validationName, false);
            }
            
            ngModelController.$parsers.unshift(function(value, scope, element, attrs) {
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
      attrs: attrs
    };
    
    return validation.validate(value, validationContext);
  }
  
  function UIFormValidationProvider() {
    this.showErrorsMode = $this.showErrorsMode;
    this.showErrorsLocation = $this.showErrorsLocation;
    this.showErrorsTemplate = $this.showErrorsTemplate;
    
    this.formValidations = $this.formValidations;
    this.defaultErrorMessage = $this.defaultErrorMessage;
    
    this.addFormValidation = $this.addFormValidation;
    
    var supportedValidations = $injector.get('uiFormValidation.supportedValidations');
    angular.forEach(supportedValidations, function (validation, index) {
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
    controller: function ($scope, $injector) {
      var utilsService = $injector.get('uiFormValidation.utilsService');
      var showErrorsModes = utilsService.getShowErrorsModes();
      var showErrorsLocationFactoriesNames = utilsService.getShowErrorsLocationFactories();
      var showErrorsLocationFactories = [];
      
      angular.forEach(showErrorsLocationFactoriesNames, function (factoryName, key) {
        showErrorsLocationFactories.push($injector.get(factoryName));
      });
    
      this.controllerName = "uiValidation_" + uniqueId++;
      this.initialized = false;
      this.isSubmited = false;
      this.initializationCallbacks = [];
    
      this.formController = undefined;
      this.formElement = undefined;
      this.controls = {};
	  
      //this.controlsErrors = undefined;
      this.showErrorsMode = uiFormValidation.showErrorsMode;
      this.showErrorsLocation = uiFormValidation.showErrorsLocation;
      this.showErrorsTemplate = uiFormValidation.showErrorsTemplate;
      
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
        	  controlWrapper.showErrorsMode = undefined;
        	  controlWrapper.showErrorsLocation = undefined;
            controlWrapper.showErrorsTemplate = undefined;
        	  
        	  $this.controls[controlName] = controlWrapper
    	    }
  	    });
        
        $this.initialized = true;
        
        angular.forEach($this.initializationCallbacks, function (fn, index) {
          fn();
  	    });
      }
      
      this.afterInitialized = function (fn) {
        $this.initializationCallbacks.push(fn);
      }
      
      this.getShowErrorsProperty = function (controlName, property) {
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
      
      this.getShowErrorsMode = function (controlName) {
        return this.getShowErrorsProperty(controlName, 'showErrorsMode');
      }
      
      this.getShowErrorsTemplate = function (controlName) {
        return this.getShowErrorsProperty(controlName, 'showErrorsTemplate');
      }
      
      this.getShowErrorsLocation = function (controlName) {
        return this.getShowErrorsProperty(controlName, 'showErrorsLocation');
      }
      
      this.shouldDisplayShowErrors = function (controlName) {
        var showErrorsMode = this.getShowErrorsMode(controlName);
        var controlWrapper = this.controls[controlName];
        var controlNgModelController = this.formController[controlName];
        
        var onSubmit = false;
        var onDirtyAndInvalid = false;
        var onInvalid = false;
        
        if (showErrorsMode.indexOf(showErrorsModes.onSubmit)) {
          onSubmit = this.isSubmited; 
        }
        
        if (showErrorsMode.indexOf(showErrorsModes.onDirtyAndInvalid)) {
          onDirtyAndInvalid = controlNgModelController.$dirty && controlNgModelController.$invalid; 
        }
        
        if (showErrorsMode.indexOf(showErrorsModes.onDirtyAndInvalid)) {
          onInvalid = controlNgModelController.$invalid; 
        }

        return onSubmit || onDirtyAndInvalid || onInvalid;
      }
      
      this.getParsedShowErrorsLocation = function (controlName) {
        var showErrorsLocation = this.getShowErrorsLocation(controlName);
        var parsedShowErrorsLocation = {name: "", args: []};
        
        var parseRegexp = /(.*?)\[(.*?)\]/;
        var match = parseRegexp.exec(showErrorsLocation);
        if (match != null && match.length == 3) {
            parsedShowErrorsLocation.name = match[1].trim();
            parsedShowErrorsLocation.args = match[2].split(",");
        } else {
        console.log(showErrorsLocation);
          throw "Unable to parse show errors location";
        }
        
        return parsedShowErrorsLocation;
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
      
      this.injectShowErrors = function (scope) {
        angular.forEach($this.controls, function (controlWrapper, controlName) {
          var showErrorsLocation = $this.getShowErrorsLocation(controlName);
          var showErrorsMode = $this.getShowErrorsMode(controlName);

          var showErrorsElement = angular.element("<div></div>");
          showErrorsElement.attr('show-errors', controlName);
          showErrorsElement.attr('validation-controller', $this.controllerName);   
          
          var parsedShowErrorsLocation = $this.getParsedShowErrorsLocation(controlName);
          
          angular.forEach(showErrorsLocationFactories, function (showErrorsLocationFactory, key) {
            if (showErrorsLocationFactory.name == parsedShowErrorsLocation.name) {
            
              if (showErrorsLocationFactory.compile) {
                if (typeof showErrorsLocationFactory.compile != 'function') {
                  throw "Validation attribute compile is not function.";
                }
                
                showErrorsLocationFactory.compile(showErrorsElement, parsedShowErrorsLocation.args);
              }

              var link = $compile(showErrorsElement);
              
              link(scope, function(clonedShowErrorsElement) {
                if (showErrorsLocationFactory.link) {
                  if (typeof showErrorsLocationFactory.link != 'function') {
                    throw "Validation attribute link is not function.";
                  }
                  
                  showErrorsLocationFactory.link(scope, clonedShowErrorsElement, controlWrapper, parsedShowErrorsLocation.args);
                }
              });
            }
          });
        });
      }
      
      this.installShowErrorsWatchers = function (scope) {
        angular.forEach($this.controls, function (controlWrapper, controlName) {
          scope.$watch(function () {
              return $this.shouldDisplayShowErrors(controlName);
            }, function(isValid){
              var showErrorsController = utilsService.showErrorsControllers[scope][$this.controllerName];

              angular.forEach(showErrorsController, function (validationShowErrorsController, key) {
                if (validationShowErrorsController.hasControlName(controlName)) {
                  validationShowErrorsController.showErrorsElement.toggleClass('hidden', !isValid);
                }
              });
            }
          );
        });
      }
      
      this.getErrors = function (showErrorsController) {
        var errors = {};
        angular.forEach(this.controls, function (controlWrapper, controlName) {
          if (showErrorsController.hasControlName(controlName)) {
            var controlErrors = {};
            controlErrors.control = controlWrapper.control;
            controlErrors.controlElement = controlErrors.controlElement;
            controlErrors.errors = {};
            
            if (controlWrapper.control && controlWrapper.control.$error) {
              angular.forEach(controlWrapper.control.$error, function (error, errorName) {
                var formValidation = uiFormValidation.formValidations[errorName];

                if (error && formValidation) {
                  controlErrors.errors[errorName] = formValidation.errorMessage;
                } else if (error) {
                  controlErrors.errors[errorName] = uiFormValidation.defaultErrorMessage(errorName, controlWrapper.control);
                }
              });
            }
            
            errors[controlName] = controlErrors;
          }
        });
        
        return errors;
      }
    },
    controllerAs: 'uiValidationController',
    link: function(scope, formElement, attrs, controllers) {
      var validationController = controllers[0];
      var formController = controllers[1];
      
      formElement.prop("novalidate", true);

      validationController.initialize(formController, formElement);
      validationController.injectShowErrors(scope);
      validationController.installShowErrorsWatchers(scope);
      
      var utilsService = $injector.get('uiFormValidation.utilsService');
      utilsService.addValidationController(scope, validationController);
    }
  };
});

app.directive('showErrorsMode', function($timeout, $log) {
    return {
      restrict: 'A',
      require: '^uiValidation',
      link: function (scope, element, attrs, validationController){
        validationController.afterInitialized(function () {
          var wrapper = validationController.getFormOrControlWrapper(element);
          
          if (!wrapper) {
            throw  "Unable to get element wrapper. Directive show-errors-mode is not placed probably on the form or input element.";
          }

          wrapper.showErrorsMode = attrs.showErrorsMode.split("\\s+");
        });
      }
    }
});

app.directive('showErrorsLocation', function($timeout, $log) {
    return {
      restrict: 'A',
      require: '^uiValidation',
      link: function (scope, element, attrs, validationController){
        validationController.afterInitialized(function () {
          var wrapper = validationController.getFormOrControlWrapper(element);
          
          if (!wrapper) {
            throw  "Unable to get element wrapper. Directive show-errors-location is not placed probably on the form or input element.";
          }

          wrapper.showErrorsLocation = attrs.showErrorsLocation;
        });
      }
    }
});

app.directive('showErrorsTemplate', function($timeout, $log) {
    return {
      restrict: 'A',
      require: 'uiValidation',
      link: function (scope, element, attrs, validationController){
        var templateGetter = $parse(attrs.showErrorsLocation);
        validationController.showErrorsTemplate = templateGetter(scope);
      }
    }
});

app.directive('showErrors', function($timeout, $log, $injector, $compile, uiFormValidation) {
    var ShowErrorsController = function (element, watchedControls) {
      this.hasControlName = function (controlName) {
        return this.watchedControls.indexOf(controlName) != -1;
      }
      
      this.showErrorsElement = element;
      this.watchedControls = watchedControls;;
    };
    
    return {
  	  replace:true,
      restrict: 'A',
      require: ['^?uiValidation, showErrors'],
      template: function (element, attrs, $scope) {
        return uiFormValidation.showErrorsTemplate();
      },
      scope: {},
      link: function(scope, element, attrs, controllers) {

        var watchedControls = element.attr("show-errors").split("\\s+");
        var validationController = controllers[0];
        var showErrorsController = controllers[1] || new ShowErrorsController(element, watchedControls);
        var utilsService = $injector.get('uiFormValidation.utilsService');  
            
        var validationControllerName = null;
        if (validationController) {
          validationControllerName = validationController.controllerName;
        } else {
          validationControllerName = attrs.validationController;
        }
        
        utilsService.addShowErrorsController(scope, validationControllerName, showErrorsController);
        scope.test = "test";
        scope.getErrors = function () {
          var validationController = utilsService.validationControllers[scope][validationControllerName];
          $log.info("getErrors");
          if (validationController) {
            return validationController.getErrors(showErrorsController);
          } else {
            return {};
          }
        };
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

app.directive('validSubmit', function ($parse, $log) {
  return {
    restrict: 'A',
    require: ['uiValidation', '?form'],
    controller: 'uiValidationController',
    link: function(scope, formElement, attrs, controllers) {

    }
  }
});