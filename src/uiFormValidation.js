'use strict';

var app = angular.module('uiFormValidation', ['ngSanitize']);

app.directive('uiValidation', function ($parse, $log) {
  return {
    restrict: 'A',
    require: ['uiValidation', 'form'],
    controller: function ($scope) {
      this.formController = undefined;
      this.controls = {},
      this.controlsErrors = undefined;
      
      this.initialize = function (formController) {
        this.formController = formController;
      }
    },
    controllerAs: 'uiValidationController',
    link: function(scope, formElement, attrs, controllers) {
      var validationController = controllers[0];
      var formController = controllers[1];
      
      validationController.initialize(formController);
          
      $log.info(validationController, formController);
    }
  };
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