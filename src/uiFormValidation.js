'use strict';

var app = angular.module('uiFormValidation', ['ngSanitize', 'ui.bootstrap']);

app.constant('uiFormValidation.showErrorsModes', {
  onSubmit: "onSubmit", 
  onDirtyAndInvalid: "onDirtyAndInvalid", 
  onInvalid: "onInvalid"
});

app.constant('uiFormValidation.showErrorsLocations', {
  after: "after", 
  append: "append", 
  explicit: "explicit"
});

app.constant('uiFormValidation.defaultValidations', [
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
  
  this.errorsTemplate = function(errors) {
	  return '<alert type="danger">error</alert>';
	};
   
  var showErrorsModes = $injector.get('uiFormValidation.showErrorsModes');
  this.showErrorsMode = [showErrorsModes.onSubmit, showErrorsModes.onDirtyAndInvalid];
  
  var showErrorsLocations = $injector.get('uiFormValidation.showErrorsLocations');
  this.showErrorsLocation = showErrorsLocations.after;
  
  this.addFormValidation = function(validation) {
    $compileProvider.directive.apply(null, [validation.validationName, function() {
      return {
        restrict: 'A',
        require: ['^uiValidation', 'ngModel'],
        link: function(scope, element, attrs, controllers) {
          var uiValidationController = controllers[0];
          var ngModelController = controllers[1];
          
          ngModelController.$parsers.unshift(function(viewValue, scope, element, attrs) {
            if ($this.validate(uiValidationController, ngModelController, validation, scope, element, attrs)) {
              ngModelController.$setValidity(validation.validationName, true);
              return viewValue;
            } else {
              ngModelController.$setValidity(validation.validationName, false);
              return undefined;
            }
          });
        }
      };
    }]);
  }
  
  this.validate = function (uiValidationController, ngModelController, validation, scope, element, attrs) {
    var validationContext = {
      uiValidationController: uiValidationController,
      ngModelController: ngModelController,
      validation: validation,
      scope: scope,
      attrs: attrs
    };
    
    return validation.validate(ngModelController.$modelValue, validationContext);
  }
  
  function UIFormValidationProvider() {
    this.showErrorsMode = $this.showErrorsMode;
    this.showErrorsLocation = $this.showErrorsLocation;
    this.errorsTemplate = $this.errorsTemplate;
    this.addFormValidation = $this.addFormValidation;
    
    var defaultValidations = $injector.get('uiFormValidation.defaultValidations');
    angular.forEach(defaultValidations, function (validation, index) {
      $this.addFormValidation(validation);
    });
  }
  
	this.$get = [function () {
	  return new UIFormValidationProvider();
	}];
});

app.directive('uiValidation', function ($parse, $log, uiFormValidation) {
  return {
    restrict: 'A',
    require: ['uiValidation', 'form'],
    controller: function ($scope) {
      this.formController = undefined;
      this.formElement = undefined;
      this.controls = {};
	  
      this.controlsErrors = undefined;
      this.showErrorsMode = uiFormValidation.showErrorsMode;
      this.showErrorsLocation = uiFormValidation.showErrorsLocation;
      
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
        	  controlWrapper.showErrorsType = undefined;
        	  controlWrapper.showErrorCustomExpresion = undefined;
        	  
        	  $this.controls[controlName] = controlWrapper
    	    }
  	    });
      }
      
      this.isFormOrControlElement = function (element) {
        
        
        if ($this.formElement[0] === element[0]) {
          return true;
        }
        
        var result = false;
        angular.forEach($this.controls, function (controlWrapper, controlName) {
          if (!result && controlWrapper.controlElement[0] === element[0]) {
            result = true;
          } 
        });
        
        return result;
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
    },
    controllerAs: 'uiValidationController',
    link: function(scope, formElement, attrs, controllers) {
      var validationController = controllers[0];
      var formController = controllers[1];
      
      validationController.initialize(formController, formElement);
          
      formElement.attr("novalidate", true);
    }
  };
});

app.directive('angularValidation', function($timeout, $log) {
    return {
      restrict: 'A',
      require: '^uiValidation',
      link: function (scope, element, attrs, validationController){
        $timeout(function () {
          if (!validationController.isFormOrControlElement(element)) {
            $log.error('Directive angular-validation needs to be on the form or control.');
          }
          	
          var wrapper = validationController.getFormOrControlWrapper(element);
          $log.info(wrapper);
        });
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