'use strict';

var app = angular.module('uiFormValidation', ['ngSanitize', 'ui.bootstrap']);

// TODO: Convert on factory & strategy pattern just like uiFormValidation.showErrorsLocationFactories...
app.constant('uiFormValidation.showErrorsModes', {
  onSubmit: "onSubmit", 
  onDirtyAndInvalid: "onDirtyAndInvalid", 
  onInvalid: "onInvalid"
});

app.service('uiFormValidation.utilsService', function () {
  this.selectFromScope = function (scope, selector) {   
    var selector = selector.trim();

    if (selector != "" || selector != "this") {
      return eval('scope.' + selector);   
    }
    
    return scope;
  }
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

app.provider('uiFormValidation', function ($injector, $compileProvider) {
	var $this = this;
  
  this.showErrorsTemplate = function() {
	  return '<div class="alert alert-error">error</div>';
	};
   
  var showErrorsModes = $injector.get('uiFormValidation.showErrorsModes');
  this.showErrorsMode = [showErrorsModes.onSubmit, showErrorsModes.onDirtyAndInvalid];
  
  this.showErrorsLocation = "after[this]";
  
  this.addFormValidation = function(validation) {
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
  return {
    restrict: 'A',
    require: ['uiValidation', 'form'],
    controller: function ($scope, $injector) {
      var showErrorsModes = $injector.get('uiFormValidation.showErrorsModes');     
      var showErrorsLocationFactoriesNames = $injector.get('uiFormValidation.showErrorsLocationFactories');
      var showErrorsLocationFactories = [];
      
      angular.forEach(showErrorsLocationFactoriesNames, function (factoryName, key) {
        showErrorsLocationFactories.push($injector.get(factoryName));
      });
    
      this.initialized = false;
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
          var showErrorsTemplateGetter = $this.getShowErrorsTemplate(controlName);
          var showErrorsLocation = $this.getShowErrorsLocation(controlName);
          var showErrorsMode = $this.getShowErrorsMode(controlName);
          
          if (typeof showErrorsTemplateGetter != 'function') {
            throw "Getter of the show errors template is undefined.";
          }
          
          var showErrorsTemplate = showErrorsTemplateGetter();
          var showErrorsElement = angular.element(showErrorsTemplate);
          
          var parsedShowErrorsLocation = $this.getParsedShowErrorsLocation(controlName);
          
          angular.forEach(showErrorsLocationFactories, function (showErrorsLocationFactory, key) {
            if (showErrorsLocationFactory.name == parsedShowErrorsLocation.name) {
              var link = null;
              if (showErrorsLocationFactory.compile) {
                if (typeof showErrorsLocationFactory.compile != 'function') {
                  throw "Validation attribute compile is not function.";
                }
                
                showErrorsLocationFactory.compile(showErrorsTemplate, parsedShowErrorsLocation.args);
              } else {
                $compile(showErrorsElement);
              }
              
              if (showErrorsLocationFactory.link) {
                if (typeof showErrorsLocationFactory.link != 'function') {
                  throw "Validation attribute link is not function.";
                }
                
                showErrorsLocationFactory.link(scope, showErrorsElement, controlWrapper, parsedShowErrorsLocation.args);
              }
              
              $log.warn("Yop", showErrorsLocationFactory);
            }
          });
          
            /*controlWrapper.controlElement.append(showErrorsElement);
            $compile(showErrorsElement)(scope);*/
          
          $log.info(showErrorsTemplate, showErrorsLocation, parsedShowErrorsLocation, showErrorsMode, showErrorsElement);
        });
      }
    },
    controllerAs: 'uiValidationController',
    link: function(scope, formElement, attrs, controllers) {
      var validationController = controllers[0];
      var formController = controllers[1];
      
      formElement.attr("novalidate", true);

      validationController.initialize(formController, formElement);
      validationController.injectShowErrors(scope);
      
          
      $log.info("uiValidation");
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

app.directive('validSubmit', function ($parse, $log) {
  return {
    restrict: 'A',
    require: ['uiValidation', '?form'],
    controller: 'uiValidationController',
    link: function(scope, formElement, attrs, controllers) {

    }
  }
});