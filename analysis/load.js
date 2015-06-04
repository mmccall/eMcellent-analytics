"use strict";

var fs = require('fs');
var expect = require('chai').expect;
var eMcellent = require('emcellent');
var path = require('path');
var recursive = require('recursive-readdir');
var jsdiff = require('diff');
var rimraf = require('rimraf');
var toolkit = require('emcellent-toolkit');
var _ = require('lodash');

var fileArray = [];
var results = {};
var config = require('./config.json');

function output(entry, src, txt, json, diff, callback) {
    var fileName = entry.split('/')[entry.split('/').length - 1];
    fs.writeFileSync(path.join(__dirname, config.output) + '/' + fileName + '-src.txt', src, {
        encoding: 'utf8'
    });
    fs.writeFileSync(path.join(__dirname, config.output) + '/' + fileName + '-dest.txt', txt, {
        encoding: 'utf8'
    });
    fs.writeFileSync(path.join(__dirname, config.output) + '/' + fileName + '-json.txt', JSON.stringify(json, null, 10), {
        encoding: 'utf8'
    });
    fs.writeFileSync(path.join(__dirname, config.output) + '/' + fileName + '-diff.txt', JSON.stringify(diff, null, 10), {
        encoding: 'utf8'
    });
    callback();
}

function test(inputEntry) {

    describe('Test File: ' + inputEntry, function () {

        it('Compare Record', function (done) {

            fs.readFile(inputEntry, {
                encoding: 'utf8'
            }, function (err, data) {
                if (err) {
                    done(err);
                } else {
                    var tmpSRC = data;
                    var markupSRC = toolkit.markup(tmpSRC, {verbose: true});
                    var tmpJSON = eMcellent.parse(markupSRC);

                    var tmpResults = [];

                    //Push all commands to an array
                    _.each(tmpJSON, function(entry) {
                        if (entry.lineRoutines) {
                            _.each(entry.lineRoutines, function(rtn) {
                                tmpResults.push(rtn.mRoutine.toUpperCase());
                            });
                        }
                    });

                    //Aggregate the array.
                    var aggResults = _.countBy(tmpResults, function(n) {
                        return n;
                    })

                    //Push them all to master results.
                    _.each(aggResults, function(val, key) {
                        if (_.isUndefined(results[key])) {
                            results[key] = val;
                        } else {
                            results[key] = results[key] + val;
                        }
                    });

                    console.log(results);


                    done();
                }
            });
        });
    });
}

describe('Load Testing', function () {

    before(function (done) {
        rimraf(path.join(__dirname, config.output), function (err) {
            if (err) {
                done(err);
            } else {
                fs.mkdir(path.join(__dirname, config.output), function (err) {
                    if (err) {
                        done(err);
                    } else {
                        done();
                    }
                });
            }
        });
    });

    before(function (done) {
        recursive(path.join(__dirname, config.source), ["*.zwr", ".DS_Store"], function (err, files) {
            if (config.throttle) {
                if (config.throttle !== "0") {
                    files.splice(config.throttle, files.length - config.throttle);
                }
            }
            fileArray = files;
            done();
        });
    });

    it('Initialize Test Load', function (done) {
        for (var i in fileArray) {
            test(fileArray[i]);
        }
        done();
    });

});
