'use strict';

var app = angular.module('uiFormValidation', ['ngSanitize', 'ui.bootstrap']);

app.directive('uiValidation', function ($parse, $log) {
  return {
    restrict: 'A',
    priority: 10001,
    require: ['uiValidation', 'form'],
    controller: function ($scope) {
      this.showErrorTypes = {onSubmit: "onSubmit", onDirtyAndInvalid: "onDirtyAndInvalid", onInvalid: "onInvalid"}
      this.formController = undefined;
      this.formElement = undefined;
      this.controls = {},
      this.controlsErrors = undefined;
      this.angularValidation = true;
      this.customValidation = true;
      this.showErrorType = [this.showErrorTypes.onSubmit, this.showErrorTypes.onDirtyAndInvalid];
      this.showErrorCustomExpresion = undefined;
      
      var $this = this;
      this.initialize = function (formController, formElement) {
        $this.formController = formController;
        $this.formElement = formElement;
        
        angular.forEach(formController, function (control, controlName) {
    	    if (control && control.hasOwnProperty('$modelValue')) {
    	      var controlWrapper = {};
    	      
        	  controlWrapper.control = control;
        	  controlWrapper.angularValidation = true;
        	  controlWrapper.customValidation = true;
        	  controlWrapper.showErrorType = [$this.showErrorTypes.onSubmit, $this.showErrorTypes.onDirtyAndInvalid];
        	  controlWrapper.showErrorCustomExpresion = undefined;
        	  
        	  $this.controls[controlName] = controlWrapper
    	    }
  	    });
      }
      
      this.isFormOrControlElement = function (element) {
        if ($this.formElement === element) {
          return true;
        }
        
        var result = false;
        angular.forEach($this.controls, function (controlWrapper, controlName) {
          if (!result && controlWrapper.control === element) {
            result = true;
          } 
        });
        
        return result;
      }
      
      this.getFormOrControlWrapper = function (element) {
        if ($this.formElement === element) {
          return $this;
        }
        
        var result = undefined;
        angular.forEach($this.controls, function (controlWrapper, controlName) {
          if (!result && controlWrapper.control === element) {
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
      $log.info(validationController, formController);
    }
  };
});

app.directive('angularValidation', function($timeout, $log) {
    return {
      restrict: 'A',
      require: '^uiValidation',
      link: function (scope, element, attrs, validationController){
        $timeout(function () {
          $log.info(angular.toJson(validationController));
           
          if (!validationController.isFormOrControlElement(element)) {
            $log.error('Directive angular-validation needs to be on the form or control.');
          }
          	
          var wrapper = validationController.getFormOrControlWrapper(element);
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