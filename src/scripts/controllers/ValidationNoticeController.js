'use strict';

angular.module('uiFormValidation.controllers').controller('validationNoticeController', function (utilsService, $scope) {

  this.parseControlErrorsSelectors = function (inputs) {
    if (utilsService.isExpression(inputs)) {
      inputs = utilsService.parseExpression(inputs);
      return utilsService.evalAndParseControlErrorsSelectors($scope.$parent, inputs); // FIXME: $parent??
    } else {
      return utilsService.parseControlErrorsSelectors(inputs);
    };
  };

});