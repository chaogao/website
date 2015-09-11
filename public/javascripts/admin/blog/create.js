/**
 * article create app
 */
angular.module("article-create", [])
    .controller("articleController", function () {
        var self = this;

        self.data = {
            title: "HTML enhanced for web apps",
            description: "Data-binding is an automatic way of updating the view whenever the model changes, as well as updating the model whenever the view changes. This is awesome because it eliminates DOM manipulation from the list of things you have to worry about."
        }
    });


angular.module("blogService", [])
    .factory('articleData', ["$http", function ($http) {
        var GET_ARTICLE = '/article';

        /**
         * 获取数据
         * @return {[type]} [description]
         */
        var get = function () {

        };

        $http.get(GET_ARTICLE, {

        });
    }]);