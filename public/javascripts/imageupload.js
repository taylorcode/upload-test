angular.module('imageupload', [])
    .directive('image', function ($q) {
        'use strict'

        var URL = window.URL || window.webkitURL;

        var getResizeArea = function () {
            var resizeAreaId = 'fileupload-resize-area';

            var resizeArea = document.getElementById(resizeAreaId);

            if (!resizeArea) {
                resizeArea = document.createElement('canvas');
                resizeArea.id = resizeAreaId;
                resizeArea.style.visibility = 'hidden';
                document.body.appendChild(resizeArea);
            }

            return resizeArea;
        }

        var resizeImage = function (origImage, options, callback) {
            
            var maxHeight = options.resizeMaxHeight || 300;
            var maxWidth = options.resizeMaxWidth || 250;
            var quality = options.resizeQuality || 0.7;
            var type = options.resizeType || 'image/jpg';

            var canvas = getResizeArea();

            var height = origImage.height;
            var width = origImage.width;

            // calculate the width and height, constraining the proportions
            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round(height *= maxWidth / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round(width *= maxHeight / height);
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;

            //draw image on canvas
            var ctx = canvas.getContext("2d");
            ctx.drawImage(origImage, 0, 0, width, height);

            // get the data from canvas as 70% jpg (or specified type).

            canvas.toBlob(function (blob) {
                var fileBlob = blob;
                callback({
                    file: fileBlob,
                    dataURL: canvas.toDataURL(type, quality)
                });
            });

        };

        var createImage = function(url, callback) {
            var image = new Image();
            image.onload = function() {
                callback(image);
            };
            image.src = url;
        };

        return {
            restrict: 'A',
            scope: {
                image: '=',
                resizeMaxHeight: '@?',
                resizeMaxWidth: '@?',
                resizeQuality: '@?',
                resizeType: '@?',
            },
            link: function postLink(scope, element, attrs, ctrl) {

                var doResizing = function(imageResult, callback) {

                    createImage(imageResult.url, function(image) {

                        resizeImage(image, scope, function (resized) {
                            var dataURL = resized.dataURL;
                            var file = resized.file;

                            file.name = imageResult.file.name; // resized file blob has the same name as the original file

                            console.log(imageResult.file);
                            console.log(file);

                            imageResult.resized = {
                                file: file,
                                dataURL: dataURL,
                                //type: dataURL.match(/:(.+\/.+);/)[1], INSANELY SLOW
                                url: URL.createObjectURL(file)
                            };

                            callback(imageResult);
                        });
                    });
                };

                var applyScope = function(imageResult) {

                    scope.$apply(function() {

                        //console.log(imageResult);
                        if(attrs.multiple) {

                            scope.image.push(imageResult);
                        } else {
                            scope.image = imageResult; 
                        }

                    });
                };

                element.bind('change', function (evt) {
                    //when multiple always return an array of images
                    if(attrs.multiple)
                        scope.image = [];

                    var files = evt.target.files;
                    for(var i = 0; i < files.length; i++) {
                        //create a result object for each file in files
                        var imageResult = {
                            file: files[i],
                            url: URL.createObjectURL(files[i])
                        };

                        if(scope.resizeMaxHeight || scope.resizeMaxWidth) { //resize image
                            doResizing(imageResult, function (imageResult) {
                                applyScope(imageResult);
                            });
                        } else { //no resizing
                            applyScope(imageResult);
                        }
                    }
                });
            }
        };
    });
