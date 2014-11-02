'use strict';

var app = angular.module('basicDemoApp', ['uiFormValidation', 'ui.utils']);

app.controller('BasicDemoController', function ($scope, validationErrorMessagesService) {
  /*
   * Register new validation error message provider object.
   * 
   * Adds messages into DEFAULT locale, so it will be provided into all locales if there does 
   * not exist proper translation.
   */
  var validationErrorMessages = {notTheSame: "Passwords are not the same."};
  validationErrorMessagesService.addValidationErrorMessages("default", "custom/namespace/default.messages", validationErrorMessages);
  
});