'use strict';

const utils = require('./utils');
const clc = require('cli-color');

module.exports = function(options,client){

    var synchronizer = {};
    synchronizer.RemoveItem = function(context, index) {
        index.deleteObject(context._id.toString(),err => {
            if(err) return console.error(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error'),' -> ',err);
        if(options.debug) console.log(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.greenBright('Deleted'),' -> ObjectId: ', context._id);
    });
    }

    synchronizer.SyncItem = function(context, index){
        if(options.filter && !options.filter(context._doc)) {
            this.RemoveItem(context, index);
        }else if(context.wasNew) {
            utils.ApplyPopulation(context,options.populate).then(populated => {
                index.addObject(populated.toObject({
                versionKey: false,
                transform: function(doc,ret) {
                    if (doc.constructor.modelName !== populated.constructor.modelName) return ret;

                    // delete ret._id;
                    ret = utils.ApplyMappings(ret, options.mappings);
                    ret = utils.ApplyDefaults(ret, options.defaults);
                    ret = utils.ApplySelector(ret,options.selector);
                    ret = utils.ApplyInflator(ret,options.inflator);
                    return ret;
                }
            }),context._id,(err,content) => {
                if(err) return console.error(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error'),' -> ',err);
            if(options.debug) console.log(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.greenBright('Created'),' -> ObjectId: ',content.objectID);
        });
        }).catch(err => {
                console.error(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error (at population)'),' -> ',err);
        });
        }else if(context.wasModified){
            utils.ApplyPopulation(context,options.populate).then(populated => {
                index.saveObject(populated.toObject({
                versionKey: false,
                transform: function(doc,ret) {
                    if (doc.constructor.modelName !== populated.constructor.modelName) return ret;

                    // delete ret._id;
                    ret = utils.ApplyMappings(ret, options.mappings);
                    ret = utils.ApplyDefaults(ret, options.defaults);
                    ret = utils.ApplySelector(ret,options.selector);
                    ret = utils.ApplyInflator(ret,options.inflator);

                    ret.objectID = doc._id;

                    return ret;
                }
            }),(err, content) => {
                if(err) return console.error(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error'),' -> ',err);
            if(options.debug) console.log(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.greenBright('Updated'),' -> ObjectId: ', content.objectID);
        });
        }).catch(err => {
                console.error(clc.blackBright(`[${new Date().toLocaleTimeString()}]`),clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error (at population)'),' -> ',err);
        });
        }
    }

    return synchronizer;
}