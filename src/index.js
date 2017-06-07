'use strict';

const algolia = require('algoliasearch');
const clc = require('cli-color');
const utils = require('./utils');

module.exports = exports = function algoliaIntegration(schema,opts) {

    let options = {
        indexName: null,
        appId: null,
        apiKey: null,
        selector: null,
        defaults: null,
        mappings: null,
        inflator: null,
        filter: null,
        filterIgnore: null,
        populate: null,
        dependency: null,
        modelProvider: null,
        debug: false
    }

    for(let key in opts) {
        if(key in options) options[key] = opts[key]; //Override default options
    }

    if(!options.indexName) return console.error(clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error'),' -> Invalid index name');
    if(!options.appId || !options.apiKey) return console.error(clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error'),' -> Invalid algolia identification');

    const client = algolia(options.appId,options.apiKey);

    var syncronizer = require('./synchronizer')(options,client);
    require('./operations').call(schema,options,client,syncronizer);

    if (!options.dependency) {
        schema.statics.SyncToAlgolia = function(){
            return require('./synchronize').call(this,options,client);
        }

        schema.statics.SyncDocuments = function(items){
            if (!items) {
                return;
            }

            items.forEach(function (item) {

                item.wasModified = true;

                let indices = utils.GetIndexName(item, options.indexName);
                if(indices instanceof Array) {
                    indices.forEach(index => syncronizer.SyncItem(item, client.initIndex(index)));
                }else{
                    syncronizer.SyncItem(item, client.initIndex(indices));
                }
            });
        }

        schema.statics.SetAlgoliaSettings = function(settings){
            if(!settings) return console.error(clc.cyanBright('[Algolia-sync]'),' -> ',clc.red.bold('Error'),' -> Invalid settings');
            return require('./settings').call(this,settings,options,client);
        }
    }


}
