'use strict';

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

