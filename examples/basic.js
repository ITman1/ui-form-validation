'use strict';

var app = angular.module('basicDemoApp', ['uiFormValidation', 'ui.utils']);

app.config(function(uiFormValidationProvider) {
  uiFormValidationProvider.addFormValidation(
  {
    validationName: "agreementChecked",
    validate: function (value) {
      return value;
    }
  });
  
  /*
   * Add validation messages resource with custom messages.
   * + associate messages with default locale
   */
  uiFormValidationProvider.addValidationErrorMessages("default", "custom.messages");
});

app.controller('BasicDemoController', function ($scope, validationErrorMessagesService, supportedValidations) {
  /*
   * Register new validation error message provider object dynamically.
   * 
   * Provider object syntax is the same as resource file:
   * 
   * {
   *   'form name or * default option': {
   *     'validation name or * for default option'
   *   } 
   * }
   * 
   * Adds messages into DEFAULT locale, so it will be provided into all locales if there does 
   * not exist proper translation.
   */
  var validationErrorMessages = {'*' : {notTheSame: "Passwords are not the same."}};
  validationErrorMessagesService.addValidationErrorMessages("default", "custom/namespace/default.messages", validationErrorMessages);
});