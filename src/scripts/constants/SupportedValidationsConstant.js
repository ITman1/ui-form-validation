'use strict';

angular.module('uiFormValidation.constants').constant('supportedValidations', {
  'validateRequired' : { /* required validation */
    validationName: "validateRequired",
    performableValidation: function () {
      return true;
    },
    validate: function (value) {
      return !(!value);
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
    errorMessage: function (validationErrorContext) {
      var adhocPath = validationErrorContext.control.controlElement.attr("validate-adhoc");
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
    }
  },
  'validateRegex' : {
    validationName: "validateRegex",
    performableValidation: function () {
      return true;
    },
    validate: function (value, validationContext) {
      return new RegExp(validationContext.element.attr("validate-regex")).test(value);
    }
  }
});

